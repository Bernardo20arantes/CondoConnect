import { criarConversa, enviarMensagem, marcarConversaLida, listarConversas, listarMensagens } from '../../shared/js/services/mensagens.js';
import { el, botao, cabecalho, navegacao, icone, avatar, vazio, dialogo, hora, curta, unidadeTexto, feedback } from './layout.js';
export function mensagens({usuario,dados,params,main}) {
  const conversas=listarConversas(usuario.id);
  const id=params.get('id');
  const conversa=conversas.find(c=>c.id===id);
  if(id) {
    if(!conversa){cabecalho('Conversa',{voltar:'mensagens.html'});main.append(vazio('Conversa não encontrada para este morador.'));return;}
    const outro=dados.usuarios.find(u=>u.id===conversa.participanteIds.find(x=>x!==usuario.id));
    cabecalho(outro.nome,{voltar:'mensagens.html',participante:outro.nome});
    document.querySelector('.header-title').append(el('small',{},unidadeTexto(dados.unidades.find(u=>u.id===outro.unidadeId))));
    main.classList.add('chat-page');
    document.body.classList.add('chat-screen');
    try { marcarConversaLida(id); } catch(e) { feedback(e.message); }
    const mensagens=listarMensagens(id,usuario.id);
    main.append(el('div',{class:'day-label'},curta(mensagens[0]?.enviadaEm)));
    for(const mensagem of mensagens)main.append(el('article',{class:'bubble'+(mensagem.autorId===usuario.id?' sent':'')},el('p',{},mensagem.texto),el('time',{datetime:mensagem.enviadaEm},hora(mensagem.enviadaEm))));
    const input=el('input',{class:'field',name:'mensagem','aria-label':'Mensagem',placeholder:'Escreva uma mensagem',required:true,maxlength:2000});
    document.querySelector('.mobile-shell').append(el('form',{class:'composer',onSubmit:event=>{event.preventDefault();const submit=event.currentTarget.querySelector('button');submit.disabled=true;try{enviarMensagem(id,input.value);input.value='';}catch(e){feedback(e.message);}finally{submit.disabled=false;}}},input,el('button',{class:'button',type:'submit'},'Enviar')));
    return;
  }
  const nova = botao('Nova conversa',()=>dialogo('Nova conversa',...dados.usuarios.filter(u=>u.perfil==='morador'&&u.id!==usuario.id).map(u=>botao(u.nome,()=>{try{const c=criarConversa(u.id);location.assign('mensagens.html?id='+c.id);}catch(e){feedback(e.message);}}))),'header-action');
  nova.prepend(icone('mensagens'));
  cabecalho('Mensagens',{acoes:[nova]});
  const search=el('input',{type:'search',class:'field','aria-label':'Buscar conversas',placeholder:'Buscar conversas'});
  const list=el('div',{class:'list-stack'});
  function render() {
    const itens=conversas.map(c=>({conversa:c,outro:dados.usuarios.find(u=>u.id===c.participanteIds.find(id=>id!==usuario.id))})).filter(x=>x.outro.nome.toLocaleLowerCase('pt-BR').includes(search.value.toLocaleLowerCase('pt-BR')));
    list.replaceChildren(...itens.map(({conversa,outro})=>{
      const historico=listarMensagens(conversa.id,usuario.id);
      const ultima=historico.at(-1);
      const naoLidas=historico.filter(m=>!m.lidaPorIds.includes(usuario.id)).length;
      return el('a',{href:'mensagens.html?id='+encodeURIComponent(conversa.id),class:'conversation-card'},avatar(outro.nome),el('div',{class:'grow'},el('strong',{},outro.nome),el('p',{},ultima?.texto??'Sem mensagens')),el('span',{class:'meta'},el('span',{},ultima?curta(ultima.enviadaEm)+' · '+hora(ultima.enviadaEm):''),naoLidas?el('span',{class:'count','aria-label':naoLidas+' não lidas'},String(naoLidas)):null));
    }));
    if(!itens.length)list.append(vazio('Nenhuma conversa encontrada.'));
  }
  search.addEventListener('input',render); main.append(el('div',{class:'search-field'},icone('busca'),search),list);render();navegacao('mensagens');
}
