# Orion PS2 — TODO

## Concluído

- [x] Biblioteca local e importação de ISO.
- [x] Diagnóstico de WebGPU, Gamepad API e armazenamento.
- [x] Remoção do redirecionamento para emulador de terceiros.
- [x] Mensagem honesta quando o núcleo próprio ainda não está disponível.
- [x] Workflow do GitHub Actions para compilar Play! com Emscripten.
- [x] Identificação da ISO God of War USA como `SCUS-973.99`.

## Núcleo próprio

- [ ] Executar o workflow e obter `Play.js` e `Play.wasm`.
- [ ] Integrar `js/play_browser` ao layout do Orion.
- [ ] Adaptar a API de seleção de disco para receber `File`/`FileSystemFileHandle` local.
- [ ] Ligar framebuffer, áudio e controles ao Orion.
- [ ] Configurar cross-origin isolation em hospedagem compatível.
- [ ] Validar God of War `SCUS-973.99` com logs, não apenas tela preta.
- [ ] Publicar somente após um teste real de boot e renderização.
