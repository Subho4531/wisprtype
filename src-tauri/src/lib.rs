mod commands;
pub mod audio;
pub mod settings;
pub mod whisper;
pub mod formatter;
pub mod injector;
pub mod history;

use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(|app, shortcut, event| {
            use tauri_plugin_global_shortcut::ShortcutState;
            println!("Global shortcut triggered: {:?} - State: {:?}", shortcut, event.state);
            if event.state == ShortcutState::Pressed {
                commands::hotkey_pressed(app.clone());
            } else if event.state == ShortcutState::Released {
                commands::hotkey_released(app.clone());
            }
        }).build())
        // Register managed states
        .manage(commands::HotkeyState(Mutex::new(commands::HotkeyData::default())))
        .manage(commands::StateContainer(Mutex::new(commands::AppState::Idle)))
        .manage(audio::AudioRecorder::new())
        .manage(whisper::engine::SharedWhisperState::default())
        .manage(std::sync::Arc::new(reqwest::Client::builder().pool_max_idle_per_host(2).timeout(std::time::Duration::from_secs(30)).build().unwrap()))
        .setup(|app| {
            // Build system tray menu
            let title_i = MenuItem::with_id(app, "title", "Wisprtype V1", false, None::<&str>)?;
            let record_i = MenuItem::with_id(app, "record", "Start / Stop Recording", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(
                app,
                &[
                    &title_i,
                    &PredefinedMenuItem::separator(app)?,
                    &record_i,
                    &settings_i,
                    &PredefinedMenuItem::separator(app)?,
                    &quit_i,
                ],
            )?;

            // Initialize System Tray Icon
            let idle_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray_idle.png"))?;
            let _tray = TrayIconBuilder::new()
                .icon(idle_icon)
                .menu(&menu)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "settings" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "record" => {
                            let state_container = app.state::<commands::StateContainer>();
                            let recorder = app.state::<audio::AudioRecorder>();
                            if let Err(e) = commands::toggle_recording(app.clone(), state_container, recorder) {
                                eprintln!("Failed to toggle recording from tray menu: {}", e);
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button, .. } = event {
                        if button == tauri::tray::MouseButton::Left {
                            // Left click on tray icon toggles recording state
                            let app = tray.app_handle();
                            let state_container = app.state::<commands::StateContainer>();
                            let recorder = app.state::<audio::AudioRecorder>();
                            if let Err(e) = commands::toggle_recording(app.clone(), state_container, recorder) {
                                eprintln!("Failed to toggle recording from tray click: {}", e);
                            }
                        }
                    }
                })
                .build(app)?;

            // Load settings early to check start_minimized
            let settings = settings::load_settings().unwrap_or_default();
            
            // Manage settings state immediately
            app.manage(commands::CachedSettings(std::sync::Arc::new(std::sync::RwLock::new(settings.clone()))));

            // Show the main settings window on startup if not minimized
            if let Some(window) = app.get_webview_window("main") {
                if !settings.start_minimized {
                    let _ = window.show();
                }
                
                // Intercept window close to hide instead of destroy, allowing the tray to reopen it
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }
            
            // Start low-level keyboard listener for modifier-only shortcuts
            let app_handle_for_rdev = app.handle().clone();
            std::thread::spawn(move || {
                let ctrl_pressed = std::sync::Arc::new(std::sync::Mutex::new(false));
                let meta_pressed = std::sync::Arc::new(std::sync::Mutex::new(false));
                let mut is_triggered = false;

                let callback = move |event: rdev::Event| {
                    let mut ctrl = ctrl_pressed.lock().unwrap();
                    let mut meta = meta_pressed.lock().unwrap();
                    
                    match event.event_type {
                        rdev::EventType::KeyPress(key) => {
                            if key == rdev::Key::ControlLeft || key == rdev::Key::ControlRight { *ctrl = true; }
                            if key == rdev::Key::MetaLeft || key == rdev::Key::MetaRight { *meta = true; }
                            
                            if *ctrl && *meta {
                                if !is_triggered {
                                    use tauri::Manager;
                                    if let Some(cached) = app_handle_for_rdev.try_state::<commands::CachedSettings>() {
                                        let settings = cached.0.read().unwrap();
                                        let hotkey_str = settings.hotkey.clone().replace(" ", "").replace("Ctrl", "Control").replace("Command", "Super").replace("Meta", "Super").replace("Win", "Super");
                                        
                                        if hotkey_str == "Control+Super" || hotkey_str == "Super+Control" {
                                            is_triggered = true;
                                            commands::hotkey_pressed(app_handle_for_rdev.clone());
                                        }
                                    }
                                }
                            }
                        },
                        rdev::EventType::KeyRelease(key) => {
                            if key == rdev::Key::ControlLeft || key == rdev::Key::ControlRight { *ctrl = false; }
                            if key == rdev::Key::MetaLeft || key == rdev::Key::MetaRight { *meta = false; }
                            
                            // Reset the trigger flag when either modifier is released
                            if (!*ctrl || !*meta) && is_triggered {
                                is_triggered = false;
                                commands::hotkey_released(app_handle_for_rdev.clone());
                            }
                        },
                        _ => ()
                    }
                };

                if let Err(error) = rdev::listen(callback) {
                    eprintln!("Error starting rdev listener: {:?}", error);
                }
            });

            // Register the global hotkey
            let hotkey_str = settings.hotkey.clone()
                .replace(" ", "")
                .replace("Ctrl", "Control")
                .replace("Command", "Super")
                .replace("Meta", "Super")
                .replace("Win", "Super");
            
            if hotkey_str != "Control+Super" && hotkey_str != "Super+Control" {
                use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
                match hotkey_str.parse::<Shortcut>() {
                    Ok(shortcut) => {
                        if let Err(e) = app.global_shortcut().register(shortcut) {
                            eprintln!("CRITICAL: Failed to register global hotkey '{}' on startup: {}", hotkey_str, e);
                        } else {
                            println!("HOTKEY: Successfully registered global hotkey '{}' on startup", hotkey_str);
                        }
                    }
                    Err(e) => {
                        eprintln!("CRITICAL: Could not parse hotkey string '{}': {}", hotkey_str, e);
                    }
                }
            } else {
                println!("HOTKEY: Delegating '{}' to low-level rdev listener", hotkey_str);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_state,
            commands::set_state,
            commands::open_settings,
            commands::toggle_recording,
            commands::start_recording,
            commands::stop_recording,
            commands::is_recording,
            commands::get_settings,
            commands::save_settings,
            commands::get_history,
            commands::delete_history_entry,
            commands::clear_history,
            commands::download_model,
            commands::get_audio_devices
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
