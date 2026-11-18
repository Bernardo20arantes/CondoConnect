# Mapa das interfaces — referências históricas e estado atual

Estado vigente: Etapa 5. As tabelas abaixo preservam os mapeamentos das etapas anteriores; textos sobre prévias e ausência de persistência são históricos, salvo cadastro/edição de moradores e edição de espaços. Serviços integrados, permissões e dados atuais prevalecem sobre parâmetros visuais antigos. Encomenda pendente não recebe título de retirada confirmada por URL; reserva cancelada mostra cancelamento mesmo em URL antiga de confirmação. Veja [relatório final](etapa5-relatorio.md), [regras](regras.md) e [roteiro](roteiro-apresentacao.md). O Mobile é site para celular, sem aplicativo nativo.

## Interfaces Web · Etapa 2 (histórico)

A Etapa 2 usa as 18 capturas fornecidas na pasta de referências Web. A correspondência está implementada nas páginas abaixo. Os parâmetros de URL identificam estados visuais do mesmo registro.

| Referência | Perfil | Página implementada |
|---|---|---|
| Login Web | Ambos | `web/login.html` |
| Dashboard da portaria | Portaria | `web/portaria/dashboard.html` |
| Encomendas · Portaria | Portaria | `web/portaria/encomendas.html` |
| Registrar encomenda | Portaria | `web/portaria/encomendas.html?estado=registrar` |
| Encomenda registrada | Portaria | `web/portaria/encomendas.html?estado=registrada&id=ENC-024` |
| Confirmar retirada | Portaria | `web/portaria/encomendas.html?estado=confirmar&id=ENC-024` |
| Retirada confirmada | Portaria | `web/portaria/encomendas.html?estado=retirada&id=ENC-024` |
| Moradores e unidades · Portaria | Portaria | `web/portaria/moradores.html` |
| Avisos operacionais | Portaria | `web/portaria/comunicados.html` |
| Novo aviso operacional | Portaria | `web/portaria/comunicados.html?estado=novo` |
| Dashboard administrativo | Administração | `web/administracao/dashboard.html` |
| Moradores e unidades · Administração | Administração | `web/administracao/moradores.html` |
| Unidades · Administração | Administração | `web/administracao/moradores.html?aba=unidades` |
| Fila de solicitações | Administração | `web/administracao/solicitacoes.html` |
| Triagem de solicitação | Administração | `web/administracao/solicitacoes.html?estado=triagem&id=SOL-018` |
| Gestão de espaços e reservas | Administração | `web/administracao/reservas.html` |
| Comunicados oficiais | Administração | `web/administracao/comunicados.html` |
| Novo comunicado oficial | Administração | `web/administracao/comunicados.html?estado=novo` |

## Estrutura e estados

O cabeçalho de 72 px e o menu de 224 px são compartilhados por `layout.js`. As páginas mantêm os tokens oficiais, cards brancos, tabelas com divisórias, campos rotulados, ações azuis e estados textuais. A Portaria possui quatro seções e a Administração cinco.

- Encomendas exibem os dados compartilhados. Os estados registrada e retirada são prévias locais de ENC-024. O formulário de retirada permite selecionar o morador responsável e mostra seu nome na confirmação. Preencher e confirmar os formulários mantém a base compartilhada intacta.
- Solicitações apresentam a listagem e a triagem com responsabilidade, equipe e novo status. Salvar atualiza a prévia do card para Em andamento ou Concluído.
- Unidades mostram todos os moradores vinculados, inclusive Marina e Gabriel na A · 302.
- A agenda parte de 21/11/2026, permite selecionar data, espaço e status e consultar os detalhes. O calendário indica os dias com reservas confirmadas. As faixas demonstrativas são 10h–13h, 14h–17h e 18h–21h.
- Comunicados oficiais e operacionais possuem listagem, filtros, detalhes e formulário. Publicar abre uma prévia preenchida, sem persistência.
- A navegação de cada perfil é verificada com a sessão demonstrativa existente.

## Dados e diferenças em relação às capturas

Os indicadores usam a data de apresentação de 14/11/2026. Isso mantém os totais coerentes com os exemplos de novembro. São dois pacotes pendentes, dois recebimentos e uma retirada nessa data. A Administração mostra duas solicitações ativas, duas reservas confirmadas de 14 a 21/11 e dois comunicados oficiais recentes.

A base da Etapa 1 contém mais moradores, unidades e encomendas que algumas capturas. As tabelas mostram os registros reais da base demonstrativa e os contadores acompanham seus filtros. A Portaria possui um comunicado operacional na base inicial. Esses totais foram preservados.

Os campos de data e seleção usam controles nativos do navegador. Inter é servida localmente em web/assets/fonts/inter-variable.ttf, com a licença SIL OFL incluída no projeto. As fontes alternativas permanecem disponíveis em caso de falha de carregamento. Os ícones dos indicadores foram desenhados em SVG local seguindo a referência de traço azul, com diferenças possíveis em relação aos ativos originais do Figma. Os componentes de busca usam campos de busca nativos. Ações de demonstração incluem instruções discretas para explicar o comportamento.

## Referências ausentes

As 18 capturas não incluem formulários de cadastro/edição de moradores nem edição individual de espaços. Esses controles agora abrem formulários visuais com Nome, E-mail e Unidade para moradores e Nome para espaços, usando somente campos do modelo existente. Os layouts foram derivados dos componentes aprovados, sem confirmação por um frame específico. Consulta de unidade e detalhes de comunicado/reserva usam janelas construídas com os componentes existentes. Esses detalhes complementares não possuem um frame específico para comparação.

O conteúdo de categoria das solicitações não tem campo próprio no modelo da Etapa 1. A triagem apresenta o tipo indicado pelo título da ocorrência. A definição de categorias estruturadas pertence à integração funcional.

## Mobile e continuidade

A versão Mobile da Etapa 3 está descrita no inventário ao final deste documento. Consulte `validacao-web.md` para as verificações da Etapa 2 e `validacao-mobile.md` para a nova entrega.

## Complementos da revisão de pendências

| Estado complementar | Página |
|---|---|
| Cadastro visual de morador | `web/administracao/moradores.html?estado=novo` |
| Edição visual de morador | `web/administracao/moradores.html?estado=editar&id=MOR-302-01` |
| Lista de espaços | `web/administracao/reservas.html?estado=gerenciar` |
| Edição visual de espaço | `web/administracao/reservas.html?estado=editar&id=ESP-001` |

Os formulários exibem prévias sem persistência de negócio. Erros são associados aos campos e o primeiro campo inválido recebe foco. O atalho de conteúdo e o retorno de foco dos diálogos foram conferidos.

O guia original do Design System foi consultado no Figma, frame 14:215, confirmando Inter e as cores de erro #991B1B e #FEE2E2. A consulta de outros frames foi impedida pelo limite do plano Starter do conector. O pacote Web local contém as mesmas 18 capturas e não inclui fontes nem SVGs originais.


# Interfaces Mobile · Etapa 3

As **19 referências foram localizadas** no arquivo `CondoConnect IMG/CondoConnect — Protótipo Mobile.zip`. O pacote contém as 13 imagens avulsas (comparadas por SHA-256, sem diferenças) e seis telas adicionais em subpastas. A ausência inicialmente registrada foi resolvida pela inspeção do ZIP. As imagens originais foram preservadas em `docs/referencias-mobile/`.

O conector Figma continua limitado pelo plano Starter, mas isso não impede a conferência das capturas aprovadas locais. A implementação foi comparada às 19 imagens; não se declara acesso aos SVGs originais nem fidelidade pixel a pixel.

## Inventário das 19 referências

Os caminhos abaixo são relativos a `mobile/`.

| Nº | Referência do pacote | Implementação |
|---|---|---|
| 1 | Login Mobile | `login.html` |
| 2 | Início do morador | `inicio.html` |
| 3 | Lista de conversas | `mensagens.html` |
| 4 | Conversa individual | `mensagens.html?id=CNV-001` |
| 5 | Lista de encomendas | `encomendas.html` |
| 6 | Serviços | `servicos.html` |
| 7 | Minhas solicitações | `solicitacoes.html` |
| 8 | Nova solicitação | `solicitacoes.html?estado=nova` |
| 9 | Espaços de lazer | `reservas.html` |
| 10 | Disponibilidade do espaço | `reservas.html?espaco=ESP-001` |
| 11 | Minhas reservas | `reservas.html?estado=minhas` |
| 12 | Notificações | `notificacoes.html` |
| 13 | Perfil | `perfil.html` |
| 14 | Mobile/Encomenda/Aguardando retirada | `encomendas.html?id=ENC-024` |
| 15 | Mobile/Encomenda/Entregue | `encomendas.html?id=ENC-024&estado=entregue` |
| 16 | Mobile/Solicitação/Em análise | `solicitacoes.html?id=SOL-018` |
| 17 | Mobile/Solicitação/Em andamento | `solicitacoes.html?id=SOL-018&visual=Em%20andamento` |
| 18 | Mobile/Reserva/Confirmada | `reservas.html?estado=confirmada&id=RES-021` |
| 19 | Mobile/Reserva/Cancelada | `reservas.html?estado=cancelada&id=RES-021` |

## Correções a partir das seis referências recuperadas

- Encomenda: cabeçalho Encomenda, identificação ENC-024, status, divisórias, destinatária, unidade, transportadora, recebimento e bloco Retirada na portaria. O estado Entregue contém data de retirada e confirmação verde. A data 14/11 · 12h10 vem da captura e aparece apenas na prévia quando não existe retirada real.
- Solicitação: cabeçalho Acompanhar solicitação, identificação, título, status, local específico, responsabilidade, descrição e timeline em ordem decrescente. As referências fornecem 14/11 · 11h05 para abertura, 11h20 para análise e 11h40 para andamento. Como o modelo não armazena esses eventos, a interface identifica o histórico como demonstrativo da referência.
- Reserva confirmada: página completa com retorno, aviso verde, card Confirmada, espaço, data/horário, RES-021 e acesso a Minhas reservas. Selecionar outra data/faixa mantém a seleção na prévia, sem criar um registro.
- Reserva cancelada: estado da própria página Minhas reservas, com aviso verde, lista futura vazia e RES-021 projetada no histórico como Cancelada. O retorno aos registros atuais revela o estado persistido inalterado.

## Componentes, navegação e estados adicionais

Dez HTML por módulo. `layout.js` fornece DOM seguro, ícones, campos, filtros, cabeçalhos, cards, etiquetas, navegação e diálogos. `mobile.js` controla sessão e páginas gerais; `mensagens.js`, `ocorrencias.js` e `reservas.js` separam os módulos. Tokens, base CSS, fonte Inter, sessão, armazenamento e serviços compartilhados são reutilizados sem alteração.

Barra inferior: Início, Mensagens, Encomendas e Serviços. Reservas e Solicitações são acessíveis pelos atalhos e por Serviços. Conversas, Perfil e Login omitem a barra conforme suas capturas. Os demais detalhes mantêm o módulo selecionado. O contêiner fluido até 480 px, os campos e as barras fixas consideram a largura disponível e as áreas seguras.

Estados complementares: conversa com Lívia (`CNV-002`), prévia de mensagem, explicação de Nova conversa, formulário e prévia de solicitação, estados Aberto e Concluído, outros espaços, busca/filtros vazios e identificadores inválidos. Confirmação e cancelamento agora seguem as páginas aprovadas, substituindo os diálogos usados na primeira entrega. O calendário apresenta novembro de 2026 completo, dia 21 selecionado inicialmente e horários consultados das reservas existentes.

## Coerência de dados e diferenças intencionais

Marina Lopes, Torre A · 302, ENC-024, SOL-018 e RES-021 usam os registros compartilhados. Não existe base Mobile independente e nenhuma operação visual grava dados de negócio.

ENC-019 e Bruno Almeida não existem no modelo. SOL-013 pertence a Lívia; a reserva cancelada da churrasqueira pertence a outro morador. Não foram criados registros fictícios adicionais nem mostrados registros de terceiros como pertencentes a Marina. Por isso, as quantidades das listas e o histórico podem diferir das imagens. As conversas e os comunicados mantêm os textos/horários da base. Não foram inventados contadores de mensagens não lidas.

As notificações são projeções das encomendas pendentes e exibem a data real do registro, em vez de fixar Hoje. Não há marcação persistente de leitura. Os metadados visuais das referências (capacidade/regras dos espaços, condomínio e timeline) não alteram o modelo compartilhado. O texto de responsabilidade é ilustrativo da referência.

Prévia de entrega, histórico ilustrativo, confirmação, cancelamento e envio são identificados como demonstrativos. O anexo fica apenas no navegador, sem upload. Os ícones SVG de traço são locais e os seletores usam controles nativos, com diferenças possíveis em relação aos ativos e controles do Figma.

## Verificação e continuidade

A revisão final cobre 25 rotas autenticadas em cinco larguras, login e interações adicionais. As capturas atualizadas ficam em `docs/capturas-mobile-revisao/`; as capturas anteriores em `docs/capturas-mobile/` são históricas e não representam os seis estados finais.

Consulte [validacao-mobile.md](validacao-mobile.md) para comandos, resultados e limites. A Etapa 4 permanece responsável pelas operações persistentes e integrações; sua ausência não é pendência da Etapa 3.

### Correção de consistência · 18/11/2026

A nova seleção do calendário abre uma prévia independente, sem reutilizar o ID de uma reserva existente. Ela informa que não foi adicionada a Minhas reservas; o acesso direto `reservas.html?estado=confirmada&id=RES-021` preserva a representação do registro de referência. A prévia funciona mesmo se RES-021 não existir. Os detalhes da solicitação exibem o local compartilhado, sem substituí-lo pelo texto fixo da cozinha.

## Atualização funcional — Etapa 4

Os mapeamentos e capturas das Etapas 2 e 3 são históricos e foram preservados. Formulários de mensagens, encomendas, solicitações, triagem, reservas e comunicados administrativos agora persistem operações. Os parâmetros antigos de prévia não podem forçar status falsos; detalhes mostram os registros atuais. Cancelamento de reserva exige ação e confirmação, sem gravar apenas por abrir uma URL. Portaria não publica comunicados. Foram acrescentados apenas seletores, informações de atendimento, navegação mensal e confirmação de restauração necessários à integração. Veja [relatório atual](etapa4-relatorio.md) e capturas-etapa4/.
