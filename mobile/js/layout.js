// Dados externos são sempre inseridos como texto, nunca como HTML.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat().filter(x => x !== null && x !== undefined));
  return node;
}
const paths = {
  voltar: 'm14 5-7 7 7 7', seta: 'm9 5 7 7-7 7', inicio: 'm3 10 9-8 9 8v11h-6v-7H9v7H3Z',
  mensagens: 'M4 4h16v13H9l-5 4ZM8 8h8M8 12h5', encomendas: 'm4 7 8-4 8 4v12l-8 4-8-4ZM4 7l8 5 8-5M12 12v11',
  servicos: 'm14 5 5-3 3 3-3 5-3-1L6 20l-3-3L14 6Z', sino: 'M6 9a6 6 0 0 1 12 0v7l2 2H4l2-2ZM10 21h4',
  busca: 'M16 16l6 6M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', calendario: 'M4 5h16v16H4ZM4 10h16M8 2v6M16 2v6M8 14h3',
  documento: 'M6 2h9l4 4v16H6ZM14 2v6h5M9 12h7M9 16h7', sair: 'M9 3H3v18h6M8 12h13m-5-5 5 5-5 5',
};
export function icone(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({viewBox:'0 0 24 24',width:24,height:24,fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(key,value);
  const path = document.createElementNS(svg.namespaceURI,'path'); path.setAttribute('d',paths[name] ?? paths.documento); svg.append(path); return svg;
}
export const link = (text, href, cls = 'button button-outline') => el('a',{class:cls,href},text);
export const botao = (text, action, cls = 'button button-outline') => el('button',{type:'button',class:cls,onClick:action},text);
export const card = (...children) => el('section',{class:'card'},...children);
export const secundario = text => el('p',{class:'secondary'},text);
export const vazio = text => card(el('p',{},text));
export function status(text) {
  const type = ['Entregue','Concluído','Confirmada'].includes(text) ? 'success' : text === 'Aguardando retirada' ? 'warning' : text === 'Cancelada' ? 'neutral' : 'info';
  return el('span',{class:'status status-'+type},text);
}
export const avatar = (name, cls = '') => el('span',{class:'avatar '+cls,'aria-hidden':'true'},name.split(' ').map(p=>p[0]).slice(0,2).join(''));
export function cabecalho(title,{voltar,acoes=[],participante}={}) {
  const header=document.querySelector('header'); header.replaceChildren();
  if(voltar) header.append(el('a',{href:voltar,class:'icon-button','aria-label':'Voltar'},icone('voltar')));
  if(participante) header.append(avatar(participante));
  header.append(el('div',{class:'header-title'},el('h1',{},title)),...acoes); document.title=title+' | CondoConnect';
}
export function navegacao(active) {
  const nav=document.querySelector('[data-navegacao]');
  nav.replaceChildren(...[['inicio','Início'],['mensagens','Mensagens'],['encomendas','Encomendas'],['servicos','Serviços']].map(([route,name])=>el('a',{href:route+'.html','aria-current':active===route?'page':null},icone(route),el('span',{},name))));
  nav.hidden=false; document.body.classList.add('with-nav');
}
export function feedback(text) { document.querySelector('[data-feedback]').textContent=text; }
export function dialogo(title,...content) {
  const origin=document.activeElement;
  const modal=el('dialog',{'aria-labelledby':'dialog-title'},el('h2',{id:'dialog-title'},title),...content,botao('Fechar',()=>modal.close()));
  modal.addEventListener('close',()=>{modal.remove();if(origin?.isConnected)origin.focus();}); document.body.append(modal);modal.showModal();
}
export function filtros(options,change) {
  const group=el('div',{class:'filters',role:'group','aria-label':'Filtrar resultados'});
  options.forEach((name,index)=>{const control=botao(name,()=>{for(const item of group.children)item.setAttribute('aria-pressed',String(item===control));change(name);});control.setAttribute('aria-pressed',String(index===0));group.append(control);});return group;
}
export function campo(name,id,{tipo='text',valor='',opcoes,placeholder,required=true}={}) {
  const control=opcoes?el('select',{id,name:id,class:'field',required},opcoes.map(x=>el('option',{},x))):el(tipo==='textarea'?'textarea':'input',{id,name:id,class:'field',type:tipo==='textarea'?null:tipo,required,placeholder});
  control.value=valor||opcoes?.[0]||'';
  return el('div',{class:'form-field'},el('label',{for:id,class:'field-label'},name),control);
}
export const data=value=>value?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo'}).format(new Date(value)):'Não informada';
export const curta=value=>data(value).slice(0,5);
export const hora=value=>value?new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(value)).replace(':','h'):'Não informado';
export const unidadeTexto=u=>u?`Torre ${u.torre} · ${u.apartamento}`:'Unidade indisponível';
export const demonstracao=()=>el('p',{class:'demo-note'},'Prévia demonstrativa · Nenhuma alteração será gravada.');
