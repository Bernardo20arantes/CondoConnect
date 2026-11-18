# Dados fictícios

A base é criada por `criarDadosDemo()` em `shared/js/data/demo-data.js`. Cada chamada devolve uma cópia. Toda coleção tem identificadores estáveis no campo `id`. Datas e horários usam ISO 8601 com deslocamento de Brasília (`-03:00`) nas datas fictícias de novembro de 2026.

| Coleção | Total | Campos além de `id` |
|---|---:|---|
| `usuarios` | 8 | `nome`, `email` demonstrativo no domínio example.com, `perfil`, `unidadeId` (nulo para funcionários) |
| `unidades` | 4 | `torre`, `apartamento` como texto |
| `encomendas` | 5 | `moradorId`, `status`, `recebidaEm`, `retiradaEm`, `retiradoPorId`, `transportadora`, `observacao`. Os quatro últimos aceitam nulo |
| `solicitacoes` | 4 | `moradorId`, `titulo`, `descricao`, `local`, `prioridade`, `status` |
| `espacos` | 3 | `nome` |
| `reservas` | 4 | `espacoId`, `moradorId`, `inicio`, `fim`, `status` |
| `conversas` | 3 | `participanteIds` |
| `mensagens` | 4 | `conversaId`, `autorId`, `enviadaEm`, `texto` |
| `comunicados` | 3 | `autorId`, `tipo`, `torre` (nulo indica todas), `publicadoEm`, `titulo`, `mensagem` |

## Relacionamentos

- Marina e Gabriel Lopes moram na Torre A, apartamento 302. Lívia Martins ocupa A · 204, Rafael Costa B · 105 e Beatriz Nunes B · 403. Uma unidade pode ter vários moradores.
- Encomendas, solicitações e reservas apontam para um morador. A unidade é obtida pelo vínculo do morador. A retirada, quando presente, referencia também quem retirou a encomenda.
- Reservas apontam para Salão de festas, Churrasqueira ou Quadra.
- Conversas agrupam moradores pelo ID. Cada mensagem referencia a conversa e um autor participante.
- Comunicados referenciam o usuário que publicou e o público por torre ou por todas as unidades.

## Registros iniciais

| Coleção | Registros |
|---|---|
| Usuários | 5 moradores acima, André Rocha e Camila Reis na Portaria, Renata Duarte na Administração |
| Encomendas | ENC-024 (Marina, aguardando retirada), ENC-023 (Rafael, entregue), ENC-022 (Lívia, aguardando retirada), ENC-021 (Beatriz, entregue), ENC-020 (Gabriel, entregue) |
| Solicitações | SOL-018 (Marina, vazamento na cozinha, em análise), SOL-017 (Rafael, portão, aberto), SOL-013 (Lívia, corredor, concluído), SOL-012 (Beatriz, interfone, concluído) |
| Reservas | RES-021 (Marina, salão, confirmada, 21/11 das 14h às 17h), RES-020 (Rafael, salão, confirmada), RES-019 (Lívia, churrasqueira, cancelada), RES-018 (Beatriz, quadra, confirmada) |
| Conversas e mensagens | CNV-001 (Marina e Rafael, MSG-001/002), CNV-002 (Marina e Lívia, MSG-003), CNV-003 (Beatriz e Gabriel, MSG-004) |
| Comunicados | COM-003 (manutenção no elevador, Torre A), COM-002 (reunião de moradores, todas), COM-001 (acesso pelo portão lateral, todas) |

As capturas de retirada confirmada e de triagem mostram possíveis evoluções de ENC-024 e SOL-018. Os dados iniciais contêm um registro por identificador.

## Complementos do esquema 2 — Etapa 4

Todos os IDs e registros iniciais acima foram preservados. A coleção notificacoes começa vazia, e eventos novos geram registros por destinatário. Mensagens antigas recebem lidaPorIds contendo inicialmente seu autor.

| Entidade | Complementos |
|---|---|
| Encomenda | unidadeId, registradoPorId e retiradoPorNome (nulos em registros legados, inferíveis quando aplicável; preenchidos nas novas operações) |
| Solicitação | categoria (Outros no legado), criadaEm, responsabilidade (A confirmar), responsavel, encaminhamento, imagem (nula) e historico (vazio no legado) |
| Mensagem | lidaPorIds, sem alterar texto, autoria ou horário original |
| Comunicado | publico: moradores para oficial legado; portaria para operacional legado |
| Notificação | id, usuarioId, evento, titulo, descricao, destino, criadaEm, lida |
| Reserva cancelada nova | canceladaEm e canceladaPorId, preservando início/fim e propriedade |

A data criadaEm de solicitações legadas é um complemento fictício determinístico: 2026-11-14T11:05:00-03:00. Não representa um histórico operacional anterior comprovado. A interface identifica a ausência desse histórico. Datas das novas solicitações/eventos refletem o momento da operação.

Horários de reservas originais não são deslocados para o presente. Após 21/11/2026, por exemplo, RES-021 aparece no histórico, mantendo seu status original; novas reservas precisam de um horário futuro. O calendário não está fixado em novembro de 2026.
