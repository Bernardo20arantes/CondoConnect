import { hoje } from '../../shared/js/services/base.js';
import { montarPagina } from './layout.js';
import { registrarEncomenda, confirmarRetirada, listarEncomendas } from '../../shared/js/services/encomendas.js';
import { moradores } from './moradores.js';
import { comunicados } from './comunicados.js';
import { contexto } from './contexto.js';
import {
  elemento, texto, cabecalho, card, status, tabela, campo, filtros, formulario, link,
  detalhe, acoes, procurar, indicadores, secao, data, dataCurta, unidadeCurta, DIA_DEMO, atualizarComDados, exibir,
} from './ui.js';

const sessao = montarPagina('porteiro');
if (sessao) {
  const pagina = location.pathname.split('/').pop();
  const renderizar = {
    'dashboard.html': dashboard,
    'encomendas.html': encomendas,
    'moradores.html': () => moradores(false),
    'comunicados.html': () => comunicados(false),
  };
  exibir(...renderizar[pagina]());
  atualizarComDados(renderizar[pagina]);
}

function linhasEncomendas(registros) {
  const { usuario, unidadeDoMorador } = contexto();
  return registros.map(e => [
    e.id, unidadeCurta(unidadeDoMorador(e.moradorId)), usuario(e.moradorId)?.nome,
    dataCurta(e.recebidaEm), status(e.status),
    link(e.status === 'Aguardando retirada' ? 'Confirmar retirada' : 'Ver detalhes',
      './encomendas.html?estado=' + (e.status === 'Aguardando retirada' ? 'confirmar' : 'detalhes') + '&id=' + e.id),
  ]);
}

function dashboard() {
  const registros = listarEncomendas();
  const pendentes = registros.filter(e => e.status === 'Aguardando retirada');
  return [
    cabecalho('Dashboard da portaria', 'Acompanhe as encomendas e confirme as retiradas.',
      elemento('div', { class: 'heading-action' }, [
        link('Registrar encomenda', './encomendas.html?estado=registrar', true),
        texto(data(new Date().toISOString()), 'demo-date'),
      ])),
    indicadores([
      ['Aguardando retirada', pendentes.length, 'Encomendas na portaria', 'warning', 'encomenda'],
      ['Recebidas hoje', registros.filter(e => diaLocal(e.recebidaEm) === DIA_DEMO).length, 'Recebidas na data atual', 'info', 'recebida'],
      ['Retiradas hoje', registros.filter(e => e.retiradaEm && diaLocal(e.retiradaEm) === DIA_DEMO).length, 'Retiradas na data atual', 'success', 'retirada'],
    ]),
    secao('Retiradas pendentes', 'Confira a unidade e o destinatário antes de confirmar.',
      link('Ver encomendas', './encomendas.html')),
    tabela(['Código', 'Unidade', 'Morador', 'Recebida em', 'Status', 'Ação'],
      linhasEncomendas(pendentes), 'Retiradas pendentes'),
    texto('Demonstração local · ' + DIA_DEMO, 'demo-note'),
  ];
}

function encomendas() {
  const params = new URLSearchParams(location.search);
  const estado = params.get('estado');
  const registros = listarEncomendas();
  if (estado === 'registrar') {
    const exemplo = registros.find(e => e.id === 'ENC-024') ?? registros[0];
    if (!exemplo) return [
      cabecalho('Registrar encomenda', 'A base atual não possui uma encomenda de referência para esta prévia.'),
      link('Voltar às encomendas', './encomendas.html'),
    ];
    return registrar(exemplo);
  }
  if (['confirmar', 'registrada', 'retirada', 'detalhes'].includes(estado)) {
    const encomenda = registros.find(e => e.id === (params.get('id') ?? 'ENC-024'));
    if (!encomenda) {
      return [cabecalho('Encomenda não encontrada', 'Confira o identificador solicitado.'), link('Voltar às encomendas', './encomendas.html')];
    }
    return detalheEncomenda(encomenda, estado);
  }
  return [
    cabecalho('Encomendas', 'Consulte as entregas recebidas e confirme as retiradas.',
      link('Registrar encomenda', './encomendas.html?estado=registrar', true)),
    filtros([
      campo('Buscar encomenda', 'busca', { tipo: 'search', placeholder: 'Nome, unidade ou código' }),
      campo('Status', 'status', { itens: [['', 'Todos'], 'Aguardando retirada', 'Entregue'] }),
    ], ({ busca, status: situacao }) => {
      const { usuario, unidadeDoMorador } = contexto();
      const visiveis = registros.filter(e => (!situacao || e.status === situacao) &&
        procurar(e.id + ' ' + usuario(e.moradorId)?.nome + ' ' + unidadeCurta(unidadeDoMorador(e.moradorId)), busca));
      return elemento('div', {}, [
        tabela(['Código', 'Unidade', 'Morador', 'Recebida em', 'Status', 'Ação'],
          linhasEncomendas(visiveis), 'Encomendas da portaria'),
        texto(visiveis.length + ' encomendas', 'result-count'),
      ]);
    }),
  ];
}

function registrar(exemplo) {
  const { dados, usuario } = contexto();
  const morador = usuario(exemplo.moradorId);
  const unidade = campo('Unidade', 'unidadeId', {
    itens: dados.unidades.map(u => [u.id, unidadeCurta(u)]), valor: morador.unidadeId, required: true,
  });
  const destinatario = campo('Morador', 'moradorId', { itens: [], required: true });
  const atualizarMoradores = () => {
    const select = destinatario.querySelector('select');
    select.replaceChildren(...dados.usuarios.filter(u => u.perfil === 'morador' &&
      u.unidadeId === unidade.querySelector('select').value)
      .map(u => elemento('option', { value: u.id }, u.nome)));
  };
  unidade.addEventListener('change', atualizarMoradores);
  atualizarMoradores();
  const form = formulario([
    elemento('div', { class: 'parcel-form-grid' }, [
      unidade, destinatario,
      campo('Transportadora (opcional)', 'transportadora', { valor: exemplo.transportadora }),
      campo('Recebida em', 'recebidaEm', { tipo: 'datetime-local', required: true, valor: hoje() + 'T' + new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour:'2-digit', minute:'2-digit' }).format(new Date()) }),
    ]),
    campo('Observação (opcional)', 'observacao', { valor: exemplo.observacao }),
    texto('A moradora receberá um aviso quando a encomenda estiver disponível para retirada.', 'feedback'),
  ], valores => {
    const registro = registrarEncomenda(valores);
    location.assign('./encomendas.html?estado=registrada&id=' + registro.id);
  }, 'Registrar encomenda', './encomendas.html', true);
  form.classList.add('parcel-form');
  return [
    cabecalho('Registrar encomenda', 'Confira a unidade e o destinatário antes de registrar a entrega.', null,
      { nome: 'Encomendas', href: './encomendas.html' }), form,
  ];
}

function detalheEncomenda(encomenda, estado) {
  const { dados, usuario, unidadeDoMorador } = contexto();
  const retirada = encomenda.status === 'Entregue';
  if ((estado === 'retirada' && !retirada) || (['confirmar', 'registrada'].includes(estado) && retirada)) estado = 'detalhes';
  const morador = usuario(encomenda.moradorId);
  const titulo = {
    confirmar: 'Confirmar retirada', registrada: 'Encomenda registrada',
    retirada: 'Retirada confirmada', detalhes: 'Detalhes da encomenda',
  }[estado];
  const informacoes = elemento('dl', { class: 'detail-grid detail-divider' }, [
    detalhe('Moradora', morador?.nome),
    detalhe('Unidade', unidadeCurta(unidadeDoMorador(encomenda.moradorId))),
    detalhe(retirada ? 'Retirada confirmada em' : 'Recebida em',
      dataCurta(retirada ? encomenda.retiradaEm : encomenda.recebidaEm)),
    ...(retirada ? [detalhe('Recebida em', dataCurta(encomenda.recebidaEm))] : []),
    detalhe('Transportadora', encomenda.transportadora), detalhe('Descrição do pacote', encomenda.observacao),
    detalhe('Registrada por', usuario(encomenda.registradoPorId)?.nome ?? 'Registro fictício inicial'),
  ]);
  const conteudo = [
    elemento('h2', {}, 'Encomenda ' + encomenda.id),
    status(retirada ? 'Entregue' : encomenda.status), informacoes,
  ];
  if (estado === 'confirmar' && !retirada) {
    const unidadeId = morador.unidadeId;
    const retirado = campo('Retirado por', 'retiradoPorId', {
      itens: dados.usuarios.filter(u => u.unidadeId === unidadeId).map(u => [u.id, u.nome + ' · Ref. cadastral ' + u.id]),
      valor: morador.id, required: true,
    });
    const form = formulario([
      ...conteudo, retirado,
      texto('Após confirmar, a encomenda aparecerá como Entregue para a moradora.'),
      campo('Data e horário da retirada', 'retiradaEm', { tipo: 'datetime-local', required: true, valor: hoje() + 'T' + new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour:'2-digit', minute:'2-digit' }).format(new Date()) }),
    ], valores => {
      confirmarRetirada(encomenda.id, valores);
      location.assign('./encomendas.html?estado=retirada&id=' + encomenda.id);
    }, 'Confirmar retirada', './encomendas.html', true);
    form.classList.add('confirm-parcel');
    return [cabecalho(titulo, 'Confira se esta é a encomenda que será entregue à moradora.', null,
      { nome: 'Encomendas', href: './encomendas.html' }), form];
  }
  if (retirada) {
    conteudo.push(elemento('dl', {}, detalhe('Retirado por', usuario(encomenda.retiradoPorId ?? encomenda.moradorId)?.nome)));
  }
  conteudo.push(acoes(link('Ver encomendas', './encomendas.html')));
  const painel = card(...conteudo);
  painel.classList.add('parcel-result');
  return [
    cabecalho(titulo, estado === 'registrada' ? 'A ' + encomenda.id + ' está disponível para retirada na portaria.' :
      retirada ? 'A retirada da ' + encomenda.id + ' foi confirmada pela portaria.' : 'Consulte os dados da entrega.'),
    painel,
    texto(estado === 'detalhes' ? 'Dados fictícios da demonstração.' : 'Operação persistida neste navegador.', 'demo-note'),
  ];
}

function focarTitulo() {
  const titulo = document.querySelector('h1');
  titulo.tabIndex = -1;
  titulo.focus();
}


function diaLocal(valor) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date(valor)); }
