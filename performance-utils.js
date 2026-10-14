// Helpers pequenos: nenhuma mudança de instruções do jogo ou de velocidade simulada.
export function createTaskYielder() {
  let channel = null;
  const pending = [];
  function yieldTask() {
    if (typeof MessageChannel === 'undefined') return new Promise(resolve => setTimeout(resolve, 0));
    if (!channel) {
      channel = new MessageChannel();
      channel.port1.onmessage = () => pending.shift()?.();
    }
    return new Promise(resolve => {
      pending.push(resolve);
      channel.port2.postMessage(null);
    });
  }
  yieldTask.dispose = () => {
    channel?.port1.close();
    channel?.port2.close();
    channel = null;
    for (const resolve of pending.splice(0)) resolve();
  };
  return yieldTask;
}

export class FrameRateMeter {
  constructor(windowMs = 3000) {
    this.windowMs = windowMs;
    this.samples = [];
    this.lastAt = null;
  }
  reset(now) { this.samples = []; this.lastAt = now; }
  sample(frames, now) {
    const elapsedMs = Math.max(1, this.lastAt === null ? 1000 : now - this.lastAt);
    this.lastAt = now;
    this.samples.push({ frames, elapsedMs, at: now });
    while (this.samples.length > 1 && this.samples[0].at < now - this.windowMs) this.samples.shift();
    let totalFrames = 0;
    let totalMs = 0;
    for (const sample of this.samples) { totalFrames += sample.frames; totalMs += sample.elapsedMs; }
    return { fps: frames * 1000 / elapsedMs, averageFps: totalFrames * 1000 / totalMs, sampleMs: elapsedMs };
  }
}
