import { botaoRestaurar } from '../../shared/js/restauracao.js';
import { iniciarSessao, obterUsuarioDaSessao, encerrarSessao } from '../../shared/js/session.js';
import { carregarDados } from '../../shared/js/storage.js';
import { mostrarEstadoDosDados, mostrarFeedback } from '../../shared/js/utils.js';

const configuracoes = {
  porteiro: {
    nome: 'Portaria',
    itens: [['Dashboard', 'dashboard'], ['Encomendas', 'encomendas'], ['Moradores e unidades', 'moradores'], ['Comunicados', 'comunicados']],
  },
  administrador: {
    nome: 'Administração',
    itens: [['Dashboard', 'dashboard'], ['Moradores e unidades', 'moradores'], ['Solicitações', 'solicitacoes'], ['Espaços e reservas', 'reservas'], ['Comunicados', 'comunicados']],
  },
};

function montarCabecalho(perfil) {
  const espaco = document.querySelector('[data-cabecalho]');
  const principal = document.querySelector('main');
  principal.id = 'conteudo-principal';
  principal.tabIndex = -1;
  const pular = document.createElement('a');
  pular.href = '#conteudo-principal';
  pular.className = 'skip-link';
  pular.textContent = 'Ir para o conteúdo';
  pular.addEventListener('click', evento => {
    evento.preventDefault();
    principal.focus();
    principal.scrollIntoView({ block: 'start' });
  });
  const cabecalho = document.createElement('header');
  cabecalho.className = 'site-header';
  const marca = document.createElement('a');
  marca.className = 'brand';
  marca.href = new URL('../../index.html', import.meta.url).href;
  marca.textContent = 'CondoConnect';
  cabecalho.append(marca);
  if (perfil) {
    const area = document.createElement('span');
    area.className = 'area-label';
    area.textContent = configuracoes[perfil].nome;
    cabecalho.append(area);
  }
  espaco.replaceChildren(pular, cabecalho);
}

function montarMenu(perfil) {
  const menu = document.querySelector('[data-menu]');
  for (const [titulo, arquivo] of configuracoes[perfil].itens) {
    const item = document.createElement('a');
    item.className = 'menu-item';
    item.textContent = titulo;
    item.href = './' + arquivo + '.html';
    if (location.pathname.endsWith('/' + arquivo + '.html')) {
      item.setAttribute('aria-current', 'page');
    }
    menu.append(item);
  }
  const sair = document.createElement('button');
  sair.className = 'menu-item session-exit';
  sair.type = 'button';
  sair.dataset.sair = '';
  sair.textContent = 'Sair da demonstração';
  menu.append(sair, botaoRestaurar('menu-item'));
}

const acessos = document.querySelector('[data-acessos]');

if (acessos) {
  montarCabecalho();
  const destinos = {
    porteiro: './portaria/dashboard.html',
    administrador: './administracao/dashboard.html',
  };

  for (const botao of acessos.querySelectorAll('[data-perfil]')) {
    botao.addEventListener('click', () => {
      const { perfil } = botao.dataset;
      if (iniciarSessao(perfil)) {
        location.assign(destinos[perfil]);
      } else {
        mostrarFeedback('Não foi possível iniciar a sessão. Verifique o armazenamento do navegador.');
      }
    });
  }
  acessos.hidden = false;
}

export function montarPagina(perfil) {
  const login = '../login.html';
  const usuario = obterUsuarioDaSessao();
  if (usuario?.perfil !== perfil) {
    location.replace(login);
    return null;
  }

  montarCabecalho(perfil);
  montarMenu(perfil);
  document.body.dataset.perfil = perfil;
  const sair = document.querySelector('[data-sair]');
  sair.addEventListener('click', () => {
    if (encerrarSessao()) {
      location.replace(login);
    } else {
      mostrarFeedback('Não foi possível encerrar a sessão nesta aba.');
    }
  });

  // Reconfere o perfil se o histórico restaurar a página do cache do navegador.
  window.addEventListener('pageshow', evento => {
    if (evento.persisted) location.reload();
  });

  mostrarEstadoDosDados(carregarDados());
  sair.hidden = false;
  return usuario;
}
