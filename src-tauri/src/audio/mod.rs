pub mod capture;
pub mod resampler;

use std::sync::Mutex;
pub use capture::ActiveRecorder;

/// AudioRecorder provides a high-level, thread-safe interface for starting and stopping
/// audio capture, automatically converting the output to 16kHz mono for speech recognition.
pub struct AudioRecorder {
    active_recorder: Mutex<Option<ActiveRecorder>>,
}

impl Default for AudioRecorder {
    fn default() -> Self {
        Self::new()
    }
}

impl AudioRecorder {
    /// Creates a new inactive AudioRecorder.
    pub fn new() -> Self {
        Self {
            active_recorder: Mutex::new(None),
        }
    }

    /// Starts recording from the default input device.
    /// Returns an error if recording is already in progress.
    pub fn start_recording(&self) -> Result<(), String> {
        let mut active = self.active_recorder.lock().map_err(|e| e.to_string())?;
        if active.is_some() {
            return Err("Recording is already in progress".to_string());
        }

        let recorder = ActiveRecorder::start()?;
        *active = Some(recorder);
        Ok(())
    }

    /// Stops recording, consumes the raw samples, downmixes them to mono,
    /// and resamples the resulting mono stream to 16kHz before returning it.
    /// Returns an error if no active recording is in progress.
    pub fn stop_recording(&self) -> Result<Vec<f32>, String> {
        let mut active = self.active_recorder.lock().map_err(|e| e.to_string())?;
        let recorder = active.take().ok_or_else(|| "No active recording to stop".to_string())?;

        // Stop the recording stream and get the captured samples
        let (raw_samples, sample_rate, channels) = recorder.stop()?;

        // Step 1: Average channels down to mono
        let mono_samples = resampler::downmix_to_mono(&raw_samples, channels);

        // Step 2: Linear resample to standard 16,000 Hz for speech recognition (Whisper)
        let resampled_samples = resampler::resample(&mono_samples, sample_rate, 16000);

        Ok(resampled_samples)
    }

    /// Checks if a recording is currently active.
    pub fn is_recording(&self) -> Result<bool, String> {
        let active = self.active_recorder.lock().map_err(|e| e.to_string())?;
        Ok(active.is_some())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Gated behind hardware microphone access - run with `cargo test -- --ignored --nocapture`
    fn test_real_audio_capture() {
        use std::thread::sleep;
        use std::time::Duration;

        println!("Initializing audio capture...");
        let recorder = AudioRecorder::new();
        
        println!("Starting recording for 3 seconds... Please speak into your microphone!");
        recorder.start_recording().expect("Failed to start recording");
        
        sleep(Duration::from_secs(3));
        
        println!("Stopping recording...");
        let samples = recorder.stop_recording().expect("Failed to stop recording");
        
        println!("Captured {} samples successfully!", samples.len());
        assert!(!samples.is_empty(), "Captured samples must not be empty");
        
        // At 16kHz, 3 seconds of audio should have approximately 48,000 samples
        let expected_samples = 48000;
        let bounds = 10000; // allow variance for stream startup latency
        let len = samples.len();
        println!("Actual sample count: {}, expected around {}", len, expected_samples);
        assert!((len as i32 - expected_samples as i32).abs() < bounds, 
            "Sample count is outside of reasonable range: {}", len);
    }
}
