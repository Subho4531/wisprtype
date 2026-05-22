use std::path::{Path, PathBuf};
use std::fs::{self, File};
use std::io::{Write, Read};
use tauri::{AppHandle, Emitter};
use futures_util::StreamExt;

/// Resolves the base directory for Wisprtype data (~/.wisprtype)
pub fn get_wisprtype_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Could not locate user home directory".to_string())?;
    Ok(home.join(".wisprtype"))
}

/// Resolves the path to the models directory (~/.wisprtype/models)
pub fn get_models_dir() -> Result<PathBuf, String> {
    let base = get_wisprtype_dir()?;
    let models_dir = base.join("models");
    if !models_dir.exists() {
        fs::create_dir_all(&models_dir).map_err(|e| format!("Failed to create models directory: {}", e))?;
    }
    Ok(models_dir)
}

/// Resolves the local path for a specific Whisper model size
pub fn get_model_path(model_size: &str) -> Result<PathBuf, String> {
    let models_dir = get_models_dir()?;
    Ok(models_dir.join(format!("ggml-{}.bin", model_size)))
}

#[derive(Clone, serde::Serialize)]
struct DownloadProgressPayload {
    progress: f64,
    message: String,
}

/// Ensures the requested model size exists locally.
/// If it does not exist, downloads it asynchronously from Hugging Face,
/// emitting real-time progress events to the Tauri frontend.
pub async fn ensure_model_exists(app: &AppHandle, model_size: &str) -> Result<PathBuf, String> {
    let model_path = get_model_path(model_size)?;
    if model_path.exists() {
        return Ok(model_path);
    }

    println!("Model not found at {:?}. Starting automatic download...", model_path);
    let url = format!(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-{}.bin",
        model_size
    );

    // Initial event: starting download
    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            progress: 0.0,
            message: format!("Downloading Whisper model ({})...", model_size),
        },
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to send download request: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to download model: server returned status {}",
            response.status()
        ));
    }

    let total_size = response
        .content_length()
        .ok_or_else(|| "Failed to get model content length".to_string())?;

    let mut file = File::create(&model_path)
        .map_err(|e| format!("Failed to create model file: {}", e))?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    // Throttle progress emissions to prevent UI flooding
    let mut last_emitted_percent = -1;

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Error during model chunk download: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Failed to write chunk to model file: {}", e))?;
        
        downloaded += chunk.len() as u64;
        let percent = ((downloaded as f64 / total_size as f64) * 100.0).round() as i32;

        if percent != last_emitted_percent {
            last_emitted_percent = percent;
            let _ = app.emit(
                "download-progress",
                DownloadProgressPayload {
                    progress: percent as f64,
                    message: format!("Downloading model ({}%)", percent),
                },
            );
        }
    }

    file.flush().map_err(|e| format!("Failed to flush model file: {}", e))?;
    println!("Model downloaded successfully to {:?}", model_path);

    // Final event: download finished
    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            progress: 100.0,
            message: "Model download complete!".to_string(),
        },
    );

    Ok(model_path)
}
