type AudioContextConstructor = new () => AudioContext;

let cachedAudioContext: AudioContext | null = null;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const ctor = Reflect.get(window, 'AudioContext') ?? Reflect.get(window, 'webkitAudioContext');
  return typeof ctor === 'function' ? ctor : null;
}

function getAudioContext(): AudioContext | null {
  const AudioContextCtor = getAudioContextConstructor();

  if (!AudioContextCtor) {
    return null;
  }

  cachedAudioContext ??= new AudioContextCtor();
  return cachedAudioContext;
}

async function resumeAudioContext(audioContext: AudioContext): Promise<void> {
  if (audioContext.state !== 'suspended') {
    return;
  }

  await audioContext.resume();
}

export async function primeScannerSuccessBeep(): Promise<void> {
  const audioContext = getAudioContext();

  if (!audioContext) {
    return;
  }

  await resumeAudioContext(audioContext);
}

export async function playScannerSuccessBeep(): Promise<void> {
  const audioContext = getAudioContext();

  if (!audioContext) {
    return;
  }

  await resumeAudioContext(audioContext);

  if (audioContext.state !== 'running') {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.addEventListener(
    'ended',
    () => {
      oscillator.disconnect();
      gainNode.disconnect();
    },
    { once: true }
  );

  oscillator.start(now);
  oscillator.stop(now + 0.12);
}
