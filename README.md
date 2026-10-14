# Orion PS2

Launcher local para uma futura execução de jogos de PS2 dentro do próprio site. A biblioteca importa ISOs e mantém apenas metadados no navegador; o arquivo do jogo não é enviado.

## Estado atual

A interface está pronta, mas este repositório ainda não contém `Play.js` nem `Play.wasm`. Portanto, o Orion **não tenta abrir emuladores de terceiros e não promete executar a ISO**. Ao importar um jogo, ele mostra o estado do núcleo e mantém a ISO local.

O workflow `.github/workflows/build-play-web.yml` prepara uma compilação do Play! WebAssembly no GitHub Actions. Ele é a primeira etapa para gerar o núcleo dentro do projeto. Depois da compilação, ainda será necessário integrar a API do canvas e o carregamento de disco do `js/play_browser`; somente copiar o `.wasm` não é suficiente.

A ISO analisada `God of War (USA)` é uma imagem válida NTSC-U com serial `SCUS-973.99`. Isso confirma o arquivo, mas não garante compatibilidade do jogo com o núcleo web experimental.

## Por que o GitHub Pages não executa o núcleo ainda

Um emulador PS2 web normalmente precisa de artefatos WebAssembly, WebGPU e isolamento cross-origin para threads. O GitHub Pages não oferece controle direto sobre os cabeçalhos HTTP necessários para esse isolamento. A hospedagem final pode precisar usar Cloudflare Pages, Netlify ou um servidor próprio com `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`.

## Publicação

O launcher estático continua compatível com GitHub Pages. Para executar o workflow, abra a aba **Actions** do repositório e execute **Build Orion PS2 WebAssembly** manualmente. O resultado aparece como artefato do workflow; ele ainda não deve ser publicado como se fosse uma integração concluída.

Use apenas jogos e arquivos de sistema que você tenha direito de utilizar.
