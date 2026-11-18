import { migrarDados, migrarRegistro } from './migracao.js';
import { criarDadosDemo, PERFIS } from './data/demo-data.js';

const versao = 2;
export const CHAVE_DADOS = 'condoconnect.demo.v1';
const prefixoOperacao = CHAVE_DADOS + '.operacao.';
const modelo = criarDadosDemo();
const origens = new WeakMap();

function tipoCompativel(valor, exemplo) {
  if (exemplo === null) return valor === null;
  return typeof valor === typeof exemplo && valor !== null;
}

function colecaoValida(registros, exemplos) {
  if (!Array.isArray(registros)) return false;
  const ids = new Set();
  const exemplo = exemplos[0];
  for (const registro of registros) {
    if (!registro || typeof registro.id !== 'string' || !registro.id || ids.has(registro.id)) {
      return false;
    }
    ids.add(registro.id);
    for (const campo of Object.keys(exemplo ?? {})) {
      if (campo === 'historico') {
        if (!Array.isArray(registro[campo])) return false;
      } else if (Array.isArray(exemplo[campo])) {
        if (!Array.isArray(registro[campo]) ||
            !registro[campo].every(id => typeof id === 'string')) return false;
      } else if (exemplo[campo] === null) {
        if (registro[campo] !== null && typeof registro[campo] !== 'string') return false;
      } else if (!exemplos.some(exemplo => tipoCompativel(registro[campo], exemplo[campo]))) {
        return false;
      }
    }
  }
  return true;
}

function estruturaValida(dados) {
  return dados && Object.entries(modelo).every(([chave, exemplos]) =>
    colecaoValida(dados[chave], exemplos));
}

function vinculosValidos(dados) {
  const unidades = new Set(dados.unidades.map(unidade => unidade.id));
  const torres = new Set(dados.unidades.map(unidade => unidade.torre));
  const usuarios = new Set(dados.usuarios.map(usuario => usuario.id));
  const moradores = new Set();
  for (const usuario of dados.usuarios) {
    if (!Object.hasOwn(PERFIS, usuario.perfil)) return false;
    if (usuario.perfil === 'morador') {
      if (!unidades.has(usuario.unidadeId)) return false;
      moradores.add(usuario.id);
    } else if (usuario.unidadeId !== null) {
      return false;
    }
  }

  const espacos = new Set(dados.espacos.map(espaco => espaco.id));
  const conversas = new Map(dados.conversas.map(conversa =>
    [conversa.id, conversa.participanteIds]));

  return dados.encomendas.every(item => moradores.has(item.moradorId) &&
    (item.retiradoPorId === null || usuarios.has(item.retiradoPorId))) &&
    dados.solicitacoes.every(item => moradores.has(item.moradorId)) &&
    dados.reservas.every(item => moradores.has(item.moradorId) &&
      espacos.has(item.espacoId) && Date.parse(item.inicio) < Date.parse(item.fim)) &&
    dados.conversas.every(item => item.participanteIds.every(id => moradores.has(id))) &&
    dados.mensagens.every(item => conversas.get(item.conversaId)?.includes(item.autorId)) &&
    dados.comunicados.every(item => usuarios.has(item.autorId) &&
      (item.torre === null || torres.has(item.torre)));
}

function dadosValidos(dados) {
  return estruturaValida(dados) && vinculosValidos(dados) && datasValidas(dados) && estadosValidos(dados);
}

function dataValida(valor) {
  if (typeof valor !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(valor) ||
      !Number.isFinite(Date.parse(valor))) return false;
  const dia = valor.slice(0, 10);
  return new Date(dia + 'T00:00:00Z').toISOString().slice(0, 10) === dia;
}

function datasValidas(dados) {
  return dados.encomendas.every(item => dataValida(item.recebidaEm) &&
      (item.retiradaEm === null || dataValida(item.retiradaEm))) &&
    dados.reservas.every(item => dataValida(item.inicio) && dataValida(item.fim)) &&
    dados.mensagens.every(item => dataValida(item.enviadaEm)) &&
    dados.comunicados.every(item => dataValida(item.publicadoEm));
}

function lerEnvelope(bruto) {
  if (bruto === null) return null;
  try {
    const registro = JSON.parse(bruto);
    if ([1, versao].includes(registro?.versao) && dadosValidos(migrarDados(registro.dados))) return registro.dados;
  } catch {
    // JSON ilegível é tratado como uma base incompatível.
  }
  return null;
}

function lerBase() {
  const bruto = localStorage.getItem(CHAVE_DADOS);
  const dados = lerEnvelope(bruto);
  if (dados) return dados;

  if (bruto !== null) throw new Error('Base inválida preservada. Restaure os dados para continuar.');
  const iniciais = criarDadosDemo();
  localStorage.setItem(CHAVE_DADOS, JSON.stringify({ versao, dados: iniciais }));
  return iniciais;
}

function lerOperacao(chave) {
  try {
    const operacao = JSON.parse(localStorage.getItem(chave));
    if (Number.isSafeInteger(operacao?.ordem) && operacao.ordem > 0 &&
        (operacao.tipo === 'restaurar' ||
          (operacao.tipo === 'editar' && Array.isArray(operacao.alteracoes)))) {
      if (operacao.tipo === 'editar') operacao.alteracoes = operacao.alteracoes.map(a => ({ ...a, antes: migrarRegistro(a.colecao, a.antes), depois: migrarRegistro(a.colecao, a.depois) }));
      return { ...operacao, chave };
    }
  } catch {
    // Uma entrada ilegível não impede a leitura das outras.
  }
  return null;
}

function aplicarAlteracoes(dados, alteracoes) {
  const resultado = { ...dados };
  for (const alteracao of alteracoes) {
    if (!alteracao || !Object.hasOwn(modelo, alteracao.colecao) ||
        typeof alteracao.id !== 'string' ||
        (alteracao.depois !== null && alteracao.depois?.id !== alteracao.id)) return null;

    const { colecao, id, antes, depois } = alteracao;
    const registros = resultado[colecao];
    const indice = registros.findIndex(registro => registro.id === id);
    const atual = registros[indice] ?? null;
    if (JSON.stringify(atual) === JSON.stringify(depois)) continue;
    if (JSON.stringify(atual) !== JSON.stringify(antes)) return null;

    const atualizados = registros.slice();
    if (depois === null) {
      atualizados.splice(indice, 1);
    } else if (indice === -1) {
      atualizados.push(depois);
    } else {
      atualizados[indice] = depois;
    }
    resultado[colecao] = atualizados;
  }
  return dadosValidos(resultado) ? resultado : null;
}

function lerEstado() {
  const base = lerBase();
  // Abas com a mesma ordem observada convergem pelo tipo e pela chave única.
  const operacoes = Object.keys(localStorage)
    .filter(chave => chave.startsWith(prefixoOperacao))
    .map(lerOperacao)
    .filter(Boolean)
    .sort((a, b) => a.ordem - b.ordem ||
      Number(a.tipo === 'restaurar') - Number(b.tipo === 'restaurar') ||
      (a.chave < b.chave ? -1 : 1));

  const restauracao = operacoes.findLastIndex(operacao => operacao.tipo === 'restaurar');
  const reinicio = operacoes[restauracao]?.chave ?? null;
  let dados = reinicio ? criarDadosDemo() : base;
  const conflitos = [];

  for (const operacao of operacoes.slice(restauracao + 1)) {
    const atualizados = operacao.reinicio === reinicio
      ? aplicarAlteracoes(dados, operacao.alteracoes) : null;
    if (atualizados) dados = atualizados;
    else conflitos.push(operacao.chave);
  }
  return { dados, reinicio, conflitos, ordem: operacoes.at(-1)?.ordem ?? 0 };
}

function registrarOrigem(dados, reinicio) {
  origens.set(dados, { dados: structuredClone(dados), reinicio });
}

// Consultas são síncronas e recebem uma cópia independente dos dados.
export function carregarDados() {
  try {
    const { dados, reinicio, conflitos } = lerEstado();
    registrarOrigem(dados, reinicio);
    return { dados, persistido: true, conflitos };
  } catch {
    return { dados: criarDadosDemo(), persistido: false, conflitos: [] };
  }
}

function compararRegistros(base, dados) {
  const alteracoes = [];
  for (const colecao of Object.keys(modelo)) {
    const anteriores = new Map(base[colecao].map(registro => [registro.id, registro]));
    const novos = new Map(dados[colecao].map(registro => [registro.id, registro]));
    for (const id of new Set([...anteriores.keys(), ...novos.keys()])) {
      const antes = anteriores.get(id) ?? null;
      const depois = novos.get(id) ?? null;
      if (JSON.stringify(antes) !== JSON.stringify(depois)) {
        alteracoes.push({ colecao, id, antes, depois });
      }
    }
  }
  return alteracoes;
}

function gravarOperacao(operacao) {
  const chave = prefixoOperacao + crypto.randomUUID();
  localStorage.setItem(chave, JSON.stringify(operacao));
  return chave;
}

export function salvarDados(dados) {
  const origem = origens.get(dados);
  if (!origem) return false;

  try {
    const editados = JSON.parse(JSON.stringify(dados));
    if (!dadosValidos(editados)) return false;

    const atual = lerEstado();
    if (origem.reinicio !== atual.reinicio) return false;
    const alteracoes = compararRegistros(origem.dados, editados);
    if (!alteracoes.length) return true;
    if (!aplicarAlteracoes(atual.dados, alteracoes)) return false;

    // Uma edição grava somente sua própria chave no LocalStorage.
    gravarOperacao({
      tipo: 'editar', ordem: atual.ordem + 1, reinicio: atual.reinicio, alteracoes,
    });
    registrarOrigem(dados, atual.reinicio);
    avisarAlteracao();
    return true;
  } catch {
    return false;
  }
}

export function restaurarDados() {
  const dados = criarDadosDemo();
  try {
    let ordem = 0;
    try { ordem = lerEstado().ordem; } catch {
      // Restauração explicitamente confirmada permite substituir a base inválida.
      localStorage.setItem(CHAVE_DADOS, JSON.stringify({ versao, dados }));
      for (const chave of Object.keys(localStorage).filter(k => k.startsWith(prefixoOperacao))) localStorage.removeItem(chave);
    }
    const reinicio = gravarOperacao({ tipo: 'restaurar', ordem: ordem + 1 });
    registrarOrigem(dados, reinicio);
    avisarAlteracao();
    return { dados, persistido: true };
  } catch {
    return { dados, persistido: false };
  }
}

const ouvintes = new Set();
function avisarAlteracao() { for (const fn of ouvintes) fn(); }
export function observarDados(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }
if (typeof window !== 'undefined') window.addEventListener('storage', e => {
  if (e.key === null || e.key === CHAVE_DADOS || e.key?.startsWith(prefixoOperacao)) avisarAlteracao();
});

function estadosValidos(dados) {
  const usuarios = new Set(dados.usuarios.map(u=>u.id));
  const pares = new Set();
  for(const c of dados.conversas) {
    if(c.participanteIds.length!==2 || new Set(c.participanteIds).size!==2) return false;
    const par=[...c.participanteIds].sort().join(':'); if(pares.has(par))return false;pares.add(par);
  }
  if(!dados.encomendas.every(e=>['Aguardando retirada','Entregue'].includes(e.status) && (e.unidadeId===null || dados.usuarios.find(u=>u.id===e.moradorId)?.unidadeId===e.unidadeId)))return false;
  if(!dados.solicitacoes.every(s=>['Aberto','Em análise','Em andamento','Concluído'].includes(s.status) && dataValida(s.criadaEm) && s.historico.every(h=>h && dataValida(h.em) && usuarios.has(h.autorId) && typeof h.descricao==='string') && (s.imagem===null || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.imagem) && s.imagem.length<=140000)))return false;
  if(!dados.mensagens.every(m=>m.texto.trim() && m.texto.length<=2000 && m.lidaPorIds.every(id=>dados.conversas.find(c=>c.id===m.conversaId).participanteIds.includes(id))))return false;
  if(!dados.comunicados.every(c=>['moradores','portaria','administracao','geral'].includes(c.publico)))return false;
  const eventos = new Set();
  if(!dados.notificacoes.every(n=>{
    const chave=n.usuarioId+':'+n.evento;
    if(eventos.has(chave))return false;eventos.add(chave);
    return usuarios.has(n.usuarioId) && typeof n.lida==='boolean' && dataValida(n.criadaEm) && ['titulo','descricao','evento'].every(c=>typeof n[c]==='string') && /^(mensagens|encomendas|solicitacoes|reservas|comunicados)\.html\?[^\s]*$/.test(n.destino);
  }))return false;
  for(let i=0;i<dados.reservas.length;i++) {
    const a=dados.reservas[i];if(!['Confirmada','Cancelada'].includes(a.status))return false;
    if(a.status!=='Confirmada')continue;
    if(dados.reservas.slice(i+1).some(b=>b.status==='Confirmada' && b.espacoId===a.espacoId && Date.parse(a.inicio)<Date.parse(b.fim) && Date.parse(a.fim)>Date.parse(b.inicio)))return false;
  }
  return true;
}
