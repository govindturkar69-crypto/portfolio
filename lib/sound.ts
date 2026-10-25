/**
 * Interface sound, generated with the Web Audio API (no audio files, no Howler).
 * Always starts muted and is never persisted as "on": each visit begins silent, and the
 * AudioContext is only created inside the click that enables sound (browser autoplay rules).
 */
type Cue = 'click' | 'whoosh' | 'tick';
type Listener = (enabled: boolean) => void;

let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
const listeners = new Set<Listener>();

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureContext() {
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  master = context.createGain();
  master.gain.value = 0.5;
  master.connect(context.destination);
  // Release the audio device when the page is put away.
  window.addEventListener('pagehide', () => {
    context?.close();
    context = null;
    master = null;
  }, { once: true });
  return context;
}

function emit() {
  listeners.forEach((listener) => listener(enabled));
}

export const sound = {
  isEnabled: () => enabled,

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Must be called from a user gesture (click/keypress) so the browser allows audio. */
  async setEnabled(next: boolean) {
    if (next) {
      const ctx = ensureContext();
      if (!ctx) return; // No Web Audio: the toggle simply stays off.
      try {
        await ctx.resume();
      } catch {
        return;
      }
      enabled = true;
      emit();
      sound.play('click');
    } else {
      enabled = false;
      emit();
      await context?.suspend().catch(() => undefined);
    }
  },

  play(cue: Cue) {
    if (!enabled || !context || !master || context.state !== 'running') return;
    // Whooshes are motion-flavoured; skip them for visitors who asked for less motion.
    if (cue === 'whoosh' && reducedMotion()) return;
    const now = context.currentTime;

    if (cue === 'whoosh') {
      const length = Math.floor(context.sampleRate * 0.45);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 0.9;
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.exponentialRampToValueAtTime(2600, now + 0.4);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      noise.connect(filter).connect(gain).connect(master);
      noise.start(now);
      noise.stop(now + 0.46);
      return;
    }

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = cue === 'click' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(cue === 'click' ? 1250 : 820, now);
    osc.frequency.exponentialRampToValueAtTime(cue === 'click' ? 640 : 700, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(cue === 'click' ? 0.09 : 0.05, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.1);
  },
};
