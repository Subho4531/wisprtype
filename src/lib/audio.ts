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
    // Very soft, soothing single bell tone (C5)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    
    // Slow, soft attack and very long release
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05); // gentle fade in
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4); // slow fade out
    
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  } else {
    // Very soft, soothing lower bell tone (G4)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(392.00, now); // G4
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }
}
