# CondoConnect — Relatório consolidado da Etapa 4

Data: 18/11/2026. Escopo: integração funcional demonstrativa local. Etapa 5 não iniciada.

## 1. Resumo geral

As interfaces Web da Portaria/Administração e Mobile do Morador passaram a executar operações persistentes pelos serviços compartilhados. Foram integrados mensagens, encomendas, solicitações, reservas, comunicados, notificações, dashboards e restauração. A estrutura de diretórios, páginas HTML, paleta, tipografia, componentes e dados fictícios originais foram preservados. Não foram adicionados frameworks, backend, banco externo ou dependências de execução.

Fluxo: evento do formulário → serviço com sessão, permissões e validações → alteração de registros e notificações → operação no LocalStorage → aviso local/evento storage → renderização dos dados atualizados. O SessionStorage mantém o usuário de cada aba.

## 2. Módulos

| Módulo | Operações implementadas | Limites/regras relevantes |
|---|---|---|
| Mensagens | Seleção de outro morador, criação/reuso de conversa, envio, recebimento, ordenação, histórico cronológico e leitura | Dois participantes; texto 1–2000 caracteres; somente participantes; sem resposta automática ou comunicação externa |
| Encomendas | Registro pela Portaria, destinatário/unidade, identificação do funcionário, consulta própria no Mobile, confirmação de retirada e notificações | Retirada única; pessoa cadastrada na mesma unidade; horários coerentes; descrição/transportadora seguem os campos existentes |
| Solicitações | Abertura pelo Morador, prioridade/categoria/local, imagem opcional, listagem administrativa, triagem, encaminhamento e histórico no Mobile | Estados sequenciais; responsabilidade definida para iniciar atendimento; responsável e descrição obrigatórios na triagem; concluídas imutáveis |
| Reservas | Espaços compartilhados, calendário dinâmico com meses, horários por espaço, criação, conflito, consulta, cancelamento e agenda administrativa | Somente períodos futuros permitidos; intervalos consecutivos válidos; canceladas preservadas e liberam horário; nenhuma cobrança |
| Comunicados | Publicação administrativa com título, mensagem, categoria, público e torre; consulta autorizada no Mobile/Portaria; autoria/data preservadas | Só Administração publica; Portaria consulta portaria/geral; moradores consultam moradores/geral e sua torre |
| Notificações | Eventos de encomendas, solicitações, reservas, comunicados e mensagens; destinatário, leitura, indicador e navegação | Persistidas com a operação de negócio; chave de evento evita duplicação; sem push, permissões ou envio externo |
| Dashboards | Contagens e listas derivadas dos registros e atualizadas entre abas | Hoje em America/Sao_Paulo; ativas excluem Concluído; futuras excluem canceladas/iniciadas; recentes usam janela de sete dias |

O início Mobile mostra pendências próprias, solicitações ativas, reservas futuras, comunicados visíveis, mensagens e notificações não lidas. Os indicadores e as respectivas listagens usam o mesmo conjunto de dados.

Imagens PNG/JPEG/WebP de até 100 KB são persistidas como Data URL; não há upload. A quota continua sendo um limite do navegador. Os dados legados não ganharam históricos operacionais inventados; a ausência de histórico anterior é identificada na interface e os novos eventos são registrados normalmente.

## 3. Arquivos

### Criados

- shared/js/migracao.js: complementos compatíveis dos registros legados.
- shared/js/restauracao.js: botão reutilizável e confirmação visual da restauração.
- shared/js/services/base.js: sessão exigida, validações comuns, IDs, alteração persistente, datas civis e criação de notificações.
- shared/js/services/notificacoes.js: consultas e marcação de leitura do destinatário.
- tests/services.test.mjs: testes de domínio, permissões, integridade, migração, falhas e concorrência.
- tests/integracao.test.mjs: cinco fluxos entre quatro abas com verificações das interfaces.
- docs/etapa4-relatorio.md e 53 PNGs em docs/capturas-etapa4/.

### Modificados

| Arquivos | Alterações |
|---|---|
| shared/js/data/demo-data.js | Acrescenta complementos de esquema sem mudar registros originais |
| shared/js/storage.js | Esquema 2 compatível com 1, validação ampliada, preservação de base inválida, eventos e restauração |
| shared/js/session.js | Seleção explícita de usuário fictício dentro do perfil |
| shared/js/utils.js | Feedback para armazenamento indisponível/base inválida |
| shared/js/services/encomendas.js | Consulta autorizada, registro e retirada |
| shared/js/services/mensagens.js | Conversa, envio, leitura e acesso por participante |
| shared/js/services/solicitacoes.js | Abertura, imagem, triagem, estados e eventos |
| shared/js/services/reservas.js | Regras de espaços, disponibilidade, criação e cancelamento |
| shared/js/services/comunicados.js | Público, publicação, consulta e notificações |
| web/js/ui.js e layout.js | Formulários funcionais com erros/duplo envio, atualização mantendo filtros e acesso à restauração |
| web/js/portaria.js | Encomendas persistentes e indicadores da data atual |
| web/js/administracao.js | Triagem, histórico, informações do atendimento e dashboard |
| web/js/reservas.js | Agenda com data atual/regras compartilhadas e cancelamento administrativo |
| web/js/comunicados.js | Publicação exclusiva da Administração, públicos e origem conforme autor |
| mobile/js/mobile.js | Login de moradores, início, notificações, atualização entre abas e restauração no Perfil |
| mobile/js/mensagens.js | Conversas reais, envio, recebimento e indicadores de leitura |
| mobile/js/ocorrencias.js | Consulta própria, criação de solicitações, imagem e histórico real |
| mobile/js/reservas.js | Calendário mensal, criação, detalhes e cancelamento persistentes |
| mobile/css/components.css | Separação visual entre horário e contador de mensagens, reutilizando os estilos existentes |
| tests/storage.test.mjs | Preservação de dados inválidos até restauração explícita |
| tests/web.test.mjs e mobile.test.mjs | Regressões adaptadas às operações persistentes, aguardando documento novo nas navegações |
| README.md, docs/regras.md, dados-demo.md, escopo.md e mapa-telas.md | Execução, arquitetura, regras, esquema, limitações e situação atual |

Foram reutilizados todos os cinco serviços de domínio originais, storage.js, session.js, utilitários DOM e estilos existentes. Nenhum HTML foi recriado. Testes e relatórios válidos das etapas anteriores foram preservados; expectativas de prévia sem gravação foram substituídas por verificações de persistência nos módulos integrados.

## 4. Persistência

A chave condoconnect.demo.v1 foi mantida para preservar a base existente. Novas bases usam versao 2; bases e operações de versao 1 são normalizadas na leitura, com complementos determinísticos. A base antiga válida não é regravada silenciosamente. O histórico de operações mantém o prefixo original.

A validação confere IDs únicos, vínculos, perfis, estados, datas, participantes, notificações e sobreposição de reservas. Base inválida permanece intocada, com fallback somente para consulta e bloqueio de gravação. Restauração explícita recupera a base. Falhas de quota não geram sucesso nem notificações parciais nos fluxos testados.

A leitura recente precede cada alteração. Operações incompatíveis já visíveis são rejeitadas; concorrência ainda não observada converge por ordenação determinística e descarte integral da operação conflitante, informada pela interface. LocalStorage não oferece garantia transacional de confirmação simultânea. O histórico cresce, inclusive após restaurações, e pode atingir a quota.

SessionStorage guarda usuário/perfil por aba. O evento storage atualiza as demais abas e uma assinatura local atualiza a aba que gravou. Formulários em edição preservam valores e avisam sobre mudanças; filtros são mantidos. Datas civis não são interpretadas como meia-noite UTC; a apresentação usa pt-BR e America/Sao_Paulo.

A restauração é acessível no menu Web e Perfil Mobile, exige confirmação e repõe deterministicamente os registros e notificações iniciais em todas as abas da origem, sem duplicações.

## 5. Testes executados

Ambiente: Node.js 24.21.0 e Microsoft Edge instalado no Windows. Perfis temporários isolados e servidores HTTP locais próprios. Playwright e @playwright/test não estavam disponíveis no projeto, conforme require.resolve; foi mantida a infraestrutura de navegador existente via protocolo de depuração do Edge, sem instalar dependências.

| Comando | Resultado final |
|---|---|
| node --test tests/storage.test.mjs tests/services.test.mjs | 20 testes aprovados, zero falhas |
| node tests/web.test.mjs | 323 verificações aprovadas; 21 rotas/estados em 1280 e 1440 px; 22 capturas |
| node tests/mobile.test.mjs | 924 verificações aprovadas; 25 rotas/estados em 320, 360, 375, 390 e 430 px; 29 capturas |
| node tests/integracao.test.mjs | 62 verificações aprovadas; quatro abas independentes; cinco fluxos; duas capturas |
| node --check nos arquivos JS/MJS de shared/js, web/js, mobile/js e tests | Sintaxe válida |
| Busca rg por innerHTML em shared/js, web/js e mobile/js | Nenhuma ocorrência |

As capturas foram geradas definindo CONDO_CAPTURAS nas pastas mobile, web e integracao de docs/capturas-etapa4. A soma é de 53 capturas. A soma das verificações de navegador é 1309, separada dos 20 casos de teste de persistência/domínio.

### Cenários e evidências

- Mensagens: criação/reuso, envio, resposta entre moradores, persistência, ordenação, não lidas/leitura, restrição de terceiros/Administração e texto HTML exibido literalmente.
- Encomendas: destinatário/unidade, Portaria → Mobile sem recarregar, retirada → Mobile, recebimento preservado, retirada duplicada rejeitada, notificações e indicadores. Duplo envio do formulário não duplica o registro.
- Solicitações: campos inválidos, imagem permitida/formato/tamanho, abertura → Administração, triagem sequencial, Mobile atualizado sem recarregar, quatro eventos no histórico e exclusão de concluídas do indicador.
- Reservas: calendário com navegação mensal, data/horário válidos, ocupação na outra aba, conflito rejeitado pelo serviço, intervalos consecutivos, cancelamento e liberação, agenda administrativa e anonimização de terceiros.
- Comunicados: publicação, persistência, geral visível aos dois públicos, Portaria exclusiva, Moradores exclusivos, torre e restrição do publicador. Origem dos comunicados legados preservada conforme autor.
- Notificações: destinatário, eventos dos módulos, leitura, indicador, ausência de duplicação após reabertura e destino relacionado.
- Persistência: migração com operação antiga, base inválida preservada, JSON/esquema desconhecidos, quota/falha de gravação, reservas concorrentes, conflitos por registro e restauração determinística entre abas.
- Regressão: login/logout, perfil, menus, filtros, links Mobile, formulários, erros junto aos campos Web, árvore de acessibilidade, diálogos por teclado, retorno de foco, fonte local e ausência de rolagem horizontal nas resoluções testadas. Desktop também verifica reflow de formulários em 640 px.

### Falhas intermediárias e correções

A primeira tentativa de navegador não iniciou a depuração no ambiente restrito; a execução autorizada fora do sandbox permitiu os testes locais. Não houve rejeição de aprovação automática.

Foram corrigidos: valor do seletor de morador após trocar o texto da opção; filtros da agenda perdidos ao atualizar entre abas; possível duplo envio antes da navegação; separação visual do contador de mensagens; origem de comunicado legado identificada pelo autor.

As suítes antigas ainda esperavam prévias sem gravação e datas fixas; foram adaptadas aos requisitos atuais. A espera de navegação foi corrigida para verificar um documento novo, evitando avaliar a página anterior quando apenas a query mudava. Testes de cancelamento passaram a selecionar a reserva pelo ID, evitando cancelar outra reserva futura existente.

Na execução final, nenhum teste permaneceu reprovado. Não foi executado Playwright porque não estava instalado. Não foram feitos testes em dispositivos físicos, outros navegadores ou comparação automática pixel a pixel; a revisão visual usou capturas locais e referências aprovadas. Isso limita a evidência à implementação demonstrativa e ao ambiente testado, sem prometer compatibilidade universal.

## 6. Integração

| Fluxo | Verificação |
|---|---|
| Portaria → Morador | Registro e retirada refletidos em aba Mobile aberta, com isolamento inclusive entre moradores da mesma unidade |
| Morador → Administração | Solicitação aparece na fila e reserva aparece na agenda compartilhada |
| Administração → Morador | Triagem/status/histórico e comunicados refletem no Mobile sem recarregamento manual |
| Morador → Morador | Nova conversa, envio, indicador de não lidas, abertura e resposta recebida na conversa aberta |
| Dashboards | Retirada atualiza pendências, solicitação concluída sai das ativas e restauração recupera indicadores |

## 7. Qualidade visual

Layouts, HTMLs, tokens, cores, tipografia Inter, componentes e menus existentes foram mantidos. Foram adicionados somente controles necessários: seletor de morador, informações do atendimento, destinatários/categoria, navegação mensal e confirmação da restauração. O botão de restauração fica no menu/Perfil, sem reorganizar dashboards.

Capturas inspecionadas incluem formulário de encomenda, triagem, calendário Mobile, conversas, reservas com registro novo/cancelado e comunicados administrativos. A lista de conversas também foi confrontada com a referência local aprovada: diferenças de conteúdo e ordenação correspondem à base e à atividade reais. O horário e o contador foram separados para evitar textos unidos. Nas verificações de dimensões e capturas inspecionadas não ficaram problemas visuais bloqueantes conhecidos.

A presença de datas de novembro de 2026 em capturas desta execução é consequência da data atual (18/11/2026) e da base original. O calendário calcula mês/ano e aceita navegação; não é uma constante do sistema.

## 8. Pendências e limitações

Nenhuma funcionalidade essencial da Etapa 4 ficou pendente nos cenários testados. Não há erro crítico conhecido nos fluxos principais após as correções.

Limites previstos: ausência de backend/autenticação real, dados acessíveis no navegador, dependência da origem/perfil e da quota, impossibilidade de garantia transacional entre abas, ausência de sincronização física entre aparelhos e ausência de push. Imagens precisam ser pequenas. Uma confirmação local pode ser invalidada por conflito simultâneo posteriormente observado; a interface informa conflitos.

Cadastro/edição de moradores e edição de espaços continuam prévias demonstrativas herdadas, fora das operações exigidas nesta Etapa 4. Registros históricos mantêm as datas originais e podem ficar no passado; selecione datas futuras para novas reservas. Antes da apresentação, restaure a base e teste o navegador/origem escolhidos. Não use dados de pessoas reais.

## 9. Como executar e repetir

~~~powershell
node servir.mjs
~~~

- Entrada: http://127.0.0.1:8000/.
- Portaria/Administração: http://127.0.0.1:8000/web/login.html.
- Moradores: http://127.0.0.1:8000/mobile/login.html.
- Perfis Web: André Rocha e Renata Duarte. Mobile: Marina, Gabriel, Lívia, Rafael e Beatriz.

Abra quatro abas novas independentes, uma por sessão. Caso duplique abas, selecione novamente o usuário no login. Mantenha o mesmo host/porta; localhost e 127.0.0.1 são origens distintas. Use emulação Mobile para visualizar as larguras de smartphone.

Siga o roteiro dos cinco módulos no README: registrar/retirar encomenda; abrir/triagem/concluir solicitação; reservar/conflitar/cancelar; publicar por público; trocar mensagens. Abra o sino para conferir eventos e leitura. Atualize/reabra páginas para verificar persistência.

Para restaurar: menu Web ou Perfil Mobile → Restaurar dados da demonstração → Apagar alterações e restaurar. Cancelar no diálogo mantém os dados atuais. Repita os testes automatizados com os comandos da seção 5, executando as suítes de navegador separadamente.

## 10. Situação final

**CONCLUÍDA**, no escopo demonstrativo local e nos cenários executados: módulos integrados, persistência/migração/isolamento, comunicação entre abas, regras de integridade, restauração e dashboards verificados. As evidências são 20 testes de persistência/domínio e 1309 verificações de navegador aprovados, com 53 capturas geradas e revisão visual por amostragem.

As limitações de LocalStorage e a ausência de infraestrutura real são restrições explícitas do escopo. Não foi iniciada a Etapa 5 e não se declara o sistema adequado para operação real em condomínios.
