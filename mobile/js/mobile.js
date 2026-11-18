import { botaoRestaurar } from '../../shared/js/restauracao.js';
import { listarNotificacoes, marcarNotificacaoLida } from '../../shared/js/services/notificacoes.js';
import { listarSolicitacoes } from '../../shared/js/services/solicitacoes.js';
import { listarReservas } from '../../shared/js/services/reservas.js';
import { listarConversas, listarMensagens } from '../../shared/js/services/mensagens.js';
import { iniciarSessao, obterUsuarioDaSessao, encerrarSessao } from '../../shared/js/session.js';
import { observarDados, carregarDados } from '../../shared/js/storage.js';
import { listarEncomendas } from '../../shared/js/services/encomendas.js';
import { listarComunicados } from '../../shared/js/services/comunicados.js';
import { el, link, botao, card, secundario, status, avatar, icone, cabecalho, navegacao, campo, feedback, dialogo, curta, hora, unidadeTexto, vazio } from './layout.js';
import { mensagens } from './mensagens.js';
import { encomendas, solicitacoes } from './ocorrencias.js';
import { reservas } from './reservas.js';

const main = document.querySelector('main');
main.querySelector('noscript')?.remove();
const pagina = document.body.dataset.pagina;
const params = new URLSearchParams(location.search);
function entrar() {
  if (iniciarSessao('morador', document.querySelector('#morador-demo')?.value)) location.assign('inicio.html');
  else feedback('Não foi possível iniciar a sessão. Verifique o armazenamento do navegador.');
}
function login() {
  cabecalho('CondoConnect');
  document.querySelector('h1').classList.add('brand-title');
  main.classList.add('login-page');
  const form = el('form', { onSubmit: event => { event.preventDefault(); dialogo('Acesso de demonstração', secundario('Não há autenticação real nesta etapa. Utilize Entrar como morador.')); } },
    campo('E-mail', 'email', { tipo: 'email', placeholder: 'Informe seu e-mail' }),
    campo('Senha', 'senha', { tipo: 'password', placeholder: 'Informe sua senha' }),
    el('button', { type: 'submit', class: 'button button-primary' }, 'Entrar'));
  form.querySelector('#email').autocomplete = 'username';
  form.querySelector('#senha').autocomplete = 'current-password';
  const seletor = campo('Morador fictício', 'morador-demo', { opcoes: carregarDados().dados.usuarios.filter(u => u.perfil === 'morador').map(u => u.id) });
  for (const option of seletor.querySelectorAll('option')) { const id=option.value; option.value=id; option.textContent = carregarDados().dados.usuarios.find(u => u.id === id).nome; }
  main.append(card(el('h2', { class: 'login-title' }, 'Entrar'), secundario('Acesse a área do morador.'), form,
    el('section', { class: 'login-demo' }, el('div', {}, el('strong', {}, 'Acesso de demonstração'), seletor, botao('Entrar como morador', entrar, 'button button-outline center-button')))));
}
function inicio(ctx) {
  const { usuario, unidade } = ctx;
  const pendentes = listarEncomendas({ moradorId: usuario.id, status: 'Aguardando retirada' });
  const naoLidas = listarNotificacoes().filter(n => !n.lida).length;
  const sino = el('a', { href: 'notificacoes.html', class: 'icon-button', 'aria-label': `Notificações: ${naoLidas} não lidas` }, icone('sino'));
  if (naoLidas) sino.append(el('span', { class: 'count' }, String(naoLidas)));
  cabecalho('CondoConnect', { acoes: [sino, el('a', { href: 'perfil.html', class: 'avatar avatar-square', 'aria-label': 'Meu perfil' }, usuario.nome.split(' ').map(x=>x[0]).slice(0,2).join(''))] });
  document.querySelector('h1').classList.add('brand-title');
  main.append(el('section', { class: 'greeting' }, el('h2', {}, 'Olá, ' + usuario.nome.split(' ')[0]), secundario(unidadeTexto(unidade))));
  const pacote = pendentes[0];
  if (pacote) {
    const destaque = card(el('h2', {}, 'Encomenda na portaria'), status(pacote.status), secundario(`${pacote.id} · Recebida em ${curta(pacote.recebidaEm)} às ${hora(pacote.recebidaEm)}`), link('Ver detalhes', 'encomendas.html?id=' + encodeURIComponent(pacote.id), 'button button-primary'));
    destaque.classList.add('accent-card'); main.append(destaque);
  } else main.append(vazio('Nenhuma encomenda aguardando retirada.'));
  main.append(el('section', {}, el('h2', { class: 'section-title' }, 'Atalhos'), el('div', { class: 'shortcut-grid' },
    [['Mensagens','Conversas','mensagens'],['Encomendas','Entregas e retiradas','encomendas'],['Solicitações','Pedir e acompanhar','solicitacoes'],['Reservas','Espaços e horários','reservas']].map(([nome, texto, rota]) => el('a', { href: rota + '.html', class: 'shortcut' }, el('strong', {}, nome), el('small', {}, texto), icone('seta'))))));
  main.append(secundario(listarSolicitacoes().filter(s=>s.status!=='Concluído').length + ' solicitações ativas · ' + listarReservas({moradorId:usuario.id}).filter(r=>r.status==='Confirmada' && Date.parse(r.inicio)>Date.now()).length + ' reservas futuras · ' + listarConversas().reduce((n,c)=>n+listarMensagens(c.id).filter(m=>!m.lidaPorIds.includes(usuario.id)).length,0) + ' mensagens não lidas'));
  const comunicados = listarComunicados({ torre: unidade?.torre });
  main.append(el('section', {}, el('h2', { class: 'section-title' }, 'Comunicados recentes'), comunicados.length ? comunicados.map(item => el('a', { class: 'announcement', href: 'comunicados.html?id=' + encodeURIComponent(item.id) }, el('div', { class: 'row row-between' }, el('strong', {}, item.titulo), el('span', { class: 'meta' }, curta(item.publicadoEm))), el('p', {}, item.mensagem))) : vazio('Nenhum comunicado disponível.')));
  navegacao('inicio');
}
function servicos() {
  cabecalho('Serviços');
  main.append(el('h3', {}, 'O que você precisa fazer?'));
  for (const [nome, texto, acao, rota, simbolo] of [['Solicitações','Registre uma ocorrência e acompanhe o andamento.','Ver solicitações','solicitacoes','documento'],['Reservas','Consulte a disponibilidade e reserve um espaço de lazer.','Ver espaços de lazer','reservas','calendario']]) {
    const action = link(acao, rota + '.html'); action.append(icone('seta'));
    const section = card(el('div', { class: 'row' }, el('span', { class: 'service-icon' }, icone(simbolo)), el('h2', {}, nome)), secundario(texto), action);
    section.classList.add('service-card'); main.append(section);
  }
  navegacao('servicos');
}
function perfil(ctx) {
  cabecalho('Perfil', { voltar: 'inicio.html' });
  const sair = botao('Sair da conta', () => { if (encerrarSessao()) location.replace('login.html'); else feedback('Não foi possível encerrar a sessão nesta aba.'); }, 'button button-outline danger');
  sair.prepend(icone('sair'));
  const section = card(el('div', { class: 'row' }, avatar(ctx.usuario.nome), el('div', {}, el('h2', {}, ctx.usuario.nome), status('Moradora'))),
    el('dl', {}, [['Condomínio','Condomínio Jardim das Torres'],['Unidade',unidadeTexto(ctx.unidade)],['E-mail',ctx.usuario.email]].map(([label,value]) => el('div', {}, el('dt', {}, label), el('dd', {}, value)))));
  section.classList.add('profile-card'); main.append(section,sair,botaoRestaurar());
}
function notificacoes(ctx) {
  cabecalho('Notificações', { voltar: 'inicio.html' });
  const lista = listarNotificacoes();
  if (!lista.length) main.append(vazio('Nenhuma notificação disponível.'));
  for (const n of lista) {
    const abrir = botao('Ver detalhes', () => { try { marcarNotificacaoLida(n.id); location.assign(n.destino); } catch(e) { feedback(e.message); } }, 'button');
    const section = card(el('h2',{},n.titulo),status(n.lida?'Lida':'Não lida'),secundario(n.descricao),secundario(curta(n.criadaEm)+' · '+hora(n.criadaEm)),abrir);
    if (!n.lida) section.append(botao('Marcar como lida',()=>{ try { marcarNotificacaoLida(n.id); } catch(e) { feedback(e.message); } }));
    main.append(section);
  }
  navegacao(null);
}
function comunicados(ctx) {
  cabecalho('Comunicados', { voltar:'inicio.html' });
  const lista = listarComunicados({ torre:ctx.unidade?.torre });
  const id=new URLSearchParams(location.search).get('id');
  const itens=id?lista.filter(item=>item.id===id):lista;
  for(const item of itens)main.append(card(el('h2',{},item.titulo),secundario(curta(item.publicadoEm)+' · '+item.tipo+' · '+(ctx.dados.usuarios.find(u=>u.id===item.autorId)?.nome??'Autor indisponível')),el('p',{},item.mensagem)));
  if(!itens.length)main.append(vazio('Comunicado não encontrado.'));
  navegacao('inicio');
}
function renderizar() {
try {
  if (pagina === 'login') login();
  else {
    const usuario = obterUsuarioDaSessao();
    if (usuario?.perfil !== 'morador') location.replace('login.html');
    else {
      const estado = carregarDados();
      const ctx = { usuario, dados: estado.dados, unidade: estado.dados.unidades.find(u => u.id === usuario.unidadeId), params: new URLSearchParams(location.search), main };
      const rotas = { inicio, servicos, perfil, notificacoes, comunicados, mensagens, encomendas, solicitacoes, reservas };
      rotas[pagina](ctx);
      if (!estado.persistido) feedback('Armazenamento indisponível ou base inválida. Exibindo dados iniciais apenas para consulta. Use Restaurar dados no Perfil para recuperar uma base inválida.');
      else if (estado.conflitos.length) feedback('Há alterações em conflito. Confira os dados antes de continuar.');
    }
  }
  document.body.setAttribute('data-pronto','');
} catch (error) {
  feedback('Não foi possível carregar esta interface. Recarregue a página.');
  console.error(error);
}
}
let atualizacao;
observarDados(() => { cancelAnimationFrame(atualizacao); atualizacao = requestAnimationFrame(() => {
  if (main.querySelector('form')) { feedback('Os dados compartilhados foram atualizados. A operação será revalidada ao salvar.'); return; }
  const busca = main.querySelector('[type=search]')?.value;
  const filtro = main.querySelector('.filters [aria-pressed=true]')?.textContent;
  const mensagem = document.querySelector('.composer input')?.value;
  const foco = document.activeElement?.getAttribute('name');
  main.replaceChildren(); main.className = 'mobile-page'; document.querySelector('.composer')?.remove(); document.body.classList.remove('chat-screen','with-nav'); document.querySelector('[data-navegacao]').hidden = true;
  renderizar();
  if (busca) { const input=main.querySelector('[type=search]'); if(input){input.value=busca;input.dispatchEvent(new Event('input'));} }
  if (filtro) [...main.querySelectorAll('.filters button')].find(b=>b.textContent===filtro)?.click();
  if (mensagem) { const input=document.querySelector('.composer input');if(input)input.value=mensagem; }
  if(foco) document.getElementsByName(foco)[0]?.focus();
}); });
renderizar();
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
