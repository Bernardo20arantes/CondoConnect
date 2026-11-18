import {
  elemento, cabecalho, texto, link, botao, tabela, campo, filtros, status, unidadeCurta,
  procurar, dialogo, detalhe, formulario, card, acoes,
} from './ui.js';
import { contexto } from './contexto.js';

export function moradores(administrador) {
  const { dados, unidade } = contexto();
  const moradores = dados.usuarios.filter(item => item.perfil === 'morador');
  const unidadesAtivas = new URLSearchParams(location.search).get('aba') === 'unidades';
  const titulo = 'Moradores e unidades';
  const parametros = new URLSearchParams(location.search);
  const estado = parametros.get('estado');
  if (administrador && ['novo', 'editar'].includes(estado)) {
    const existente = moradores.find(m => m.id === parametros.get('id'));
    if (estado === 'editar' && !existente) {
      return [cabecalho('Morador não encontrado', 'Confira a referência do cadastro.'),
        link('Voltar aos moradores', './moradores.html')];
    }
    const form = formulario([
      elemento('div', { class: 'two-columns form-grid' }, [
        campo('Nome', 'nome', { valor: existente?.nome ?? '', required: true, maxlength: 120, autocomplete: 'off' }),
        campo('E-mail', 'email', { tipo: 'email', valor: existente?.email ?? '', required: true, maxlength: 160, autocomplete: 'off' }),
      ]),
      campo('Unidade', 'unidadeId', {
        itens: [['', 'Selecione a unidade'], ...dados.unidades.map(u => [u.id, unidadeCurta(u)])],
        valor: existente?.unidadeId ?? '', required: true,
      }),
    ], valores => {
      const destino = document.querySelector('[data-pagina]');
      destino.replaceChildren(
        cabecalho('Prévia do cadastro', 'Confira os dados preenchidos.'),
        card(elemento('h2', {}, valores.nome), elemento('dl', {}, [
          detalhe('E-mail', valores.email), detalhe('Unidade', unidadeCurta(unidade(valores.unidadeId))),
          detalhe('Perfil', 'Morador'),
          existente && detalhe('Referência cadastral', existente.id),
        ]), texto('Prévia concluída. O cadastro não foi gravado.', 'feedback'),
        acoes(link('Voltar aos moradores', './moradores.html'))),
      );
      const titulo = destino.querySelector('h1');
      titulo.tabIndex = -1;
      titulo.focus();
    }, 'Visualizar cadastro', './moradores.html');
    return [cabecalho(estado === 'novo' ? 'Cadastrar morador' : 'Editar cadastro',
      'Preencha os dados do morador e selecione sua unidade.', null,
      { nome: 'Moradores e unidades', href: './moradores.html' }), form];
  }
  const mostrarUnidade = unidadeId => {
    const registro = unidade(unidadeId);
    dialogo(unidadeCurta(registro), elemento('dl', {}, [
      detalhe('Torre', 'Torre ' + registro.torre),
      detalhe('Apartamento', registro.apartamento),
      detalhe('Moradores vinculados', moradores.filter(m => m.unidadeId === unidadeId).map(m => m.nome).join(', ')),
    ]));
  };
  const abas = administrador && elemento('nav', { class: 'tabs', 'aria-label': 'Cadastros' }, [
    elemento('a', { href: './moradores.html', 'aria-current': !unidadesAtivas && 'page' }, 'Moradores'),
    elemento('a', { href: './moradores.html?aba=unidades', 'aria-current': unidadesAtivas && 'page' }, 'Unidades'),
  ]);
  const campos = [
    campo('Buscar', 'busca', { tipo: 'search', placeholder: unidadesAtivas ? 'Número do apartamento' : 'Nome ou número do apartamento' }),
    campo('Torre', 'torre', { itens: [['', 'Todas'], ['A', 'Torre A'], ['B', 'Torre B']] }),
  ];
  if (administrador && !unidadesAtivas) {
    campos.push(campo('Situação', 'situacao', { itens: [['', 'Todas'], ['Ativo', 'Ativo']] }));
  }
  const conteudo = filtros(campos, ({ busca, torre }) => {
    const unidades = dados.unidades.filter(u => (!torre || u.torre === torre) &&
      procurar(u.apartamento, busca));
    if (administrador && unidadesAtivas) {
      return elemento('div', {}, [
        elemento('h2', { class: 'table-heading' }, 'Unidades cadastradas'),
        tabela(['Unidade', 'Torre', 'Apartamento', 'Moradores vinculados'], unidades.map(u => [
          unidadeCurta(u), 'Torre ' + u.torre, u.apartamento,
          moradores.filter(m => m.unidadeId === u.id).map(m => m.nome).join(', '),
        ]), 'Unidades cadastradas'),
        texto(unidades.length + ' unidades', 'result-count'),
      ]);
    }
    const visiveis = moradores.filter(m => {
      const u = unidade(m.unidadeId);
      return (!torre || u.torre === torre) && procurar(m.nome + ' ' + u.apartamento, busca);
    });
    return elemento('div', {}, [
      elemento('h2', { class: 'table-heading' }, administrador ? 'Moradores cadastrados' : 'Moradores autorizados'),
      tabela(administrador ? ['Morador', 'Unidade', 'E-mail', 'Situação', 'Ação'] :
        ['Morador', 'Torre', 'Apartamento', 'Ação'], visiveis.map(m => {
        const u = unidade(m.unidadeId);
        return administrador
          ? [m.nome, unidadeCurta(u), m.email, status('Ativo'), link('Editar cadastro', './moradores.html?estado=editar&id=' + m.id)]
          : [m.nome, 'Torre ' + u.torre, u.apartamento, botao('Ver unidade', () => mostrarUnidade(u.id))];
      }), 'Moradores cadastrados'),
      texto(visiveis.length + ' moradores', 'result-count'),
    ]);
  });
  return [
    cabecalho(titulo, administrador ? 'Gerencie o cadastro de moradores e o vínculo com suas unidades.' :
      'Consulte moradores autorizados e confirme a unidade antes de registrar uma encomenda.',
    administrador && link('+ Cadastrar morador', './moradores.html?estado=novo', true)),
    abas || elemento('span', { hidden: true }), conteudo,
  ];
}
