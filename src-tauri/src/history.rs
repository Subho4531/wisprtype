use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionEntry {
    pub id: String,
    pub timestamp: String,
    pub text: String,
    pub word_count: usize,
}

/// Resolves the home-relative path of the history file
pub fn get_history_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let base_dir = home.join(".wisprtype");
    if !base_dir.exists() {
        fs::create_dir_all(&base_dir).map_err(|e| format!("Failed to create config folder: {}", e))?;
    }
    Ok(base_dir.join("history.json"))
}

/// Loads transcription history from ~/.wisprtype/history.json
pub fn load_history() -> Result<Vec<TranscriptionEntry>, String> {
    let path = get_history_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut file = File::open(&path).map_err(|e| format!("Failed to open history file: {}", e))?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read history file: {}", e))?;

    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }

    let history: Vec<TranscriptionEntry> = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse history JSON: {}", e))?;

    Ok(history)
}

/// Saves the provided history into ~/.wisprtype/history.json
fn save_history(history: &[TranscriptionEntry]) -> Result<(), String> {
    let path = get_history_path()?;
    let serialized = serde_json::to_string_pretty(history)
        .map_err(|e| format!("Failed to serialize history JSON: {}", e))?;

    let mut file = File::create(&path).map_err(|e| format!("Failed to write history file: {}", e))?;
    file.write_all(serialized.as_bytes())
        .map_err(|e| format!("Failed to write history data: {}", e))?;
    file.flush().map_err(|e| format!("Failed to flush history data: {}", e))?;

    Ok(())
}

/// Adds a new entry to the history
pub fn save_entry(text: &str) -> Result<(), String> {
    let mut history = load_history().unwrap_or_default();
    
    let now = std::time::SystemTime::now();
    let datetime: chrono::DateTime<chrono::Local> = now.into();
    let timestamp = datetime.format("%Y-%m-%d %H:%M:%S").to_string();
    let id = uuid::Uuid::new_v4().to_string();
    let word_count = text.split_whitespace().count();

    let entry = TranscriptionEntry {
        id,
        timestamp,
        text: text.to_string(),
        word_count,
    };

    history.insert(0, entry); // Insert at the beginning (newest first)
    
    // Keep only the last 100 entries to prevent the file from growing indefinitely
    if history.len() > 100 {
        history.truncate(100);
    }

    save_history(&history)?;
    Ok(())
}

/// Deletes a specific entry by ID
pub fn delete_entry(id: &str) -> Result<(), String> {
    let mut history = load_history()?;
    history.retain(|e| e.id != id);
    save_history(&history)?;
    Ok(())
}

/// Clears all history
pub fn clear_history() -> Result<(), String> {
    save_history(&[])?;
    Ok(())
}
