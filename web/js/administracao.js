import { montarPagina } from './layout.js';
import { atualizarSolicitacao, ESTADOS, listarSolicitacoes } from '../../shared/js/services/solicitacoes.js';
import { listarReservas, listarEspacos } from '../../shared/js/services/reservas.js';
import { listarComunicados } from '../../shared/js/services/comunicados.js';
import { moradores } from './moradores.js';
import { comunicados } from './comunicados.js';
import { agenda } from './reservas.js';
import { contexto } from './contexto.js';
import {
  elemento, cabecalho, texto, link, card, tabela, campo, filtros, formulario, status,
  detalhe, procurar, indicadores, secao, unidadeCurta, DIA_DEMO, atualizarComDados, exibir, data, hora,
} from './ui.js';

if (montarPagina('administrador')) {
  const pagina = location.pathname.split('/').pop();
  const renderizar = {
    'dashboard.html': dashboard,
    'moradores.html': () => moradores(true),
    'solicitacoes.html': solicitacoes,
    'reservas.html': agenda,
    'comunicados.html': () => comunicados(true),
  };
  exibir(...renderizar[pagina]());
  atualizarComDados(renderizar[pagina]);
}

function linhasSolicitacoes(registros) {
  const { unidadeDoMorador, usuario } = contexto();
  return registros.map(s => [
    s.id, elemento('div', {}, [s.titulo, texto(usuario(s.moradorId)?.nome + ' · ' + s.categoria + ' · ' + data(s.criadaEm))]), s.local + ' · ' + unidadeCurta(unidadeDoMorador(s.moradorId)),
    s.prioridade === 'Alta' ? elemento('strong', {}, 'Alta') : s.prioridade, status(s.status),
    link(s.status === 'Concluído' ? 'Ver detalhes' : 'Abrir triagem', './solicitacoes.html?estado=triagem&id=' + s.id),
  ]);
}

function dashboard() {
  const solicitacoes = listarSolicitacoes();
  const ativas = solicitacoes.filter(s => s.status !== 'Concluído');
  const reservas = listarReservas().filter(r => r.status === 'Confirmada' &&
    Date.parse(r.inicio) >= Date.now())
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const comunicados = listarComunicados({ tipo: 'oficial' });
  const recentes = comunicados.filter(c => Date.parse(c.publicadoEm) >= Date.now() - 7 * 86400000 && Date.parse(c.publicadoEm) <= Date.now());
  const espacos = listarEspacos();
  const { unidadeDoMorador } = contexto();
  const listaReservas = reservas.map(r => elemento('li', {}, [
    elemento('strong', {}, espacos.find(e => e.id === r.espacoId)?.nome + ' · ' +
      Number(r.inicio.slice(11, 13)) + 'h às ' + Number(r.fim.slice(11, 13)) + 'h'),
    texto(r.id + ' · ' + data(r.inicio) + ' · ' + unidadeCurta(unidadeDoMorador(r.moradorId))),
  ]));
  const listaComunicados = comunicados.map(c => elemento('li', {}, [
    elemento('strong', {}, c.titulo),
    texto('Publicado em ' + data(c.publicadoEm) + ' · ' + (c.torre ? 'Torre ' + c.torre : 'Todas as unidades')),
  ]));
  return [
    cabecalho('Dashboard administrativo', 'Acompanhe as pendências e a agenda do condomínio.',
      elemento('div', { class: 'heading-action' }, [
        link('Novo comunicado', './comunicados.html?estado=novo', true), texto(data(new Date().toISOString()), 'demo-date'),
      ])),
    indicadores([
      ['Solicitações ativas', ativas.length, 'Pedidos ainda não concluídos', 'warning', 'solicitacao'],
      ['Reservas confirmadas', reservas.length, 'Reservas confirmadas futuras', 'success', 'reserva'],
      ['Comunicados recentes', recentes.length, 'Publicados nos últimos 7 dias', 'info', 'comunicado'],
    ]),
    secao('Solicitações prioritárias', 'Analise ocorrências novas e acompanhe as triagens em curso.',
      link('Ver solicitações', './solicitacoes.html')),
    tabela(['Protocolo', 'Ocorrência', 'Local', 'Prioridade', 'Status', 'Ação'],
      linhasSolicitacoes([...ativas].sort((a, b) => Number(b.prioridade === 'Alta') - Number(a.prioridade === 'Alta'))),
      'Solicitações prioritárias'),
    elemento('div', { class: 'dashboard-bottom' }, [
      card(secao('Próximas reservas', null, link('Ver agenda', './reservas.html')), elemento('ul', { class: 'summary-list' }, listaReservas)),
      card(secao('Comunicados oficiais', null, link('Ver comunicados', './comunicados.html')), elemento('ul', { class: 'summary-list' }, listaComunicados)),
    ]),
    texto('Demonstração local · ' + DIA_DEMO, 'demo-note'),
  ];
}

function solicitacoes() {
  const params = new URLSearchParams(location.search);
  const registros = listarSolicitacoes();
  if (params.get('estado') === 'triagem') {
    const registro = registros.find(s => s.id === (params.get('id') ?? 'SOL-018'));
    if (!registro) return [cabecalho('Solicitação não encontrada', 'Confira o protocolo.'), link('Voltar', './solicitacoes.html')];
    return triagem(registro);
  }
  return [
    cabecalho('Solicitações', 'Acompanhe os pedidos dos moradores e faça a triagem.'),
    filtros([
      campo('Buscar', 'busca', { tipo: 'search', placeholder: 'Protocolo, título ou unidade' }),
      campo('Status', 'status', { itens: [['', 'Todos'], 'Aberto', 'Em análise', 'Em andamento', 'Concluído'] }),
      campo('Local', 'local', { itens: [['', 'Todos'], ['comum', 'Área comum'], ['unidade', 'Dentro da unidade']] }),
    ], ({ busca, status: situacao, local }) => {
      const { usuario, unidadeDoMorador } = contexto();
      const visiveis = registros.filter(s => (!situacao || s.status === situacao) &&
        (!local || (local === 'comum' ? /^Área comum(?: ·|$)/.test(s.local) : !/^Área comum(?: ·|$)/.test(s.local))) &&
        procurar(s.id + ' ' + s.titulo + ' ' + usuario(s.moradorId)?.nome + ' ' +
          unidadeCurta(unidadeDoMorador(s.moradorId)), busca));
      return tabela(['Protocolo', 'Solicitação', 'Local', 'Prioridade', 'Status', 'Ação'],
        linhasSolicitacoes(visiveis), 'Fila de solicitações');
    }),
  ];
}

function triagem(registro) {
  const { usuario, unidadeDoMorador } = contexto();
  const categoria = registro.categoria;
  const resumo = card(
    elemento('h2', {}, registro.id + ' · ' + registro.titulo), status(registro.status),
    elemento('dl', { class: 'detail-grid detail-divider two-columns' }, [
      detalhe('Moradora', usuario(registro.moradorId)?.nome),
      detalhe('Unidade', unidadeCurta(unidadeDoMorador(registro.moradorId))),
    ]),
    elemento('dl', {}, [
      detalhe('Local da ocorrência', registro.local),
      detalhe('Tipo e prioridade informada', categoria + ' · ' + registro.prioridade),
    ]),
    texto(registro.descricao),
    detalhe('Abertura', data(registro.criadaEm) + ' · ' + hora(registro.criadaEm)),
    registro.imagem && elemento('img', { src: registro.imagem, alt: 'Imagem anexada à solicitação', style: 'max-width:100%;max-height:240px;object-fit:contain' }),
    ...registro.historico.map(h => texto(h.status + ' · ' + data(h.em) + ' · ' + h.descricao)),
  );
  const responsabilidade = campo('Responsabilidade', 'responsabilidade', {
    itens: ['A confirmar', 'Condomínio', 'Morador'], valor: registro.responsabilidade,
  });
  const equipe = elemento('fieldset', { class: 'radio-group' }, [
    elemento('legend', {}, 'Responsável pelo atendimento'),
    ...['Equipe de manutenção do condomínio', 'Profissional externo', 'Administração'].map((nome, i) =>
      elemento('label', {}, [
        elemento('input', { type: 'radio', name: 'responsavel', value: nome, checked: registro.responsavel ? registro.responsavel === nome : i === 0 }), nome,
      ])),
  ]);
  const novoStatus = campo('Novo status', 'status', {
    itens: ESTADOS.filter((_,i) => i >= ESTADOS.indexOf(registro.status) && i <= ESTADOS.indexOf(registro.status) + 1), valor: ESTADOS[Math.min(ESTADOS.indexOf(registro.status)+1,3)],
  });
  const form = formulario([
    elemento('h2', {}, 'Classificação e andamento'), responsabilidade,
    texto('Classifique como responsabilidade do condomínio ou da moradora após avaliar a origem do problema.'),
    equipe, novoStatus, campo('Informações do atendimento', 'encaminhamento', { tipo: 'textarea', required: true, maxlength: 2000, valor: registro.encaminhamento }), texto('A moradora acompanha a mudança pela interface Mobile.'),
  ], (valores, mensagem) => {
    atualizarSolicitacao(registro.id, valores);
    location.assign('./solicitacoes.html?estado=triagem&id=' + registro.id);
  }, 'Salvar alterações', './solicitacoes.html', true);
  return [
    cabecalho('Triagem de solicitação', 'Defina a responsabilidade e atualize o andamento.', null,
      { nome: 'Solicitações', href: './solicitacoes.html' }),
    elemento('div', { class: 'triage-grid' }, [resumo, form]),
  ];
}

