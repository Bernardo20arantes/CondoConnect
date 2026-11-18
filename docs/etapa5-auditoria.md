# Auditoria inicial — Etapa 5

Data: 18/11/2026. Inspeção anterior às alterações de código. Projeto existente em HTML/CSS/JavaScript modular, sem dependências de pacote ou repositório Git local. Cinco suítes Node/Edge CDP existentes; Playwright não faz parte da infraestrutura. Base inicial: 20 testes Node, 323 verificações Web e 924 Mobile aprovados nesta etapa. Integração em execução.

| Gravidade | Achado | Tratamento previsto |
|---|---|---|
| Alto | Raiz contém testes, documentos e capturas; ainda não há saída de publicação isolada | Preparar `dist/` por cópia com lista permitida, sem compilação/framework |
| Médio | Agenda administrativa monta `T9:00`, inválido para a faixa das 9h da quadra, e ordena esse horário depois das 10h | Preencher horas com dois dígitos e testar ocupação/ordem |
| Médio | Filtro Área comum compara texto exato e perde chamados com local específico acrescentado | Reconhecer categoria com delimitador e testar no navegador |
| Médio | Mensagens/comunicados/notificações ordenam ISO como texto, embora convivam registros `Z` e `-03:00`; atividade usa o último item do array | Comparar instantes e calcular a atividade mais recente |
| Médio | Calendário Mobile aceita dia civil inexistente na query, normalizado por Date.parse | Reutilizar validação civil do serviço |
| Baixo | Cabeçalhos de dashboards usam o fuso do computador, diferente dos indicadores em São Paulo | Usar formatador existente com fuso explícito |
| Médio | Cobertura Desktop não inclui 1920 px; suítes dependem do relógio real | Ampliar matriz e fixar relógio/fuso dos testes |
| Baixo | Página inexistente retorna resposta vazia no servidor local | Preparar 404 com links absolutos e verificar status HTTP |
| Médio | Regressão nova reproduziu overflow Mobile com mensagem de 2000 caracteres sem espaços | Permitir quebra de texto no conteúdo Mobile, sem ocultar overflow |
| Médio | Inspeção das capturas mostrou título de retirada confirmada em encomenda pendente ao abrir URL direta; reserva cancelada também mantinha título antigo de confirmação | Derivar os títulos/descrições do estado persistido; testar URLs antigas |

## Comportamentos aprovados preservados

- Cadastro/edição de moradores e edição de espaços são prévias sem persistência, conforme Etapa 4. Não implementar novos CRUDs nesta etapa.
- Portaria consulta comunicados; somente Administração publica, conforme regras vigentes. As imagens antigas com publicação pela Portaria não substituem essa decisão.
- Datas, contagens, históricos e permissões são derivados dos dados; não forçar exemplos fixos das imagens.
- LocalStorage possui limitações de quota e concorrência, sem sincronização entre dispositivos. Restauração mantém histórico físico anterior. Alterar esse desenho exigiria outra decisão de arquitetura; preservar e documentar.
- Infraestrutura CDP repete código entre três suítes. Duplicação restrita a testes, sem justificar refatoração extensa nesta finalização.

Não foram identificados erros críticos nas verificações iniciais executadas. Resultados finais, evidências e limites serão registrados em `etapa5-relatorio.md`.
