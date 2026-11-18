# Escopo acadêmico

**Estado atual:** Etapa 5 validada, com preparação estática para Netlify. Os trechos sobre etapas anteriores abaixo são históricos. Consulte [relatório final](etapa5-relatorio.md), [publicação](netlify.md) e [regras atuais](regras.md). Cadastro de moradores e edição de espaços permanecem prévias; não foi ampliado o escopo. O CondoConnect Mobile é um site otimizado para celulares, não um aplicativo nativo.

O CondoConnect demonstra como um condomínio pode centralizar comunicação, rotina de portaria e solicitações de moradores. As interfaces compartilham dados locais fictícios, com páginas e estilos próprios para cada versão.

| Perfil | Interface | Módulos previstos |
|---|---|---|
| Morador | Web Mobile | Início, mensagens, encomendas, solicitações, reservas, notificações, comunicados e perfil |
| Porteiro | Web Desktop | Dashboard, encomendas, retiradas, consulta de moradores e unidades, avisos operacionais |
| Administrador ou síndico | Web Desktop | Dashboard, moradores e unidades, triagem, espaços e reservas, comunicados oficiais |

Na Etapa 1, os pontos de entrada permitem selecionar o perfil e consultar um registro no dashboard ou no início. Os serviços de domínio oferecem consultas de leitura. Persistência e sessão são locais ao navegador e destinadas à demonstração. O servidor fornece os arquivos estáticos. Autenticação real, backend, banco externo e sincronização entre dispositivos estão fora do escopo demonstrativo.

## Interfaces Web da Etapa 2

As páginas Web previstas estão implementadas com navegação por perfil, tabelas, filtros, agenda, formulários e estados demonstrativos. As operações de negócio continuam sendo prévias visuais. O mapa de telas detalha cada referência e os controles que aguardam integração funcional.

## Integração funcional da Etapa 4

Mensagens, encomendas, solicitações, reservas, comunicados, notificações e dashboards utilizam os mesmos serviços e registros persistidos. A restauração é confirmada visualmente. Não houve implementação da Etapa 5. Cadastro/edição de moradores e edição de espaços continuam prévias visuais das etapas anteriores, fora das operações exigidas nesta integração.
