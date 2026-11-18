import assert from 'node:assert/strict';
import { fixarRelogio, DIA_FUTURO } from './relogio.mjs';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as esperar } from 'node:timers/promises';

const origem = 'http://127.0.0.1:8232';
const depuracao = 'http://127.0.0.1:9362';
const perfil = await mkdtemp(join(tmpdir(), 'condoconnect-integracao-'));
const pastaCapturas = process.env.CONDO_CAPTURAS;
const edge = process.env.CONDO_EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const servidor = spawn(process.execPath, ['servir.mjs', '8232', ...(process.env.CONDO_PUBLICACAO ? ['--publicacao'] : [])], { stdio: 'inherit' });
const navegador = spawn(edge, [
  '--headless=new', '--remote-debugging-port=9362', '--user-data-dir=' + perfil,
  '--no-first-run', '--disable-background-timer-throttling', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const sockets = [];
let navegadorIsolado;
const erros = [];
let verificacoes = 0;
let capturas = 0;
function conferir(valor, esperado, descricao) {
  assert.deepEqual(valor, esperado, descricao);
  verificacoes++;
}

async function aguardar(operacao, contexto) {
  for (let tentativa = 0; tentativa < 100; tentativa++) {
    const resultado = await operacao();
    if (resultado) return resultado;
    await esperar(100);
  }
  console.error(JSON.stringify(erros));
  throw new Error('Tempo esgotado · ' + contexto);
}

async function aba(debug = depuracao) {
  const alvo = await fetch(debug + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  sockets.push(ws);
  await new Promise((ok, falha) => { ws.onopen = ok; ws.onerror = falha; });
  let id = 0;
  const pendentes = new Map();
  ws.onmessage = ({ data }) => {
    const mensagem = JSON.parse(data);
    if (mensagem.id) {
      const [ok, falha] = pendentes.get(mensagem.id);
      pendentes.delete(mensagem.id);
      if (mensagem.error) falha(mensagem.error);
      else ok(mensagem.result);
    }
    if (mensagem.method === 'Runtime.exceptionThrown') erros.push(mensagem.params);
    if (mensagem.method === 'Network.responseReceived' &&
        mensagem.params.response.status >= 400 &&
        !mensagem.params.response.url.endsWith('/favicon.ico')) erros.push(mensagem.params.response);
  };
  function chamar(method, params = {}) {
    const numero = ++id;
    return new Promise((ok, falha) => {
      const limite = setTimeout(() => falha(new Error('Sem resposta do navegador · ' + method)), 30000);
      pendentes.set(numero, [
        valor => { clearTimeout(limite); ok(valor); },
        erro => { clearTimeout(limite); falha(erro); },
      ]);
      ws.send(JSON.stringify({ id: numero, method, params }));
    });
  }
  async function avaliar(expression) {
    const resposta = await chamar('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true, userGesture: true,
    });
    if (resposta.exceptionDetails) throw new Error(JSON.stringify(resposta.exceptionDetails));
    return resposta.result.value;
  }
  await chamar('Runtime.enable');
  await fixarRelogio(chamar);
  await chamar('Network.enable');
  await chamar('Emulation.setFocusEmulationEnabled', { enabled: true });
  async function abrir(rota) {
    const documentoAnterior = await avaliar('performance.timeOrigin');
    await chamar('Page.navigate', { url: origem + rota });
    await aguardar(() => avaliar('location.pathname === ' + JSON.stringify(rota.split('?')[0]) +
      ' && performance.timeOrigin !== ' + documentoAnterior + ' && document.readyState === "complete" && !!document.querySelector("[data-pronto]")'), rota);
    await avaliar('document.fonts.ready.then(() => true)');
  }
  async function clicar(seletor) {
    await avaliar('document.querySelector(' + JSON.stringify(seletor) + ').click()');
  }
  return { chamar, avaliar, abrir, clicar };
}

async function captura(pagina, nome) {
  if (!pastaCapturas) return;
  await mkdir(pastaCapturas, { recursive: true });
  await pagina.chamar('Page.bringToFront');
  await pagina.avaliar('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  // Aguarda o compositor antes de capturar barras fixas após navegar entre documentos.
  await esperar(150);
  const imagem = await pagina.chamar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(pastaCapturas, nome + '.png'), Buffer.from(imagem.data, 'base64'));
  capturas++;
}



const dia=DIA_FUTURO;
async function preencher(p,valores){await p.avaliar('for(const [name,value] of Object.entries('+JSON.stringify(valores)+')){const c=document.getElementsByName(name)[0];c.value=value;c.dispatchEvent(new Event("input",{bubbles:true}));c.dispatchEvent(new Event("change",{bubbles:true}));}');}
async function contem(p,texto){return p.avaliar('document.querySelector("main")?.textContent.includes('+JSON.stringify(texto)+')');}
async function login(p,perfil,id){
 if(perfil==='morador'){await p.abrir('/mobile/login.html');if(id)await preencher(p,{'morador-demo':id});await p.clicar('.login-demo button');await aguardar(()=>p.avaliar('location.pathname==="/mobile/inicio.html"&&document.querySelector("[data-pronto]")'),'login morador');}
 else {await p.chamar('Page.navigate',{url:origem+'/web/login.html'});await aguardar(()=>p.avaliar('!!document.querySelector("[data-acessos]:not([hidden])")'),'login Web');await p.clicar('[data-perfil='+perfil+']');await aguardar(()=>p.avaliar('location.pathname.includes("dashboard")&&!!document.querySelector("[data-pronto]")'),'login Web concluído');}
}
try {
 await aguardar(()=>fetch(depuracao+'/json/version').then(r=>r.ok).catch(()=>false),'Edge');
 const portaria=await aba(),admin=await aba(),marina=await aba(),gabriel=await aba();
 await login(portaria,'porteiro');await login(admin,'administrador');await login(marina,'morador');await login(gabriel,'morador','MOR-302-02');
 conferir(await marina.avaliar('new Date().toISOString()'),'2026-11-18T15:00:00.000Z','relógio fixo');
 conferir(await marina.avaliar(`(()=>{const nova=window.open('about:blank');if(!nova)return null;const sessao=JSON.parse(nova.sessionStorage.getItem('condoconnect.sessao.v1'));nova.close();return sessao.usuarioId;})()`),'MOR-302-01','aba com opener recebe cópia inicial de sessão');
 conferir(await gabriel.avaliar('JSON.parse(sessionStorage.getItem("condoconnect.sessao.v1")).usuarioId'),'MOR-302-02','sessões distintas');
 await marina.abrir('/mobile/encomendas.html');await portaria.abrir('/web/portaria/encomendas.html?estado=registrar');
 await preencher(portaria,{observacao:'Pacote fictício integrado'});await portaria.avaliar('document.querySelector("form.card").requestSubmit();document.querySelector("form.card").requestSubmit()');
 await aguardar(()=>portaria.avaliar('document.querySelector("h1")?.textContent==="Encomenda registrada"'),'registro UI');
 conferir(await portaria.avaliar('(async()=> (await import("/shared/js/storage.js")).carregarDados().dados.encomendas.length)()'),6,'duplo envio não duplica encomenda');
 const encomenda=await portaria.avaliar('new URLSearchParams(location.search).get("id")');
 await aguardar(()=>contem(marina,encomenda),'encomenda aparece sem recarregar');verificacoes++;
 await marina.abrir('/mobile/encomendas.html?id='+encomenda);await portaria.abrir('/web/portaria/encomendas.html?estado=confirmar&id='+encomenda);await portaria.clicar('[type=submit]');
 await aguardar(()=>contem(marina,'Retirada confirmada'),'retirada atualiza outra aba');verificacoes++;
 await portaria.abrir('/web/portaria/dashboard.html');conferir(await portaria.avaliar('document.querySelector(".indicator-number")?.textContent'),'2','indicador pendentes após entrega');
 await gabriel.abrir('/mobile/encomendas.html');conferir(await contem(gabriel,encomenda),false,'encomenda não vaza para mesma unidade');
 await admin.abrir('/web/administracao/solicitacoes.html');await marina.abrir('/mobile/solicitacoes.html?estado=nova');
 await preencher(marina,{titulo:'Chamado integrado fictício',especifico:'Jardim',descricao:'Descrição do chamado fictício',prioridade:'Alta'});await marina.clicar('[type=submit]');
 await aguardar(()=>marina.avaliar('document.querySelector("h1")?.textContent==="Acompanhar solicitação"'),'criação UI');
 const solicitacao=await marina.avaliar('new URLSearchParams(location.search).get("id")');
 await aguardar(()=>contem(admin,'Chamado integrado fictício'),'solicitação aparece no admin sem recarregar');verificacoes++;
 await admin.abrir('/web/administracao/solicitacoes.html?estado=triagem&id='+solicitacao);
 for(const status of ['Em análise','Em andamento','Concluído']){
  await preencher(admin,{responsabilidade:'Condomínio',encaminhamento:'Atendimento fictício: '+status,status});await admin.clicar('[type=submit]');
  await aguardar(()=>admin.avaliar('document.querySelector(".triage-grid .status")?.textContent === '+JSON.stringify(status)),'triagem '+status);
  await aguardar(()=>marina.avaliar('document.querySelector(".request-detail .status")?.textContent === '+JSON.stringify(status)),'Mobile '+status);verificacoes++;
 }
 conferir(await marina.avaliar('document.querySelectorAll(".timeline li").length'),4,'histórico completo');
 await admin.abrir('/web/administracao/dashboard.html');conferir(await admin.avaliar('document.querySelector(".indicator-number")?.textContent'),'2','concluída sai do indicador');
 await admin.abrir('/web/administracao/reservas.html?data='+dia);await marina.abrir('/mobile/reservas.html?espaco=ESP-003&data='+dia);
 await marina.clicar('.slot-list button:nth-child(2)');await marina.clicar('main > button');await aguardar(()=>marina.avaliar('location.search.includes("estado=confirmada")'),'reserva UI');
 const reserva=await marina.avaliar('new URLSearchParams(location.search).get("id")');
 await preencher(admin,{espaco:'ESP-003'});await aguardar(()=>contem(admin,reserva),'agenda compartilhada');verificacoes++;
 await gabriel.abrir('/mobile/reservas.html?espaco=ESP-003&data='+dia);conferir(await gabriel.avaliar('document.querySelector(".slot-list button:nth-child(2)")?.disabled'),true,'bloqueio na outra aba');
 conferir(await gabriel.avaliar('(async()=>{try{(await import("/shared/js/services/reservas.js")).criarReserva({espacoId:"ESP-003",dia:'+JSON.stringify(dia)+',inicio:10,fim:11});return false;}catch(e){return e.message.includes("ocupado");}})()'),true,'serviço impede conflito');
 await gabriel.clicar('.slot-list button:nth-child(3)');await gabriel.clicar('main > button');await aguardar(()=>gabriel.avaliar('location.search.includes("estado=confirmada")'),'intervalo consecutivo');verificacoes++;
 await marina.abrir('/mobile/reservas.html?estado=minhas');await marina.clicar('[data-reserva="'+reserva+'"] button');await marina.clicar('dialog button');await aguardar(()=>contem(marina,'Cancelada'),'cancelamento UI');
 await gabriel.abrir('/mobile/reservas.html?espaco=ESP-003&data='+dia);conferir(await gabriel.avaliar('document.querySelector(".slot-list button:nth-child(2)")?.disabled'),false,'horário liberado');
 await marina.abrir('/mobile/inicio.html');await portaria.abrir('/web/portaria/comunicados.html');
 async function publicar(titulo,publico){await admin.abrir('/web/administracao/comunicados.html?estado=novo');await preencher(admin,{titulo,mensagem:'Conteúdo fictício '+titulo,torre:'',publico});await admin.clicar('[type=submit]');await aguardar(()=>admin.avaliar('location.search===""&&document.querySelector("tbody")?.textContent.includes('+JSON.stringify(titulo)+')'),'publicação UI');}
 await publicar('Aviso geral integrado','geral');await aguardar(()=>contem(marina,'Aviso geral integrado'),'comunicado morador');await aguardar(()=>contem(portaria,'Aviso geral integrado'),'comunicado portaria');verificacoes+=2;
 await publicar('Aviso exclusivo Portaria','portaria');await aguardar(()=>contem(portaria,'Aviso exclusivo Portaria'),'público portaria');conferir(await contem(marina,'Aviso exclusivo Portaria'),false,'público restrito');
 await publicar('Aviso exclusivo Moradores','moradores');await aguardar(()=>contem(marina,'Aviso exclusivo Moradores'),'público moradores');conferir(await contem(portaria,'Aviso exclusivo Moradores'),false,'portaria sem comunicado privado moradores');
 await marina.abrir('/mobile/mensagens.html');await gabriel.abrir('/mobile/mensagens.html');await marina.clicar('.header-action');
 await marina.avaliar('[...document.querySelectorAll("dialog button")].find(b=>b.textContent==="Gabriel Lopes").click()');
 await aguardar(()=>marina.avaliar('!!document.querySelector(".composer")'),'nova conversa UI');const conversa=await marina.avaliar('new URLSearchParams(location.search).get("id")');
 await preencher(marina,{mensagem:'Mensagem integrada fictícia'});await marina.clicar('.composer button');
 await aguardar(()=>contem(gabriel,'Mensagem integrada fictícia'),'mensagem aparece na outra aba');conferir(await gabriel.avaliar('document.querySelector(".conversation-card .count")?.textContent'),'1','indicador não lida');
 await gabriel.abrir('/mobile/mensagens.html?id='+conversa);await preencher(gabriel,{mensagem:'Resposta integrada fictícia'});await gabriel.clicar('.composer button');await aguardar(()=>contem(marina,'Resposta integrada fictícia'),'resposta na aba aberta');verificacoes++;
 await marina.abrir('/mobile/mensagens.html?id='+conversa);conferir(await contem(marina,'Resposta integrada fictícia'),true,'mensagem persiste ao reabrir');
 await marina.abrir('/mobile/notificacoes.html');const quantidade=await marina.avaliar('document.querySelectorAll("main .card").length');conferir(quantidade>=9,true,'notificações de todos os módulos');
 await marina.avaliar('[...document.querySelectorAll("main button")].find(b=>b.textContent==="Marcar como lida")?.click()');await aguardar(()=>contem(marina,'Lida'),'leitura persistida');
 await marina.abrir('/mobile/notificacoes.html');conferir(await marina.avaliar('document.querySelectorAll("main .card").length'),quantidade,'sem notificações duplicadas');
 // Outro perfil de navegador, na mesma origem, mantém base e sessão próprias.
 const isolado=await mkdtemp(join(tmpdir(),'condoconnect-isolado-'));
 navegadorIsolado=spawn(edge,['--headless=new','--remote-debugging-port=9363','--user-data-dir='+isolado,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});
 await aguardar(()=>fetch('http://127.0.0.1:9363/json/version').then(r=>r.ok).catch(()=>false),'segundo perfil Edge');
 const independente=await aba('http://127.0.0.1:9363');await independente.abrir('/mobile/login.html');
 conferir(await independente.avaliar('sessionStorage.getItem("condoconnect.sessao.v1")'),null,'sem sessão no perfil independente');
 conferir(await independente.avaliar('(async()=>JSON.stringify((await import("/shared/js/storage.js")).carregarDados().dados)===JSON.stringify((await import("/shared/js/data/demo-data.js")).criarDadosDemo()))()'),true,'base independente sem alterações das outras abas');
 // Redimensionamento com registros novos e IDs extensos.
 for(const width of [320,360,375,390,430]){await marina.chamar('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});for(const rota of ['/mobile/inicio.html','/mobile/encomendas.html','/mobile/mensagens.html','/mobile/notificacoes.html','/mobile/solicitacoes.html?id='+solicitacao,'/mobile/reservas.html?estado=minhas']){await marina.abrir(rota);conferir(await marina.avaliar('document.documentElement.scrollWidth<=innerWidth'),true,'dados dinâmicos sem overflow '+width+' '+rota);}}
 await captura(marina,'integracao-mobile');await admin.chamar('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await captura(admin,'integracao-administracao');
 // Exceção de quota: nenhum sucesso nem gravação parcial.
 conferir(await marina.avaliar('(async()=>{const st=await import("/shared/js/storage.js");const before=JSON.stringify(st.carregarDados().dados);const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException("Quota","QuotaExceededError")};try{(await import("/shared/js/services/solicitacoes.js")).criarSolicitacao({tipo:"Outros",local:"Área comum",titulo:"Falha",descricao:"Teste",prioridade:"Normal"});return false;}catch{ return JSON.stringify(st.carregarDados().dados)===before; }finally{Storage.prototype.setItem=original;}})()'),true,'falha armazenamento sem escrita parcial');
 await marina.abrir('/mobile/perfil.html');await marina.avaliar('[...document.querySelectorAll("main button")].find(b=>b.textContent==="Restaurar dados da demonstração").click()');conferir(await marina.avaliar('!!document.querySelector("dialog[open]")'),true,'confirmação visual restauração');await marina.clicar('dialog button');
 await aguardar(()=>marina.avaliar('!document.querySelector("dialog")'),'fechar confirmação sem restaurar');verificacoes++;
 await portaria.abrir('/web/portaria/dashboard.html');await gabriel.abrir('/mobile/mensagens.html');
 await marina.avaliar('[...document.querySelectorAll("main button")].find(b=>b.textContent==="Restaurar dados da demonstração").click()');await marina.clicar('dialog button:last-child');
 await aguardar(()=>gabriel.avaliar('!document.querySelector("main")?.textContent.includes("Mensagem integrada fictícia")'),'restauração outras abas');
 conferir(await portaria.avaliar('document.querySelector(".indicator-number")?.textContent'),'2','indicador restaurado');
 conferir(await marina.avaliar('(async()=>JSON.stringify((await import("/shared/js/storage.js")).carregarDados().dados)===JSON.stringify((await import("/shared/js/data/demo-data.js")).criarDadosDemo()))()'),true,'estado restaurado determinístico');
 conferir(erros,[],'exceções JS e HTTP');console.log(JSON.stringify({verificacoes,falhas:0,capturas,abas:4,fluxos:5}));
} finally {for(const ws of sockets)ws.close();navegadorIsolado?.kill();navegador.kill();servidor.kill();}
