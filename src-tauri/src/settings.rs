use std::fs::{self, File};
use std::io::{Write, Read};
use std::path::PathBuf;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub hotkey: String,
    #[serde(rename = "launchOnStartup")]
    pub launch_on_startup: bool,
    #[serde(rename = "pasteImmediately")]
    pub paste_immediately: bool,
    #[serde(rename = "microphoneDevice")]
    pub microphone_device: String,
    pub gain: u32,
    #[serde(rename = "whisperModel")]
    pub whisper_model: String,
    #[serde(rename = "formattingEngine")]
    pub formatting_engine: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
    #[serde(rename = "systemPrompt")]
    pub system_prompt: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            hotkey: "Ctrl + Shift + Space".to_string(),
            launch_on_startup: true,
            paste_immediately: true,
            microphone_device: "Default System Microphone".to_string(),
            gain: 75,
            whisper_model: "base".to_string(),
            formatting_engine: "cloud".to_string(),
            api_key: "".to_string(),
            system_prompt: "Fix spelling, grammar, punctuation, and format nicely as professional text. Keep the tone natural.".to_string(),
        }
    }
}

/// Resolves the home-relative path of the config file
pub fn get_config_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let base_dir = home.join(".wisprtype");
    if !base_dir.exists() {
        fs::create_dir_all(&base_dir).map_err(|e| format!("Failed to create config folder: {}", e))?;
    }
    Ok(base_dir.join("config.json"))
}

/// Loads app settings from ~/.wisprtype/config.json.
/// If the file does not exist, it creates a default configuration.
pub fn load_settings() -> Result<AppSettings, String> {
    let path = get_config_path()?;
    if !path.exists() {
        let default_settings = AppSettings::default();
        save_settings(&default_settings)?;
        return Ok(default_settings);
    }

    let mut file = File::open(&path).map_err(|e| format!("Failed to open config file: {}", e))?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    let settings: AppSettings = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse config JSON: {}", e))?;

    Ok(settings)
}

/// Saves the provided AppSettings into ~/.wisprtype/config.json.
pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let path = get_config_path()?;
    let serialized = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize config JSON: {}", e))?;

    let mut file = File::create(&path).map_err(|e| format!("Failed to write config file: {}", e))?;
    file.write_all(serialized.as_bytes())
        .map_err(|e| format!("Failed to write config data: {}", e))?;
    file.flush().map_err(|e| format!("Failed to flush config data: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_settings_default() {
        let settings = AppSettings::default();
        assert_eq!(settings.hotkey, "Ctrl + Shift + Space");
        assert!(settings.launch_on_startup);
        assert!(settings.paste_immediately);
        assert_eq!(settings.gain, 75);
        assert_eq!(settings.whisper_model, "base");
        assert_eq!(settings.formatting_engine, "cloud");
    }

    #[test]
    fn test_app_settings_json_serialization() {
        let settings = AppSettings::default();
        let serialized = serde_json::to_string(&settings).unwrap();
        let deserialized: AppSettings = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized.hotkey, settings.hotkey);
        assert_eq!(deserialized.gain, settings.gain);
        assert_eq!(deserialized.whisper_model, settings.whisper_model);
    }
}

