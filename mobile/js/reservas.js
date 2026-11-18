import { REGRAS_ESPACOS, criarReserva, cancelarReserva, listarEspacos, listarReservas } from '../../shared/js/services/reservas.js';
import { hoje, diaValido } from '../../shared/js/services/base.js';
import { el, link, botao, card, cabecalho, navegacao, secundario, status, vazio, dialogo, data, hora, feedback } from './layout.js';
export function reservas({usuario,params,main}) {
  const espacos=listarEspacos(), minhas=listarReservas({moradorId:usuario.id});
  const estado=params.get('estado'), espaco=espacos.find(x=>x.id===params.get('espaco'));
  if(estado==='confirmada') {
    const item=minhas.find(x=>x.id===params.get('id'));
    cabecalho(item?.status==='Cancelada'?'Reserva cancelada':'Reserva confirmada',{voltar:'reservas.html?estado=minhas'});
    if(!item)main.append(vazio('Reserva não encontrada para este morador.'));
    else main.append(el('section',{class:'notice-panel notice-success reservation-confirmation'},el('h3',{},item.status==='Confirmada'?'Horário reservado':'Reserva cancelada')),cartao(item,espacos),link('Ver minhas reservas','reservas.html?estado=minhas','button'));
  } else if(estado==='minhas'||estado==='cancelada') {
    cabecalho('Minhas reservas',{voltar:'reservas.html'});
    for(const [titulo,itens] of [['Próximas',minhas.filter(r=>r.status==='Confirmada'&&Date.parse(r.inicio)>Date.now())],['Histórico',minhas.filter(r=>r.status==='Cancelada'||Date.parse(r.inicio)<=Date.now())]]) {
      main.append(el('h3',{},titulo));
      for(const r of itens){const section=cartao(r,espacos);if(titulo==='Próximas')section.append(botao('Cancelar reserva',()=>dialogo('Cancelar reserva?',secundario('O registro será preservado e o horário ficará disponível.'),botao('Confirmar cancelamento',()=>{try{cancelarReserva(r.id);location.assign('reservas.html?estado=minhas');}catch(e){feedback(e.message);}}))));main.append(section);}
      if(!itens.length)main.append(vazio('Nenhuma reserva nesta seção.'));
    }
  } else if(params.has('espaco')&&!espaco) {cabecalho('Espaço de lazer',{voltar:'reservas.html'});main.append(vazio('Espaço não encontrado.'));}
  else if(espaco)disponibilidade(espaco,{usuario,params,main});
  else {
    cabecalho('Espaços de lazer',{voltar:'servicos.html'});main.append(link('Minhas reservas','reservas.html?estado=minhas'));
    for(const e of espacos)main.append(card(el('h2',{},e.nome==='Quadra'?'Quadra esportiva':e.nome),secundario(REGRAS_ESPACOS[e.id].descricao),link('Consultar disponibilidade','reservas.html?espaco='+e.id)));
  }
  navegacao('servicos');
}
function cartao(r,espacos){const section=card(status(r.status),el('h2',{},espacos.find(e=>e.id===r.espacoId)?.nome),secundario(r.id),el('p',{class:'reservation-date'},data(r.inicio)+' · '+hora(r.inicio)+' às '+hora(r.fim)));section.classList.add('reservation-detail');section.dataset.reserva=r.id;return section;}
function disponibilidade(espaco,{usuario,params,main}) {
  cabecalho(espaco.nome,{voltar:'reservas.html'});
  const regras=REGRAS_ESPACOS[espaco.id];
  let dia=params.get('data')||hoje(), mes=dia.slice(0,7), selecionado=null;
  if(!diaValido(dia)){dia=hoje();mes=dia.slice(0,7);}
  const calendario=card(),agenda=card();
  main.append(card(el('h3',{},'Regras do espaço'),secundario(regras.descricao)),calendario,agenda);
  const confirmar=botao('Confirmar reserva',()=>{
    if(selecionado===null)return;confirmar.disabled=true;
    try{const [inicio,fim]=regras.faixas[selecionado];const r=criarReserva({espacoId:espaco.id,dia,inicio,fim});location.assign('reservas.html?estado=confirmada&id='+r.id);}
    catch(e){feedback(e.message);selecionado=null;render();}
  },'button');main.append(confirmar);
  function mudarMes(delta){const [ano,m]=mes.split('-').map(Number);const dt=new Date(ano,m-1+delta,1,12);mes=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');dia=mes+'-01';selecionado=null;render();}
  function render(){
    const url=new URL(location.href);url.searchParams.set('data',dia);history.replaceState(null,'',url);
    const registros=listarReservas({espacoId:espaco.id}).filter(r=>r.status==='Confirmada');
    const [ano,m]=mes.split('-').map(Number), total=new Date(ano,m,0).getDate(), primeiro=(new Date(ano,m-1,1).getDay()+6)%7;
    const grid=el('div',{class:'calendar-grid',role:'group','aria-label':'Dias do mês'});
    grid.append(...['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(x=>el('strong',{},x)),...Array.from({length:primeiro},()=>el('span',{'aria-hidden':'true'})));
    for(let numero=1;numero<=total;numero++){
      const d=mes+'-'+String(numero).padStart(2,'0'),tem=registros.some(r=>r.inicio.slice(0,10)===d);
      const b=el('button',{type:'button',class:'calendar-day'+(tem?' has-booking':''),'data-dia':numero,'aria-label':data(d+'T12:00:00-03:00')+(tem?', com reservas':''),'aria-pressed':String(d===dia),onClick:()=>{dia=d;selecionado=null;render();}},String(numero));b.disabled=d<hoje();grid.append(b);
    }
    calendario.replaceChildren(el('div',{class:'row row-between'},botao('‹',()=>mudarMes(-1),'icon-button'),el('h3',{},new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date(mes+'-01T12:00:00-03:00'))),botao('›',()=>mudarMes(1),'icon-button')),el('div',{class:'calendar'},grid));
    const slots=el('div',{class:'slot-list',role:'group','aria-label':'Horários'});
    regras.faixas.forEach(([inicio,fim],i)=>{
      const instante=h=>Date.parse(dia+'T'+String(h).padStart(2,'0')+':00:00-03:00');
      const conflitos=registros.filter(r=>Date.parse(r.inicio)<instante(fim)&&Date.parse(r.fim)>instante(inicio));
      const ocupado=conflitos.length>0,passado=instante(inicio)<=Date.now();
      if(selecionado===i&&(ocupado||passado))selecionado=null;
      const b=botao('',()=>{selecionado=i;render();});b.append(el('span',{},inicio+'h às '+fim+'h'),el('span',{},ocupado?(conflitos.some(r=>r.moradorId===usuario.id)?'Sua reserva':'Indisponível'):passado?'Encerrado':selecionado===i?'Selecionado':'Disponível'));b.disabled=ocupado||passado;b.setAttribute('aria-pressed',String(selecionado===i));slots.append(b);
    });
    agenda.replaceChildren(el('h3',{},data(dia+'T12:00:00-03:00')),slots);confirmar.disabled=selecionado===null;
    calendario.querySelectorAll('.icon-button')[0].setAttribute('aria-label','Mês anterior');calendario.querySelectorAll('.icon-button')[1].setAttribute('aria-label','Próximo mês');
  }
  render();
}
