# Validação da Etapa 2

Registro histórico. A validação vigente é a [Etapa 5](etapa5-relatorio.md): operações integradas e 21 estados Web em 1280, 1440 e 1920 px. Os resultados e descrições abaixo permanecem como evidência da Etapa 2.

## Resultado

CONCLUÍDA COM PENDÊNCIAS visuais não bloqueantes. As 18 referências possuem página ou estado equivalente, os fluxos Web estão acessíveis e as prévias não gravam alterações de negócio. As limitações visuais e os detalhes sem frame específico estão registrados em `mapa-telas.md`.

## Execução reproduzível

```powershell
node --test tests/storage.test.mjs
node tests/web.test.mjs
```

A verificação Web utiliza Node.js, o Microsoft Edge instalado no Windows e o protocolo de depuração do navegador, sem instalar dependências. Ela inicia um servidor na porta 8230 e um navegador temporário na porta 9360. Essas portas devem estar livres. Para outro local do executável, defina `CONDO_EDGE`. O navegador e o servidor temporários são encerrados ao terminar.

Para salvar capturas, defina `CONDO_CAPTURAS` para uma pasta de saída antes de executar o teste Web.

## Verificações realizadas

- Oito testes do armazenamento passaram, com zero falhas.
- O teste Web ampliado concluiu 327 verificações no Edge e 327 no Chrome, com zero falhas. A revisão gerou 22 capturas, cobrindo as 18 referências e os quatro estados complementares.
- Foram percorridos 21 estados de área em 1440 × 900 e 1280 × 900, além do Login Web. Três formulários também foram conferidos no reflow equivalente a 200% a partir de 1280 px.
- Títulos, ausência de rolagem horizontal global, seção ativa, campos rotulados e destinos locais foram conferidos em cada estado.
- Login e sessão dos dois perfis foram exercitados. Os links dos menus mantiveram o perfil e a restrição de perfil redirecionou o acesso indevido.
- Indicadores da Portaria foram 2, 2 e 1. Indicadores da Administração foram 2, 2 e 2.
- Busca por Marina encontrou ENC-024. Uma busca sem correspondência exibiu o estado vazio.
- Registro visual, seleção de Gabriel na retirada, confirmação de entrega, triagem em andamento/concluída e prévia de comunicado foram exercitados.
- Texto com marcação HTML foi exibido como texto, sem criar elemento de imagem.
- A agenda exibiu reservas confirmadas e canceladas, selecionou outro dia e abriu os detalhes.
- Enter abriu uma consulta de unidade. Escape fechou os detalhes da reserva. O foco foi exercitado com a emulação de foco do Edge.
- O retrato completo do LocalStorage foi idêntico antes e depois dos fluxos demonstrativos. A saída removeu a sessão da aba.
- Nenhuma exceção JavaScript nem falha HTTP de recursos da aplicação foi observada. A ausência de favicon não é considerada falha de interface.
- Todos os módulos passaram por `node --check`.
- Os hashes dos arquivos Mobile foram comparados antes e depois.

## Correções e limites da revisão

A medição de largura do teste foi ajustada para aceitar a barra vertical do navegador. Cards administrativos receberam largura mínima adequada para conter seus conteúdos. A automação recebeu emulação de foco e espera pela renderização antes das capturas.

Foram inspecionadas capturas de dashboards, formulários, encomendas, cadastros, comunicados, triagem e agenda em comparação com as referências. As dimensões gerais, a paleta, os campos e as divisões de conteúdo seguem os frames. A Inter passou a ser servida localmente e seu carregamento foi verificado. Os ícones locais conservam diferenças possíveis em relação aos vetores originais.

Leitor de tela com saída de voz e comparação automatizada pixel a pixel não foram executados. Os fluxos foram verificados no Edge e Chrome e os erros de formulário foram conferidos na árvore de acessibilidade do navegador. Esses limites impedem afirmar conformidade integral de acessibilidade ou equivalência exata com os ativos do Figma.

## Integração funcional futura

A persistência das operações de negócio, a aprovação/cancelamento de reservas e a publicação efetiva de comunicados permanecem planejadas. Cadastro e edição de moradores e espaços possuem agora formulários e prévias visuais. As confirmações atuais são prévias visuais e seu estado se encerra ao navegar ou recarregar. O calendário oferece consulta local por data e espaço e não aprova reservas.


## Arquivos da implementação

Arquivos HTML criados:

- `web/portaria/encomendas.html`
- `web/portaria/moradores.html`
- `web/portaria/comunicados.html`
- `web/administracao/moradores.html`
- `web/administracao/solicitacoes.html`
- `web/administracao/reservas.html`
- `web/administracao/comunicados.html`

Módulos criados:

- `web/js/ui.js` fornece criação segura de elementos, campos, tabelas, cards, indicadores, status, filtros, diálogos e formulários.
- `web/js/contexto.js` relaciona os dados compartilhados de usuários e unidades.
- `web/js/moradores.js` reutiliza a consulta e as tabelas nos dois perfis.
- `web/js/comunicados.js` reutiliza listagem, filtros, detalhes, formulário e prévia de publicação.
- `web/js/reservas.js` fornece agenda, consulta e seleção pelo calendário.
- `tests/web.test.mjs` verifica navegação, dados, estados, resoluções e gera capturas opcionais.

Arquivos existentes ampliados:

- Os dois dashboards HTML passaram a usar um contêiner de conteúdo renderizado pelos módulos de seus perfis.
- `web/js/layout.js` passou a vincular todos os itens dos menus às páginas e destacar a seção atual.
- `web/js/portaria.js` e `web/js/administracao.js` passaram a renderizar seus módulos e estados.
- `web/css/components.css` recebeu os estilos Web de indicadores, tabelas, filtros, formulários, detalhes, agenda e calendário.
- `README.md`, `docs/escopo.md` e `docs/mapa-telas.md` foram atualizados. Este documento registra as verificações.

O Login e os mecanismos compartilhados de sessão, serviços, armazenamento e tokens foram reutilizados. Os arquivos Mobile e os testes de armazenamento existentes foram preservados.

## Conferências finais adicionais

A conferência estática encontrou 87 referências locais Web existentes, incluindo a fonte. Foram calculados os contrastes de nove combinações usadas em textos, botões e etiquetas, todos iguais ou superiores a 4,5:1. Essa conferência complementa a inspeção e não certifica conformidade integral de acessibilidade.

Os estados disponíveis para visualização direta e a navegação por perfil estão listados em `mapa-telas.md`. Para iniciar a aplicação, execute `node servir.mjs` e abra `http://127.0.0.1:8000/web/login.html`. Selecione Portaria ou Administração. Os campos de credenciais continuam ilustrativos e os botões de perfil iniciam a sessão.

## Revisão das pendências

Foram incluídos formulários visuais para cadastro/edição de moradores e edição de espaços. Nome, E-mail e Unidade reutilizam o modelo já aprovado. Os identificadores existentes são preservados nas prévias de edição. Um cadastro novo não recebe ID persistente nesta etapa.

A validação dos formulários agora apresenta mensagens junto aos campos, associa as mensagens por aria-describedby, informa aria-invalid e move o foco ao primeiro erro. A árvore de acessibilidade do navegador confirmou o nome do campo e seu estado inválido. Diálogos devolvem o foco ao acionador, e o link Ir para o conteúdo foca a região principal.

A fonte Inter variável foi incluída a partir do repositório Google Fonts com a licença SIL OFL. Ela é carregada somente pelos estilos Web. Arquivo SHA-256 29160A80FF49DDCAB2C97711247E08B1FAB27A484A329CE8B813D820DC559031. O servidor passou a servir TTF e os testes verificam tipo de conteúdo e disponibilidade dos pesos 400 e 700.

Origem da fonte e licença:

- https://github.com/google/fonts/tree/main/ofl/inter
- https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt

O guia do Design System pôde ser consultado no Figma. A consulta seguinte atingiu o limite do plano Starter. Por isso, a equivalência exata dos SVGs e a existência de frames adicionais continuam dependentes de exportação ou de liberação do acesso no Figma. Os formulários complementares seguem os componentes existentes e não são apresentados como cópias de frames ausentes.

Os testes existentes de armazenamento continuam com oito aprovações e zero falhas. O teste Web ampliado passou integralmente tanto no Edge quanto no Chrome, com 327 verificações por execução. A comparação dos hashes confirmou os arquivos Mobile preservados. O retrato do LocalStorage permaneceu idêntico antes e depois das interações demonstrativas.

## Correções da revisão técnica

- O armazenamento valida datas ISO com fuso explícito em encomendas, reservas, mensagens e comunicados, incluindo os dias do calendário. Uma gravação inválida é rejeitada sem modificar a base. Uma base antiga inválida segue a recuperação demonstrativa existente, e uma edição inválida do histórico é apresentada como conflito.
- A formatação Web usa Data indisponível ou Horário indisponível quando recebe um valor ilegível, mantendo a interface renderizável.
- Registrar uma encomenda prepara uma cópia visual em Aguardando retirada, com retiradaEm e retiradoPorId nulos. O mesmo tratamento é aplicado ao estado registrada acessado diretamente. O registro compartilhado usado como referência conserva seu estado persistido.
- A agenda compara instantes completos. Reservas que terminam às 14h30 ocupam a faixa 14h–17h, enquanto o término exato às 14h permite a faixa seguinte. Reservas que atravessam a meia-noite também são consideradas no dia correspondente e no marcador do calendário.

Os dois testes novos do armazenamento verificam rejeição de datas ilegíveis, datas inexistentes, horas inválidas, ano bissexto, recuperação de base legada e isolamento de uma edição inválida no histórico. Os testes Web incluem as três regressões reproduzidas, o limite exato entre faixas e a preservação do registro compartilhado durante a prévia.

Resultado após as correções: oito testes de armazenamento aprovados, 327 verificações Web aprovadas no Edge e 327 no Chrome, sem falhas. Os arquivos Mobile mantiveram seus hashes.
