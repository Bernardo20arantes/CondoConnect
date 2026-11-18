export function formatarUnidade(unidade) {
  return unidade ? 'Torre ' + unidade.torre + ' — Apartamento ' + unidade.apartamento
    : 'Unidade indisponível';
}

export function mostrarFeedback(mensagem) {
  document.querySelector('[data-feedback]').textContent = mensagem;
}

export function mostrarEstadoDosDados({ persistido, conflitos }) {
  if (!persistido) {
    mostrarFeedback('Armazenamento indisponível ou base inválida. Exibindo dados iniciais apenas para consulta. Use Restaurar dados da demonstração para recuperar uma base inválida.');
  } else if (conflitos.length) {
    mostrarFeedback('Há alterações em conflito que não foram aplicadas. Confira os dados exibidos antes de editar.');
  }
}
