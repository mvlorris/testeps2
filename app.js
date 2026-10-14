const DB_NAME = 'orion-ps2';
const STORE = 'games';
const files = new Map(); // Somente referências desta sessão; nenhuma ISO enviada.
const $ = selector => document.querySelector(selector);
let games = [];
let currentFilter = 'all';
let player = null;
let activeGame = null;
let toastTimer;
let coreMode = 'optimized';
try { if (localStorage.getItem('orion-core-mode') === 'compatibility') coreMode = 'compatibility'; } catch {}
let graphicsProfile = 'auto';
try { if (localStorage.getItem('orion-graphics-profile') === 'legacy') graphicsProfile = 'legacy'; } catch {}

function selectedCoreOptions() { return { mode: coreMode, graphics: graphicsProfile }; }

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4000);
}
function formatSize(bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let index = 0;
  while (bytes >= 1024 && index < 3) { bytes /= 1024; index++; }
  return `${bytes.toFixed(index ? 1 : 0)} ${units[index]}`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function dbOperation(mode, action) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request?.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Operação local interrompida.'));
    });
  } finally { db.close(); }
}
async function loadGames() {
  try {
    const stored = await dbOperation('readonly', store => store.getAll());
    // Não reutilizar File ou flag coreReady das versões anteriores.
    games = stored.map(({ id, name, ext, size, addedAt }) => ({ id, name, ext, size, addedAt }));
    games.sort((a, b) => b.addedAt - a.addedAt);
    render();
  } catch (error) { console.warn(error); toast('Armazenamento indisponível; a sessão ainda pode abrir arquivos locais.'); }
}
function chooseFile() {
  // Limpar ANTES de selecionar, não durante uma leitura em andamento.
  if (player) stopPlayer();
  $('#gameInput').value = '';
  $('#gameInput').click();
}
function render() {
  $('#gameCount').textContent = `${games.length} ${games.length === 1 ? 'título' : 'títulos'}`;
  const list = games.filter(game => currentFilter === 'all' || files.has(game.id));
  if (!list.length) {
    $('#libraryGrid').innerHTML = `<div class="empty-state"><h3>${games.length ? 'Nenhum arquivo selecionado nesta sessão' : 'A biblioteca está vazia'}</h3><p>Importe uma imagem de disco do seu computador. Apenas os metadados ficam salvos.</p><button class="secondary-btn" id="emptyImportBtn">Importar ISO</button></div>`;
    $('#emptyImportBtn').onclick = chooseFile;
    return;
  }
  $('#libraryGrid').innerHTML = `<div class="game-grid">${list.map(game => `<article class="game-card"><div><div class="game-art">${escapeHtml(game.name.slice(0, 2).toUpperCase())}</div><div class="game-info"><h3 class="game-name">${escapeHtml(game.name)}</h3><div class="game-meta">${escapeHtml(game.ext.toUpperCase())} · ${formatSize(game.size)} · ${files.has(game.id) ? 'SELECIONADO' : 'SELECIONE O ARQUIVO'}</div></div></div><div class="card-actions"><button class="play-btn" data-play="${escapeHtml(game.id)}">${files.has(game.id) ? 'INICIAR PS2' : 'SELECIONAR ISO'}</button><button class="delete-btn" data-delete="${escapeHtml(game.id)}" aria-label="Remover da biblioteca">×</button></div></article>`).join('')}</div>`;
  document.querySelectorAll('[data-play]').forEach(button => {
    button.onclick = () => {
      const game = games.find(item => item.id === button.dataset.play);
      if (files.has(game.id)) openEmulator(game); else chooseFile();
    };
  });
  document.querySelectorAll('[data-delete]').forEach(button => {
    button.onclick = async () => {
      const id = button.dataset.delete;
      try {
        await dbOperation('readwrite', store => store.delete(id));
        files.delete(id);
        games = games.filter(game => game.id !== id);
        render();
        toast('Metadados removidos; o arquivo original não foi apagado.');
      } catch (error) { toast('Falha ao remover os metadados: ' + error.message); }
    };
  });
}
function stopPlayer() {
  player?.remove(); // Destruir o documento libera os pthreads do núcleo.
  player = null;
  activeGame = null;
  $('#playerStats').textContent = '';
}
function openEmulator(game) {
  const dialog = $('#emulatorDialog');
  stopPlayer();
  activeGame = game;
  $('#emulatorName').textContent = game.name;
  $('#emulatorMessage').textContent = 'Abrindo o player local…';
  $('#retryFileBtn').hidden = false;
  if (!dialog.open) dialog.showModal();
  if (!crossOriginIsolated) {
    $('#emulatorMessage').textContent = 'O isolamento ainda não está ativo. Recarregue a página antes de selecionar a ISO.';
    return;
  }
  player = document.createElement('iframe');
  player.title = 'Player PS2 local';
  player.src = './player.html?v=0.6.0';
  player.allow = 'autoplay; fullscreen; gamepad';
  $('#playerHost').append(player);
}
window.addEventListener('message', event => {
  if (!player || event.origin !== location.origin || event.source !== player.contentWindow) return;
  const data = event.data;
  if (data?.source !== 'orion-player') return;
  if (data.type === 'ready') {
    const file = files.get(activeGame.id);
    player.contentWindow.postMessage({ source: 'orion-library', type: 'boot', file, options: selectedCoreOptions() }, location.origin);
  } else if (data.type === 'status' || data.type === 'error') {
    $('#emulatorMessage').textContent = data.message;
  } else if (data.type === 'stats') {
    const fps = Number.isFinite(data.averageFps) ? data.averageFps.toFixed(1) : String(data.frames);
    const graphicsLabel = data.graphicsCorrected ? data.dualSource ? 'alpha dupla fonte + highp' : 'highp; fallback alpha' : 'gráficos anteriores';
    const text = `${fps} FPS · ${graphicsLabel} · ${data.readCount.toLocaleString('pt-BR')} leituras pela ponte · cache ${formatSize(data.cacheBytes || 0)} · WASM ${formatSize(data.wasmMemoryBytes)}`;
    if ($('#playerStats').textContent !== text) $('#playerStats').textContent = text;
  }
});
$('#importGameBtn').onclick = chooseFile;
$('#retryFileBtn').onclick = chooseFile;
$('#gameInput').onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['iso', 'bin', 'chd', 'cso', 'isz'].includes(ext)) { toast('Selecione ISO, BIN, CHD, CSO ou ISZ; extraia arquivos ZIP/GZ antes.'); return; }
  let game = games.find(item => item.name === file.name.replace(/\.[^/.]+$/, '') && item.size === file.size && item.ext === ext);
  if (!game) {
    game = { id: crypto.randomUUID(), name: file.name.replace(/\.[^/.]+$/, ''), ext, size: file.size, addedAt: Date.now() };
    games.unshift(game);
  }
  files.set(game.id, file);
  try { await dbOperation('readwrite', store => store.put(game)); }
  catch (error) { console.warn(error); toast('Metadados não puderam ser salvos; abrindo nesta sessão.'); }
  render();
  openEmulator(game);
  // Manter a seleção e o File vivos enquanto o emulador usa file.slice().
};
document.querySelectorAll('.filter-btn').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    render();
  };
});
function setDiag(name, ok, text) {
  $(`#${name}Check`).textContent = text;
  $(`#${name}Dot`).classList.toggle('ok', ok);
}
function diagnose() {
  const webgl2 = !!document.createElement('canvas').getContext('webgl2');
  setDiag('webgl', webgl2, webgl2 ? 'disponível — usado pelo núcleo' : 'indisponível');
  setDiag('webgpu', !!navigator.gpu, navigator.gpu ? 'disponível — não usado nesta versão' : 'indisponível — não necessário');
  setDiag('storage', !!window.indexedDB, window.indexedDB ? 'metadados locais' : 'indisponível');
  setDiag('isolation', !!window.crossOriginIsolated, window.crossOriginIsolated ? 'ativo' : 'aguardando recarregamento');
  $('#gpuStatus').textContent = webgl2 ? 'PS2 / WebGL2' : 'WebGL2 indisponível';
}
async function setupIsolation() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./coi-serviceworker.js');
    await navigator.serviceWorker.ready;
    if (!crossOriginIsolated && !sessionStorage.getItem('orion-coi-reload-v4')) {
      await new Promise(resolve => {
        if (navigator.serviceWorker.controller) resolve();
        else navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      });
      sessionStorage.setItem('orion-coi-reload-v4', '1');
      location.reload();
    }
  } catch (error) { console.warn(error); toast('Não foi possível ativar o isolamento: ' + error.message); }
}
$('#howBtn').onclick = () => $('#howDialog').showModal();
$('#settingsBtn').onclick = () => $('#settingsDialog').showModal();
$('#coreModeSelect').value = coreMode;
$('#coreModeSelect').onchange = event => {
  coreMode = event.target.value === 'compatibility' ? 'compatibility' : 'optimized';
  try { localStorage.setItem('orion-core-mode', coreMode); } catch {}
  toast('Modo salvo. Feche e inicie o jogo novamente para aplicar.');
};
$('#graphicsProfileSelect').value = graphicsProfile;
$('#graphicsProfileSelect').onchange = event => {
  graphicsProfile = event.target.value === 'legacy' ? 'legacy' : 'auto';
  try { localStorage.setItem('orion-graphics-profile', graphicsProfile); } catch {}
  toast('Perfil gráfico global salvo. Reinicie o player para aplicar.');
};
document.querySelectorAll('[data-close]').forEach(button => { button.onclick = () => button.closest('dialog').close(); });
$('#emulatorDialog').addEventListener('close', stopPlayer);
$('#clearLibraryBtn').onclick = async () => {
  if (!confirm('Remover os metadados da biblioteca? Nenhuma ISO será apagada.')) return;
  try {
    await dbOperation('readwrite', store => store.clear());
    games = [];
    files.clear();
    render();
  } catch (error) { toast(error.message); }
};
diagnose();
void loadGames();
void setupIsolation();
