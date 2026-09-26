type Sound = 'success' | 'fail' | 'mix' | 'coin' | 'click' | 'cook';

let context: AudioContext | null = null;

export function playSound(type: Sound): void {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  try {
    context ??= new AudioContextClass();
    if (context.state === 'suspended') void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const notes: Record<Sound, number[]> = {
      success: [523, 659, 784, 1047],
      fail: [280, 190],
      mix: [220, 370],
      coin: [988, 1319],
      click: [800],
      cook: [440, 520],
    };
    const duration = type === 'success' ? 0.42 : type === 'fail' ? 0.32 : 0.18;
    oscillator.type = type === 'fail' ? 'triangle' : 'sine';
    notes[type].forEach((frequency, index) => oscillator.frequency.setValueAtTime(frequency, now + index * (duration / notes[type].length)));
    gain.gain.setValueAtTime(type === 'fail' ? 0.055 : 0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch { /* Audio is optional when a browser blocks playback. */ }
}
