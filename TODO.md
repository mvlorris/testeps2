# Orion PS2 — TODO

## Entregue nesta versão

- [x] Criar launcher estático compatível com GitHub Pages.
- [x] Permitir importar ISO, BIN, CHD, CSO e GZ do computador.
- [x] Persistir nomes e metadados localmente com IndexedDB.
- [x] Adicionar seleção de BIOS local, embora o Play! Web não exija BIOS externa.
- [x] Diagnosticar WebGPU, Gamepad API e armazenamento.
- [x] Integrar o botão de execução ao Play! Web oficial.
- [x] Orientar a seleção da ISO novamente na aba do emulador por isolamento de segurança do navegador.
- [x] Documentar publicação e limitações legais/técnicas.

## Próximo marco: integração embutida

- [ ] Avaliar compilar o Play! Web dentro do próprio projeto.
- [ ] Hospedar os artefatos WebAssembly apenas se a licença e o tamanho forem adequados.
- [ ] Configurar cross-origin isolation para SharedArrayBuffer e threads.
- [ ] Investigar comunicação segura entre biblioteca e núcleo embutido.
- [ ] Testar compatibilidade de jogos e desempenho em Chrome/Edge.
