# CondoConnect — Relatório técnico final da Etapa 5

Data: 18/11/2026. Escopo: validação, correções pontuais, documentação e preparação para publicação estática. Referências: 31 imagens Web/Mobile fornecidas e implementação/documentação das quatro etapas anteriores.

## 1. Situação geral

**PRONTO PARA PUBLICAÇÃO como site demonstrativo estático no Netlify**, dentro do escopo acadêmico aprovado. Os módulos integrados passaram nos testes executados, não há falha crítica conhecida nos cenários cobertos e a pasta pública está preparada. Nenhuma publicação, criação de repositório remoto ou alteração de conta foi realizada.

As limitações originais permanecem: login/permissões demonstrativos, LocalStorage sem sincronização entre dispositivos ou transações garantidas, quota e histórico crescente. Cadastro/edição de moradores e edição de espaços são prévias sem gravação. Elas não foram convertidas em funcionalidades novas nesta finalização.

**O CondoConnect Mobile é um site otimizado para celulares, não um aplicativo nativo.** São duas versões do site, com HTML/CSS/JS próprios e recursos de domínio compartilhados, acessíveis por `/web/login.html` e `/mobile/login.html` no mesmo domínio. A URL determina a versão; não há detecção de dispositivo, instalação, PWA, manifesto, Service Worker, backend ou banco externo.

## 2. Auditoria e correções

Inspeção inicial de estrutura, páginas, CSS, módulos, serviços, armazenamento, sessões, dados fictícios, cinco suítes existentes, documentos e servidor. Nenhum arquivo correto foi recriado; nenhuma funcionalidade ou teste válido foi removido. Consulte [auditoria inicial](etapa5-auditoria.md).

| Gravidade | Problema observado | Correção final |
|---|---|---|
| Alto | Raiz sem separação de publicação, contendo documentação/testes/capturas | Script de cópia com lista permitida e saída `dist/`; arquivos de desenvolvimento excluídos |
| Médio | Agenda da Quadra montava `T9:00`, prejudicando detecção de ocupação, e ordenava 9h após 10h | Horas com dois dígitos na comparação e ordenação; regressão com 9h ocupada |
| Médio | Filtro Área comum perdia chamados com local específico | Reconhecimento do prefixo com delimitador, mantendo a busca e demais filtros |
| Médio | ISO em `Z` e `-03:00` ordenados lexicalmente; atividade usava último registro do array | Mensagens, atividade, comunicados, notificações e próximas reservas comparados por instante |
| Médio | Query de calendário aceitava dia civil inexistente, normalizado por Date.parse | Reuso de `diaValido`; 30/02 volta à data atual |
| Médio | Mensagem de 2000 caracteres sem espaços causava overflow Mobile | Quebra de palavras no conteúdo Mobile; teste da conversa e resumo em 320 px |
| Médio | URL de retirada podia apresentar confirmação em encomenda pendente; URL antiga de registro prometia disponibilidade após retirada | Título/descrição compatíveis com o estado persistido |
| Médio | URL antiga de confirmação mantinha título de reserva confirmada após cancelamento | Título passa a Reserva cancelada |
| Baixo | Data nos cabeçalhos dependia do fuso do computador | Formatador existente com America/Sao_Paulo |
| Baixo | Página inexistente sem conteúdo de recuperação | `404.html` com links absolutos e status 404 no servidor local |

Também foram ampliados os testes para 1920 px, relógio determinístico, fusos mistos, sobreposição parcial, espaços diferentes, virada do ano, sessões inválidas, isolamento entre perfis de navegador, pacote público e contraste. A arquitetura, Design System, navegação inferior e regras demonstrativas foram preservados.

## 3. Resultado por módulo

| Módulo | Resultado e evidência |
|---|---|
| Mensagens | Aprovado: criação/reuso de conversa, envio/resposta entre moradores, persistência, ordem cronológica, atividade, leitura/não lidas e restrição de participantes. Espaços e limite excedido rejeitados; HTML literal; texto longo contido. |
| Encomendas | Aprovado: Portaria registra para morador/unidade compatíveis; destinatário recebe alerta e detalhes; retirada única identifica pessoa/data e preserva recebimento. Dashboard e Mobile atualizam. Perfis inválidos não alteram registros. |
| Solicitações | Aprovado: criação, validação/anexo, fila administrativa, local específico, triagem sequencial, responsabilidade/responsável, histórico, timeline, notificações e indicador. Saltos/retornos rejeitados, concluídas imutáveis. |
| Reservas | Aprovado: espaços, calendário mensal, seleção, faixas, conflito inclusive parcial, períodos consecutivos/espaços diferentes, anonimização de terceiros, consulta administrativa, cancelamento e liberação. Datas inválidas/passadas e cancelamento alheio rejeitados. |
| Comunicados | Aprovado: publicação exclusiva da Administração, autoria/categoria/público/torre, persistência, consulta autorizada e alertas. Portaria consulta apenas públicos permitidos. |
| Notificações | Aprovado: associação ao destinatário/evento, leitura, persistência, contagem, destino relacionado e ausência de duplicação nos cenários. Sem push. |
| Dashboards | Aprovado: registros e contagens coerentes, pendências, recebidas/retiradas hoje em São Paulo, solicitações ativas, reservas futuras, janela de sete dias e restauração. |

## 4. Testes executados

Ambiente: Windows, Node.js **24.21.0**, Microsoft Edge **157.0.4341.60** em modo headless com perfis temporários. Infraestrutura existente via Chrome DevTools Protocol, sem dependências novas. Playwright não fazia parte do projeto e não foi instalado. Serviços e navegador usam referência controlada de **18/11/2026 às 12h de São Paulo**; os testes verificam o relógio do navegador. O site publicado continua usando a data real.

### Execução final

```powershell
node --test tests/storage.test.mjs tests/services.test.mjs tests/publicacao.test.mjs
$env:CONDO_PUBLICACAO = '1'
$env:CONDO_CAPTURAS = "$PWD\docs\capturas-etapa5\web"
node tests/web.test.mjs
$env:CONDO_CAPTURAS = "$PWD\docs\capturas-etapa5\mobile"
node tests/mobile.test.mjs
$env:CONDO_CAPTURAS = "$PWD\docs\capturas-etapa5\integracao"
node tests/integracao.test.mjs
```

`publicacao.test.mjs` gera/regera `dist/` antes das verificações. As três suítes de navegador rodaram separadamente sobre essa saída. Não executar as suítes de teclado simultaneamente. Para voltar aos fontes, remova `Env:CONDO_PUBLICACAO`.

| Suíte | Quantidade | Aprovados | Reprovados finais | Ignorados |
|---|---:|---:|---:|---:|
| Node: storage | 8 casos | 8 | 0 | 0 |
| Node: services | 15 casos | 15 | 0 | 0 |
| Node: publicacao | 3 casos | 3 | 0 | 0 |
| Navegador Web | 456 verificações | 456 | 0 | 0 |
| Navegador Mobile | 929 verificações | 929 | 0 | 0 |
| Navegador integração | 66 verificações | 66 | 0 | 0 |

Total: **26 casos Node** e **1451 verificações de navegador**. As verificações são asserções nas três suítes, não 1451 casos Playwright. Outras verificações: `node --check` em **35 arquivos JS/MJS** dos fontes/testes/scripts; busca estática de `innerHTML`, `eval`, Service Worker, detecção de dispositivo e padrões de chaves privadas sem ocorrências nos arquivos de execução inspecionados. Isso não equivale a auditoria de segurança formal.

### Cobertura de integração

- A: registro na Portaria → encomenda na aba Marina → retirada → atualização Mobile e indicadores.
- B: solicitação de Marina → fila administrativa → três avanços de status → histórico de quatro eventos e notificações.
- C: reserva Mobile → agenda administrativa → bloqueio em Gabriel → faixa consecutiva → cancelamento/liberação.
- D: comunicação geral, exclusiva da Portaria e exclusiva de moradores; públicos respeitados nas abas abertas.
- E: nova conversa Marina/Gabriel, envio, indicador de não lida, leitura, resposta e persistência.

Quatro abas com sessões explícitas na mesma origem; segundo perfil temporário de navegador comprovou base independente e sessão ausente. Abertura com `window.open` comprovou a cópia inicial de SessionStorage quando existe opener. A interface de “duplicar aba” específica do navegador não foi automatizada; a limitação está documentada.

### Persistência, dados e falhas

Inicialização, ausência de sessão, JSON/esquema inválido, migração, IDs/vínculos/estados, datas inexistentes, falhas de leitura/escrita, quota simulada, conflitos entre abas e restauração determinística. Base inválida é preservada até recuperação explícita; falha de escrita não emite sucesso/notificações parciais. Cancelar a confirmação de restauração preserva os dados; confirmar atualiza as demais abas.

A quota foi simulada por exceção de Storage, sem preencher fisicamente todo o disco/armazenamento. Não foi feito teste de carga prolongado do histórico. LocalStorage continua sem garantia transacional para operações simultâneas; rejeição/convergência do conflito é testada, não uma promessa de confirmação global.

### Falhas intermediárias e ajustes dos testes

A execução inicial do Edge no ambiente restrito esgotou o tempo; execuções autorizadas fora desse limite permitiram testes locais. A nova regressão de texto longo falhou antes da correção de CSS. A primeira preparação rejeitou marcadores `.gitkeep`; passou a ignorá-los explicitamente. Houve tentativas HTTP sem servidor alcançável no ambiente restrito; a execução autorizada passou. A expectativa de 9h foi ajustada para o formatador existente `09h`, e o teste de foco passou a aguardar o evento de fechamento/removal do diálogo antes de acionar outro controle. O relógio passou a habilitar Page e verificar a injeção explicitamente. Nenhuma falha final permanece nas suítes executadas.

## 5. Revisão visual, responsividade e acessibilidade

Web: login, dashboards Portaria/Administração, encomendas/lista/registro/detalhes/confirmação, moradores/unidades/cadastro/edição, comunicados/lista/publicação restrita/publicação administrativa, solicitações/triagem, agenda/gestão/prévia de espaço. **21 rotas/estados autenticados × 3 larguras = 63 combinações**, mais login e verificações adicionais em 640 px.

Mobile: login, início, conversas/lista/detalhes, encomendas/lista/detalhes, serviços, solicitações/lista/nova/timeline, espaços/calendários dos três espaços, minhas reservas/confirmada/cancelamento, notificações, perfil e comunicado. **25 rotas/estados autenticados × 5 larguras = 125 combinações**, mais login e fluxos com registros novos.

Larguras: Web **1280, 1440 e 1920 px**; Mobile **320, 360, 375, 390 e 430 px**. Foram verificadas contenção dos controles, ausência de overflow horizontal nas matrizes, espaço inferior para navegação fixa, menus ativos, rótulos e título principal. A Quadra requer rolagem vertical por possuir mais faixas. A correção de textos longos não oculta overflow com CSS.

Revisão visual por capturas e comparação qualitativa com as imagens aprovadas: paleta, fonte, cards, bordas, tabelas, botões, alinhamento, menus e identidade preservados. Evidências: **22 PNGs Web, 29 Mobile e 2 integração**, em `capturas-etapa5/`, mais dois painéis de contato. Estados antigos de URL não fabricam dados de negócio.

Acessibilidade básica: campos rotulados, navegação e abertura de diálogo por teclado, Escape, retorno de foco, atalho de conteúdo, árvore de acessibilidade para erro Web, status textuais, feedback e foco visível. Nove pares de texto dos tokens passaram no cálculo de contraste **4,5:1**. Não houve certificação WCAG, teste com leitor de tela ou verificação exaustiva de todos os estados/combinações de cor.

Diferenças intencionais remanescentes: mais moradores/unidades na base que em certas imagens; registros privados não são exibidos como pertencentes a Marina; notificações não são inventadas para a base inicial; datas/indicadores/calendários são dinâmicos; histórico legado é identificado; seletores nativos variam por navegador; novos campos de triagem e destinatários refletem regras já aprovadas. Portaria não publica, embora a imagem antiga apresente esse botão. Não houve comparação pixel a pixel ou alteração de design para forçar textos estáticos.

## 6. Arquivos entregues

### Criados

- `404.html`, `preparar-publicacao.mjs`, `netlify.toml`, `.gitignore`.
- `tests/relogio.mjs`, `tests/publicacao.test.mjs`.
- `docs/etapa5-auditoria.md`, `docs/etapa5-relatorio.md`, `docs/arquitetura.md`, `docs/netlify.md`, `docs/roteiro-apresentacao.md`.
- `dist/`: 56 arquivos gerados para publicação, cópias dos fontes públicos.
- `docs/capturas-etapa5/`: 53 capturas individuais e dois painéis para inspeção visual.

### Modificados

- `shared/js/services/mensagens.js`, `comunicados.js`, `notificacoes.js`: ordenação por instante/atividade.
- `web/js/administracao.js`: filtro de local, datas e ordenação; `web/js/portaria.js`: fuso e textos coerentes; `web/js/reservas.js`: faixa das 9h.
- `mobile/js/reservas.js`: dia civil e título de cancelamento; `mobile/css/mobile.css`: quebra de texto longo.
- `servir.mjs`: modo de prévia de `dist/` e conteúdo 404.
- `tests/services.test.mjs`, `web.test.mjs`, `mobile.test.mjs`, `integracao.test.mjs`: novas regressões, relógio, matriz Desktop, isolamento e modo de publicação.
- `README.md`, `docs/regras.md`, `docs/escopo.md`, `docs/mapa-telas.md`, `docs/validacao-web.md`, `docs/validacao-mobile.md`: estado vigente, instruções e diferenciação dos registros históricos.

Não foram alterados os HTMLs das interfaces, tokens, base fictícia, esquema do storage ou identidade visual. A pasta não contém repositório Git local, portanto não foi possível fornecer `git diff`/commit; o inventário acima registra as alterações desta tarefa.

## 7. Netlify e apresentação

Diretório a publicar: **`dist/`**. Preparação: **`node preparar-publicacao.mjs`**, somente cópia, sem compilação ou dependências. Git: `netlify.toml` contém esse comando, `publish = "dist"` e Node 24. Manual: gerar localmente e enviar a saída pronta pelo painel quando autorizado. Preservadas `/web/`, `/mobile/` e `/shared/`; nenhuma regra de SPA.

Foram conferidos **56 arquivos, 194 referências locais com caixa exata**, integridade das cópias, remoção de arquivo obsoleto, links/imports, HTTP dos recursos, fonte, MIME JavaScript, HEAD, métodos e páginas inexistentes. Isso detecta divergências de nomes que poderiam falhar em Linux, sem afirmar teste em servidor Linux real.

URLs previstas: `https://NOME-DO-SITE.netlify.app/web/login.html` e `https://NOME-DO-SITE.netlify.app/mobile/login.html`. Nome ilustrativo. Testes em domínio público estão **pendentes após publicação autorizada**, incluindo CDN/DNS/TLS e comportamento real do Netlify. Consulte [procedimentos e checklist](netlify.md), com fontes oficiais.

Roteiro: [roteiro-apresentacao.md](roteiro-apresentacao.md). Início local: `node servir.mjs`; abra Portaria/Administração por `/web/login.html` e Marina/Gabriel em abas Mobile independentes por `/mobile/login.html`. Execute os cinco fluxos do roteiro, usando uma data futura para reservar. Restauração no menu Web ou Perfil Mobile exige confirmação e permite repetir a apresentação.

## 8. Pendências e limites

**Críticas:** nenhuma conhecida nos cenários executados.

**Não bloqueantes para preparar a publicação acadêmica:** checklist público após autorização; validação em dispositivos físicos e outros motores de navegador; comparação pixel a pixel; leitor de tela/auditoria formal; quota física e ensaio prolongado. As prévias de cadastro/edição e limitações de armazenamento são comportamentos preservados, claramente identificados, não operações persistentes prometidas.

**Melhorias futuras fora do escopo:** autenticação/autorização reais no servidor, persistência transacional, sincronização entre dispositivos, políticas de dados e testes multibrowser mais amplos. Nenhum desses recursos foi implementado ou apresentado como existente.
