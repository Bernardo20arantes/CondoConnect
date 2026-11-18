import { carregarDados } from '../storage.js';
import { exigir, alterar, idNovo, texto, opcao, notificar } from './base.js';
export const ESTADOS = ['Aberto','Em análise','Em andamento','Concluído'];
export function listarSolicitacoes({ moradorId, status } = {}) {
  const u = exigir('morador','administrador');
  return carregarDados().dados.solicitacoes.filter(s => (u.perfil !== 'morador' || s.moradorId === u.id) && (!moradorId || s.moradorId === moradorId) && (!status || s.status === status));
}
export function criarSolicitacao(v) {
  return alterar(['morador'], (dados,u) => {
    const imagem = v.imagem ?? null;
    if (imagem !== null && (typeof imagem !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(imagem) || imagem.length > 140000)) throw new Error('Imagem inválida. Use PNG, JPEG ou WebP de até 100 KB.');
    const s = { id: idNovo('SOL'), moradorId: u.id, titulo: texto(v.titulo,'Título',150), descricao: texto(v.descricao,'Descrição',3000), local: texto(v.local,'Local',150), categoria: opcao(v.tipo,['Vazamento','Elétrica','Limpeza','Outros'],'Tipo'), prioridade: opcao(v.prioridade,['Baixa','Normal','Alta'],'Prioridade'), criadaEm: new Date().toISOString(), status: 'Aberto', responsabilidade: 'A confirmar', responsavel: '', encaminhamento: '', imagem, historico: [] };
    if (v.especifico) s.local += ' · ' + texto(v.especifico,'Local específico',150);
    s.historico.push({ status: 'Aberto', em: s.criadaEm, autorId: u.id, descricao: 'Solicitação registrada.' });
    dados.solicitacoes.push(s);
    notificar(dados,u.id,s.id + ':aberta','Solicitação recebida',s.titulo,'solicitacoes.html?id=' + s.id); return s;
  });
}
export function atualizarSolicitacao(id,v) {
  return alterar(['administrador'], (dados,u) => {
    const s = dados.solicitacoes.find(s => s.id === id);
    if (!s) throw new Error('Solicitação não encontrada.');
    const destino = opcao(v.status,ESTADOS,'Status');
    const origem = ESTADOS.indexOf(s.status), proximo = ESTADOS.indexOf(destino);
    if (proximo < origem || proximo > origem + 1) throw new Error('Avance uma etapa por vez: Aberto → Em análise → Em andamento → Concluído.');
    if (s.status === 'Concluído') throw new Error('Solicitação concluída não pode ser alterada.');
    const responsabilidade = opcao(v.responsabilidade,['A confirmar','Condomínio','Morador'],'Responsabilidade');
    const responsavel = opcao(v.responsavel,['Equipe de manutenção do condomínio','Profissional externo','Administração'],'Responsável');
    const encaminhamento = texto(v.encaminhamento,'Informações do atendimento',2000);
    if (proximo >= 2 && responsabilidade === 'A confirmar') throw new Error('Defina a responsabilidade antes de iniciar o atendimento.');
    Object.assign(s,{ status: destino, responsabilidade, responsavel, encaminhamento });
    s.historico.push({ status: destino, em: new Date().toISOString(), autorId: u.id, descricao: responsabilidade + ' · ' + responsavel + ' · ' + encaminhamento });
    notificar(dados,s.moradorId,s.id + ':' + s.historico.length,destino === 'Concluído' ? 'Atendimento concluído' : 'Solicitação atualizada',destino + ': ' + s.titulo,'solicitacoes.html?id=' + s.id); return s;
  });
}
