/// Utilities for resampling and downmixing audio data.

/// Resamples a slice of f32 samples from `from_hz` to `to_hz`.
/// Uses high-performance linear interpolation, which is robust,
/// lightweight, and highly effective for speech recognition tasks.
pub fn resample(input: &[f32], from_hz: u32, to_hz: u32) -> Vec<f32> {
    if from_hz == to_hz {
        return input.to_vec();
    }
    if input.is_empty() {
        return Vec::new();
    }

    let ratio = from_hz as f64 / to_hz as f64;
    let new_len = (input.len() as f64 / ratio).round() as usize;
    let mut output = Vec::with_capacity(new_len);

    for i in 0..new_len {
        let pos = i as f64 * ratio;
        let idx = pos.floor() as usize;
        let fract = pos - idx as f64;

        if idx + 1 < input.len() {
            let sample = input[idx] * (1.0 - fract as f32) + input[idx + 1] * fract as f32;
            output.push(sample);
        } else if idx < input.len() {
            output.push(input[idx]);
        }
    }

    output
}

/// Downmixes multi-channel audio data to mono by averaging the samples across channels.
pub fn downmix_to_mono(input: &[f32], channels: u16) -> Vec<f32> {
    if channels <= 1 {
        return input.to_vec();
    }

    let channels = channels as usize;
    let mut output = Vec::with_capacity(input.len() / channels);

    for chunk in input.chunks_exact(channels) {
        let sum: f32 = chunk.iter().sum();
        output.push(sum / channels as f32);
    }

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_downmix_to_mono() {
        // Stereo input (2 channels) where each frame sums to a predictable average
        let stereo = vec![1.0, 3.0, 2.0, 4.0, 5.0, 5.0];
        let mono = downmix_to_mono(&stereo, 2);
        assert_eq!(mono, vec![2.0, 3.0, 5.0]);
    }

    #[test]
    fn test_resample_no_change() {
        let input = vec![0.1, 0.2, 0.3, 0.4];
        let output = resample(&input, 44100, 44100);
        assert_eq!(input, output);
    }

    #[test]
    fn test_resample_downsample() {
        // Simple linear ramp from 0.0 to 10.0
        let input: Vec<f32> = (0..10).map(|x| x as f32).collect();
        // Downsample by factor of 2 (ratio 2.0)
        let output = resample(&input, 2000, 1000);
        
        // Input:  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        // Output len should be ~5
        assert_eq!(output.len(), 5);
        // Under linear interpolation with ratio=2.0:
        // i=0: pos=0.0 -> input[0] = 0.0
        // i=1: pos=2.0 -> input[2] = 2.0
        // i=2: pos=4.0 -> input[4] = 4.0
        // i=3: pos=6.0 -> input[6] = 6.0
        // i=4: pos=8.0 -> input[8] = 8.0
        assert_eq!(output, vec![0.0, 2.0, 4.0, 6.0, 8.0]);
    }
}
