# Relatório técnico · Etapa 3 Mobile

Registro histórico. A validação vigente é a [Etapa 5](etapa5-relatorio.md): 25 estados Mobile nas cinco larguras aprovadas e operações integradas. As descrições e contagens abaixo referem-se à Etapa 3.

Revisão em 17/11/2026. Situação final: **CONCLUÍDA** no escopo de interfaces demonstrativas da Etapa 3.

## 1. Resumo geral

Dez documentos HTML por módulo implementam os fluxos Mobile do morador. As **19 referências aprovadas foram localizadas e mapeadas**. A suíte final cobre 25 rotas autenticadas, login, filtros, formulários, prévias e navegação; foram geradas 29 capturas atualizadas.

A pendência inicial de seis imagens ausentes foi resolvida: elas estavam no ZIP `CondoConnect — Protótipo Mobile.zip`, em subpastas Encomenda, Solicitação e Reserva. A comparação SHA-256 confirmou que as outras 13 imagens do ZIP são idênticas às imagens avulsas usadas inicialmente.

## 2. Interfaces e referências

Páginas em `mobile/`: login, início, mensagens, encomendas, serviços, solicitações, reservas, notificações, perfil e comunicados. O inventário das 19 referências, com suas URLs e estados, está em [mapa-telas.md](mapa-telas.md).

As seis referências recuperadas e corrigidas:

| Referência | Implementação |
|---|---|
| Encomenda · Aguardando retirada | `encomendas.html?id=ENC-024` |
| Encomenda · Entregue | `encomendas.html?id=ENC-024&estado=entregue` |
| Solicitação · Em análise | `solicitacoes.html?id=SOL-018` |
| Solicitação · Em andamento | `solicitacoes.html?id=SOL-018&visual=Em%20andamento` |
| Reserva · Confirmada | `reservas.html?estado=confirmada&id=RES-021` |
| Reserva · Cancelada | `reservas.html?estado=cancelada&id=RES-021` |

Também estão disponíveis Aberto e Concluído para solicitação, horários ocupados/disponíveis/selecionados, filtros vazios, busca sem resultado, erros de identificador e prévias de mensagem e nova solicitação.

## 3. Arquivos e componentes

A implementação inicial modificou os dois HTML Mobile existentes, seus dois CSS e `layout.js`/`mobile.js`; criou oito HTML e os módulos `mensagens.js`, `ocorrencias.js`, `reservas.js` e `tests/mobile.test.mjs`. README e mapa de telas foram atualizados.

Nesta revisão foram ajustados:

- `mobile/js/ocorrencias.js`: detalhes de encomenda e acompanhamento de solicitação.
- `mobile/js/reservas.js`: páginas de confirmação e cancelamento visual.
- `mobile/css/components.css`: painéis de aviso, detalhes, timeline e confirmação.
- `tests/mobile.test.mjs`: novas rotas, navegação e preservação da seleção de data/faixa.
- `README.md`, `docs/mapa-telas.md` e este relatório: inventário e resultados atuais.

Foram adicionadas as 19 imagens originais em `docs/referencias-mobile/`, 29 capturas finais em `docs/capturas-mobile-revisao/` e o inventário SHA-256 da base em `docs/integridade-base-mobile.json`. As 27 capturas da primeira entrega foram preservadas em `docs/capturas-mobile/` como histórico.

Reutilizados sem alteração: tokens, base CSS, fonte Inter existente, sessão, armazenamento e cinco serviços compartilhados. Não foram instaladas bibliotecas nem alterados testes preexistentes.

## 4. Navegação e comportamento

Login demonstrativo entra como Marina Lopes, Torre A · 302. A barra inferior oferece Início, Mensagens, Encomendas e Serviços. Atalhos e Serviços levam a Solicitações e Reservas. Sino abre notificações; avatar abre perfil; comunicados do início abrem seus detalhes.

Encomendas abrem detalhes, instruções de retirada e prévia Entregue. Solicitações abrem formulário ou acompanhamento com status e timeline. A agenda permite selecionar dia e faixa e abrir a página Reserva confirmada; a seleção é mantida na prévia. Cancelar reserva abre o estado Minhas reservas com aviso de cancelamento e RES-021 projetada no histórico. Um link retorna aos registros atuais.

Essas prévias não alteram a base. Diálogos permanecem apenas nas ações complementares de mensagem, nova conversa e prévia de solicitação. Saída encerra a sessão da aba. Páginas autenticadas exigem perfil morador; identificadores ausentes ou de outro morador não exibem seus dados.

## 5. Responsividade

Testadas larguras **320, 360, 375, 390 e 430 px**, altura de 844 px, no Edge em emulação Mobile. Cada rota passou por verificações de largura total, controles contidos, campos nomeados, título único, módulo ativo, geometria da barra fixa e espaço inferior do conteúdo.

Não foram detectadas falhas de rolagem horizontal ou controles fora da largura nos cenários executados. A barra considera a área segura do dispositivo. O conteúdo permanece rolável em telas menores; os títulos longos podem quebrar linha.

As capturas finais incluem 26 cenários em 390 × 844 e três cenários adicionais em 430 × 844. Os componentes das seis imagens recuperadas foram inspecionados visualmente após a renderização.

## 6. Testes e resultados reais

| Comando/verificação | Resultado final da revisão |
|---|---|
| `node --test tests/storage.test.mjs` | 8 testes aprovados, 0 falhas |
| `node tests/mobile.test.mjs` com `CONDO_CAPTURAS` apontando para `docs/capturas-mobile-revisao` | 936 verificações aprovadas, 0 falhas, 25 rotas × 5 larguras, 29 capturas |
| `node tests/web.test.mjs` | 327 verificações aprovadas, 0 falhas, 42 combinações de estado e resolução |
| `node --check mobile/js/ocorrencias.js` | Sem erro de sintaxe |
| `node --check mobile/js/reservas.js` | Sem erro de sintaxe |
| `node --check tests/mobile.test.mjs` | Sem erro de sintaxe |
| Comparação SHA-256 dos 35 arquivos em `web/` e `shared/` | 0 alterações |
| Comparação das 13 imagens avulsas com o ZIP | 0 diferenças |

O teste Mobile cobre sessão, rotas/links, recursos HTTP, fonte, campos nomeados, filtros, busca, formulário obrigatório, Escape e retorno de foco, texto semelhante a HTML exibido com segurança, calendário completo, seleção de faixa, confirmação em página, cancelamento em página e identificação de prévias. A nova asserção confirma a seleção alternativa de domingo, 22/11/2026, das 18h às 21h.

O snapshot de todas as chaves do LocalStorage permanece idêntico antes e depois dos fluxos demonstrativos. Uma alteração externa preparada exclusivamente pelo teste confirma que o Mobile consulta o estado compartilhado de ENC-024. O navegador usa perfil temporário isolado.

As suítes foram executadas separadamente para evitar disputa de foco. Foi necessário executar o navegador com acesso HTTP local autorizado, pois o sandbox inicial bloqueava a conexão CDP com `EACCES`. O conector Figma continuou recusando a consulta pelo limite Starter; as referências locais completas resolveram a validação de conteúdo.

Não foram testados dispositivos físicos, Safari/iOS ou leitor de tela. A verificação de semântica e teclado não representa certificação WCAG. Esses são limites de cobertura, não funcionalidades faltantes da Etapa 3.

## 7. Fidelidade visual e dados

As seis imagens adicionais determinaram os cabeçalhos, divisórias, campos, painéis de retirada, timeline com pontos/conectores e páginas de confirmação/cancelamento. A timeline apresenta os horários da referência: abertura às 11h05, análise às 11h20 e andamento às 11h40, em 14/11. A prévia Entregue apresenta 14/11 · 12h10, conforme a imagem.

Esses horários não foram gravados como histórico operacional: os estados alternativos são identificados como demonstração. O registro real continua sendo consultado pelos serviços existentes. Confirmação e cancelamento não gravam reservas nem liberam horários na base real.

As diferenças de dados previamente documentadas foram mantidas por exigência de integridade: ENC-019 e Bruno Almeida não existem no modelo; SOL-013 e a reserva cancelada da churrasqueira pertencem a outros moradores. Esses registros não foram inventados nem atribuídos a Marina. Conversas, comunicados e quantidades das listas seguem a base compartilhada. O histórico Cancelada mostra RES-021 como prévia, sem acrescentar a reserva de outro usuário.

A interface usa Inter, tokens, cores, hierarquia, cards e navegação das referências. Ícones SVG locais, seletores nativos, notas demonstrativas e alturas afetadas pelo conteúdo real podem diferir dos ativos do Figma. Não se declara fidelidade pixel a pixel. As notas de demonstração são intencionais para não apresentar operações simuladas como persistentes.

## 8. Integridade Web

Os 35 arquivos de `web/` e `shared/` mantêm os hashes da base. A regressão Web passou nas 327 verificações disponíveis e o armazenamento nos oito testes existentes. Nenhum arquivo específico Web ou serviço compartilhado foi alterado. As prévias Mobile preservaram o LocalStorage nos cenários testados.

## 9. Pendências e limites de escopo

**Não restam referências ausentes nem estados Mobile solicitados sem implementação.** As 19 capturas estão arquivadas e mapeadas. As diferenças de conteúdo são decisões de preservação da base já exigidas no pedido, e estão explicitadas no mapa.

Continuam fora desta etapa: envio persistente de mensagens, cadastro/atualização de solicitações, gravação/cancelamento real de reservas, conflitos completos, retirada operacional, autenticação real, upload, leitura persistente de notificações, push e backend. São entregas da Etapa 4 e não foram antecipadas.

## 10. Situação final

**CONCLUÍDA**: todas as 19 referências têm representação navegável, os seis estados adicionais foram conferidos e corrigidos, os testes finais passaram e Web/dados compartilhados foram preservados. A classificação se limita ao escopo demonstrativo da Etapa 3 e aos ambientes efetivamente testados.

## Correções após revisão · 18/11/2026

Foram corrigidos dois defeitos reproduzidos na revisão:

- A confirmação de uma nova seleção de espaço/data/faixa não consulta nem reutiliza RES-021. A prévia não recebe identificador persistido e informa que não foi adicionada a Minhas reservas. A URL de referência `estado=confirmada&id=RES-021` continua consultando o registro existente para representar a captura aprovada. Seleções incompletas ou inválidas exibem erro, sem recorrer a um registro diferente.
- O local nos detalhes de solicitação usa `item.local`, inclusive nos estados demonstrativos de status. Alterações na base compartilhada aparecem de forma consistente na listagem e nos detalhes.

Verificação: 957 asserções aprovadas na suíte Mobile, sem falhas, incluindo os casos com e sem RES-021, vínculo original com Salão de festas, ausência de persistência da prévia, seleção inválida e local alterado para Área comum · jardim. Os oito testes de armazenamento passaram. Os 35 arquivos de `web/` e `shared/` mantiveram seus hashes. A suíte Web não precisou ser repetida nesta correção, pois seus arquivos e dependências compartilhadas permaneceram intactos; o resultado de 327 verificações acima pertence à revisão anterior.

As capturas de `capturas-mobile-revisao/` foram atualizadas para refletir os textos da prévia e o local compartilhado. O projeto permanece no escopo demonstrativo da Etapa 3, sem operações persistentes da Etapa 4.
