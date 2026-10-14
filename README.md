# Orion PS2

Launcher local, estático e compatível com GitHub Pages para organizar arquivos de jogos de PS2 no navegador.

## O que já funciona

- Importação local de ISO, BIN, CHD, CSO e GZ.
- Biblioteca persistida em IndexedDB no navegador.
- Filtros de biblioteca e remoção de jogos.
- Importação de BIOS para a sessão (sem upload).
- Diagnóstico de WebGPU, Gamepad API e armazenamento local.
- Interface responsiva e sem backend.

## Limitação importante

Esta versão é o **launcher/base de integração**. O núcleo de emulação PS2 ainda não está incluído. A execução real exige integrar um emulador PS2 compatível com WebAssembly/WebGPU e respeitar suas licenças. O navegador não executa uma ISO sozinho apenas por ter WebGPU.

Use somente ISOs, BIOS e jogos que você tenha direito de utilizar. Nenhum arquivo selecionado é enviado para a internet.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `styles.css`, `app.js` e este README.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha `main` e a pasta `/root`.
6. Salve e aguarde a URL do Pages.

Como o projeto usa apenas caminhos relativos, ele funciona em subpastas do GitHub Pages.

## Desenvolvimento local

Abra `index.html` em um navegador moderno. Para alguns recursos avançados, é melhor usar um servidor estático local, por exemplo:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Próxima integração técnica

O ponto de entrada visual de execução está no handler `[data-play]` em `app.js`. O próximo passo é substituir o aviso por um módulo WASM de emulação, carregar a ISO em chunks e conectar o framebuffer ao canvas WebGPU.
