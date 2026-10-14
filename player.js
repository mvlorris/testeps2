import { DiscImageDevice, checkDiscAccess } from './disc-device.js?v=0.4.0';

const canvas = document.querySelector('#outputCanvas');
const status = document.querySelector('#status');
const logsElement = document.querySelector('#logs');
let module = null;
let started = false;
let failed = false;
let statsTimer = null;
let lastFramesAt = 0;
let totalFrames = 0;
const lines = [];

function send(type, values = {}) {
  if (parent !== window) parent.postMessage({ source: 'orion-player', type, ...values }, location.origin);
}
function setStatus(message) {
  status.textContent = message;
  send('status', { message });
}
function log(message) {
  const text = String(message);
  lines.push(text);
  if (lines.length > 120) lines.shift();
  logsElement.textContent = lines.join('\n');
  console.info('[Orion Play]', text);
  if (/Failed to start:/i.test(text)) fail(new Error(text));
}
function fail(error) {
  if (failed) return;
  failed = true;
  clearInterval(statsTimer);
  const technical = error?.message || String(error);
  const message = /NotReadable|permission|could not be read/i.test(technical + ' ' + error?.name)
    ? 'O navegador perdeu acesso ao arquivo. Feche o player e selecione a ISO novamente; não altere ou mova o arquivo enquanto joga.'
    : 'Falha no player: ' + technical;
  setStatus(message);
  log(technical);
  send('error', { message, technical });
}

async function boot(file) {
  if (started) return;
  started = true;
  try {
    if (!crossOriginIsolated) throw new Error('Isolamento cross-origin inativo. Recarregue a página antes de selecionar a ISO.');
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) throw new Error('WebGL2 não está disponível neste navegador.');
    context.getExtension('WEBGL_lose_context')?.loseContext();
    setStatus('Verificando acesso a pequenos blocos da ISO…');
    await checkDiscAccess(file);
    setStatus('Carregando o núcleo WebAssembly do próprio site…');
    const coreURL = new URL('./Play.js', location.href);
    const { default: Play } = await import(coreURL.href);
    module = await Play({
      canvas,
      mainScriptUrlOrBlob: coreURL.href,
      locateFile: path => new URL(path, coreURL.href).href,
      print: log,
      printErr: log,
      onAbort: reason => fail(new Error('Runtime interrompido: ' + reason)),
    });
    // Esta é a API usada pelo frontend oficial js/play_browser.
    module.FS.mkdir('/work');
    module.discImageDevice = new DiscImageDevice(module, { onReadError: fail });
    module.discImageDevice.setFile(file);
    setStatus('Inicializando a máquina PS2 e o canvas WebGL2…');
    module.ccall('initVm', null, [], []);
    module.bootDiscImage(file.name);
    setStatus('Boot solicitado; aguardando quadros do jogo…');
    send('boot-requested', { name: file.name, size: file.size });
    canvas.focus();
    const bootAt = performance.now();
    statsTimer = setInterval(() => {
      if (failed) return;
      try {
        const frames = module.getFrames();
        module.clearStats();
        totalFrames += frames;
        if (frames > 0) lastFramesAt = performance.now();
        document.querySelector('#fps').textContent = `${frames} quadros/s`;
        const device = module.discImageDevice;
        const elapsed = performance.now() - bootAt;
        if (frames > 0) setStatus('Emulador produzindo quadros — clique na tela para controlar.');
        else if (elapsed > 20000 && (!lastFramesAt || performance.now() - lastFramesAt > 15000)) {
          setStatus('Sem novos quadros. O boot foi solicitado, mas a execução pode estar lenta ou bloqueada no núcleo; consulte o log.');
        }
        send('stats', { frames, totalFrames, bytesRead: device.bytesRead, readCount: device.readCount, wasmMemoryBytes: module.HEAPU8.length });
      } catch (error) { fail(error); }
    }, 1000);
  } catch (error) { fail(error); }
}

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data?.source !== 'orion-library' || event.data?.type !== 'boot') return;
  if (!(event.data.file instanceof File)) { fail(new Error('Selecione o arquivo pelo botão Importar ISO.')); return; }
  void boot(event.data.file);
});
window.addEventListener('error', event => fail(event.error || new Error(event.message)));
window.addEventListener('unhandledrejection', event => fail(event.reason));
canvas.addEventListener('click', () => canvas.focus());
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(new Error('O navegador perdeu o contexto gráfico WebGL2.')); });
document.querySelector('#fullscreenBtn').onclick = () => canvas.requestFullscreen().catch(fail);
window.addEventListener('pagehide', () => { clearInterval(statsTimer); });
send('ready');
