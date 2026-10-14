# Orion PS2

Launcher local, estático e compatível com GitHub Pages para organizar arquivos de jogos de PS2 no navegador.

## O que funciona

O Orion importa ISO, BIN, CHD, CSO e GZ, persiste a biblioteca no IndexedDB do navegador, oferece filtros e remoção, verifica WebGPU/Gamepad API e abre o emulador Play! para navegador. A seleção da ISO ocorre localmente e nenhum jogo ou BIOS é enviado ao Orion.

O [Play! Web](https://playjs.purei.org/) é uma versão experimental do emulador PlayStation 2 para navegador. Ele aceita ISO, CSO, CHD, ISZ, BIN e ELF e não exige uma BIOS externa. Ao clicar em **Abrir Play!**, o navegador abre o emulador em outra aba; por segurança, a mesma ISO precisa ser escolhida novamente dentro do Play!.

## Publicar no GitHub Pages

O site já está configurado para funcionar como um site estático. Para publicar uma cópia, envie `index.html`, `styles.css`, `app.js`, `README.md` e `TODO.md` para um repositório e, em **Settings → Pages**, selecione **Deploy from a branch**, branch `main` e pasta `/ (root)`.

## Limitações

O Play! Web é experimental e não executa todos os jogos que funcionam na versão desktop. O desempenho depende do navegador, da GPU e do jogo. Use somente ISOs e jogos que você tenha direito de utilizar.

## Desenvolvimento local

Abra `index.html` em um navegador moderno ou use um servidor estático local, por exemplo `python -m http.server 8080`, e acesse `http://localhost:8080`.

## Próximas melhorias

A integração futura pode substituir a abertura externa por uma compilação própria do Play! Web, mas isso exige manter os artefatos WebAssembly, verificar licenças e configurar os cabeçalhos de isolamento cross-origin necessários para threads e streaming.
