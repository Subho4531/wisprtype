use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tokio::sync::mpsc;

/// ActiveRecorder manages the active CPAL stream and streams captured samples to a channel.
pub struct ActiveRecorder {
    stream: cpal::Stream,
    pub sample_rate: u32,
    pub channels: u16,
}

impl ActiveRecorder {
    /// Starts recording from the default audio input device.
    /// Spawns a background thread through cpal and sends chunks via the provided sender.
    pub fn start(sender: mpsc::UnboundedSender<Vec<f32>>) -> Result<Self, String> {
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

        let err_handler = |err| {
            eprintln!("An error occurred on the audio input stream: {}", err);
        };

        let stream = match sample_format {
            cpal::SampleFormat::F32 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[f32], _: &cpal::InputCallbackInfo| {
                        let _ = sender.send(data.to_vec());
                    },
                    err_handler,
                    None
                )
            }
            cpal::SampleFormat::I16 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[i16], _: &cpal::InputCallbackInfo| {
                        let f32_data = data.iter().map(|&s| s as f32 / i16::MAX as f32).collect();
                        let _ = sender.send(f32_data);
                    },
                    err_handler,
                    None
                )
            }
            cpal::SampleFormat::U16 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[u16], _: &cpal::InputCallbackInfo| {
                        let f32_data = data.iter().map(|&s| (s as f32 - 32768.0) / 32768.0).collect();
                        let _ = sender.send(f32_data);
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
            sample_rate,
            channels,
        })
    }

    /// Stops the recording, consumes the recorder, pauses the stream.
    pub fn stop(self) {
        let _ = self.stream.pause();
    }
}
