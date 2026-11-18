import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { criarDadosDemo } from '../shared/js/data/demo-data.js';
import {
  CHAVE_DADOS, carregarDados, restaurarDados, salvarDados,
} from '../shared/js/storage.js';

const prefixo = CHAVE_DADOS + '.operacao.';
const armazenamentoOriginal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

function aba(dados = {}) {
  const armazenamento = Object.assign(Object.create({
    getItem(chave) { return this[chave] ?? null; },
    setItem(chave, valor) { this[chave] = String(valor); },
  }), dados);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: armazenamento,
  });
  return armazenamento;
}

function operacoes(armazenamento) {
  return Object.fromEntries(Object.entries(armazenamento)
    .filter(([chave]) => chave.startsWith(prefixo)));
}

afterEach(() => {
  if (armazenamentoOriginal) {
    Object.defineProperty(globalThis, 'localStorage', armazenamentoOriginal);
  } else {
    delete globalThis.localStorage;
  }
});

test('rejeita datas inválidas sem alterar os dados persistidos', () => {
  const armazenamento = aba();
  carregarDados();
  const base = { ...armazenamento };
  for (const [colecao, campo] of [
    ['encomendas', 'recebidaEm'], ['encomendas', 'retiradaEm'],
    ['reservas', 'inicio'], ['reservas', 'fim'],
    ['mensagens', 'enviadaEm'], ['comunicados', 'publicadoEm'],
  ]) {
    for (const valor of ['data-invalida', '', '2026-02-30T10:00:00-03:00', '2026-11-14T25:00:00-03:00']) {
      const { dados } = carregarDados();
      dados[colecao][0][campo] = valor;
      assert.equal(salvarDados(dados), false, colecao + '.' + campo + ' = ' + valor);
      assert.deepEqual({ ...armazenamento }, base);
    }
  }
  const { dados } = carregarDados();
  dados.encomendas[0].recebidaEm = '2028-02-29T13:25:00.000Z';
  assert.equal(salvarDados(dados), true);
  assert.equal(carregarDados().dados.encomendas[0].recebidaEm, '2028-02-29T13:25:00.000Z');
});

test('preserva base inválida até restauração explícita e ignora edição inválida no histórico', () => {
  const legado = criarDadosDemo();
  legado.encomendas[0].recebidaEm = 'data-invalida';
  const armazenamento = aba({ [CHAVE_DADOS]: JSON.stringify({ versao: 1, dados: legado }) });
  assert.deepEqual(carregarDados().dados, criarDadosDemo());
  assert.equal(carregarDados().persistido, false);
  assert.equal(JSON.parse(armazenamento[CHAVE_DADOS]).dados.encomendas[0].recebidaEm, 'data-invalida');
  assert.equal(restaurarDados().persistido, true);
  const atual = criarDadosDemo().encomendas[0];
  const chave = prefixo + 'invalida';
  armazenamento.setItem(chave, JSON.stringify({
    tipo: 'editar', ordem: 2, reinicio: Object.keys(armazenamento).find(k => k.startsWith(prefixo)),
    alteracoes: [{ colecao: 'encomendas', id: atual.id, antes: atual, depois: { ...atual, recebidaEm: 'data-invalida' } }],
  }));
  const resultado = carregarDados();
  assert.deepEqual(resultado.dados, criarDadosDemo());
  assert.deepEqual(resultado.conflitos, [chave]);
});

test('preserva edições independentes mesmo quando as abas não enxergam a gravação uma da outra', () => {
  const portaria = aba();
  const { dados: primeira } = carregarDados();
  const base = { ...portaria };
  primeira.encomendas[0].observacao = 'Conferida';
  assert.equal(salvarDados(primeira), true);

  const administracao = aba(base);
  const { dados: segunda } = carregarDados();
  segunda.encomendas[1].observacao = 'Identificada';
  segunda.solicitacoes[0].titulo = 'Vazamento confirmado';
  assert.equal(salvarDados(segunda), true);

  Object.assign(administracao, operacoes(portaria));
  const { dados, conflitos } = carregarDados();
  assert.equal(dados.encomendas[0].observacao, 'Conferida');
  assert.equal(dados.encomendas[1].observacao, 'Identificada');
  assert.equal(dados.solicitacoes[0].titulo, 'Vazamento confirmado');
  assert.deepEqual(conflitos, []);
  assert.equal(administracao[CHAVE_DADOS], base[CHAVE_DADOS]);
  assert.equal(Object.keys(operacoes(administracao)).length, 2);
});

test('converge sobre um conflito no mesmo registro e descarta a operação inteira', () => {
  const primeira = aba();
  const { dados: um } = carregarDados();
  const base = { ...primeira };
  um.encomendas[0].observacao = 'Primeira aba';
  assert.equal(salvarDados(um), true);

  const segunda = aba(base);
  const { dados: dois } = carregarDados();
  dois.encomendas[0].observacao = 'Segunda aba';
  dois.solicitacoes[0].titulo = 'Triagem pela segunda aba';
  assert.equal(salvarDados(dois), true);

  Object.assign(segunda, operacoes(primeira));
  const resultado = carregarDados();
  Object.assign(primeira, operacoes(segunda));
  aba(primeira);
  assert.deepEqual(carregarDados(), resultado);
  assert.equal(resultado.conflitos.length, 1);
  assert.equal(resultado.dados.solicitacoes[0].titulo,
    resultado.dados.encomendas[0].observacao === 'Segunda aba'
      ? 'Triagem pela segunda aba' : 'Vazamento na cozinha');
});

test('rejeita alterações incompatíveis que já estão visíveis', () => {
  const armazenamento = aba();
  const { dados: atual } = carregarDados();
  const { dados: antigo } = carregarDados();
  atual.encomendas[0].observacao = 'Gravada';
  assert.equal(salvarDados(atual), true);
  antigo.encomendas[0].observacao = 'Cópia desatualizada';
  assert.equal(salvarDados(antigo), false);
  assert.equal(Object.keys(operacoes(armazenamento)).length, 1);
  assert.equal(carregarDados().dados.encomendas[0].observacao, 'Gravada');
});

test('preserva a base preexistente, rejeita dados inválidos e restaura sem reaplicar edições antigas', () => {
  const legado = criarDadosDemo();
  legado.encomendas[0].observacao = 'Base anterior';
  const armazenamento = aba({ [CHAVE_DADOS]: JSON.stringify({ versao: 1, dados: legado }) });
  const { dados: antigo } = carregarDados();
  assert.equal(antigo.encomendas[0].observacao, 'Base anterior');

  const { dados: invalido } = carregarDados();
  invalido.reservas[0].fim = invalido.reservas[0].inicio;
  assert.equal(salvarDados(invalido), false);
  const { dados: semUnidade } = carregarDados();
  semUnidade.usuarios[0].unidadeId = 'UNI-INEXISTENTE';
  assert.equal(salvarDados(semUnidade), false);
  assert.deepEqual(operacoes(armazenamento), {});

  antigo.encomendas[0].observacao = 'Alteração anterior à restauração';
  assert.equal(salvarDados(antigo), true);
  assert.deepEqual(restaurarDados(), { dados: criarDadosDemo(), persistido: true });
  assert.deepEqual(carregarDados().dados, criarDadosDemo());
  antigo.encomendas[0].observacao = 'Tentativa tardia';
  assert.equal(salvarDados(antigo), false);
});

test('continua consultável se uma gravação falhar', () => {
  const armazenamento = aba();
  const { dados } = carregarDados();
  Object.defineProperty(armazenamento, 'setItem', {
    value() { throw new Error('Quota'); },
  });
  dados.encomendas[0].observacao = 'Não gravada';
  assert.equal(salvarDados(dados), false);
  assert.equal(restaurarDados().persistido, false);
  assert.deepEqual(carregarDados().dados, criarDadosDemo());
});

test('uma edição de outra aba que ainda não viu a restauração não recupera a base antiga', () => {
  const primeira = aba();
  carregarDados();
  const base = { ...primeira };
  assert.equal(restaurarDados().persistido, true);

  const segunda = aba(base);
  const { dados } = carregarDados();
  dados.encomendas[0].observacao = 'Edição sem observar a restauração';
  assert.equal(salvarDados(dados), true);
  Object.assign(segunda, operacoes(primeira));

  const recuperados = carregarDados();
  assert.deepEqual(recuperados.dados, criarDadosDemo());
  assert.deepEqual(recuperados.conflitos, []);
});
