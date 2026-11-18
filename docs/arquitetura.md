# Arquitetura atual — Etapa 5

Site estático multipágina em HTML5, CSS3 e JavaScript ES modules. Duas interfaces independentes: `/web/` para Portaria/Administração e `/mobile/` para moradores. Recursos de domínio compartilhados em `/shared/`. A URL escolhe a versão, sem detecção de dispositivo. **O CondoConnect Mobile é um site otimizado para celulares, não um aplicativo nativo.**

## Fluxo e serviços

Formulário → serviço autorizado pela sessão → leitura recente/validação → operação única com registros e notificações → LocalStorage → assinatura local/evento `storage` → atualização das interfaces. O DOM usa criação de elementos e inserção de texto, sem interpretar conteúdo digitado como HTML.

| Componente | Responsabilidade |
|---|---|
| `shared/js/data/demo-data.js` | Conjunto fictício determinístico e IDs originais |
| `shared/js/migracao.js` | Leitura compatível de registros legados |
| `shared/js/storage.js` | Envelope, vínculos, datas, estados, operações, conflitos e restauração |
| `shared/js/session.js` | Login/logout demonstrativos por aba |
| `services/base.js` | Exigência de perfil, alteração, texto, opções, IDs, notificações e datas civis |
| `services/encomendas.js` | Consulta, registro e retirada única pela Portaria |
| `services/solicitacoes.js` | Abertura, imagem opcional, triagem sequencial e histórico |
| `services/reservas.js` | Espaços, faixas permitidas, conflitos, consulta e cancelamento |
| `services/mensagens.js` | Conversas de dois moradores, envio, leitura e ordem por instante |
| `services/comunicados.js` | Publicação administrativa e consulta filtrada por público/torre |
| `services/notificacoes.js` | Consulta/leitura por destinatário |
| `web/js/` e `mobile/js/` | Formulários, estados, navegação e renderização de cada interface |

Tokens e estilos base são compartilhados; layouts, barra lateral Desktop e navegação inferior Mobile são próprios. A fonte Inter é local, sem dependência de CDN.

## Armazenamento e sessões

Chave de base `condoconnect.demo.v1`, envelope versão 2; versão 1 continua legível. Cada escrita gera `condoconnect.demo.v1.operacao.UUID`. A reprodução determinística rejeita uma operação inteira que conflite ou invalide os vínculos. Dados ilegíveis não são apagados silenciosamente: exibe-se fallback de consulta, bloqueando gravações. Restauração confirmada repõe os dados originais e notifica abas.

SessionStorage usa `condoconnect.sessao.v1` com usuário/perfil da aba. Não contém credenciais reais. Abas com opener podem copiar inicialmente a sessão; login explícito redefine o usuário. Perfis de navegador independentes não compartilham dados, mesmo acessando a mesma origem.

LocalStorage não é transacional e não sincroniza dispositivos. Histórico físico cresce mesmo após restauração e pode atingir quota; imagens opcionais são pequenas. Não foi adicionada compactação ou substituição de banco. Ver detalhes e transições em [regras.md](regras.md).

## Publicação e testes

`preparar-publicacao.mjs` copia somente recursos públicos para `dist/`. `netlify.toml` aponta para essa saída; não há compilação/framework ou rewrite de SPA. `servir.mjs` serve os fontes por padrão e a saída com `--publicacao`, sempre limitado a recursos estáticos. A fonte e sua licença são distribuídas.

Testes Node verificam domínio/persistência; suítes Edge CDP cobrem renderização e integração. Não foi instalada ferramenta nova. `tests/relogio.mjs` fixa data/fuso apenas no navegador de testes; serviços usam o mock de Date do runner Node. O runtime publicado continua no relógio real. A documentação de resultados atuais está em [etapa5-relatorio.md](etapa5-relatorio.md); relatórios anteriores são históricos.
