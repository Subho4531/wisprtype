use std::path::Path;
use whisper_rs::{WhisperContext, FullParams, SamplingStrategy};

/// Transcribes 16kHz mono f32 samples using the Whisper model at the specified path.
pub fn transcribe(model_path: &Path, samples: &[f32]) -> Result<String, String> {
    let model_path_str = model_path
        .to_str()
        .ok_or_else(|| "Invalid model path characters".to_string())?;

    println!("Loading offline Whisper context from {:?}...", model_path);
    
    // Create the Whisper context
    let ctx = WhisperContext::new(model_path_str)
        .map_err(|e| format!("Failed to create Whisper context: {}", e))?;

    // Create a new parameter set using Greedy sampling strategy
    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    
    // Suppress logs and console output to maintain professional, silent background execution
    params.set_print_special(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);
    
    // Default to English transcription. It can be set to None for auto-detection in multi-lingual modes.
    params.set_language(Some("en"));

    println!("Starting offline Whisper transcription ({} samples)...", samples.len());

    // Create execution state
    let mut state = ctx
        .create_state()
        .map_err(|e| format!("Failed to create Whisper state: {}", e))?;

    // Execute the transcription pipeline
    state
        .run(&params, samples)
        .map_err(|e| format!("Failed to execute Whisper model run: {}", e))?;

    // Aggregate transcription segments
    let mut transcription = String::new();
    let num_segments = state
        .full_n_segments()
        .map_err(|e| format!("Failed to retrieve segment count: {}", e))?;

    for i in 0..num_segments {
        let segment_text = state
            .full_get_segment_text(i)
            .map_err(|e| format!("Failed to read text from segment {}: {}", i, e))?;
        transcription.push_str(&segment_text);
    }

    let cleaned_text = transcription.trim().to_string();
    println!("Transcription complete. Length: {} chars.", cleaned_text.len());
    
    Ok(cleaned_text)
}
