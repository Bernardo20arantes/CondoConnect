# Roteiro de apresentação acadêmica

Duração sugerida: 10–15 minutos. O CondoConnect centraliza entregas, comunicação, solicitações e reservas para reduzir informações dispersas entre moradores, portaria e administração. Usar somente os dados fictícios do projeto.

## Preparação

1. Na raiz, execute `node servir.mjs` e abra `http://127.0.0.1:8000/`. Para ensaiar o pacote final: `node preparar-publicacao.mjs` e depois `node servir.mjs 8000 --publicacao`.
2. Abra quatro abas novas pela barra de endereço, no **mesmo navegador, perfil e origem**. Não duplique uma aba autenticada: ela pode copiar inicialmente a sessão. Se necessário, saia e selecione novamente o perfil.

| Aba | Entrada | Seleção e destino |
|---|---|---|
| Portaria | `/web/login.html` | Portaria → `/web/portaria/dashboard.html`; André Rocha |
| Administração | `/web/login.html` | Administração → `/web/administracao/dashboard.html`; Renata Duarte |
| Marina | `/mobile/login.html` | Marina Lopes → Entrar como morador → `/mobile/inicio.html`; Torre A · 302 |
| Gabriel | `/mobile/login.html` | Gabriel Lopes → Entrar como morador → `/mobile/inicio.html`; Torre A · 302 |

3. Antes do roteiro, Marina abre `/mobile/perfil.html` → **Restaurar dados da demonstração** → **Apagar alterações e restaurar**. As outras abas atualizam. A restauração descarta alterações de todos os cenários na mesma origem.
4. Sugestão de exibição: Web em 1440 px; Mobile em 390 px pelo navegador. Não exige instalação e também abre no computador.
5. Anote uma data cinco dias à frente da data atual para usar na reserva. Registros originais de novembro de 2026 permanecem históricos conforme a data do ensaio.

## 1. Introdução

Explique o problema da comunicação dispersa e os três perfis: Morador, Porteiro e Administrador/Síndico. Mostre as duas entradas da página inicial.

Declare: “O CondoConnect Mobile é um site otimizado para celulares, não um aplicativo nativo. As duas interfaces têm URLs próprias no mesmo domínio. Esta versão acadêmica usa dados fictícios e armazenamento local do navegador.”

## 2. Portaria e Morador — encomendas

1. Portaria: observe os indicadores do dashboard. Pendências iniciais: ENC-024 para Marina e ENC-022 para Lívia. Recebidas/retiradas hoje dependem da data real.
2. Abra `/web/portaria/encomendas.html?estado=registrar`. Escolha Torre A · 302, Marina Lopes, transportadora “Correios” e observação “Caixa da apresentação”. Confira data/hora atual e registre.
3. Observe o ID gerado e **Aguardando retirada**. Não espere um ID sequencial específico.
4. Marina: abra `/mobile/encomendas.html` e o registro novo; observe atualização sem recarregar, sino e `/mobile/notificacoes.html`. Abra a notificação para ir aos detalhes e marcar a leitura.
5. Portaria: localize a encomenda → **Confirmar retirada**. Identifique Marina, confira o horário e confirme.
6. Observe **Entregue**, pessoa/data da retirada, atualização na aba Marina e indicadores da Portaria. O recebimento original permanece e uma segunda retirada é impedida.

## 3. Morador — solicitações

1. Marina: Serviços → Solicitações → Nova solicitação, ou `/mobile/solicitacoes.html?estado=nova`.
2. Preencha Área comum, Outros, Normal, título “Limpeza do jardim”, local específico “Jardim central” e descrição “Solicito a limpeza das folhas no caminho”. Não é necessário anexar imagem.
3. Envie e observe protocolo gerado, **Aberto** e primeiro evento da linha do tempo.
4. Administração: `/web/administracao/solicitacoes.html`; localize o título/protocolo. O filtro Área comum inclui o local específico.

## 4. Administração — triagem e comunicado

1. Abra a triagem do protocolo novo. Defina **Condomínio**, **Equipe de manutenção do condomínio** e informações “Equipe avisada para avaliar o jardim”. Salve **Em análise**.
2. Observe a mudança no Mobile e a notificação. Avance para **Em andamento**, com “Limpeza iniciada”; depois **Concluído**, com “Limpeza finalizada”. Avance uma etapa por vez.
3. Mostre os quatro eventos no Mobile e a saída desse chamado do indicador de solicitações ativas no dashboard administrativo.
4. Abra `/web/administracao/comunicados.html?estado=novo`. Título “Orientação para a apresentação”, público **Todas as unidades**, destinatários **Público geral do condomínio**, categoria **Oficial**, mensagem “A demonstração está em andamento com dados fictícios.” Publique.
5. Observe o comunicado na aba Marina e em `/web/portaria/comunicados.html`. Explique: destinatários “Todos os moradores” não incluem Portaria; torre restringe moradores; somente Administração publica.

Cadastro/edição de moradores e edição de espaços são prévias sem gravação. Não os apresente como operações persistentes ou parte dos fluxos integrados.

## 5. Reservas e prevenção de conflito

1. Marina: Serviços → Reservas → Quadra esportiva (`/mobile/reservas.html?espaco=ESP-003`). Selecione a data futura anotada e **10h às 11h**, se livre; caso contrário, anote outra faixa livre.
2. Confirme e mostre ID, data/hora e **Confirmada**.
3. Administração: `/web/administracao/reservas.html`; escolha Quadra e a mesma data. Mostre o registro compartilhado.
4. Gabriel abre a Quadra na mesma data: a faixa de Marina fica **Indisponível**, impedindo seleção conflitante. O serviço também revalida ao salvar. Faixas consecutivas e espaços diferentes são permitidos.
5. Marina: `/mobile/reservas.html?estado=minhas`; encontre pelo ID, escolha **Cancelar reserva** e confirme.
6. Observe o histórico cancelado e a faixa livre para Gabriel. Reservas históricas já iniciadas não podem ser canceladas.

## 6. Mensagens

1. Marina e Gabriel abrem `/mobile/mensagens.html` nas respectivas abas.
2. Marina → Nova conversa → Gabriel Lopes. Envie “Mensagem fictícia da apresentação”.
3. Observe a conversa e o indicador de não lida na lista de Gabriel. Abra-a nessa aba para marcar leitura.
4. Gabriel responde “Recebido na outra aba”. Observe a resposta na conversa aberta de Marina.
5. Reabra a conversa para mostrar persistência. Opcionalmente, tente mensagem só com espaços: ela é rejeitada. Conteúdo semelhante a HTML aparece como texto.

## 7. Conclusão e repetição

Apresente os benefícios da centralização e a integração local dos perfis. Explique os limites: sem backend/autenticação real, push ou sincronização entre computador e celular físico; LocalStorage acessível pelas ferramentas do navegador, sujeito a quota e sem transações garantidas entre abas. Não usar dados reais.

Evoluções futuras fora desta entrega: backend com autenticação/autorização reais, persistência transacional e integração entre dispositivos. Não as apresente como implementadas.

Para repetir, confirme a restauração no Perfil Mobile ou no menu Web. Confira os dados originais e as outras abas. As sessões permanecem por aba; alterações de negócio são descartadas. Não restaure durante um formulário que pretenda preservar.
