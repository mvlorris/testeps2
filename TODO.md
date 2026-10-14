# Orion PS2 — revisão de desempenho 0.5.0

## Implementado e testado

- [x] Base 0.4.1 funcional confirmada pelo usuário; ISO original permanece intacta e local.
- [x] Cache nativo de 64 KiB por stream para reduzir chamadas entre worker e interface.
- [x] Regressão C++ com 625 mil leituras sintéticas: 39 buscas de origem, bytes corretos, EOF e posições acima de 4 GiB.
- [x] Núcleo otimizado compilado a partir da revisão Play! conhecida d44bfa18; SHA256 dos artefatos verificado.
- [x] MessageChannel nas pausas cooperativas; remoção de zeramento redundante no caminho comum.
- [x] Cache JS de 16 MiB no modo otimizado e 4 MiB no anterior; nenhuma cópia integral da ISO em RAM.
- [x] Log atualizado somente quando aberto; status evita escritas repetidas do DOM.
- [x] FPS medido pelo tempo real decorrido, com média móvel curta e diagnóstico da GPU usada.
- [x] Preferência de GPU de alto desempenho e MSAA do canvas desativado no modo otimizado; resolução nativa preservada.
- [x] Modo anterior mantido em Configurações para regressões de compatibilidade.
- [x] Teste com God of War USA no Chrome/SwiftShader: menu New Game visível, 530 quadros e nenhum erro JavaScript.
- [x] Comparação inicial: chamadas à ponte de 630.109 para 19.720; boot→primeiro quadro de 40,0 s para 11,0 s. Não é benchmark estatístico de gameplay.

## Validação final

- [x] Implantação 0.5.0 confirmada: nove recursos com SHA256 idêntico ao teste local, dois núcleos acessíveis; boot público com menu New Game, 506 quadros e nenhum erro JavaScript/rede.
- [ ] Comprovar ganho de FPS sustentado durante gameplay no hardware real do usuário; não prometer 60 FPS a partir do boot.

## Port recompilado para PC — investigação separada, não entregue

REA 6.5.0 foi usado para análise estática do site e do artefato ELF God of War. A ISO SCUS_973.99 foi aberta somente para leitura. O runtime ps2-web-recomp foi analisado; documenta God of War II, não valida God of War I. Nenhum port foi compilado ou publicado. A melhoria do site tem prioridade nesta revisão.

## Limites

O núcleo atual usa WebGL2, não WebGPU. A análise REA não converte automaticamente a ISO em um jogo PC. A compatibilidade e o desempenho ainda dependem do Play!, jogo, navegador e hardware.

## Correção gráfica solicitada — revisão 0.6.0

- [x] Corrigir o caminho de alpha/blending no núcleo WebGL2 usando dupla fonte quando o navegador/GPU suportarem, sem mudar os dados da ISO. Teste RGBA8: alpha 128 preservado; 21.426 chamadas reais de dupla fonte e 27 variantes de shader na Radeon, sem erros.
- [x] Aumentar a precisão dos shaders e aplicar a melhoria por padrão a todos os jogos novos e existentes, com fallback automático para navegadores sem a extensão. Três shaders highp; seleção global e fallback real sem extensão testados.
- [x] Manter uma opção de gráficos anteriores para regressões; não esconder cores incorretas com filtros visuais. Gráficos Anteriores e Núcleo Anterior permanecem selecionáveis; nenhum filtro de cor foi aplicado.
- [x] Validar objetivamente a preservação do alpha no framebuffer e testar God of War em gameplay na Radeon, não apenas no menu/SwiftShader. Primeira fase alcançada: 35 variantes e 53.147 chamadas de dupla fonte; a camada verde persiste e NÃO está resolvida.
- [ ] Publicar somente correções testadas e declarar os defeitos residuais; não afirmar que todos os jogos foram testados ou que todos os bugs sumiram.
- [ ] Resolver a camada verde/neblina de God of War: requer correções adicionais do GS; não foi eliminada pela dupla fonte/highp desta revisão. Não executar novos testes extensivos nesta entrega, conforme solicitação do usuário.
