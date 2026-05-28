pub mod rule;
pub mod client;

pub use rule::clean_text;
pub use client::refine_text_llm;

const PERMANENT_PROMPT: &str = "You are an expert transcription formatter. Correct spelling, grammar, and punctuation errors. Format the text professionally without adding any conversational filler, markdown formatting (like quotes or bolding), prefixes, or explanations. Output ONLY the final perfectly formatted text.";

/// Formats the raw transcription using the selected engine configuration.
/// Ensures extreme resilience by automatically falling back to rule-based formatting if network or local LLM requests fail.
pub async fn format_transcription(
    text: &str,
    http_client: &reqwest::Client,
    provider: &str,
    model: &str,
    api_key: &str,
) -> String {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    match provider.to_lowercase().as_str() {
        "none" => {
            println!("Formatting disabled: returning raw trimmed text.");
            trimmed.to_string()
        }
        _ => {
            println!("LLM formatting selected (Provider: {}, Model: {}).", provider, model);
            match refine_text_llm(http_client, trimmed, PERMANENT_PROMPT, provider, model, api_key).await {
                Ok(refined) => refined,
                Err(e) => {
                    eprintln!("LLM formatting failed ({}); falling back to offline rule refiner.", e);
                    clean_text(trimmed)
                }
            }
        }
    }
}
