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

pub struct CachedSettings(pub std::sync::Arc<std::sync::RwLock<crate::settings::AppSettings>>);

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
        if state == AppState::Idle {
            let _ = overlay_win.hide();
        } else {
            // Dynamically position the mini overlay centered horizontally near the bottom
            if let Some(monitor) = overlay_win.primary_monitor().ok().flatten() {
                let screen_size = monitor.size();
                let scale_factor = monitor.scale_factor();
                
                // 1/16th of the screen width
                let win_width = screen_size.width / 16;
                // Keep the height small (e.g. 36 logical pixels)
                let win_height = (36.0 * scale_factor) as u32;
                
                let _ = overlay_win.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: win_width,
                    height: win_height,
                }));
                
                let pad_y = (50.0 * scale_factor) as u32; // just above taskbar
                
                // Center horizontally
                let x = screen_size.width.saturating_sub(win_width) / 2;
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
pub fn get_settings(cached: State<'_, CachedSettings>) -> Result<String, String> {
    let settings = cached.0.read().unwrap().clone();
    serde_json::to_string(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_settings(
    app: AppHandle,
    cached: State<'_, CachedSettings>,
    settings_str: String,
) -> Result<(), String> {
    let settings: crate::settings::AppSettings = serde_json::from_str(&settings_str)
        .map_err(|e| format!("Failed to parse settings JSON: {}", e))?;

    // Load old settings to compare hotkey change
    let old_settings = cached.0.read().unwrap().clone();

    // Save settings to config file
    crate::settings::save_settings(&settings)?;
    *cached.0.write().unwrap() = settings.clone();

    // Dynamically update Global Shortcut registration on the OS
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    let old_hotkey = old_settings.hotkey.replace(" ", "").replace("Ctrl", "Control");
    let new_hotkey = settings.hotkey.replace(" ", "").replace("Ctrl", "Control");

    if old_hotkey != new_hotkey {
        println!("HOTKEY: Dynamic change detected. Unregistering '{}' and registering '{}'", old_hotkey, new_hotkey);
        
        // Try unregistering old hotkey
        if let Ok(old_shortcut) = old_hotkey.parse::<Shortcut>() {
            let _ = app.global_shortcut().unregister(old_shortcut);
        }

        // Try registering new hotkey
        match new_hotkey.parse::<Shortcut>() {
            Ok(new_shortcut) => {
                if let Err(e) = app.global_shortcut().register(new_shortcut) {
                    eprintln!("HOTKEY ERROR: Failed to dynamically register new hotkey '{}': {}", new_hotkey, e);
                    return Err(format!("Failed to register hotkey on OS: {}", e));
                }
            }
            Err(e) => {
                eprintln!("HOTKEY ERROR: Could not parse new hotkey string '{}': {}", new_hotkey, e);
                return Err(format!("Invalid hotkey format: {}", e));
            }
        }
    }

    // Handle auto-start setting
    use tauri_plugin_autostart::ManagerExt;
    let autostart_manager = app.autolaunch();
    if settings.launch_on_startup {
        let _ = autostart_manager.enable();
    } else {
        let _ = autostart_manager.disable();
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
        // Load settings to get audio gain
        let cached = app.state::<CachedSettings>();
        let settings = cached.0.read().unwrap().clone();
        let gain_multiplier = if settings.gain == 0 {
            0.0
        } else {
            10.0_f32.powf((settings.gain as f32 - 50.0) / 50.0)
        };

        // Start recording audio stream
        let (mut rx, sr, ch) = recorder.start_recording()?;
        set_state(app.clone(), state_container, "Recording".to_string(), None)?;

        let app_clone = app.clone();
        tauri::async_runtime::spawn(async move {
            let mut all_samples = Vec::with_capacity(16000 * 60);
            let mut mono_buf = Vec::with_capacity(8192);
            let mut resample_buf = Vec::with_capacity(4096);
            
            // Phase 2 & 4: Streaming Audio Pipeline & Background Noise Reduction
            let mut denoiser = nnnoiseless::DenoiseState::new();

            while let Some(mut chunk) = rx.recv().await {
                // Apply software gain
                let mut peak: f32 = 0.0;
                if (gain_multiplier - 1.0).abs() > f32::EPSILON {
                    for sample in chunk.iter_mut() {
                        *sample *= gain_multiplier;
                        *sample = sample.clamp(-1.0, 1.0);
                        let abs_sample = sample.abs();
                        if abs_sample > peak {
                            peak = abs_sample;
                        }
                    }
                } else {
                    for sample in chunk.iter() {
                        let abs_sample = sample.abs();
                        if abs_sample > peak {
                            peak = abs_sample;
                        }
                    }
                }

                // Emit volume level to UI for visualizers (0-100 scale)
                let volume_level = (peak * 100.0).min(100.0);
                let _ = app_clone.emit("volume-level", volume_level);

                mono_buf.clear();
                if ch > 1 {
                    for frame in chunk.chunks_exact(ch as usize) {
                        mono_buf.push(frame.iter().sum::<f32>() / ch as f32);
                    }
                } else {
                    mono_buf.extend_from_slice(&chunk);
                }
                
                if sr == 48000 {
                    let mut denoised_chunk = vec![0.0_f32; 480];
                    for frame in mono_buf.chunks_exact(480) {
                        denoiser.process_frame(&mut denoised_chunk, frame);
                        resample_buf.clear();
                        crate::audio::resampler::resample_into(&denoised_chunk, sr, 16000, &mut resample_buf);
                        all_samples.extend_from_slice(&resample_buf);
                    }
                } else {
                    resample_buf.clear();
                    crate::audio::resampler::resample_into(&mono_buf, sr, 16000, &mut resample_buf);
                    all_samples.extend_from_slice(&resample_buf);
                }
            }

            // Once channel closes (user stops recording)
            let state_container_inner = app_clone.state::<StateContainer>();
            let _ = set_state(app_clone.clone(), state_container_inner, "Transcribing".to_string(), Some("Processing audio...".to_string()));

            match process_recording(app_clone.clone(), all_samples).await {
                Ok(text) => {
                    println!("Transcription pipeline successfully completed! Text: {}", text);
                    let state_container_inner = app_clone.state::<StateContainer>();
                    let _ = set_state(app_clone.clone(), state_container_inner, "Idle".to_string(), None);
                }
                Err(e) => {
                    eprintln!("Transcription pipeline failed: {}", e);
                    let state_container_err = app_clone.state::<StateContainer>();
                    let _ = set_state(app_clone.clone(), state_container_err, "Error".to_string(), Some(e));
                    
                    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                    let state_container_idle = app_clone.state::<StateContainer>();
                    let _ = set_state(app_clone.clone(), state_container_idle, "Idle".to_string(), None);
                }
            }
        });
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
        // Stop the recorder, which closes the channel and signals the background task to run transcription
        let _ = recorder.stop_recording();
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
            if let Err(e) = start_recording_pipeline(app.clone(), state_container, recorder) {
                eprintln!("HOTKEY: Failed to start recording pipeline: {}", e);
            }
        }
        HotkeyMode::WaitingForDoubleTap => {
            data.mode = HotkeyMode::ToggledOn;
            // Recording is already ongoing, do nothing.
        }
        HotkeyMode::ToggledOn => {
            // It's a single press to stop toggle mode.
            data.mode = HotkeyMode::Idle;
            if let Err(e) = stop_recording_pipeline(app.clone(), state_container, recorder) {
                eprintln!("HOTKEY: Failed to stop recording pipeline: {}", e);
            }
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
                    if let Err(e) = stop_recording_pipeline(app.clone(), state_container, recorder) {
                        eprintln!("HOTKEY: Failed to stop recording pipeline (PPT): {}", e);
                    }
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
                            if let Err(e) = abort_recording(app_clone.clone(), s_container, r) {
                                eprintln!("HOTKEY: Failed to abort recording: {}", e);
                            }
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

fn normalize_audio(samples: &mut [f32]) {
    let max_amplitude = samples.iter().map(|s| s.abs()).fold(0.0_f32, f32::max);
    if max_amplitude > f32::EPSILON && max_amplitude < 0.95 {
        let scale = 0.95 / max_amplitude;
        for s in samples.iter_mut() {
            *s *= scale;
        }
    }
}

fn trim_silence(samples: &[f32], sample_rate: u32) -> &[f32] {
    let frame_size = (sample_rate as usize * 30) / 1000;
    let threshold = 0.01_f32;

    let rms = |frame: &[f32]| -> f32 {
        let sum_sq: f32 = frame.iter().map(|s| s * s).sum();
        (sum_sq / frame.len() as f32).sqrt()
    };

    let start = samples.chunks(frame_size).position(|f| rms(f) > threshold).unwrap_or(0) * frame_size;
    let end = samples.rchunks(frame_size).position(|f| rms(f) > threshold).map(|pos| samples.len() - pos * frame_size).unwrap_or(samples.len());

    let pad = (sample_rate as usize) / 10;
    let start = start.saturating_sub(pad);
    let end = (end + pad).min(samples.len());
    if start >= end {
        return &[];
    }
    &samples[start..end]
}

async fn process_recording(
    app: AppHandle,
    mut samples: Vec<f32>,
) -> Result<String, String> {
    if samples.is_empty() {
        return Err("Audio signal was too short or empty".to_string());
    }

    normalize_audio(&mut samples);
    let trimmed = trim_silence(&samples, 16000);
    if trimmed.len() < 1600 {
        return Err("Audio signal was too short or empty".to_string());
    }
    let samples_owned = trimmed.to_vec();

    // Load active configurations
    let cached = app.state::<CachedSettings>();
    let settings = cached.0.read().unwrap().clone();

    // 2. Ensure speech model is present in directory, downloading it if missing
    let model_path = crate::whisper::models::ensure_model_exists(&app, &settings.whisper_model).await?;
    let model_path_owned = model_path.clone();

    // 3. Transcribe audio offline via whisper-rs
    let whisper_state = app.state::<crate::whisper::engine::SharedWhisperState>();
    let context_arc = whisper_state.context.clone();

    let raw_text = tokio::task::spawn_blocking(move || {
        let temp_state = crate::whisper::engine::SharedWhisperState { context: context_arc };
        crate::whisper::engine::transcribe(&temp_state, &model_path_owned, &samples_owned)
    })
    .await
    .map_err(|e| format!("Whisper task panicked: {}", e))?
    .map_err(|e| e)?;
    if raw_text.trim().is_empty() {
        return Err("Speech not recognized. Please speak closer to your microphone.".to_string());
    }

    // 4. Update state to Formatting
    let state_container = app.state::<StateContainer>();
    let _ = set_state(app.clone(), state_container.clone(), "Formatting".to_string(), Some("Refining text...".to_string()));

    // Polish speech text using selected AI Formatting Engine
    let http_client = app.state::<std::sync::Arc<reqwest::Client>>();
    let formatted_text = crate::formatter::format_transcription(
        &raw_text,
        http_client.inner(),
        &settings.cloud_provider,
        &settings.cloud_model,
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

    // 6. Save to History
    let _ = crate::history::save_entry(&formatted_text);

    Ok(formatted_text)
}

// --- History Commands ---

#[tauri::command]
pub fn get_history() -> Result<String, String> {
    let history = crate::history::load_history()?;
    serde_json::to_string(&history).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_history_entry(id: String) -> Result<(), String> {
    crate::history::delete_entry(&id)
}

#[tauri::command]
pub fn clear_history() -> Result<(), String> {
    crate::history::clear_history()
}

#[tauri::command]
pub async fn download_model(app: AppHandle, model: String) -> Result<(), String> {
    crate::whisper::models::ensure_model_exists(&app, &model).await.map(|_| ())
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
pub fn start_recording(
    app: AppHandle,
    state_container: State<'_, StateContainer>,
    recorder: State<'_, AudioRecorder>,
) -> Result<(), String> {
    start_recording_pipeline(app, state_container, recorder)
}

#[tauri::command]
pub fn stop_recording(
    app: AppHandle,
    state_container: State<'_, StateContainer>,
    recorder: State<'_, AudioRecorder>,
) -> Result<(), String> {
    stop_recording_pipeline(app, state_container, recorder)
}

#[tauri::command]
pub fn is_recording(recorder: State<'_, AudioRecorder>) -> Result<bool, String> {
    recorder.is_recording()
}
