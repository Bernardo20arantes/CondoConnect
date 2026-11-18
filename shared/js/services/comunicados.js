import { carregarDados } from '../storage.js';
import { exigir, alterar, texto, opcao, idNovo, notificar } from './base.js';
export function podeVerComunicado(c,u,dados) {
  if (u.perfil === 'administrador') return true;
  if (c.publico !== 'geral' && c.publico !== (u.perfil === 'morador' ? 'moradores' : 'portaria')) return false;
  return u.perfil !== 'morador' || !c.torre || dados.unidades.find(t => t.id === u.unidadeId)?.torre === c.torre;
}
export function listarComunicados({ tipo, torre } = {}) {
  const u = exigir('morador','porteiro','administrador'); const { dados } = carregarDados();
  return dados.comunicados.filter(c => podeVerComunicado(c,u,dados) && (!tipo || c.tipo === tipo) && (torre === undefined || c.torre === null || c.torre === torre)).sort((a,b) => Date.parse(b.publicadoEm) - Date.parse(a.publicadoEm));
}
export function publicarComunicado(v) {
  return alterar(['administrador'], (dados,u) => {
    const publico = opcao(v.publico ?? 'moradores',['moradores','portaria','administracao','geral'],'Público');
    const torre = v.torre || null;
    if (torre && !dados.unidades.some(t => t.torre === torre)) throw new Error('Torre inválida.');
    const c = { id: idNovo('COM'), titulo: texto(v.titulo,'Título',160), mensagem: texto(v.mensagem,'Mensagem',5000), tipo: opcao(v.tipo ?? 'oficial',['oficial','operacional'],'Categoria'), publico, torre, publicadoEm: new Date().toISOString(), autorId: u.id };
    dados.comunicados.push(c);
    for (const usuario of dados.usuarios.filter(p => podeVerComunicado(c,p,dados))) notificar(dados,usuario.id,c.id,'Novo comunicado',c.titulo,'comunicados.html?id=' + c.id); return c;
  });
}
