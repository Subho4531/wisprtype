use serde_json::json;

/// Calls the secure OpenAI-compatible cloud API to refine/format speech transcription.
pub async fn refine_text_cloud(text: &str, system_prompt: &str, api_key: &str) -> Result<String, String> {
    if api_key.trim().is_empty() {
        return Err("API Key is empty. Please enter a valid Cloud API Key in settings.".to_string());
    }

    println!("Calling Cloud AI Completion endpoint...");
    let client = reqwest::Client::new();
    let payload = json!({
        "model": "gpt-4o-mini", // Lightweight, very fast and highly capable for formatting
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": text }
        ],
        "temperature": 0.3
    });

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Cloud request failed: {}", e))?;

    if !response.status().is_success() {
        let err_body = response.text().await.unwrap_or_default();
        return Err(format!("Cloud API returned error: {}", err_body));
    }

    let res_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Cloud response JSON: {}", e))?;

    let refined = res_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "Failed to read choices text from Cloud response".to_string())?;

    Ok(refined.trim().to_string())
}

/// Calls local Ollama chat API to refine/format speech transcription.
pub async fn refine_text_local(text: &str, system_prompt: &str) -> Result<String, String> {
    println!("Calling local Ollama endpoint...");
    let client = reqwest::Client::new();
    
    // We use "llama3" as the default recommended local model. Ollama exposes a standard /api/chat endpoint.
    let payload = json!({
        "model": "llama3",
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": text }
        ],
        "stream": false,
        "options": {
            "temperature": 0.3
        }
    });

    let response = client
        .post("http://localhost:11434/api/chat")
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Ollama connection failed: {}", e))?;

    if !response.status().is_success() {
        let err_body = response.text().await.unwrap_or_default();
        return Err(format!("Ollama API returned error: {}", err_body));
    }

    let res_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response JSON: {}", e))?;

    let refined = res_json["message"]["content"]
        .as_str()
        .ok_or_else(|| "Failed to read content from Ollama response".to_string())?;

    Ok(refined.trim().to_string())
}
