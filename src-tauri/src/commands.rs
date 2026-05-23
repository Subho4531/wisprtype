use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, Emitter};
use crate::audio::AudioRecorder;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum AppState {
    Idle,
    Recording,
    Transcribing,
    Formatting,
    Pasting,
    Error,
}

pub struct StateContainer(pub Mutex<AppState>);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HotkeyMode {
    Idle,
    Holding,
    WaitingForDoubleTap,
    ToggledOn,
}

pub struct HotkeyData {
    pub mode: HotkeyMode,
    pub last_pressed: Option<std::time::Instant>,
}

impl Default for HotkeyData {
    fn default() -> Self {
        Self {
            mode: HotkeyMode::Idle,
            last_pressed: None,
        }
    }
}

pub struct HotkeyState(pub Mutex<HotkeyData>);

#[tauri::command]
pub fn get_state(state_container: State<'_, StateContainer>) -> String {
    let state = state_container.0.lock().unwrap();
    serde_json::to_string(&*state).unwrap_or_else(|_| "\"Idle\"".to_string())
}

#[tauri::command]
pub fn set_state(
    app: AppHandle,
    state_container: State<'_, StateContainer>,
    state_str: String,
    message: Option<String>,
) -> Result<(), String> {
    let state = match state_str.as_str() {
        "Idle" => AppState::Idle,
        "Recording" => AppState::Recording,
        "Transcribing" => AppState::Transcribing,
        "Formatting" => AppState::Formatting,
        "Pasting" => AppState::Pasting,
        "Error" => AppState::Error,
        _ => return Err(format!("Invalid state: {}", state_str)),
    };

    // Update internal state
    {
        let mut current_state = state_container.0.lock().unwrap();
        *current_state = state.clone();
    }

    // Toggle Overlay window visibility based on state
    if let Some(overlay_win) = app.get_webview_window("overlay") {
        if state == AppState::Idle || state == AppState::Pasting {
            let _ = overlay_win.hide();
        } else {
            // Dynamically position the overlay window in the bottom-right corner of the primary screen
            if let Some(monitor) = overlay_win.primary_monitor().ok().flatten() {
                let screen_size = monitor.size();
                let scale_factor = monitor.scale_factor();
                
                // Base dimensions in logical units: width 320, height 90 (matches tauri.conf.json)
                let pad_x = (24.0 * scale_factor) as u32;
                let pad_y = (60.0 * scale_factor) as u32; // stay above typical taskbar
                
                let win_width = (320.0 * scale_factor) as u32;
                let win_height = (90.0 * scale_factor) as u32;
                
                let x = screen_size.width.saturating_sub(win_width).saturating_sub(pad_x);
                let y = screen_size.height.saturating_sub(win_height).saturating_sub(pad_y);
                
                let _ = overlay_win.set_position(tauri::PhysicalPosition::new(x, y));
            }
            let _ = overlay_win.show();
        }
    }

    // Update tray icon
    if let Err(e) = update_tray_icon(&app, &state) {
        eprintln!("Failed to update tray icon: {}", e);
    }

    // Emit event to frontend
    #[derive(Clone, serde::Serialize)]
    struct StateChangedPayload {
        state: String,
        message: Option<String>,
    }

    app.emit(
        "state-changed",
        StateChangedPayload {
            state: state_str,
            message,
        },
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn open_settings(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_settings() -> Result<String, String> {
    let settings = crate::settings::load_settings()?;
    serde_json::to_string(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_settings(
    app: AppHandle,
    settings_str: String,
) -> Result<(), String> {
    let settings: crate::settings::AppSettings = serde_json::from_str(&settings_str)
        .map_err(|e| format!("Failed to parse settings JSON: {}", e))?;

    // Load old settings to compare hotkey change
    let old_settings = crate::settings::load_settings().unwrap_or_default();

    // Save settings to config file
    crate::settings::save_settings(&settings)?;

    // Dynamically update Global Shortcut registration on the OS
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    let old_hotkey = old_settings.hotkey.to_lowercase().replace(" ", "");
    let new_hotkey = settings.hotkey.to_lowercase().replace(" ", "");

    if old_hotkey != new_hotkey {
        println!("Dynamic Hotkey Change: Unregistering '{}' and registering '{}'", old_hotkey, new_hotkey);
        
        // Try unregistering old hotkey
        if let Ok(old_shortcut) = old_hotkey.parse::<Shortcut>() {
            let _ = app.global_shortcut().unregister(old_shortcut);
        }

        // Try registering new hotkey
        if let Ok(new_shortcut) = new_hotkey.parse::<Shortcut>() {
            if let Err(e) = app.global_shortcut().register(new_shortcut) {
                eprintln!("Failed to dynamically register new hotkey '{}': {}", new_hotkey, e);
                return Err(format!("Failed to register hotkey on OS: {}", e));
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn toggle_recording(
    app: AppHandle,
    state_container: State<'_, StateContainer>,
    recorder: State<'_, AudioRecorder>,
) -> Result<(), String> {
    let current_state = {
        let state = state_container.0.lock().unwrap();
        state.clone()
    };
    if current_state == AppState::Idle {
        start_recording_pipeline(app, state_container, recorder)
    } else {
        stop_recording_pipeline(app, state_container, recorder)
    }
}

pub fn start_recording_pipeline(
    app: AppHandle,
    state_container: State<'_, StateContainer>,
    recorder: State<'_, AudioRecorder>,
) -> Result<(), String> {
    let current_state = {
        let state = state_container.0.lock().unwrap();
        state.clone()
    };

    if current_state == AppState::Idle {
        // Start recording audio stream
        recorder.start_recording()?;
        set_state(app, state_container, "Recording".to_string(), None)?;
    }
    Ok(())
}

pub fn stop_recording_pipeline(
    app: AppHandle,
    state_container: State<'_, StateContainer>,
    recorder: State<'_, AudioRecorder>,
) -> Result<(), String> {
    let current_state = {
        let state = state_container.0.lock().unwrap();
        state.clone()
    };

    if current_state == AppState::Recording {
        // Transition state to Transcribing (Overlay UI displays spinner/status pill)
        set_state(app.clone(), state_container, "Transcribing".to_string(), Some("Processing audio...".to_string()))?;

        let app_clone = app.clone();

        // Run intensive recording processing asynchronously to avoid blocking the OS main thread
        tauri::async_runtime::spawn(async move {
            match process_recording(app_clone.clone()).await {
                Ok(text) => {
                    println!("Transcription pipeline successfully completed! Text: {}", text);
                    let state_container_inner = app_clone.state::<StateContainer>();
                    let _ = set_state(app_clone.clone(), state_container_inner, "Idle".to_string(), None);
                }
                Err(e) => {
                    eprintln!("Transcription pipeline failed: {}", e);
                    let state_container_err = app_clone.state::<StateContainer>();
                    let _ = set_state(app_clone.clone(), state_container_err, "Error".to_string(), Some(e));
                    
                    // Keep error visible for 3 seconds before gracefully reverting to Idle
                    std::thread::sleep(std::time::Duration::from_secs(3));
                    let state_container_idle = app_clone.state::<StateContainer>();
                    let _ = set_state(app_clone.clone(), state_container_idle, "Idle".to_string(), None);
                }
            }
        });
    } else if current_state != AppState::Idle {
        // If in processing or error state, click to interrupt and force return to Idle
        let _ = recorder.stop_recording();
        set_state(app, state_container, "Idle".to_string(), None)?;
    }
    Ok(())
}

pub fn abort_recording(
    app: AppHandle,
    state_container: State<'_, StateContainer>,
    recorder: State<'_, AudioRecorder>,
) -> Result<(), String> {
    let _ = recorder.stop_recording();
    set_state(app, state_container, "Idle".to_string(), None)?;
    Ok(())
}

pub fn hotkey_pressed(app: AppHandle) {
    let hotkey_state = app.state::<HotkeyState>();
    let state_container = app.state::<StateContainer>();
    let recorder = app.state::<AudioRecorder>();
    
    let mut data = hotkey_state.0.lock().unwrap();
    let now = std::time::Instant::now();
    data.last_pressed = Some(now);

    match data.mode {
        HotkeyMode::Idle => {
            data.mode = HotkeyMode::Holding;
            let _ = start_recording_pipeline(app.clone(), state_container, recorder);
        }
        HotkeyMode::WaitingForDoubleTap => {
            data.mode = HotkeyMode::ToggledOn;
            // Recording is already ongoing, do nothing.
        }
        HotkeyMode::ToggledOn => {
            // It's a single press to stop toggle mode.
            data.mode = HotkeyMode::Idle;
            let _ = stop_recording_pipeline(app.clone(), state_container, recorder);
        }
        HotkeyMode::Holding => {
            // Should not happen, but if it does, ignore
        }
    }
}

pub fn hotkey_released(app: AppHandle) {
    let hotkey_state = app.state::<HotkeyState>();
    let state_container = app.state::<StateContainer>();
    let recorder = app.state::<AudioRecorder>();
    
    let mut data = hotkey_state.0.lock().unwrap();
    let now = std::time::Instant::now();

    match data.mode {
        HotkeyMode::Holding => {
            if let Some(pressed_at) = data.last_pressed {
                let duration = now.duration_since(pressed_at);
                if duration.as_millis() > 400 {
                    // Push to talk completed
                    data.mode = HotkeyMode::Idle;
                    let _ = stop_recording_pipeline(app.clone(), state_container, recorder);
                } else {
                    // Short tap, might be a double tap
                    data.mode = HotkeyMode::WaitingForDoubleTap;
                    
                    // Spawn timeout task
                    let app_clone = app.clone();
                    tauri::async_runtime::spawn(async move {
                        // wait a bit longer to give user time to double tap comfortably
                        tokio::time::sleep(tokio::time::Duration::from_millis(400)).await;
                        let state = app_clone.state::<HotkeyState>();
                        let mut inner_data = state.0.lock().unwrap();
                        if inner_data.mode == HotkeyMode::WaitingForDoubleTap {
                            // User abandoned double tap. Discard the recording silently.
                            inner_data.mode = HotkeyMode::Idle;
                            let s_container = app_clone.state::<StateContainer>();
                            let r = app_clone.state::<AudioRecorder>();
                            let _ = abort_recording(app_clone.clone(), s_container, r);
                        }
                    });
                }
            } else {
                data.mode = HotkeyMode::Idle;
            }
        }
        HotkeyMode::ToggledOn => {
            // Do nothing, we ignore the release of the second tap.
        }
        HotkeyMode::Idle => {
            // Do nothing, it's the release of a single tap to stop toggle mode.
        }
        HotkeyMode::WaitingForDoubleTap => {
            // Shouldn't happen
        }
    }
}

async fn process_recording(
    app: AppHandle,
) -> Result<String, String> {
    // 1. Consume raw recorded mono 16kHz audio buffer
    let recorder = app.state::<AudioRecorder>();
    let samples = recorder.stop_recording()?;
    if samples.is_empty() {
        return Err("Audio signal was too short or empty".to_string());
    }

    // Load active configurations
    let settings = crate::settings::load_settings().unwrap_or_default();

    // 2. Ensure speech model is present in directory, downloading it if missing
    let model_path = crate::whisper::models::ensure_model_exists(&app, &settings.whisper_model).await?;

    // 3. Transcribe audio offline via whisper-rs
    let raw_text = crate::whisper::engine::transcribe(&model_path, &samples)?;
    if raw_text.trim().is_empty() {
        return Err("Speech not recognized. Please speak closer to your microphone.".to_string());
    }

    // 4. Update state to Formatting
    let state_container = app.state::<StateContainer>();
    let _ = set_state(app.clone(), state_container.clone(), "Formatting".to_string(), Some("Refining text...".to_string()));

    // Polish speech text using selected AI Formatting Engine
    let formatted_text = crate::formatter::format_transcription(
        &raw_text,
        &settings.formatting_engine,
        &settings.system_prompt,
        &settings.api_key
    ).await;

    // 5. Update state to Pasting
    let _ = set_state(app.clone(), state_container.clone(), "Pasting".to_string(), Some("Injecting text...".to_string()));

    // Paste into active window immediately, or just write to clipboard buffer
    if settings.paste_immediately {
        crate::injector::copy_and_paste(&formatted_text)?;
    } else {
        let mut clipboard = arboard::Clipboard::new()
            .map_err(|e| format!("Failed to access clipboard: {}", e))?;
        clipboard.set_text(formatted_text.clone())
            .map_err(|e| format!("Failed to set clipboard text: {}", e))?;
    }

    Ok(formatted_text)
}

pub fn update_tray_icon(app: &AppHandle, state: &AppState) -> Result<(), tauri::Error> {
    if let Some(tray) = app.tray_by_id("main") {
        let icon_bytes = match state {
            AppState::Idle => include_bytes!("../icons/tray_idle.png").as_ref(),
            AppState::Recording => include_bytes!("../icons/tray_recording.png").as_ref(),
            AppState::Transcribing => include_bytes!("../icons/tray_transcribing.png").as_ref(),
            AppState::Formatting => include_bytes!("../icons/tray_formatting.png").as_ref(),
            AppState::Pasting => include_bytes!("../icons/tray_success.png").as_ref(),
            AppState::Error => include_bytes!("../icons/tray_error.png").as_ref(),
        };
        let icon = tauri::image::Image::from_bytes(icon_bytes)?;
        tray.set_icon(Some(icon))?;
    }
    Ok(())
}

#[tauri::command]
pub fn start_recording(recorder: State<'_, AudioRecorder>) -> Result<(), String> {
    recorder.start_recording()
}

#[tauri::command]
pub fn stop_recording(recorder: State<'_, AudioRecorder>) -> Result<Vec<f32>, String> {
    let samples = recorder.stop_recording()?;
    println!("Recorded {} samples of audio successfully!", samples.len());
    Ok(samples)
}

#[tauri::command]
pub fn is_recording(recorder: State<'_, AudioRecorder>) -> Result<bool, String> {
    recorder.is_recording()
}
