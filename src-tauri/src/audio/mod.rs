pub mod capture;
pub mod resampler;

use std::sync::Mutex;
pub use capture::ActiveRecorder;
use tokio::sync::mpsc;

/// AudioRecorder provides a high-level, thread-safe interface for starting and stopping
/// audio capture. It returns a stream of chunks.
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
    /// Returns a receiver for audio chunks, along with sample rate and channels.
    /// Returns an error if recording is already in progress.
    pub fn start_recording(&self) -> Result<(mpsc::UnboundedReceiver<Vec<f32>>, u32, u16), String> {
        let mut active = self.active_recorder.lock().map_err(|e| e.to_string())?;
        if active.is_some() {
            return Err("Recording is already in progress".to_string());
        }

        let (tx, rx) = mpsc::unbounded_channel();
        let recorder = ActiveRecorder::start(tx)?;
        let sr = recorder.sample_rate;
        let ch = recorder.channels;
        *active = Some(recorder);
        
        Ok((rx, sr, ch))
    }

    /// Stops recording and drops the active stream.
    /// Returns an error if no active recording is in progress.
    pub fn stop_recording(&self) -> Result<(), String> {
        let mut active = self.active_recorder.lock().map_err(|e| e.to_string())?;
        let recorder = active.take().ok_or_else(|| "No active recording to stop".to_string())?;

        // Stop the recording stream
        recorder.stop();
        Ok(())
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
    use tokio::runtime::Runtime;

    #[test]
    #[ignore] // Gated behind hardware microphone access - run with `cargo test -- --ignored --nocapture`
    fn test_real_audio_capture() {
        use std::thread::sleep;
        use std::time::Duration;

        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            println!("Initializing audio capture...");
            let recorder = AudioRecorder::new();
            
            println!("Starting recording for 3 seconds... Please speak into your microphone!");
            let (mut rx, sr, ch) = recorder.start_recording().expect("Failed to start recording");
            
            let mut all_samples = Vec::new();
            
            let handle = tokio::spawn(async move {
                while let Some(chunk) = rx.recv().await {
                    all_samples.extend(chunk);
                }
                all_samples
            });

            sleep(Duration::from_secs(3));
            
            println!("Stopping recording...");
            recorder.stop_recording().expect("Failed to stop recording");
            
            let samples = handle.await.unwrap();
            
            println!("Captured {} raw samples successfully at {} Hz, {} channels!", samples.len(), sr, ch);
            assert!(!samples.is_empty(), "Captured samples must not be empty");
        });
    }
}
