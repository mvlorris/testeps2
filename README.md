# Orion PS2 — player local experimental

Site estático compatível com GitHub Pages. Usa o núcleo open-source **Play!** hospedado no próprio repositório. Não abre playjs.purei.org, não envia a ISO e não exige uma BIOS externa.

## Correção da versão 0.4.0

A versão anterior tentava `file.arrayBuffer()` sobre toda a ISO de God of War (8.522.792.960 bytes). Isso poderia falhar por tamanho/memória ou acesso ao arquivo. Ela também apenas executava `main()`, que imprime a versão: não criava uma máquina PS2 nem solicitava boot. A versão atual substitui esse fluxo pelo dispositivo de disco e pela sequência do frontend oficial `js/play_browser`:

1. Testar acesso ao começo, descritor ISO9660 e fim do arquivo, lendo apenas alguns KiB.
2. Carregar `Play.js` / `Play.wasm` do mesmo site.
3. Atribuir `module.discImageDevice` a um leitor local de `File.slice()`.
4. Criar o canvas `outputCanvas` de 640×480.
5. Chamar `module.ccall('initVm', null, [], [])`.
6. Chamar `module.bootDiscImage(file.name)`.
7. Mostrar quadros reais por `getFrames()` / `clearStats()` e contadores de leitura.

O dispositivo lê blocos de no máximo 1 MiB por vez, com cache LRU limitado a quatro blocos (4 MiB), sem copiar toda a ISO ao filesystem virtual. Os offsets usam números inteiros seguros, incluindo posições acima de 4 GiB. Falhas de leitura são mostradas sem deixar `isDone()` esperando indefinidamente. Cada sessão roda em um iframe **do próprio site**; fechar o player destrói seu documento e os workers.

**Importante: este núcleo renderiza com WebGL2, não WebGPU.** Detectar `navigator.gpu` não torna um emulador WebGPU. Essa é uma correção das alegações das versões anteriores; um backend WebGPU exigiria trabalho adicional no núcleo, não só HTML/JavaScript.

## Usar

Abra https://mvlorris.github.io/testeps2/ em Chrome ou Edge atualizado.

- Na primeira visita, aguarde o service worker ser ativado e o recarregamento automático.
- Confirme **Isolamento cross-origin: ativo**.
- Selecione uma ISO já extraída e disponível no disco local, não um ZIP nem um placeholder de nuvem.
- Mantenha o arquivo disponível: não o mova, sobrescreva ou apague durante a execução.
- Clique no canvas para controlar: Enter = Start, Backspace = Select, setas = direcional, A/Z/S/X = quadrado/cruz/triângulo/círculo.
- Clique em **Selecionar ISO novamente** se o navegador reportar perda de acesso.
- Somente os metadados ficam no IndexedDB **por escolha do projeto**. O IndexedDB pode armazenar blobs/arquivos, mas não copiamos ISOs de vários GB para ele. Ao recarregar, o usuário seleciona o arquivo novamente.

O status distingue **boot solicitado**, **quadros produzidos** e **falha**. Quadros produzidos não provam que o jogo é jogável nem que avança além de uma tela preta. Desempenho e compatibilidade dependem do núcleo experimental, do jogo e do hardware.

## Arquivos

- `index.html`, `app.js`, `styles.css`: biblioteca local e interface.
- `player.html`, `player.js`: canvas e inicialização real da VM em um iframe do mesmo domínio.
- `disc-device.js`: leitura assíncrona por blocos para a ponte C++ do Play!.
- `Play.js`, `Play.wasm`: núcleo compilado, sem download de emulador de outro site durante o jogo.
- `coi-serviceworker.js`: adiciona COOP/COEP às respostas do próprio site para pthreads no Pages.
- `.github/workflows/build-play-web.yml`: compilação do núcleo em GitHub Actions. Gera um artefato; não substitui automaticamente os binários publicados.
- `LICENSE-Play.txt`: licença do Play! e do código adaptado do seu frontend.

## Origem e limites

Fonte do núcleo: https://github.com/jpd002/Play-, revisão `d44bfa1814b729d4a3ed3c6c3a945432d5ee5bbe` (0.77-13-gd44bfa18). O código local do dispositivo e a sequência de boot foram adaptados do frontend oficial dessa revisão. O núcleo é open-source de terceiros **auto-hospedado**, não um emulador escrito do zero pelo Orion.

A ISO local foi identificada como `SCUS_973.99`, God of War (USA). Reconhecer a estrutura e o serial não confirma integridade por hash nem compatibilidade completa.

## Validação desta correção

Em teste local com a ISO de 8.522.792.960 bytes, Chrome headless e renderizador de teste SwiftShader, o núcleo registrou `Starting...`, produziu 209 quadros e exibiu a tela **Sony Computer Entertainment America Presents** de God of War. O teste não registrou erros de JavaScript. A memória WASM observada foi de aproximadamente 188,4 MiB, além do cache limitado de leitura, em vez de uma alocação de toda a ISO. O primeiro boot levou dezenas de segundos nesse ambiente de teste; não é uma estimativa de desempenho para outros computadores.

Isso comprova leitura e renderização inicial, não gameplay completo, velocidade estável, funcionamento de áudio ou controles físicos. Testes automatizados adicionais verificaram offsets acima de 4 GiB, cache limitado e tratamento de falhas de leitura.

Use somente jogos e arquivos que você tenha direito de utilizar.
