import { publicarComunicado, listarComunicados } from '../../shared/js/services/comunicados.js';
import {
  elemento, cabecalho, texto, link, botao, tabela, campo, filtros, formulario, procurar,
  dialogo, detalhe, data, card, acoes,
} from './ui.js';
import { contexto } from './contexto.js';

export function comunicados(administrador) {
  const { usuario } = contexto();
  const tipo = administrador ? 'oficial' : 'operacional';
  const registros = listarComunicados();
  const params = new URLSearchParams(location.search);
  const novo = params.get('estado') === 'novo';
  const titulo = administrador ? 'Comunicados oficiais' : 'Avisos operacionais';
  const rotuloNovo = administrador ? 'Novo comunicado oficial' : 'Novo aviso operacional';
  const publico = item => ({moradores:'Moradores',portaria:'Portaria',administracao:'Administração',geral:'Geral'}[item.publico]) + (item.torre ? ' · Torre ' + item.torre : ' · Todas as unidades');
  if (novo && !administrador) return [cabecalho('Publicação restrita à Administração', 'A Portaria pode consultar os comunicados destinados a ela.')];
  if (novo) {
    const exemplo = registros[0];
    const form = formulario([
      campo('Título', 'titulo', { required: true, valor: exemplo?.titulo ?? '', maxlength: 160 }),
      campo('Público', 'torre', { valor: exemplo?.torre ?? '', itens: [['', 'Todas as unidades'], ['A', 'Torre A'], ['B', 'Torre B']] }),
      campo('Destinatários', 'publico', { itens: [['moradores', 'Todos os moradores'], ['portaria','Portaria'], ['administracao','Administração'], ['geral','Público geral do condomínio']] }),
      campo('Categoria', 'tipo', { itens: [['oficial','Oficial'], ['operacional','Operacional']] }),
      campo('Mensagem', 'mensagem', { tipo: 'textarea', required: true, valor: exemplo?.mensagem ?? '', rows: 6 }),
    ], (valores) => {
      publicarComunicado(valores);
      location.assign('./comunicados.html');
    }, administrador ? 'Publicar comunicado' : 'Publicar aviso', './comunicados.html', true);
    form.classList.add('announcement-form');
    return [cabecalho(rotuloNovo, administrador ? 'Defina o público e revise o conteúdo antes de publicar.' :
      'Envie um aviso operacional autorizado aos moradores do público selecionado.', null,
    { nome: 'Comunicados', href: './comunicados.html' }), form];
  }
  return [
    cabecalho(titulo, administrador ? 'Publique comunicados oficiais e consulte o histórico do condomínio.' :
      'Consulte os comunicados destinados à Portaria ou ao público geral.',
    administrador && link('+ ' + (administrador ? 'Novo comunicado' : 'Novo aviso operacional'), './comunicados.html?estado=novo', true)),
    filtros([
      campo('Buscar', 'busca', { tipo: 'search', placeholder: 'Título da publicação' }),
      campo('Público', 'torre', { itens: [['', 'Todos'], ['todas', 'Todas as unidades'], ['A', 'Torre A'], ['B', 'Torre B']] }),
    ], ({ busca, torre }) => {
      const visiveis = registros.filter(r => procurar(r.titulo, busca) &&
        (!torre || (torre === 'todas' ? r.torre === null : r.torre === torre)));
      return elemento('div', {}, [
        elemento('h2', { class: 'table-heading' }, 'Publicados'),
        tabela(['Título', 'Público', 'Publicado em', 'Origem', 'Ação'], visiveis.map(r => [
          r.titulo, publico(r), data(r.publicadoEm), usuario(r.autorId)?.perfil === 'porteiro' ? 'Portaria' : 'Administração',
          botao('Ver detalhes', () => dialogo(r.titulo, [
            elemento('dl', {}, [
              detalhe('Categoria', r.tipo === 'oficial' ? 'Comunicado oficial' : 'Aviso operacional'),
              detalhe('Público', publico(r)), detalhe('Publicado em', data(r.publicadoEm)),
              detalhe('Publicado por', usuario(r.autorId)?.nome),
            ]),
            texto(r.mensagem, 'message-content'),
          ])),
        ]), titulo),
      ]);
    }),
  ];
}
