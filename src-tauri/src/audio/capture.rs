use std::sync::{Arc, Mutex};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

/// ActiveRecorder manages the active CPAL stream and buffers captured samples in a thread-safe manner.
pub struct ActiveRecorder {
    stream: cpal::Stream,
    buffer: Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
    channels: u16,
}

impl ActiveRecorder {
    /// Starts recording from the default audio input device.
    /// Spawns a background thread through cpal to buffer incoming samples.
    pub fn start() -> Result<Self, String> {
        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or_else(|| "No default microphone input device found. Please connect a microphone.".to_string())?;

        let config = device
            .default_input_config()
            .map_err(|e| format!("Failed to get default input configuration: {}", e))?;

        let sample_rate = config.sample_rate();
        let channels = config.channels();
        let sample_format = config.sample_format();

        let buffer = Arc::new(Mutex::new(Vec::new()));
        let buffer_clone = Arc::clone(&buffer);

        let err_handler = |err| {
            eprintln!("An error occurred on the audio input stream: {}", err);
        };

        let stream = match sample_format {
            cpal::SampleFormat::F32 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[f32], _: &cpal::InputCallbackInfo| {
                        if let Ok(mut buf) = buffer_clone.lock() {
                            buf.extend_from_slice(data);
                        }
                    },
                    err_handler,
                    None
                )
            }
            cpal::SampleFormat::I16 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[i16], _: &cpal::InputCallbackInfo| {
                        if let Ok(mut buf) = buffer_clone.lock() {
                            buf.extend(data.iter().map(|&s| s as f32 / i16::MAX as f32));
                        }
                    },
                    err_handler,
                    None
                )
            }
            cpal::SampleFormat::U16 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[u16], _: &cpal::InputCallbackInfo| {
                        if let Ok(mut buf) = buffer_clone.lock() {
                            buf.extend(data.iter().map(|&s| {
                                (s as f32 - 32768.0) / 32768.0
                            }));
                        }
                    },
                    err_handler,
                    None
                )
            }
            _ => return Err("Unsupported audio sample format".to_string()),
        }.map_err(|e| format!("Failed to build input stream: {}", e))?;

        stream
            .play()
            .map_err(|e| format!("Failed to start audio stream playing: {}", e))?;

        Ok(Self {
            stream,
            buffer,
            sample_rate,
            channels,
        })
    }

    /// Stops the recording, consumes the recorder, pauses the stream,
    /// and returns the raw accumulated samples along with the device's sample rate and channel count.
    pub fn stop(self) -> Result<(Vec<f32>, u32, u16), String> {
        let _ = self.stream.pause();
        
        let raw_samples = match Arc::try_unwrap(self.buffer) {
            Ok(mutex) => mutex.into_inner().map_err(|e| e.to_string())?,
            Err(arc) => arc.lock().map_err(|e| e.to_string())?.clone(),
        };

        Ok((raw_samples, self.sample_rate, self.channels))
    }
}
