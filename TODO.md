# Orion PS2 — estado da versão 0.4.0

## Concluído e verificado

- [x] Biblioteca de metadados e seleção local de arquivos, sem upload de ISO.
- [x] Núcleo Play! WebAssembly compilado e hospedado no mesmo site.
- [x] Isolamento cross-origin por service worker no GitHub Pages.
- [x] Leitura por blocos de no máximo 1 MiB, cache LRU limitado a 4 MiB, offsets acima de 4 GiB.
- [x] Tratamento de NotReadableError sem deixar o worker preso em isDone().
- [x] Sequência real de inicialização: canvas outputCanvas → initVm → bootDiscImage.
- [x] Status de boot e contadores reais de quadros, leitura e memória.
- [x] Separação da sessão de emulação em iframe do próprio site, destruído ao fechar.
- [x] Correção das alegações antigas: o renderizador é WebGL2; metadados apenas no IndexedDB por escolha, não limitação da API.
- [x] Teste com God of War (USA), 8.522.792.960 bytes: log Starting..., 209 quadros produzidos e tela de apresentação Sony visível no teste local Chrome/SwiftShader.
- [x] Testes de regressão: leitura acima de 4 GiB, nenhuma leitura da ISO inteira, cache de quatro blocos e falhas sem deadlock.

## Não comprovado / fora desta correção

- [ ] Jogabilidade completa de God of War e progresso até gameplay, sem bugs e com desempenho estável.
- [ ] Validar teclado e áudio em jogo completo; a integração usa os handlers oficiais.
- [ ] Controle físico via Gamepad API; não anunciado como funcional nesta versão.
- [ ] Backend WebGPU real. O núcleo atual usa WebGL2.
- [ ] Versão para jogos de PC.
