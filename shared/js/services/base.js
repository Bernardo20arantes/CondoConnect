import { carregarDados, salvarDados } from '../storage.js';
import { obterUsuarioDaSessao } from '../session.js';
export function exigir(...perfis) {
  const usuario = obterUsuarioDaSessao();
  if (!usuario || !perfis.includes(usuario.perfil)) throw new Error('Este perfil não pode executar esta operação.');
  return usuario;
}
export function texto(valor, nome, limite = 2000) {
  if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > limite) throw new Error(nome + ': preencha entre 1 e ' + limite + ' caracteres.');
  return valor.trim();
}
export function opcao(valor, opcoes, nome) {
  if (!opcoes.includes(valor)) throw new Error(nome + ' inválido.');
  return valor;
}
export const idNovo = prefixo => prefixo + '-' + crypto.randomUUID();
export function alterar(perfis, acao) {
  const usuario = exigir(...perfis);
  const estado = carregarDados();
  if (!estado.persistido) throw new Error('Armazenamento indisponível ou base inválida. Nenhuma alteração foi salva.');
  const resultado = acao(estado.dados, usuario);
  if (!salvarDados(estado.dados)) throw new Error('Não foi possível salvar. Confira o armazenamento ou uma alteração em outra aba e tente novamente.');
  return resultado;
}
export function notificar(dados, usuarioId, evento, titulo, descricao, destino) {
  if (dados.notificacoes.some(n => n.usuarioId === usuarioId && n.evento === evento)) return;
  dados.notificacoes.push({ id: idNovo('NOT'), usuarioId, evento, titulo, descricao, destino, criadaEm: new Date().toISOString(), lida: false });
}
export const hoje = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export function diaValido(dia) {
  return typeof dia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dia) && Number.isFinite(Date.parse(dia + 'T12:00:00Z')) && new Date(dia + 'T12:00:00Z').toISOString().slice(0,10) === dia;
}
export function instanteLocal(valor) {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(valor) || !diaValido(valor.slice(0,10))) throw new Error('Data e horário inválidos.');
  return valor + ':00-03:00';
}
