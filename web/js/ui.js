import { observarDados } from '../../shared/js/storage.js';
import { hoje } from '../../shared/js/services/base.js';
export function elemento(tag, atributos = {}, filhos = []) {
  const no = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (nome === 'class') no.className = valor;
    else if (nome.startsWith('on')) no.addEventListener(nome.slice(2), valor);
    else if (valor !== false && valor != null) no.setAttribute(nome, valor === true ? '' : valor);
  }
  for (const filho of [filhos].flat(Infinity)) {
    if (filho != null && filho !== false) no.append(filho);
  }
  return no;
}

export const texto = (conteudo, classe = 'secondary') => elemento('p', { class: classe }, conteudo);
export const link = (rotulo, href, primario = false) =>
  elemento('a', { href, class: 'button' + (primario ? '' : ' button-outline') }, rotulo);
export const botao = (rotulo, acao, primario = false) =>
  elemento('button', { type: 'button', class: 'button' + (primario ? '' : ' button-outline'), onclick: acao }, rotulo);
export const card = (...filhos) => elemento('section', { class: 'card panel' }, filhos);
export const acoes = (...filhos) => elemento('div', { class: 'actions form-actions' }, filhos);

export function status(valor) {
  const cores = {
    'Aguardando retirada': 'warning', Aberto: 'warning', 'Em análise': 'info',
    'Em andamento': 'info', Entregue: 'success', Confirmada: 'success', Concluído: 'success',
    Cancelada: 'neutral', Disponível: 'neutral', Ativo: 'success',
  };
  return elemento('span', { class: 'status status-' + (cores[valor] ?? 'neutral') }, valor);
}

export function cabecalho(titulo, descricao, acao, voltar) {
  document.title = titulo + ' | CondoConnect';
  return elemento('div', { class: 'page-heading' }, [
    elemento('div', {}, [
      voltar && elemento('a', { href: voltar.href, class: 'back-link' }, '‹ ' + voltar.nome),
      elemento('h1', {}, titulo),
      descricao && texto(descricao),
    ]),
    acao,
  ]);
}

export function tabela(titulos, linhas, legenda) {
  const corpo = elemento('tbody');
  for (const celulas of linhas) {
    corpo.append(elemento('tr', {}, celulas.map((celula, indice) =>
      elemento(indice === 0 ? 'th' : 'td', indice === 0 ? { scope: 'row' } : {}, celula))));
  }
  if (!linhas.length) {
    corpo.append(elemento('tr', {}, elemento('td', { colspan: titulos.length }, 'Nenhum registro encontrado.')));
  }
  return elemento('div', { class: 'table-frame', tabindex: '0', role: 'region', 'aria-label': legenda }, [
    elemento('table', { class: 'table' }, [
      elemento('caption', { class: 'sr-only' }, legenda),
      elemento('thead', {}, elemento('tr', {}, titulos.map(t => elemento('th', { scope: 'col' }, t)))),
      corpo,
    ]),
  ]);
}

export function campo(rotulo, nome, opcoes = {}) {
  const { itens, valor, tipo = 'text', ...atributos } = opcoes;
  const controle = itens
    ? elemento('select', { id: nome, name: nome, class: 'field', ...atributos },
      itens.map(item => {
        const [id, titulo] = Array.isArray(item) ? item : [item, item];
        return elemento('option', { value: id }, titulo);
      }))
    : elemento(tipo === 'textarea' ? 'textarea' : 'input', {
      id: nome, name: nome, class: 'field', ...atributos,
      ...(tipo === 'textarea' ? {} : { type: tipo }),
    });
  if (valor != null) controle.value = valor;
  const erro = elemento('p', { id: nome + '-erro', class: 'field-error', hidden: true });
  controle.setAttribute('aria-describedby', erro.id);
  return elemento('div', { class: 'form-field' }, [
    elemento('label', { for: nome, class: 'field-label' }, rotulo), controle, erro,
  ]);
}

export function filtros(campos, renderizar) {
  const area = elemento('form', { class: 'filters', role: 'search', onsubmit: e => e.preventDefault() }, campos);
  const resultado = elemento('div', { class: 'results', 'aria-live': 'polite' });
  const atualizar = () => resultado.replaceChildren(renderizar(Object.fromEntries(new FormData(area))));
  area.addEventListener('input', atualizar);
  atualizar();
  return elemento('div', {}, [area, resultado]);
}

export function formulario(filhos, aoEnviar, rotulo = 'Salvar alterações', cancelar = './dashboard.html', funcional = false) {
  const mensagem = texto('', 'feedback');
  mensagem.setAttribute('role', 'status');
  const form = elemento('form', { class: 'card panel form-panel', novalidate: true }, [
    filhos,
    texto(funcional ? 'Demonstração local com dados fictícios. As alterações serão gravadas neste navegador.' : 'Demonstração visual. As alterações não serão gravadas.', 'demo-note'),
    mensagem,
    acoes(link('Cancelar', cancelar), elemento('button', { class: 'button', type: 'submit' }, rotulo)),
  ]);
  form.addEventListener('submit', evento => {
    evento.preventDefault();
    const invalidos = [];
    for (const controle of form.querySelectorAll('input, select, textarea')) {
      controle.setCustomValidity('');
      if (controle.required && !controle.value.trim()) {
        controle.setCustomValidity('Preencha este campo.');
      }
      const erro = form.querySelector('[id="' + controle.id + '-erro"]');
      if (!controle.validity.valid) invalidos.push(controle);
      controle.setAttribute('aria-invalid', String(!controle.validity.valid));
      if (erro) {
        erro.textContent = controle.validity.valid ? '' : controle.validationMessage;
        erro.hidden = controle.validity.valid;
      }
    }
    if (invalidos.length) {
      mensagem.textContent = 'Confira os campos indicados para continuar.';
      invalidos[0].focus();
      return;
    }
    const submit = form.querySelector('[type=submit]');
    if (submit.disabled) return;
    submit.disabled = true;
    let concluido = false;
    try { aoEnviar(Object.fromEntries(new FormData(form)), mensagem); concluido = true; }
    catch (erro) { mensagem.textContent = erro.message; }
    finally { submit.disabled = funcional && concluido; }
  });
  return form;
}

export function detalhe(rotulo, valor) {
  return elemento('div', { class: 'detail' }, [
    elemento('dt', {}, rotulo), elemento('dd', {}, valor ?? '—'),
  ]);
}

export function dialogo(titulo, filhos) {
  const origem = document.activeElement;
  const janela = elemento('dialog', { class: 'detail-dialog', 'aria-labelledby': 'dialog-title' }, [
    elemento('h2', { id: 'dialog-title', tabindex: '-1' }, titulo),
    elemento('div', { class: 'dialog-body' }, filhos),
  ]);
  janela.append(acoes(botao('Fechar', () => janela.close())));
  janela.addEventListener('close', () => {
    janela.remove();
    if (origem?.isConnected) origem.focus();
  });
  document.body.append(janela);
  janela.showModal();
  janela.querySelector('h2').focus();
  return janela;
}

export function procurar(valor, termo) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .includes((termo ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
}

// A data da apresentação mantém os indicadores alinhados aos exemplos aprovados.
export const DIA_DEMO = hoje();
function formatarData(valor, opcoes, indisponivel) {
  if (typeof valor !== 'string' || !Number.isFinite(Date.parse(valor))) return indisponivel;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', ...opcoes,
  }).format(new Date(valor));
}

export const data = valor => formatarData(valor, {}, 'Data indisponível');
export const hora = valor => formatarData(valor, { hour: '2-digit', minute: '2-digit' }, 'Horário indisponível');
export function dataCurta(valor) {
  const dia = data(valor);
  if (dia === 'Data indisponível') return dia;
  return dia.slice(0, 5) + ' · ' + hora(valor).replace(':', 'h');
}
export const unidadeCurta = unidade => unidade ? 'Torre ' + unidade.torre + ' · ' + unidade.apartamento : '—';

export function indicadores(itens) {
  return elemento('div', { class: 'indicators' }, itens.map(([rotulo, quantidade, descricao, cor, icone]) =>
    card(elemento('div', { class: 'indicator-label' }, [
      elemento('span', { class: 'status status-' + cor }, rotulo),
      iconeIndicador(icone),
    ]), elemento('strong', { class: 'indicator-number' }, String(quantidade)), texto(descricao))));
}

function iconeIndicador(nome) {
  const caminhos = {
    encomenda: ['M12 3 4 7v10l8 4 8-4V7Z', 'm4 7 8 4 8-4M12 11v10M8 5l8 4'],
    recebida: ['M5 10 2 16v5h20v-5l-3-6', 'M2 16h6l2 3h4l2-3h6', 'M12 3v10m-4-4 4 4 4-4'],
    retirada: ['M6 3h12v18H6Z', 'm9 12 2 2 4-4'],
    solicitacao: ['M6 2h12v20H6Z', 'M9 7h6M9 11h6M9 15h4'],
    reserva: ['M4 5h16v16H4Z', 'M7 2v6M17 2v6M4 10h16', 'm8 15 3 3 5-5'],
    comunicado: ['m4 10 15-6v16L4 14Z', 'M8 15v6h4l-2-5'],
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [chave, valor] of Object.entries({
    viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none',
    stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  })) svg.setAttribute(chave, valor);
  for (const d of caminhos[nome] ?? caminhos.encomenda) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return elemento('span', { class: 'indicator-icon', 'aria-hidden': 'true' }, svg);
}

export function secao(titulo, descricao, acao) {
  return elemento('div', { class: 'section-heading' }, [
    elemento('div', {}, [elemento('h2', {}, titulo), descricao && texto(descricao)]), acao,
  ]);
}

export function exibir(...filhos) {
  const destino = document.querySelector('[data-pagina]');
  destino.replaceChildren(...filhos);
  destino.setAttribute('data-pronto', '');
}

// Reaplica filtros sem apagar formulários em edição.
export function atualizarComDados(renderizar) {
  let frame;
  return observarDados(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if(document.querySelector('form:not([role=search])')) {
        const feedback=document.querySelector('[data-feedback]');
        if(feedback)feedback.textContent='Os dados compartilhados foram atualizados. A operação será revalidada ao salvar.';
        return;
      }
      const valores=[...document.querySelectorAll('[role=search] [name]')].map(c=>[c.name,c.value]);
      exibir(...renderizar());
      for(const [nome,valor] of valores){const campo=document.getElementsByName(nome)[0];if(campo)campo.value=valor;}
      document.querySelector('[role=search] [name]')?.dispatchEvent(new Event('input',{bubbles:true}));
    });
  });
}
