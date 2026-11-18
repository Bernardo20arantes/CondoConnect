# CondoConnect

Demonstração acadêmica de gestão condominial com dados exclusivamente fictícios. Portaria, Administração e Morador compartilham registros usando HTML, CSS, módulos ES, LocalStorage e SessionStorage. Etapa 5 validada e preparada para publicação estática no Netlify, sem envio público realizado. Sem backend, autenticação real, serviços externos ou sincronização entre dispositivos.

**O CondoConnect Mobile é um site otimizado para celulares, não um aplicativo nativo.** Web Desktop e Web Mobile têm arquivos e URLs próprios no mesmo domínio. O caminho acessado determina a versão; não existe redirecionamento por dispositivo, instalação, manifesto ou Service Worker. O Mobile também abre no computador.

## Executar

Com Node.js instalado, na raiz do projeto:

~~~powershell
node servir.mjs
~~~

Use a **mesma origem** em todas as abas: http://127.0.0.1:8000. Não abra os HTMLs diretamente pelo sistema de arquivos. Outra porta pode ser passada como argumento ao servidor.

| Entrada | Endereço | Perfil fictício |
|---|---|---|
| Escolha da interface | [Página inicial](http://127.0.0.1:8000/) | Desktop ou Mobile |
| Desktop | [Login Web](http://127.0.0.1:8000/web/login.html) | Portaria: André Rocha; Administração: Renata Duarte |
| Morador | [Login Mobile](http://127.0.0.1:8000/mobile/login.html) | Seletor com Marina, Gabriel, Lívia, Rafael e Beatriz |

Os campos de credenciais são ilustrativos. No Mobile, selecione um morador fictício e use **Entrar como morador**. Na Web, use o botão do perfil.

## Demonstrar a integração

Abra abas novas pela barra de endereço, sem duplicar a aba de uma sessão ativa. Entre como Porteiro, Administrador, Marina e Gabriel, uma sessão em cada aba. Abas duplicadas podem copiar inicialmente o SessionStorage; faça novamente o login na cópia para selecionar outro usuário. As sessões são independentes, e os registros pertencem ao mesmo LocalStorage.

1. **Encomendas:** Portaria → Encomendas → Registrar encomenda. Escolha unidade/destinatário, recebimento e informações do pacote. Marina verá seu registro e sua notificação. Na Portaria, confirme a retirada, identificando quem retirou e o horário. O Mobile e o dashboard atualizam.
2. **Solicitações:** Marina → Serviços → Solicitações → Nova solicitação. Preencha os campos. Na Administração, abra a triagem e avance por Em análise, Em andamento e Concluído. Defina responsabilidade, responsável e informações do atendimento. Consulte o histórico no Mobile.
3. **Reservas:** Marina → Serviços → Reservas → espaço. Navegue pelos meses e selecione data futura e horário livre. Gabriel verá o período ocupado. A Administração consulta a mesma agenda. Em Minhas reservas, cancele com confirmação para liberar o horário.
4. **Comunicados:** Administração → Comunicados → Novo comunicado. Defina categoria, destinatários e torre. Portaria e moradores verão apenas os públicos correspondentes. Publicação é exclusiva da Administração.
5. **Mensagens:** Marina → Mensagens → Nova conversa → Gabriel. Envie e responda na outra aba. Conversa aberta marca mensagens como lidas e recebe alterações automaticamente.
6. **Notificações:** no Mobile, abra o sino. Consulte eventos, marque como lidos ou abra o registro relacionado. O indicador do início conta notificações não lidas.

Os dados persistem ao recarregar/reabrir páginas. Interfaces com formulários em edição preservam os campos e revalidam a operação ao salvar. O calendário usa a data atual; as datas de novembro de 2026 continuam apenas nos registros históricos originais.

## Restaurar a demonstração

Use **Restaurar dados da demonstração** no menu Web ou no Perfil Mobile. Leia a confirmação e selecione **Apagar alterações e restaurar**. A ação descarta as alterações locais da demonstração em todas as abas da mesma origem e repõe a base fictícia determinística. Não afeta outros sites.

## Arquitetura

| Diretório | Responsabilidade |
|---|---|
| shared/js/data | Base fictícia original |
| shared/js/storage.js, migracao.js | Validação, histórico de operações, migração compatível e eventos entre abas |
| shared/js/session.js | Usuário/perfil da aba no SessionStorage |
| shared/js/services | Consultas autorizadas, operações, validações e notificações |
| web/js e mobile/js | DOM, formulários, navegação e atualização das interfaces |
| web/css, mobile/css e shared/css | Layouts existentes e Design System |
| tests | Regressão de persistência, domínio e navegador |
| docs | Regras, dados, relatórios e capturas |
| dist | Saída estática gerada para publicação; contém somente o site |

Não há coleções separadas para as interfaces. Novas operações geram UUIDs; IDs fictícios existentes são preservados. A chave continua sendo condoconnect.demo.v1, com esquema 2 e leitura compatível do esquema 1.

## Verificar

~~~powershell
node --test tests/storage.test.mjs tests/services.test.mjs tests/publicacao.test.mjs
node tests/web.test.mjs
node tests/mobile.test.mjs
node tests/integracao.test.mjs
~~~

Execute as suítes de navegador **separadamente**, pois os testes de teclado usam foco. Reutilizam o Edge instalado e o protocolo de depuração, com servidor e perfil temporários isolados; não alteram o navegador habitual. Defina CONDO_EDGE para outro caminho do Edge, se necessário. Playwright não está instalado no projeto; nenhuma dependência foi adicionada.

Os testes de serviços e navegador fixam a referência em 18/11/2026, às 12h de São Paulo. O site normal continua usando a data atual. Para repetir a validação dos arquivos que serão publicados:

~~~powershell
node preparar-publicacao.mjs
$env:CONDO_PUBLICACAO = '1'
node tests/web.test.mjs
node tests/mobile.test.mjs
node tests/integracao.test.mjs
Remove-Item Env:CONDO_PUBLICACAO
~~~

Resultados da Etapa 5: 26 testes Node e 1451 verificações de navegador aprovados, zero falhas/ignorados. Desktop: 1280, 1440 e 1920 px, mais reflow em 640 px; Mobile: 320, 360, 375, 390 e 430 px. Há 53 capturas individuais em `docs/capturas-etapa5/`. Consulte o [relatório final](docs/etapa5-relatorio.md) para cobertura e limites.

Capturas opcionais:

~~~powershell
$env:CONDO_CAPTURAS = "$PWD\docs\capturas-etapa4\mobile"
node tests/mobile.test.mjs
~~~

## Publicar e atualizar no Netlify

Execute `node preparar-publicacao.mjs`. O script recria somente `dist/` a partir de `index.html`, `404.html`, `web/`, `mobile/` e `shared/`, incluindo a fonte e sua licença. Não compila código nem instala dependências. Não edite `dist/` manualmente: ela é uma saída substituível. Documentação, capturas, testes e servidor local ficam fora da publicação.

- **Manual:** após autorizar a publicação, envie a pasta `dist/` pelo painel do Netlify. Para atualizar o mesmo site, gere novamente a pasta e envie-a na área de deploys desse projeto.
- **Git:** após criar/conectar um repositório autorizado, use a raiz deste projeto como base, comando `node preparar-publicacao.mjs` e diretório de publicação `dist`. `netlify.toml` já registra essas opções e Node 24. Não há regra de SPA, funções ou banco.

Endereços previstos: `https://NOME-DO-SITE.netlify.app/web/login.html` e `https://NOME-DO-SITE.netlify.app/mobile/login.html`. O domínio ainda é ilustrativo. Para conferir a saída localmente, execute `node servir.mjs 8000 --publicacao`. Acesse ambos os caminhos em `http://127.0.0.1:8000`.

O Netlify não compartilha LocalStorage entre computadores e celulares. A demonstração integrada exige abas na **mesma origem, mesmo perfil e mesmo navegador**. HTTP/HTTPS, hosts ou portas diferentes também separam os dados. Veja [publicação, atualização e checklist público](docs/netlify.md).

## Limitações e apresentação

Permissões e login são demonstrativos. Não use dados reais ou credenciais verdadeiras. O navegador pode bloquear o armazenamento, atingir quota ou perder dados ao limpá-lo; operações simultâneas não têm garantia transacional. Não há comunicação real entre dispositivos nem push. Cadastro/edição de moradores e edição de espaços continuam sendo **prévias sem gravação**, preservadas das etapas anteriores. Portaria apenas consulta comunicados; a Administração publica.

Comece pelo [roteiro de apresentação acadêmica](docs/roteiro-apresentacao.md). Ele descreve os perfis, URLs, restauração e cinco fluxos reproduzíveis. Consulte também a [arquitetura atual](docs/arquitetura.md), [auditoria](docs/etapa5-auditoria.md), [regras](docs/regras.md), [dados fictícios](docs/dados-demo.md) e [mapa de telas](docs/mapa-telas.md). Relatórios e capturas das etapas anteriores foram preservados como registros históricos.
