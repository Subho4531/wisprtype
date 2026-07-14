use serde_json::json;

/// Calls an LLM provider to refine/format speech transcription.
pub async fn refine_text_llm(
    client: &reqwest::Client,
    text: &str,
    system_prompt: &str,
    provider: &str,
    model: &str,
    api_key: &str,
) -> Result<String, String> {
    let active_api_key = api_key.to_string();

    if provider != "ollama" && active_api_key.trim().is_empty() {
        return Err("API Key is empty. Please enter a valid Cloud API Key in settings.".to_string());
    }

    println!("Calling {} endpoint for formatting...", provider);
    
    let (url, payload, auth_header) = match provider.to_lowercase().as_str() {
        "ollama" => {
            (
                "http://localhost:11434/api/chat".to_string(),
                json!({
                    "model": model,
                    "messages": [
                        { "role": "system", "content": system_prompt },
                        { "role": "user", "content": text }
                    ],
                    "stream": false,
                    "options": {
                        "temperature": 0.1
                    }
                }),
                None
            )
        }
        "gemini" => {
            // Using Google Gemini endpoint (Google AI Studio)
            (
                format!("https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}", model, active_api_key),
                json!({
                    "contents": [
                        { "role": "user", "parts": [{ "text": text }] }
                    ],
                    "systemInstruction": {
                        "parts": [{ "text": system_prompt }]
                    },
                    "generationConfig": {
                        "temperature": 0.1
                    }
                }),
                None
            )
        }
        "openrouter" => {
            (
                "https://openrouter.ai/api/v1/chat/completions".to_string(),
                json!({
                    "model": model,
                    "messages": [
                        { "role": "system", "content": system_prompt },
                        { "role": "user", "content": text }
                    ],
                    "temperature": 0.1
                }),
                Some(format!("Bearer {}", active_api_key))
            )
        }
        "groq" => {
            (
                "https://api.groq.com/openai/v1/chat/completions".to_string(),
                json!({
                    "model": model,
                    "messages": [
                        { "role": "system", "content": system_prompt },
                        { "role": "user", "content": text }
                    ],
                    "temperature": 1.0,
                    "max_completion_tokens": 1024,
                    "top_p": 1.0,
                    "stream": false,
                    "stop": null
                }),
                Some(format!("Bearer {}", active_api_key))
            )
        }
        "openai" | _ => {
            (
                "https://api.openai.com/v1/chat/completions".to_string(),
                json!({
                    "model": model,
                    "messages": [
                        { "role": "system", "content": system_prompt },
                        { "role": "user", "content": text }
                    ],
                    "temperature": 0.1
                }),
                Some(format!("Bearer {}", active_api_key))
            )
        }
    };

    let mut builder = client.post(&url).header("Content-Type", "application/json");
    
    if let Some(auth) = auth_header {
        builder = builder.header("Authorization", auth);
    }
    
    // Add OpenRouter specific headers if needed
    if provider.to_lowercase() == "openrouter" {
        builder = builder
            .header("HTTP-Referer", "https://github.com/wisprtype")
            .header("X-Title", "Wisprtype");
    }

    let response = builder
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("LLM request failed: {}", e))?;

    if !response.status().is_success() {
        let err_body = response.text().await.unwrap_or_default();
        return Err(format!("LLM API returned error: {}", err_body));
    }

    let res_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse LLM response JSON: {}", e))?;

    let refined = if provider.to_lowercase() == "ollama" {
        res_json["message"]["content"].as_str()
    } else if provider.to_lowercase() == "gemini" {
        res_json["candidates"][0]["content"]["parts"][0]["text"].as_str()
    } else {
        res_json["choices"][0]["message"]["content"].as_str()
    };

    let refined_text = refined
        .ok_or_else(|| "Failed to read text from LLM response".to_string())?
        .trim()
        .to_string();

    Ok(refined_text)
}
