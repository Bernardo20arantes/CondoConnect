// Complementos determinísticos: nunca alteram IDs, textos ou estados legados.
export function migrarRegistro(colecao, item) {
  if (!item) return item;
  const defaults = {
    encomendas: { unidadeId: null, registradoPorId: null, retiradoPorNome: null },
    solicitacoes: { categoria: 'Outros', criadaEm: '2026-11-14T11:05:00-03:00', responsabilidade: 'A confirmar', responsavel: '', encaminhamento: '', imagem: null, historico: [] },
    mensagens: { lidaPorIds: [item.autorId] },
    comunicados: { publico: item.tipo === 'operacional' ? 'portaria' : 'moradores' },
  };
  return { ...defaults[colecao], ...item };
}
export function migrarDados(dados) {
  for (const colecao of ['encomendas', 'solicitacoes', 'mensagens', 'comunicados']) {
    if (Array.isArray(dados[colecao])) dados[colecao] = dados[colecao].map(item => migrarRegistro(colecao, item));
  }
  dados.notificacoes ??= [];
  return dados;
}
