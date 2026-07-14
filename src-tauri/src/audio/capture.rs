use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tokio::sync::mpsc;

#[allow(deprecated)]
pub fn list_input_devices() -> Result<Vec<String>, String> {
    let host = cpal::default_host();
    let devices = host.input_devices().map_err(|e| format!("Failed to get input devices: {}", e))?;
    
    let mut names = Vec::new();
    for device in devices {
        if let Ok(name) = device.name() {
            if !names.contains(&name) {
                names.push(name);
            }
        }
    }
    
    let mut final_list = vec!["Default System Microphone".to_string()];
    final_list.extend(names);
    Ok(final_list)
}

/// ActiveRecorder manages the active CPAL stream and streams captured samples to a channel.
pub struct ActiveRecorder {
    stream: cpal::Stream,
    pub sample_rate: u32,
    pub channels: u16,
}

impl ActiveRecorder {
    /// Starts recording from the default audio input device.
    /// Spawns a background thread through cpal and sends chunks via the provided sender.
    #[allow(deprecated)]
    pub fn start(sender: mpsc::UnboundedSender<Vec<f32>>, device_name: Option<&str>) -> Result<Self, String> {
        let host = cpal::default_host();
        
        let device = if let Some(name) = device_name {
            if name == "Default System Microphone" {
                host.default_input_device()
            } else {
                host.input_devices()
                    .map_err(|e| e.to_string())?
                    .find(|d| d.name().map(|n| n == name).unwrap_or(false))
            }
        } else {
            host.default_input_device()
        }
        .ok_or_else(|| format!("Could not find microphone device: {:?}", device_name))?;

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
