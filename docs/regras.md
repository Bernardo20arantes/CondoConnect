# Regras da demonstração — Etapa 5

Regras da Etapa 4 preservadas e revalidadas. O CondoConnect Mobile é um site otimizado para celulares, não um aplicativo nativo. A URL determina a interface; ambas podem ser abertas no computador. Publicação estática planejada no mesmo domínio Netlify, sem sincronização entre dispositivos.

## Sessão e perfis

SessionStorage guarda somente usuarioId e perfil na chave condoconnect.sessao.v1. O Mobile permite selecionar um dos cinco moradores fictícios; a Web seleciona o primeiro funcionário do perfil. A unidade é obtida do cadastro. Login e logout afetam a aba atual.

Abas novas independentes podem ter usuários diferentes. Duplicar uma aba ou abri-la com referência à aba original pode copiar inicialmente sua sessão; refaça o login na cópia. Todas devem usar o mesmo protocolo, host, porta e perfil de navegador. Não há sincronização entre dispositivos físicos ou perfis separados.

As verificações de perfil e propriedade estão nos serviços e nas telas. Moradores consultam suas encomendas, solicitações e notificações; somente participantes acessam conversas. A Administração não possui telas de conversas privadas. A disponibilidade de espaços expõe somente ID, espaço, intervalo e status de reservas de terceiros, sem identificar seu proprietário.

Essas regras são demonstrativas: código, dados e armazenamento podem ser alterados no navegador. O sistema não oferece autenticação nem segurança para uso real.

## Persistência e migração

LocalStorage mantém a chave legada condoconnect.demo.v1. Novas bases usam envelope com versao: 2. Bases e operações da versão 1 são lidas com complementos determinísticos, sem substituir silenciosamente a base nem os IDs existentes. Novas alterações usam o mesmo histórico condoconnect.demo.v1.operacao.UUID.

A migração acrescenta metadados de encomendas, campos de triagem e histórico, leitura de mensagens, público de comunicados e a coleção notificacoes. Registros antigos de solicitações recebem data fictícia padrão documentada em dados-demo.md; não se inventa histórico de atendimentos antigos. Comunicados oficiais legados destinam-se a moradores e operacionais à Portaria; a restrição por torre é preservada para moradores.

A leitura valida estrutura, IDs, relacionamentos, estados, datas e sobreposição de reservas confirmadas. Base ausente é inicializada. Base inválida é preservada, com dados iniciais exibidos apenas em memória e gravações bloqueadas até restauração explícita. Falhas de leitura/gravação são informadas, sem apresentar sucesso de uma operação não persistida.

Cada operação lê o estado recente, valida domínio e escreve as diferenças por ID em uma única entrada do histórico. Notificações e registro de negócio fazem parte da mesma operação, evitando gravações parciais no fluxo normal. salvarDados recebe o mesmo objeto devolvido por carregarDados, confere a origem e rejeita versões incompatíveis do mesmo registro ou operações anteriores a uma restauração.

Edições simultâneas ainda não observadas convergem por ordenação determinística das operações. Se uma operação violar os registros anteriores ou a integridade resultante, ela é descartada inteira e informada em conflitos. Inclusive reservas simultâneas sobrepostas e conversas individuais duplicadas são revalidadas na reprodução. Um retorno true significa que a operação foi gravada; sua aceitação pode mudar após observar uma operação concorrente.

**LocalStorage não oferece transações entre abas.** Não há garantia absoluta de confirmação de operações simultâneas. Essa garantia exigiria armazenamento transacional. O histórico cresce e pode atingir a quota do navegador; não foi adicionada compactação complexa. Imagens são limitadas para reduzir esse risco.

## Atualização de interfaces

observarDados notifica a aba que gravou e observa o evento storage nas demais abas. As páginas renderizam novamente os registros/indicadores, mantendo filtros. Formulários em edição mantêm os valores e avisam sobre mudanças externas; ao salvar, a validação consulta o estado atual. Conversas abertas marcam mensagens recebidas como lidas. Uma aba em segundo plano pode renderizar ao voltar a ficar visível, conforme o agendamento do navegador.

## Operações e estados

| Módulo | Regras |
|---|---|
| Encomendas | Somente Porteiro registra e confirma retirada. Destinatário precisa existir e pertencer à unidade selecionada. Estado inicial Aguardando retirada, depois Entregue; retirada repetida é rejeitada. Quem retirou deve ser um morador cadastrado da mesma unidade. Recebimento é preservado; retirada não pode antecedê-lo nem estar no futuro. |
| Solicitações | Somente Morador abre; somente Administração faz triagem. Fluxo sequencial Aberto → Em análise → Em andamento → Concluído, sem saltos ou retorno. É permitido registrar encaminhamento sem mudar a etapa ainda aberta. Cada alteração gera evento com data, autor e descrição. Concluídas são imutáveis. |
| Triagem | Responsabilidade A confirmar, Condomínio ou Morador. Atendimento por Equipe de manutenção do condomínio, Profissional externo ou Administração. Informações do atendimento obrigatórias para salvar; responsabilidade definida antes de Em andamento/Concluído. |
| Imagens | Opcionais, PNG/JPEG/WebP, até 100 KB por arquivo. Data URL é persistida junto à solicitação; SVG e formatos grandes são rejeitados. Não há upload nem antivírus. |
| Mensagens | Somente entre dois moradores distintos. Conversa existente é reutilizada. Texto de 1 a 2000 caracteres após trim; participantes e remetente derivam da sessão. Ordem cronológica e leitura por participante. Sem respostas automáticas. |
| Reservas | Data civil válida, início futuro e faixa permitida pelo espaço. Mesmo espaço: conflito quando início A < fim B e fim A > início B. Consecutivas são válidas. Canceladas não bloqueiam. Sem pagamentos. |
| Cancelamento | Proprietário ou Administração pode cancelar reserva confirmada futura; canceladas e reservas iniciadas não podem ser canceladas. Registro, data e autor do cancelamento permanecem no histórico. |
| Comunicados | Somente Administração publica. Título e mensagem obrigatórios; categorias oficial/operacional, públicos moradores/portaria/administracao/geral. Torre A/B ou todas mantém o filtro de unidades aprovado. Portaria consulta portaria/geral; Morador consulta moradores/geral e sua torre; Administração consulta todos. |
| Notificações | Destinatário individual, chave de evento para evitar duplicação, data, texto, leitura e destino local. Abrir marca como lida e navega. Eventos de negócio não são recriados ao recarregar. Sem push ou permissões do navegador. |

## Regras de horários

Salão e Churrasqueira: faixas 10–13, 14–17 e 18–21. Quadra: períodos consecutivos de uma hora entre 9 e 21. São regras demonstrativas, compartilhadas pelos serviços e calendários, sem cobrança. Não há intervalo obrigatório adicional entre reservas.

Dias de calendário são tratados como YYYY-MM-DD, convertidos com horário e deslocamento explícitos somente ao criar intervalos. Instantes novos usam ISO com Z ou -03:00 e são exibidos em pt-BR, America/Sao_Paulo. Não se interpreta um dia civil isolado como meia-noite UTC. O calendário começa na data atual e permite navegar pelos meses.

## Indicadores

- Portaria: total Aguardando retirada; recebimentos e retiradas cujo dia em America/Sao_Paulo coincide com hoje.
- Administração: solicitações cujo status é diferente de Concluído; reservas Confirmadas com início futuro; comunicados oficiais publicados nos últimos sete dias. A fila ordena solicitações ativas colocando Alta primeiro; próximas reservas são ordenadas pelo início.
- Morador: encomendas pendentes próprias, solicitações não concluídas próprias, reservas confirmadas futuras próprias, mensagens recebidas não lidas e notificações não lidas. Comunicados obedecem ao público.

## Restauração

Disponível no menu Web e Perfil Mobile, com diálogo e confirmação explícita de exclusão das alterações locais. restaurarDados registra novo marco; alterações anteriores deixam de ser aplicadas. As telas abertas recebem o evento. A base fictícia restaurada é determinística, inclusive notificações vazias; a restauração não cria duplicações.

Operações antigas permanecem fisicamente no histórico e ocupam quota, embora não integrem mais os dados atuais. Para recuperar uma base inválida após confirmação, a infraestrutura substitui a base e remove somente as operações do próprio CondoConnect. Não usa localStorage.clear e não afeta outros sites.
