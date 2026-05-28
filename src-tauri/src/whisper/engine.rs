use std::path::{Path, PathBuf};
use std::sync::Mutex;
use whisper_rs::{WhisperContext, FullParams, SamplingStrategy};

pub struct SharedWhisperState {
    pub context: std::sync::Arc<Mutex<Option<(PathBuf, WhisperContext)>>>,
}

impl Default for SharedWhisperState {
    fn default() -> Self {
        Self {
            context: std::sync::Arc::new(Mutex::new(None)),
        }
    }
}

/// Transcribes 16kHz mono f32 samples using the Whisper model at the specified path.
/// Caches the WhisperContext to avoid reloading from disk on every invocation.
pub fn transcribe(state: &SharedWhisperState, model_path: &Path, samples: &[f32]) -> Result<String, String> {
    let mut cache = state.context.lock().map_err(|e| e.to_string())?;

    let needs_load = match &*cache {
        Some((path, _)) => path != model_path,
        None => true,
    };

    if needs_load {
        let model_path_str = model_path
            .to_str()
            .ok_or_else(|| "Invalid model path characters".to_string())?;

        println!("Loading offline Whisper context from {:?}...", model_path);
        
        let ctx = WhisperContext::new_with_params(model_path_str, Default::default())
            .map_err(|e| format!("Failed to create Whisper context: {}", e))?;
            
        *cache = Some((model_path.to_path_buf(), ctx));
    }

    let ctx = &cache.as_ref().unwrap().1;

    // Create a new parameter set using Greedy sampling strategy
    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 5 });
    params.set_suppress_blank(true);
    params.set_no_timestamps(true);
    params.set_single_segment(false);
    params.set_max_initial_ts(1.0);
    params.set_initial_prompt("Wisprtype transcription: ");
    
    // Suppress logs and console output to maintain professional, silent background execution
    params.set_print_special(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);
    
    // Default to English transcription. It can be set to None for auto-detection in multi-lingual modes.
    params.set_language(Some("en"));

    println!("Starting offline Whisper transcription ({} samples)...", samples.len());

    // Create execution state
    let mut whisper_state = ctx
        .create_state()
        .map_err(|e| format!("Failed to create Whisper state: {}", e))?;

    // Execute the transcription pipeline
    whisper_state
        .full(params, samples)
        .map_err(|e| format!("Failed to execute Whisper model run: {}", e))?;

    // Aggregate transcription segments
    let mut transcription = String::new();
    let num_segments = whisper_state
        .full_n_segments()
        .map_err(|e| format!("Failed to retrieve segment count: {}", e))?;

    for i in 0..num_segments {
        let segment_text = whisper_state
            .full_get_segment_text(i)
            .map_err(|e| format!("Failed to read text from segment {}: {}", i, e))?;
        transcription.push_str(&segment_text);
    }

    let cleaned_text = transcription.trim().to_string();
    println!("Transcription complete. Length: {} chars.", cleaned_text.len());
    
    Ok(cleaned_text)
}
