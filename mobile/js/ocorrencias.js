import { listarEncomendas } from '../../shared/js/services/encomendas.js';
import { criarSolicitacao, listarSolicitacoes } from '../../shared/js/services/solicitacoes.js';
import { el, link, botao, card, cabecalho, navegacao, secundario, status, filtros, campo, vazio, data, curta, hora, unidadeTexto, feedback } from './layout.js';
const detalhe = entries => el('dl',{},entries.map(([label,value])=>el('div',{},el('dt',{},label),el('dd',{},value??'Não informado'))));
export function encomendas({usuario,params,main,unidade}) {
  const itens=listarEncomendas({moradorId:usuario.id});
  const id=params.get('id');
  if(id) {
    cabecalho('Encomenda',{voltar:'encomendas.html'});
    const item=itens.find(x=>x.id===id);
    if(!item){main.append(vazio('Encomenda não encontrada para este morador.'));navegacao('encomendas');return;}
    const entregue = item.status === 'Entregue';
    const retirada = item.retiradaEm;
    const section = card(el('h2',{},'Encomenda '+item.id),status(entregue?'Entregue':item.status),detalhe([
      ['Destinatária',usuario.nome],['Unidade',unidadeTexto(unidade)],['Transportadora',item.transportadora],['Recebida em',curta(item.recebidaEm)+' · '+hora(item.recebidaEm)],
      ...(entregue?[['Retirada confirmada em',retirada?curta(retirada)+' · '+hora(retirada):'Não informada']]:[]),
    ]));
    section.classList.add('parcel-detail'); main.append(section);
    main.append(el('section',{class:'notice-panel '+(entregue?'notice-success':'notice-info')},el('h3',{},entregue?'Retirada confirmada':'Retirada na portaria'),
      el('p',{},entregue?'A portaria registrou a entrega da encomenda.':'Informe sua unidade na portaria.'),entregue?null:el('p',{},'A equipe confirma a retirada no sistema.')));
    if(entregue) main.append(card(detalhe([['Retirado por',item.retiradoPorNome ?? item.retiradoPorId],['Observação',item.observacao]])));
  } else {
    cabecalho('Encomendas');main.append(secundario('Consulte as entregas da sua unidade.'));
    const list=el('div',{class:'list-stack'});
    function render(filter) {
      const selecionados=itens.filter(x=>filter==='Todas'||(filter==='Pendentes'?x.status==='Aguardando retirada':x.status==='Entregue'));
      list.replaceChildren(...selecionados.map(item=>card(el('h2',{},item.id),status(item.status),secundario(item.retiradaEm?'Retirada em '+curta(item.retiradaEm)+' às '+hora(item.retiradaEm):`${item.transportadora??'Transportadora não informada'} · Recebida em ${curta(item.recebidaEm)} às ${hora(item.recebidaEm)}`),link('Ver detalhes','encomendas.html?id='+encodeURIComponent(item.id)))));
      if(!selecionados.length)list.append(vazio('Nenhuma encomenda neste filtro.'));
    }
    main.append(filtros(['Todas','Pendentes','Entregues'],render),list);render('Todas');
  }
  navegacao('encomendas');
}
export function solicitacoes(ctx) {
  const {usuario,params,main,unidade}=ctx;
  const itens=listarSolicitacoes({moradorId:usuario.id});
  const estado=params.get('estado'); const id=params.get('id');
  if(estado==='nova') {
    cabecalho('Nova solicitação',{voltar:'solicitacoes.html'});
    const form=el('form',{class:'form-stack',onSubmit:async event=>{event.preventDefault();
      const submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;let sucesso=false;
      try {
        const valores=Object.fromEntries(new FormData(form)); delete valores.imagem;
        const file=form.querySelector('[type=file]').files[0];
        if(file){
          if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>100*1024)throw new Error('Use PNG, JPEG ou WebP de até 100 KB.');
          valores.imagem=await new Promise((ok,falha)=>{const reader=new FileReader();reader.onload=()=>ok(reader.result);reader.onerror=()=>falha(new Error('Não foi possível ler a imagem.'));reader.readAsDataURL(file);});
        }
        const s=criarSolicitacao(valores);sucesso=true;location.assign('solicitacoes.html?id='+s.id);
      } catch(e){feedback(e.message);} finally{submit.disabled=sucesso;}
    }},
      campo('Local da ocorrência','local',{opcoes:['Dentro da unidade','Área comum']}),
      el('p',{class:'info-strip'},'A administração vai avaliar a responsabilidade.'),
      el('div',{class:'form-row'},campo('Tipo de serviço','tipo',{opcoes:['Vazamento','Elétrica','Limpeza','Outros']}),campo('Prioridade','prioridade',{opcoes:['Normal','Alta','Baixa']})),
      campo('Título','titulo',{placeholder:'Vazamento na cozinha'}),campo('Local específico','especifico',{placeholder:unidadeTexto(unidade)+' · cozinha'}),
      campo('Descrição','descricao',{tipo:'textarea',placeholder:'Há água sob a pia, mesmo com a torneira fechada.'}));
    const arquivo=el('input',{type:'file',id:'imagem',name:'imagem',accept:'image/png,image/jpeg,image/webp',hidden:true});
    const nome=el('p',{class:'meta','aria-live':'polite'});
    arquivo.addEventListener('change',()=>{nome.textContent=arquivo.files[0]?'Imagem local (até 100 KB): '+arquivo.files[0].name:'';});
    form.append(arquivo,botao('Anexar imagem (opcional)',()=>arquivo.click()),nome,el('button',{type:'submit',class:'button'},'Enviar solicitação'),secundario('Demonstração local. Imagem opcional: PNG, JPEG ou WebP até 100 KB.'));
    for(const input of form.querySelectorAll('input[type=text],textarea'))input.maxLength=input.tagName==='TEXTAREA'?3000:150;
    main.append(form);
  } else if(id) {
    cabecalho('Acompanhar solicitação',{voltar:'solicitacoes.html'});
    const item=itens.find(x=>x.id===id);
    if(!item){main.append(vazio('Solicitação não encontrada para este morador.'));navegacao('servicos');return;}
    const section = card(el('p',{class:'meta'},el('strong',{},item.id)),el('h2',{},item.titulo),status(item.status),
      el('div',{class:'request-info'},el('span',{class:'meta'},'Local'),el('p',{},el('strong',{},item.local)),
        el('span',{class:'meta'},'Responsabilidade'),el('p',{},el('strong',{},item.responsabilidade + (item.responsavel ? ' · ' + item.responsavel : '')))),secundario(item.descricao));
    section.classList.add('request-detail'); main.append(section);
    const passos=[...item.historico].reverse();
    main.append(card(el('h2',{},'Andamento'),el('ol',{class:'timeline'},passos.length?passos.map(h=>el('li',{},el('strong',{},h.status),el('small',{},data(h.em)+' · '+hora(h.em)),el('p',{},h.descricao))):el('li',{},'Registro fictício anterior à integração · '+item.status))));
    if(item.imagem)main.append(card(el('img',{src:item.imagem,alt:'Imagem da solicitação',style:'max-width:100%;max-height:240px;object-fit:contain'})));
  } else {
    cabecalho('Solicitações',{voltar:'servicos.html'});
    main.append(link('Nova solicitação','solicitacoes.html?estado=nova','button'));
    const list=el('div',{class:'list-stack'});
    function render(filter) {
      const selecionados=itens.filter(x=>filter==='Todas'||(filter==='Concluídas'?x.status==='Concluído':x.status!=='Concluído'));
      list.replaceChildren(...selecionados.map(item=>card(el('p',{class:'meta'},el('strong',{},item.id)),el('h2',{},item.titulo),secundario(item.local),status(item.status),link('Ver andamento','solicitacoes.html?id='+encodeURIComponent(item.id)))));
      if(!selecionados.length)list.append(vazio('Nenhuma solicitação neste filtro.'));
    }
    main.append(filtros(['Todas','Em aberto','Concluídas'],render),list);render('Todas');
  }
  navegacao('servicos');
}
