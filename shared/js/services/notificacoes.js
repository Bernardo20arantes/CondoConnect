import { carregarDados } from '../storage.js';
import { exigir, alterar } from './base.js';
export function listarNotificacoes() {
  const u = exigir('morador','porteiro','administrador');
  return carregarDados().dados.notificacoes.filter(n => n.usuarioId === u.id).sort((a,b) => Date.parse(b.criadaEm) - Date.parse(a.criadaEm));
}
export function marcarNotificacaoLida(id) {
  return alterar(['morador','porteiro','administrador'], (dados,u) => {
    const n = dados.notificacoes.find(n => n.id === id && n.usuarioId === u.id);
    if (!n) throw new Error('Notificação não autorizada.'); n.lida = true; return n;
  });
}
