import { hoje } from '../../shared/js/services/base.js';
import { REGRAS_ESPACOS, cancelarReserva, listarEspacos, listarReservas } from '../../shared/js/services/reservas.js';
import { contexto } from './contexto.js';
import {
  elemento, cabecalho, texto, botao, tabela, campo, status, filtros, dialogo, detalhe,
  unidadeCurta, data, hora, formulario, card, acoes, link,
} from './ui.js';

export function agenda() {
  const espacos = listarEspacos();
  const reservas = listarReservas();
  const parametros = new URLSearchParams(location.search);
  if (parametros.get('estado') === 'gerenciar') return gerenciarEspacos(espacos, reservas);
  if (parametros.get('estado') === 'editar') {
    const espaco = espacos.find(e => e.id === parametros.get('id'));
    if (!espaco) return [
      cabecalho('Espaço não encontrado', 'Confira a referência do espaço.'),
      link('Voltar aos espaços', './reservas.html?estado=gerenciar'),
    ];
    const form = formulario([
      campo('Nome do espaço', 'nome', { valor: espaco.nome, required: true, maxlength: 120 }),
      elemento('dl', {}, detalhe('Identificador', espaco.id)),
    ], valores => {
      const destino = document.querySelector('[data-pagina]');
      destino.replaceChildren(
        cabecalho('Prévia do espaço', 'Confira os dados do espaço de lazer.'),
        card(elemento('h2', {}, valores.nome),
          elemento('dl', {}, detalhe('Identificador', espaco.id)),
          texto('Prévia concluída. A alteração não foi gravada.', 'feedback'),
          acoes(link('Voltar aos espaços', './reservas.html?estado=gerenciar'))),
      );
      const titulo = destino.querySelector('h1');
      titulo.tabIndex = -1;
      titulo.focus();
    }, 'Visualizar alteração', './reservas.html?estado=gerenciar');
    return [
      cabecalho('Editar espaço', 'Revise as informações do espaço de lazer.', null,
        { nome: 'Espaços de lazer', href: './reservas.html?estado=gerenciar' }), form,
    ];
  }
  const { usuario, unidadeDoMorador } = contexto();
  const mostrarReserva = r => dialogo('Reserva ' + r.id, [
    status(r.status), r.status === 'Confirmada' && Date.parse(r.inicio) > Date.now() && botao('Cancelar reserva', () => { if (confirm('Cancelar esta reserva e liberar o horário?')) { try { cancelarReserva(r.id); location.reload(); } catch(e) { alert(e.message); } } }), elemento('dl', {}, [
      detalhe('Espaço', espacos.find(e => e.id === r.espacoId)?.nome),
      detalhe('Morador', usuario(r.moradorId)?.nome),
      detalhe('Unidade', unidadeCurta(unidadeDoMorador(r.moradorId))),
      detalhe('Data e horário', data(r.inicio) + ' · ' + hora(r.inicio) + ' às ' + hora(r.fim)),
    ]),
  ]);
  const dataInicial = new URLSearchParams(location.search).get('data') ?? hoje();
  const espaco = campo('Espaço', 'espaco', { itens: espacos.map(e => [e.id, e.nome]), valor: 'ESP-001' });
  const dia = campo('Data', 'dia', { tipo: 'date', required: true, valor: dataInicial });
  const situacao = campo('Status', 'status', { itens: [['', 'Todos'], 'Confirmada', 'Cancelada', 'Disponível'] });
  const conteudo = filtros([espaco, dia, situacao], valores => {
    if (!valores.dia || !Number.isFinite(Date.parse(valores.dia))) return texto('Selecione uma data válida.', 'feedback');
    const inicioDia = Date.parse(valores.dia + 'T00:00:00-03:00');
    const fimDia = inicioDia + 24 * 60 * 60 * 1000;
    const doDia = reservas.filter(r => r.espacoId === valores.espaco &&
      Date.parse(r.inicio) < fimDia && Date.parse(r.fim) > inicioDia);
    const confirmadas = doDia.filter(r => r.status === 'Confirmada');
    const linhas = doDia.filter(r => !valores.status || r.status === valores.status).map(r => ({
      ordem: r.inicio,
      celulas: [
        hora(r.inicio).replace(':00', 'h') + ' às ' + hora(r.fim).replace(':00', 'h'),
        usuario(r.moradorId)?.nome, unidadeCurta(unidadeDoMorador(r.moradorId)), r.id,
        status(r.status), botao('Ver detalhes', () => mostrarReserva(r)),
      ],
    }));
    if (!valores.status || valores.status === 'Disponível') {
      for (const [inicio, fim] of REGRAS_ESPACOS[valores.espaco].faixas) {
        const inicioFaixa = Date.parse(valores.dia + 'T' + String(inicio).padStart(2, '0') + ':00:00-03:00');
        const fimFaixa = Date.parse(valores.dia + 'T' + String(fim).padStart(2, '0') + ':00:00-03:00');
        const ocupado = confirmadas.some(r => Date.parse(r.inicio) < fimFaixa && Date.parse(r.fim) > inicioFaixa);
        if (!ocupado) linhas.push({
          ordem: valores.dia + 'T' + String(inicio).padStart(2, '0'),
          celulas: [inicio + 'h às ' + fim + 'h', '—', '—', '—', status('Disponível'), '—'],
        });
      }
    }
    linhas.sort((a, b) => a.ordem.localeCompare(b.ordem));
    const dataSelecionada = new Date(valores.dia + 'T12:00:00-03:00');
    const rotulo = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo',
    }).format(dataSelecionada);
    const calendario = criarCalendario(valores.dia, reservas.filter(r => r.espacoId === valores.espaco), novaData => {
      dia.querySelector('input').value = novaData;
      dia.querySelector('input').dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('.calendar-day[aria-pressed="true"]')?.focus();
    });
    return elemento('div', {}, [
      elemento('h2', { class: 'agenda-title' }, 'Agenda · ' + rotulo),
      tabela(['Horário', 'Morador', 'Unidade', 'Reserva', 'Status', 'Ação'],
        linhas.map(l => l.celulas), 'Agenda de reservas'),
      elemento('section', { class: 'card calendar' }, [
        elemento('h3', {}, 'Disponibilidade mensal'),
        texto(espacos.find(e => e.id === valores.espaco)?.nome + ' · ' +
          new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(dataSelecionada)),
        calendario,
        elemento('div', { class: 'calendar-legend' }, [
          texto('● Com reservas'), texto('Sem reservas (sem ponto)'),
        ]),
      ]),
      texto('Reservas confirmadas bloqueiam o período; canceladas preservam o histórico e liberam o horário.', 'demo-note'),
    ]);
  });
  return [cabecalho('Espaços e reservas', 'Consulte os espaços e acompanhe a ocupação por período.',
    link('Gerenciar espaços', './reservas.html?estado=gerenciar', true)), conteudo];
}

function gerenciarEspacos(espacos, reservas) {
  return [
    cabecalho('Espaços de lazer', 'Consulte os espaços cadastrados e visualize suas informações.', null,
      { nome: 'Espaços e reservas', href: './reservas.html' }),
    tabela(['Espaço', 'Identificador', 'Reservas confirmadas', 'Ação'], espacos.map(espaco => [
      espaco.nome, espaco.id,
      String(reservas.filter(r => r.espacoId === espaco.id && r.status === 'Confirmada').length),
      link('Editar espaço', './reservas.html?estado=editar&id=' + espaco.id),
    ]), 'Espaços cadastrados'),
  ];
}

function criarCalendario(selecionada, reservas, selecionar) {
  const [ano, mes] = selecionada.split('-').map(Number);
  const primeiro = (new Date(ano, mes - 1, 1).getDay() + 6) % 7;
  const total = new Date(ano, mes, 0).getDate();
  const celulas = Array.from({ length: primeiro }, () => elemento('td'));
  for (let numero = 1; numero <= total; numero++) {
    const id = ano + '-' + String(mes).padStart(2, '0') + '-' + String(numero).padStart(2, '0');
    const inicioDia = Date.parse(id + 'T00:00:00-03:00');
    const fimDia = inicioDia + 24 * 60 * 60 * 1000;
    const ocupada = reservas.some(r => r.status === 'Confirmada' &&
      Date.parse(r.inicio) < fimDia && Date.parse(r.fim) > inicioDia);
    const botaoDia = elemento('button', {
      type: 'button', class: 'calendar-day' + (ocupada ? ' has-reservations' : ''),
      'aria-pressed': id === selecionada ? 'true' : 'false',
      'aria-label': numero + '/' + mes + '/' + ano + (ocupada ? ', com reservas' : ', sem reservas'),
      onclick: () => selecionar(id),
    }, String(numero));
    celulas.push(elemento('td', {}, botaoDia));
  }
  while (celulas.length % 7) celulas.push(elemento('td'));
  const linhas = [];
  for (let indice = 0; indice < celulas.length; indice += 7) {
    linhas.push(elemento('tr', {}, celulas.slice(indice, indice + 7)));
  }
  return elemento('table', { class: 'calendar-table', 'aria-label': 'Selecionar dia da agenda' }, [
    elemento('thead', {}, elemento('tr', {}, ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      .map(nome => elemento('th', { scope: 'col' }, nome)))),
    elemento('tbody', {}, linhas),
  ]);
}
