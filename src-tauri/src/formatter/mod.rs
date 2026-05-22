pub mod rule;
pub mod client;

pub use rule::clean_text;
pub use client::{refine_text_cloud, refine_text_local};

/// Formats the raw transcription using the selected engine configuration.
/// Ensures extreme resilience by automatically falling back to rule-based formatting if network or local LLM requests fail.
pub async fn format_transcription(
    text: &str,
    engine: &str,
    system_prompt: &str,
    api_key: &str,
) -> String {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    match engine.to_lowercase().as_str() {
        "none" => {
            println!("Formatting disabled: returning raw trimmed text.");
            trimmed.to_string()
        }
        "local" => {
            println!("Local LLM formatting selected.");
            match refine_text_local(trimmed, system_prompt).await {
                Ok(refined) => refined,
                Err(e) => {
                    eprintln!("Ollama formatting failed ({}); falling back to offline rule refiner.", e);
                    clean_text(trimmed)
                }
            }
        }
        "cloud" => {
            println!("Cloud LLM formatting selected.");
            match refine_text_cloud(trimmed, system_prompt, api_key).await {
                Ok(refined) => refined,
                Err(e) => {
                    eprintln!("Cloud AI formatting failed ({}); falling back to offline rule refiner.", e);
                    clean_text(trimmed)
                }
            }
        }
        _ => {
            println!("Unknown formatting engine '{}'; falling back to offline rule refiner.", engine);
            clean_text(trimmed)
        }
    }
}
