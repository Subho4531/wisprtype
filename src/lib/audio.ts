// Create an audio context on demand to comply with browser autoplay policies
let audioCtx: AudioContext | null = null;

export function playFeedbackSound(type: 'start' | 'stop') {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'start') {
    // Soothing ascending double blip (marimba-like)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now); // A4
    oscillator.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } else {
    // Soothing descending double blip
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(659.25, now); // E5
    oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.15); // A4
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
}
