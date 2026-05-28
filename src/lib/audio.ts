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
    // Sharp, small tick for start
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.005); // immediate attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05); // instant decay
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  } else {
    // Lower, small tick for stop
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.005); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05); 
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }
}
