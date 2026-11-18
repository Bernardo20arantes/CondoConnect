import { carregarDados } from '../storage.js';
import { exigir, alterar, idNovo, texto, notificar, instanteLocal } from './base.js';
export function listarEncomendas({ moradorId, status } = {}) {
  const usuario = exigir('morador', 'porteiro', 'administrador');
  return carregarDados().dados.encomendas.filter(e => (usuario.perfil !== 'morador' || e.moradorId === usuario.id) && (moradorId === undefined || e.moradorId === moradorId) && (status === undefined || e.status === status));
}
export function registrarEncomenda(valores) {
  return alterar(['porteiro'], (dados, usuario) => {
    const morador = dados.usuarios.find(u => u.id === valores.moradorId && u.perfil === 'morador');
    if (!morador || morador.unidadeId !== valores.unidadeId) throw new Error('Destinatário e unidade não correspondem.');
    const recebidaEm = instanteLocal(valores.recebidaEm);
    if (Date.parse(recebidaEm) > Date.now() + 60000) throw new Error('O recebimento não pode estar no futuro.');
    const encomenda = { id: idNovo('ENC'), moradorId: morador.id, unidadeId: morador.unidadeId, transportadora: valores.transportadora?.trim().slice(0,150) || null, observacao: valores.observacao?.trim().slice(0,1000) || null, recebidaEm, registradoPorId: usuario.id, status: 'Aguardando retirada', retiradaEm: null, retiradoPorId: null, retiradoPorNome: null };
    dados.encomendas.push(encomenda);
    notificar(dados, morador.id, encomenda.id + ':recebida', 'Encomenda recebida', 'Seu pacote está disponível na portaria.', 'encomendas.html?id=' + encomenda.id);
    return encomenda;
  });
}
export function confirmarRetirada(id, valores) {
  return alterar(['porteiro'], dados => {
    const e = dados.encomendas.find(e => e.id === id);
    if (!e || e.status !== 'Aguardando retirada') throw new Error('Encomenda indisponível ou já entregue.');
    const pessoa = dados.usuarios.find(u => u.id === valores.retiradoPorId && u.unidadeId === dados.usuarios.find(u => u.id === e.moradorId)?.unidadeId);
    if (!pessoa) throw new Error('Identifique quem retirou a encomenda.');
    e.retiradoPorId = pessoa.id; e.retiradoPorNome = texto(pessoa.nome, 'Retirado por', 150);
    e.retiradaEm = valores.retiradaEm ? instanteLocal(valores.retiradaEm) : new Date().toISOString();
    if (Date.parse(e.retiradaEm) < Date.parse(e.recebidaEm) || Date.parse(e.retiradaEm) > Date.now() + 60000) throw new Error('Confira a data da retirada.');
    e.status = 'Entregue';
    notificar(dados, e.moradorId, e.id + ':retirada', 'Encomenda retirada', 'A portaria confirmou a entrega do pacote.', 'encomendas.html?id=' + e.id);
    return e;
  });
}
