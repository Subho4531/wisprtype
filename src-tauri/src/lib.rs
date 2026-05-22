mod commands;
pub mod audio;
pub mod settings;
pub mod whisper;
pub mod formatter;
pub mod injector;

use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(|app, shortcut, event| {
            use tauri_plugin_global_shortcut::ShortcutState;
            if event.state == ShortcutState::Pressed {
                println!("Global shortcut triggered: {:?}", shortcut);
                let state_container = app.state::<commands::StateContainer>();
                let recorder = app.state::<audio::AudioRecorder>();
                if let Err(e) = commands::toggle_recording_pipeline(app.clone(), state_container, recorder) {
                    eprintln!("Failed to toggle recording from hotkey: {}", e);
                }
            }
        }).build())
        // Register managed states
        .manage(commands::StateContainer(Mutex::new(commands::AppState::Idle)))
        .manage(audio::AudioRecorder::new())
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
                            if let Err(e) = commands::toggle_recording_pipeline(app.clone(), state_container, recorder) {
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
                            if let Err(e) = commands::toggle_recording_pipeline(app.clone(), state_container, recorder) {
                                eprintln!("Failed to toggle recording from tray click: {}", e);
                            }
                        }
                    }
                })
                .build(app)?;

            // Hide the main settings window on startup to run as background tray app
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }

            // Load settings and register the global hotkey
            let settings = settings::load_settings().unwrap_or_default();
            let hotkey_str = settings.hotkey.to_lowercase().replace(" ", "");
            
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
            if let Ok(shortcut) = hotkey_str.parse::<Shortcut>() {
                if let Err(e) = app.global_shortcut().register(shortcut) {
                    eprintln!("Failed to register global hotkey '{}' on startup: {}", hotkey_str, e);
                } else {
                    println!("Successfully registered global hotkey '{}' on startup", hotkey_str);
                }
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
            commands::save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
