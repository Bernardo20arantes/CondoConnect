import { carregarDados } from '../storage.js';
import { exigir, alterar, idNovo, notificar, diaValido, hoje } from './base.js';
export const REGRAS_ESPACOS = {
  'ESP-001': { faixas: [[10,13],[14,17],[18,21]], descricao: 'Até 40 pessoas. Entregue o espaço limpo ao fim da reserva.' },
  'ESP-002': { faixas: [[10,13],[14,17],[18,21]], descricao: 'Até 12 pessoas. Entregue o espaço limpo ao fim da reserva.' },
  'ESP-003': { faixas: Array.from({length:12},(_,i) => [i+9,i+10]), descricao: 'Uso por hora, das 9h às 21h. Respeite o período reservado.' },
};
export function listarEspacos() { exigir('morador','administrador'); return carregarDados().dados.espacos; }
export function listarReservas({ espacoId, moradorId } = {}) {
  const u = exigir('morador','administrador');
  return carregarDados().dados.reservas.filter(r => (!espacoId || r.espacoId === espacoId) && (!moradorId || r.moradorId === moradorId)).map(r => u.perfil === 'morador' && r.moradorId !== u.id ? { id: r.id, espacoId: r.espacoId, inicio: r.inicio, fim: r.fim, status: r.status } : r);
}
export function criarReserva({ espacoId, dia, inicio, fim }) {
  return alterar(['morador'], (dados,u) => {
    if (!dados.espacos.some(e => e.id === espacoId)) throw new Error('Espaço inválido.');
    if (!diaValido(dia) || dia < hoje()) throw new Error('Selecione uma data válida a partir de hoje.');
    if (!REGRAS_ESPACOS[espacoId]?.faixas.some(([a,b]) => a === inicio && b === fim)) throw new Error('Horário fora das regras do espaço.');
    const instante = h => dia + 'T' + String(h).padStart(2,'0') + ':00:00-03:00';
    const a = instante(inicio), b = instante(fim);
    if (Date.parse(a) <= Date.now()) throw new Error('O horário da reserva já passou.');
    if (dados.reservas.some(r => r.status === 'Confirmada' && r.espacoId === espacoId && Date.parse(r.inicio) < Date.parse(b) && Date.parse(r.fim) > Date.parse(a))) throw new Error('Horário ocupado. Selecione outro período.');
    const r = { id: idNovo('RES'), espacoId, moradorId: u.id, inicio: a, fim: b, status: 'Confirmada' }; dados.reservas.push(r);
    notificar(dados,u.id,r.id + ':confirmada','Reserva confirmada','Seu horário foi reservado.','reservas.html?estado=confirmada&id=' + r.id); return r;
  });
}
export function cancelarReserva(id) {
  return alterar(['morador','administrador'], (dados,u) => {
    const r = dados.reservas.find(r => r.id === id);
    if (!r || (u.perfil !== 'administrador' && r.moradorId !== u.id)) throw new Error('Reserva não autorizada.');
    if (r.status !== 'Confirmada' || Date.parse(r.inicio) <= Date.now()) throw new Error('Somente reservas confirmadas futuras podem ser canceladas.');
    r.status = 'Cancelada'; r.canceladaEm = new Date().toISOString(); r.canceladaPorId = u.id;
    notificar(dados,r.moradorId,r.id + ':cancelada','Reserva cancelada','O horário foi liberado.','reservas.html?estado=minhas'); return r;
  });
}
