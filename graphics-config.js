// A escolha não depende do nome do jogo: o mesmo caminho é usado para todas as ISOs.
export function selectGraphics(options = {}, dualSourceSupported = false) {
  const optimized = options.mode !== 'compatibility';
  if (!optimized) return { optimized: false, corrected: false, dualSource: false, script: 'Play.js', wasm: 'Play.wasm', label: 'núcleo anterior' };
  if (options.graphics === 'legacy') return { optimized: true, corrected: false, dualSource: false, script: 'Play-perf.js', wasm: 'Play-perf.wasm', label: 'gráficos anteriores' };
  return { optimized: true, corrected: true, dualSource: !!dualSourceSupported, script: 'Play-graphics.js', wasm: 'Play-graphics.wasm', label: dualSourceSupported ? 'highp + alpha dupla fonte' : 'highp + fallback de alpha' };
}
