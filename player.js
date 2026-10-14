import { DiscImageDevice, checkDiscAccess } from './disc-device.js?v=0.5.0';
import { FrameRateMeter } from './performance-utils.js?v=0.5.0';
import { selectGraphics } from './graphics-config.js?v=0.6.0';

const canvas = document.querySelector('#outputCanvas');
const status = document.querySelector('#status');
const logsElement = document.querySelector('#logs');
const logPanel = document.querySelector('#logPanel');
const fpsElement = document.querySelector('#fps');
const gpuElement = document.querySelector('#gpuInfo');
const meter = new FrameRateMeter();
let module = null;
let started = false;
let failed = false;
let statsTimer = null;
let lastFramesAt = 0;
let totalFrames = 0;
let logsDirty = false;
let gpuName = 'GPU não identificada';
let gpuInspected = false;
let graphics = { corrected: false, dualSource: false };
const lines = [];

function send(type, values = {}) {
  if (parent !== window) parent.postMessage({ source: 'orion-player', type, ...values }, location.origin);
}
function setStatus(message) {
  if (status.textContent === message) return;
  status.textContent = message;
  send('status', { message });
}
function flushLog() {
  if (!logsDirty || !logPanel.open) return;
  logsElement.textContent = lines.join('\n');
  logsDirty = false;
}
function log(message) {
  const text = String(message);
  lines.push(text);
  if (lines.length > 120) lines.shift();
  logsDirty = true;
  // Não escrever no DOM/console para cada mensagem do emulador.
  if (/Failed to start:/i.test(text)) fail(new Error(text));
}
function fail(error) {
  if (failed) return;
  failed = true;
  clearInterval(statsTimer);
  const technical = error?.message || String(error);
  const message = /NotReadable|permission|could not be read/i.test(technical + ' ' + error?.name)
    ? 'O navegador perdeu acesso à ISO. Feche o player e selecione o arquivo novamente.'
    : 'Falha no player: ' + technical + ' — tente o núcleo anterior nas configurações.';
  setStatus(message);
  log(technical);
  flushLog();
  console.error('[Orion Play]', technical);
  send('error', { message, technical });
}
function configureGraphics(optimized, settings) {
  if (!optimized) return;
  const getContext = canvas.getContext.bind(canvas);
  canvas.getContext = (type, attributes) => {
    const webgl = /^(webgl2?|experimental-webgl)$/.test(type);
    const gl = getContext(type, webgl ? { ...attributes, powerPreference: 'high-performance', antialias: false } : attributes);
    if (gl && webgl && settings.dualSource && !gl.getExtension('WEBGL_blend_func_extended')) {
      settings.dualSource = false;
      log('Dupla fonte indisponível no canvas; fallback gráfico selecionado.');
    }
    return gl;
  };
}
function inspectGraphics() {
  const gl = canvas.getContext('webgl2');
  if (!gl) return;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  gpuInspected = true;
  gpuName = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : String(gl.getParameter(gl.RENDERER));
  const software = /swiftshader|llvmpipe|software rasterizer|microsoft basic render/i.test(gpuName);
  gpuElement.textContent = software
    ? 'Renderização por software detectada: verifique a aceleração gráfica do navegador.'
    : 'WebGL2 · ' + gpuName + ' · ' + (graphics.corrected ? (graphics.dualSource ? 'Alpha dupla fonte + highp' : 'Highp; alpha em fallback') : 'Gráficos anteriores');
  send('gpu', { gpuName, software, graphicsCorrected: graphics.corrected, dualSource: graphics.dualSource });
}

async function boot(file, options = {}) {
  if (started) return;
  started = true;
  try {
    if (!crossOriginIsolated) throw new Error('Isolamento cross-origin inativo. Recarregue antes de selecionar a ISO.');
    const probe = document.createElement('canvas').getContext('webgl2', { powerPreference: 'high-performance' });
    if (!probe) throw new Error('WebGL2 indisponível.');
    const choice = selectGraphics(options, !!probe.getExtension('WEBGL_blend_func_extended'));
    const { optimized } = choice;
    graphics = { corrected: choice.corrected, dualSource: choice.dualSource };
    probe.getExtension('WEBGL_lose_context')?.loseContext();
    configureGraphics(optimized, graphics);
    setStatus('Verificando acesso à ISO…');
    await checkDiscAccess(file);
    setStatus(choice.corrected ? 'Carregando núcleo gráfico com precisão highp…' : optimized ? 'Carregando núcleo com gráficos anteriores…' : 'Carregando núcleo anterior de compatibilidade…');
    const coreURL = new URL('./' + choice.script, location.href);
    const { default: Play } = await import(coreURL.href);
    module = await Play({
      canvas,
      orionGraphics: graphics,
      mainScriptUrlOrBlob: coreURL.href,
      locateFile: path => new URL(/(^|\/)Play\.wasm$/.test(path) ? choice.wasm : path, coreURL.href).href,
      print: log,
      printErr: log,
      onAbort: reason => fail(new Error('Runtime interrompido: ' + reason)),
    });
    module.FS.mkdir('/work');
    module.discImageDevice = new DiscImageDevice(module, { onReadError: fail, cacheBlocks: optimized ? 16 : 4 });
    module.discImageDevice.setFile(file);
    setStatus('Inicializando PS2…');
    module.ccall('initVm', null, [], []);
    module.bootDiscImage(file.name);
    setStatus('Boot solicitado; aguardando quadros do jogo…');
    send('boot-requested', { name: file.name, size: file.size, optimized, graphicsCorrected: graphics.corrected, dualSource: graphics.dualSource });
    canvas.focus();
    const bootAt = performance.now();
    meter.reset(bootAt);
    statsTimer = setInterval(() => {
      if (failed) return;
      try {
        const now = performance.now();
        const frames = module.getFrames();
        module.clearStats();
        const rate = meter.sample(frames, now);
        totalFrames += frames;
        if (frames > 0 && !gpuInspected) inspectGraphics();
        if (frames > 0) lastFramesAt = now;
        fpsElement.textContent = `${rate.averageFps.toFixed(1)} FPS`;
        const device = module.discImageDevice;
        if (frames > 0) setStatus('Emulador produzindo quadros — clique na tela para controlar.');
        else if (now - bootAt > 30000 && (!lastFramesAt || now - lastFramesAt > 15000)) {
          setStatus('Sem novos quadros. A execução pode estar lenta ou aguardando leitura; consulte o log.');
        }
        flushLog();
        send('stats', { frames, fps: rate.fps, averageFps: rate.averageFps, sampleMs: rate.sampleMs, totalFrames,
          bytesRead: device.bytesRead, diskBytesRead: device.diskBytesRead, readCount: device.readCount,
          cacheHits: device.cacheHits, cacheMisses: device.cacheMisses, cacheBytes: device.cacheBytes,
          wasmMemoryBytes: module.HEAPU8.length, gpuName, optimized, graphicsCorrected: graphics.corrected, dualSource: graphics.dualSource });
      } catch (error) { fail(error); }
    }, 1000);
  } catch (error) { fail(error); }
}

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data?.source !== 'orion-library' || event.data?.type !== 'boot') return;
  if (!(event.data.file instanceof File)) { fail(new Error('Selecione a ISO pelo botão Importar.')); return; }
  void boot(event.data.file, event.data.options);
});
window.addEventListener('error', event => fail(event.error || new Error(event.message)));
window.addEventListener('unhandledrejection', event => fail(event.reason));
logPanel.addEventListener('toggle', flushLog);
canvas.addEventListener('click', () => canvas.focus());
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(new Error('Contexto WebGL2 perdido.')); });
document.querySelector('#fullscreenBtn').onclick = () => canvas.requestFullscreen().catch(fail);
window.addEventListener('pagehide', () => { clearInterval(statsTimer); module?.discImageDevice?.dispose(); });
send('ready');
