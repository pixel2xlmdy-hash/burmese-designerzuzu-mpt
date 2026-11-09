// Self-contained boutique harp / chime tone via the Web Audio API (no audio files, works offline).

type Ctx = AudioContext;

function pluck(ctx: Ctx, out: AudioNode, freq: number, at: number, dur: number, level: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(freq * 6, at);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, at + dur);

  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.value = freq;

  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = freq * 2.002;
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.35;

  body.connect(filter);
  shimmer.connect(shimmerGain).connect(filter);
  filter.connect(gain).connect(out);

  body.start(at);
  shimmer.start(at);
  body.stop(at + dur + 0.05);
  shimmer.stop(at + dur + 0.05);
}

function schedule(ctx: Ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.32;

  // Soft echo for a hall-like sparkle.
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.21;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  master.connect(ctx.destination);
  master.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(ctx.destination);

  const t = ctx.currentTime + 0.05;
  // Rising pentatonic harp glissando, then a gentle resolving chord.
  const run = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  run.forEach((f, i) => pluck(ctx, master, f, t + i * 0.085, 1.4, 0.5));
  const chordAt = t + run.length * 0.085 + 0.12;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    pluck(ctx, master, f, chordAt + i * 0.025, 2.2, 0.38),
  );
}

let ctx: Ctx | null = null;
let played = false;

/** Tries to play the launch chime. Returns false if the browser is waiting for a tap. */
export async function playChime(): Promise<boolean> {
  if (played || typeof window === "undefined") return true;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return true;
  try {
    ctx ??= new AC();
    if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
    if (ctx.state !== "running") return false;
    played = true;
    schedule(ctx);
    return true;
  } catch {
    return true;
  }
}
