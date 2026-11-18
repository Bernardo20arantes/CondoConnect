import { carregarDados } from '../storage.js';
import { exigir, alterar, idNovo, texto, notificar } from './base.js';
export function listarConversas(participanteId) {
  const u = exigir('morador');
  if (participanteId && participanteId !== u.id) return [];
  const { dados } = carregarDados();
  const atividade = c => dados.mensagens.reduce((ultima, m) => m.conversaId === c.id ? Math.max(ultima, Date.parse(m.enviadaEm)) : ultima, 0);
  return dados.conversas.filter(c => c.participanteIds.includes(u.id)).sort((a,b) => atividade(b) - atividade(a));
}
export function listarMensagens(conversaId, participanteId) {
  const u = exigir('morador');
  const { dados } = carregarDados();
  if ((participanteId && participanteId !== u.id) || !dados.conversas.find(c => c.id === conversaId)?.participanteIds.includes(u.id)) return [];
  return dados.mensagens.filter(m => m.conversaId === conversaId).sort((a,b) => Date.parse(a.enviadaEm) - Date.parse(b.enviadaEm));
}
export function criarConversa(outroId) {
  return alterar(['morador'], (dados,u) => {
    if (u.id === outroId || !dados.usuarios.some(p => p.id === outroId && p.perfil === 'morador')) throw new Error('Selecione outro morador cadastrado.');
    const existente = dados.conversas.find(c => c.participanteIds.length === 2 && c.participanteIds.includes(u.id) && c.participanteIds.includes(outroId));
    if (existente) return existente;
    const c = { id: idNovo('CNV'), participanteIds: [u.id,outroId] }; dados.conversas.push(c); return c;
  });
}
export function enviarMensagem(conversaId, conteudo) {
  return alterar(['morador'], (dados,u) => {
    const c = dados.conversas.find(c => c.id === conversaId && c.participanteIds.includes(u.id));
    if (!c) throw new Error('Conversa não autorizada.');
    const m = { id: idNovo('MSG'), conversaId, autorId: u.id, texto: texto(conteudo,'Mensagem',2000), enviadaEm: new Date().toISOString(), lidaPorIds: [u.id] };
    dados.mensagens.push(m);
    for (const id of c.participanteIds.filter(id => id !== u.id)) notificar(dados,id,m.id,'Nova mensagem',u.nome + ' enviou uma mensagem.','mensagens.html?id=' + conversaId);
    return m;
  });
}
export function marcarConversaLida(conversaId) {
  return alterar(['morador'], (dados,u) => {
    if (!dados.conversas.find(c => c.id === conversaId)?.participanteIds.includes(u.id)) throw new Error('Conversa não autorizada.');
    for (const m of dados.mensagens.filter(m => m.conversaId === conversaId)) if (!m.lidaPorIds.includes(u.id)) m.lidaPorIds.push(u.id);
    for (const n of dados.notificacoes.filter(n => n.usuarioId === u.id && n.destino === 'mensagens.html?id=' + conversaId)) n.lida = true;
  });
}
