# Publicação estática no Netlify

Preparação técnica concluída em 18/11/2026. Nenhum projeto remoto, repositório, conta ou deploy foi criado/alterado nesta tarefa. Publicação pública depende de autorização do responsável.

## Pacote e prévia local

Na raiz, com Node.js 24:

```powershell
node preparar-publicacao.mjs
node servir.mjs 8000 --publicacao
```

O primeiro comando prepara 56 arquivos em `dist/`; o segundo permite conferir essa saída em `http://127.0.0.1:8000/`. Abra `/web/login.html` e `/mobile/login.html`. Não envie a raiz inteira ao Netlify.

O script somente copia os recursos autorizados de `web/`, `mobile/` e `shared/`, mais `index.html` e `404.html`. Mantém a licença Inter; ignora marcadores `.gitkeep`; rejeita links simbólicos e tipos inesperados para revisão explícita. Recria a pasta fixa `dist/` e elimina sobras de versões anteriores. Não coloque arquivos próprios nessa pasta. Não há compilação, pacote npm, framework ou serviço de build da aplicação.

## Método A — manual, após autorização

1. Execute os testes e gere novamente `dist/`.
2. No painel do Netlify, utilize a opção de publicação manual e envie **o conteúdo estático de `dist/` como raiz do site**, com `index.html` na raiz.
3. Defina o nome disponível do site e registre a URL real.
4. Para atualizações, repita a geração e envie a nova pasta na área de deploys do **mesmo projeto**, mantendo o domínio.
5. Execute o checklist público abaixo.

O pacote já está pronto; não dependa de executar comandos no envio manual. Preserve uma cópia da versão anterior se precisar reverter.

## Método B — Git, após autorização

Não há repositório Git local nesta entrega. Quando houver um repositório autorizado, versionar os fontes, script e `netlify.toml`; `dist/` está no `.gitignore` porque é gerada. Não incluir segredos, dados pessoais ou arquivos `.env`.

| Configuração | Valor |
|---|---|
| Base | Raiz do CondoConnect; se estiver em subpasta do repositório, selecionar essa subpasta |
| Build command | `node preparar-publicacao.mjs` |
| Publish directory | `dist` relativo à base |
| Node | 24, definido em `netlify.toml` |
| Functions/backend/banco | Não utilizados |
| Rewrite global de SPA | Não configurar |

O comando existe apenas para copiar arquivos. Atualizações de fontes no ramo conectado regeneram o pacote. Não há dependências para instalar. Todos os imports ES e recursos locais devem permanecer na mesma estrutura.

## URLs e dados

- Entrada: `https://NOME-DO-SITE.netlify.app/`.
- Web: `https://NOME-DO-SITE.netlify.app/web/login.html`.
- Mobile: `https://NOME-DO-SITE.netlify.app/mobile/login.html`.

Os nomes são ilustrativos, não links de um deploy existente. As duas versões são sites tradicionais; a URL determina a interface, independentemente do dispositivo. O Mobile não é aplicativo nativo nem PWA instalável.

O armazenamento é local à origem e ao perfil do navegador. Abas Web/Mobile no mesmo domínio e perfil compartilham LocalStorage. Outro navegador, perfil, celular, domínio de preview ou porta possui uma base independente. O Netlify não cria sincronização entre dispositivos. SessionStorage identifica o perfil por aba; duplicações e abas abertas com referência à original podem copiar a sessão inicialmente. Prefira abas novas abertas pela barra de endereço e login explícito.

## Verificações locais concluídas

`node --test tests/publicacao.test.mjs` verifica a lista pública, cópia fiel, remoção de sobras, 194 referências locais com caixa exata, HTTP de todos os recursos de execução, MIME de módulos, HEAD, 404, métodos e ausência de redirecionamento por dispositivo. As três suítes de navegador foram executadas com `CONDO_PUBLICACAO=1` sobre `dist/`, incluindo login, perfis, módulos e integração.

A página `404.html` usa links absolutos para funcionar também em URLs profundas. O servidor local devolve 404 preservando esse conteúdo; não converte caminhos ausentes em sucesso HTTP ou em SPA. A licença `.txt` está no pacote para distribuição, mas não é servida pela lista de recursos de execução do servidor de desenvolvimento.

## Checklist público — pendente, executar depois do deploy autorizado

1. Abrir `/`, os dois logins e os dashboards, em HTTPS e no mesmo domínio.
2. Entrar por perfil e abrir diretamente uma URL interna, com e sem sessão compatível; conferir retorno ao login quando necessário.
3. Conferir CSS, fonte Inter, módulos ES e imagens anexadas localmente; inspecionar console e rede para erros/404.
4. Abrir abas independentes de Portaria, Administração, Marina e Gabriel; executar os cinco cenários do roteiro e restauração.
5. Recarregar páginas para confirmar persistência e testar um perfil de navegador separado para confirmar isolamento.
6. Abrir `/web/pagina-inexistente.html` e `/mobile/pagina-inexistente.html`: página útil, links corretos e **status 404**.
7. Conferir as larguras Desktop/Mobile da matriz de testes e ausência de redirecionamento automático.
8. Confirmar que `/README.md`, `/tests/`, `/docs/` e arquivos privados não fazem parte do deploy.

Essa validação não foi executada em domínio público: não há deploy autorizado nesta tarefa. O servidor local não simula toda a CDN, DNS, TLS ou configuração de conta Netlify.

## Fontes oficiais consultadas

Configurações de comando/diretório: [Build configuration overview](https://docs.netlify.com/build/configure-builds/overview/) e [File-based configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/). Métodos: [Create deploys](https://docs.netlify.com/deploy/create-deploys/). Página 404 automática: [Redirect options](https://docs.netlify.com/manage/routing/redirects/redirect-options/).
