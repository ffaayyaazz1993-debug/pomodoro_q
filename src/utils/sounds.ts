let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playCompletionSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Pleasant chime - three ascending tones
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.8);
    });
  } catch (e) {
    console.error('Failed to play completion sound:', e);
  }
}

export function playBreakCompleteSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Gentle descending tone for break complete
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(783.99, now);
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    console.error('Failed to play break sound:', e);
  }
}

export function playWarningSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Two short beeps
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + i * 0.2);
      
      gain.gain.setValueAtTime(0, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(volume * 0.2, now + i * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.15);
    }
  } catch (e) {
    console.error('Failed to play warning sound:', e);
  }
}

export function playTickSound(volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    
    gain.gain.setValueAtTime(volume * 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {
    console.error('Failed to play tick sound:', e);
  }
}

export function previewSound(type: 'completion' | 'break' | 'warning', volume: number = 0.5): void {
  switch (type) {
    case 'completion':
      playCompletionSound(volume);
      break;
    case 'break':
      playBreakCompleteSound(volume);
      break;
    case 'warning':
      playWarningSound(volume);
      break;
  }
}
