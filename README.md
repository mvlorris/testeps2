# Orion PS2

Launcher local para importar imagens de jogos de PlayStation 2 e iniciar o runtime Play! WebAssembly hospedado no próprio GitHub Pages. A ISO permanece no computador do usuário e não é enviada ao servidor.

## O que está publicado

- `Play.js` e `Play.wasm`: artefatos compilados no GitHub Actions a partir do Play!.
- `app.js`: importa a ISO, monta o arquivo no filesystem virtual do WebAssembly e inicia o módulo.
- `coi-serviceworker.js`: habilita COOP/COEP no GitHub Pages para permitir `SharedArrayBuffer`/pthreads.
- `build-play-web.yml`: recompila o núcleo automaticamente no GitHub Actions.

## Como usar

1. Abra https://mvlorris.github.io/testeps2/ em um navegador Chromium atualizado.
2. Na primeira visita, aguarde o recarregamento automático do service worker de isolamento.
3. Confirme no diagnóstico que **Isolamento cross-origin** aparece como `ativo`.
4. Importe sua ISO pelo botão **Importar ISO** e aguarde o núcleo iniciar.
5. Se a biblioteca mostrar somente metadados após recarregar, reimporte a ISO: navegadores não permitem persistir o objeto `File` original em IndexedDB.

## Limitações atuais

O runtime Play! WebAssembly compilado já é carregado do próprio site e não usa um emulador externo. A camada de integração com o canvas/WebGL2/WebGPU depende do frontend do build do Play! e pode variar conforme navegador e jogo; a ISO `God of War (USA)` foi identificada como NTSC-U, serial `SCUS-973.99`, mas isso não garante compatibilidade perfeita.

O GitHub Pages é uma hospedagem estática. O service worker local fornece o isolamento necessário para o build com pthreads; se o navegador bloquear workers, use Chrome/Edge atualizado, recarregue a página e confirme o diagnóstico.

Use apenas jogos e arquivos de sistema que você tenha direito de utilizar.
