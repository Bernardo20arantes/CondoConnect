import assert from 'node:assert/strict';
import { fixarRelogio, DIA_FUTURO } from './relogio.mjs';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as esperar } from 'node:timers/promises';

const origem = 'http://127.0.0.1:8231';
const depuracao = 'http://127.0.0.1:9361';
const perfil = await mkdtemp(join(tmpdir(), 'condoconnect-mobile-'));
const pastaCapturas = process.env.CONDO_CAPTURAS;
const edge = process.env.CONDO_EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const servidor = spawn(process.execPath, ['servir.mjs', '8231', ...(process.env.CONDO_PUBLICACAO ? ['--publicacao'] : [])], { stdio: 'inherit' });
const navegador = spawn(edge, [
  '--headless=new', '--remote-debugging-port=9361', '--user-data-dir=' + perfil,
  '--no-first-run', '--disable-background-timer-throttling', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const sockets = [];
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
  throw new Error('Tempo esgotado · ' + contexto);
}

async function aba() {
  const alvo = await fetch(depuracao + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
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


const rotas = [
  ['inicio.html','CondoConnect','inicio'],
  ['mensagens.html','Mensagens','mensagens'],
  ['mensagens.html?id=CNV-001','Rafael Costa',null],
  ['mensagens.html?id=CNV-002','Lívia Martins',null],
  ['encomendas.html','Encomendas','encomendas'],
  ['encomendas.html?id=ENC-024','Encomenda','encomendas'],
  ['encomendas.html?id=ENC-024&estado=entregue','Encomenda','encomendas'],
  ['servicos.html','Serviços','servicos'],
  ['solicitacoes.html','Solicitações','servicos'],
  ['solicitacoes.html?estado=nova','Nova solicitação','servicos'],
  ['solicitacoes.html?id=SOL-018','Acompanhar solicitação','servicos'],
  ...['Aberto','Em análise','Em andamento','Concluído'].map(s=>['solicitacoes.html?id=SOL-018&visual='+encodeURIComponent(s),'Acompanhar solicitação','servicos']),
  ['reservas.html','Espaços de lazer','servicos'],
  ['reservas.html?espaco=ESP-001','Salão de festas','servicos'],
  ['reservas.html?espaco=ESP-002','Churrasqueira','servicos'],
  ['reservas.html?espaco=ESP-003','Quadra','servicos'],
  ['reservas.html?estado=minhas','Minhas reservas','servicos'],
  ['reservas.html?estado=confirmada&id=RES-021','Reserva confirmada','servicos'],
  ['reservas.html?estado=cancelada&id=RES-021','Minhas reservas','servicos'],
  ['notificacoes.html','Notificações',null],
  ['perfil.html','Perfil',null],
  ['comunicados.html?id=COM-003','Comunicados','inicio'],
];
const snapshot='JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))';
try {
  await aguardar(()=>fetch(depuracao+'/json/version').then(r=>r.ok).catch(()=>false),'Edge');
  const p=await aba();
  await p.abrir('/mobile/login.html');
  conferir(await p.avaliar('new Date().toISOString()'),'2026-11-18T15:00:00.000Z','relógio fixo');
  const loginBase=await p.avaliar(snapshot);
  for(const width of [320,360,375,390,430]) {
    await p.chamar('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    conferir(await p.avaliar('document.documentElement.scrollWidth<=innerWidth'),true,'login sem overflow '+width);
    if(width===390)await captura(p,'00-login');
  }
  await p.clicar('.login-demo button');
  await aguardar(()=>p.avaliar('location.pathname==="/mobile/inicio.html" && !!document.querySelector("[data-pronto]")'),'entrada');
  conferir(await p.avaliar('JSON.parse(sessionStorage.getItem("condoconnect.sessao.v1")).perfil'),'morador','perfil');
  const base=await p.avaliar(snapshot);
  const links=new Set();
  for(const width of [320,360,375,390,430]) {
    await p.chamar('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    for(const [index,[route,title,active]] of rotas.entries()) {
      await p.abrir('/mobile/'+route);
      conferir(await p.avaliar('document.querySelector("h1")?.textContent'),title,route);
      conferir(await p.avaliar('document.documentElement.scrollWidth<=innerWidth'),true,'sem overflow '+width+' '+route);
      conferir(await p.avaliar('document.querySelector("[data-navegacao] [aria-current]")?.getAttribute("href")??null'),active?active+'.html':null,'módulo ativo');
      conferir(await p.avaliar(`[...document.querySelectorAll('input:not([type=file]),select,textarea')].every(e=>e.getAttribute('aria-label')||document.querySelector('label[for="'+e.id+'"]'))`),true,'campos rotulados');
      conferir(await p.avaliar('document.querySelectorAll("h1").length'),1,'título único');
      conferir(await p.avaliar(`(()=>{const n=document.querySelector('[data-navegacao]');if(n.hidden)return true;const r=n.getBoundingClientRect();return r.height>=60&&Math.abs(r.bottom-innerHeight)<=1&&parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom)>=r.height;})()`),true,'barra visível e conteúdo com espaço inferior');
      conferir(await p.avaliar(`[...document.querySelectorAll('main a,main button,main input,main select,main textarea')].every(e=>{const r=e.getBoundingClientRect();return !r.width||(r.left>=0&&r.right<=innerWidth+1);})`),true,'controles contidos');
      for(const href of await p.avaliar('[...document.querySelectorAll("a[href]")].map(a=>a.href).filter(h=>h.startsWith(location.origin)&&!h.includes("#"))'))links.add(href);
      if(width===390)await captura(p,String(index+1).padStart(2,'0')+'-'+route.replace(/[^a-z0-9]/gi,'-'));
    }
  }
  for(const href of links)conferir((await fetch(href)).status,200,'link '+href);
  conferir(await p.avaliar('document.fonts.check("400 16px Inter")'),true,'Inter');
  await p.abrir('/mobile/mensagens.html');
  await p.avaliar('const busca=document.querySelector("[type=search]");busca.value="Rafael";busca.dispatchEvent(new Event("input"))');
  conferir(await p.avaliar('document.querySelectorAll(".conversation-card").length'),1,'busca de conversa');
  await p.avaliar('document.querySelector("[type=search]").value="Inexistente";document.querySelector("[type=search]").dispatchEvent(new Event("input"))');
  conferir(await p.avaliar('document.querySelector("main")?.textContent.includes("Nenhuma conversa")'),true,'busca vazia');
  await p.avaliar('document.querySelector(".header-action").focus()');
  await p.clicar('.header-action');
  conferir(await p.avaliar('!!document.querySelector("dialog[open]")'),true,'nova conversa demonstrativa');
  await p.chamar('Page.bringToFront');
  await p.chamar('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await p.chamar('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await aguardar(()=>p.avaliar('!document.querySelector("dialog")'),'fechar diálogo');
  conferir(await p.avaliar('document.activeElement.className'),'header-action','restaurar foco');
  await p.abrir('/mobile/mensagens.html?id=CNV-001');
  await p.avaliar('document.querySelector("[name=mensagem]").value="<img src=x onerror=alert(1)>"');
  await p.clicar('.composer button');
  await aguardar(()=>p.avaliar('document.querySelector(".bubble:last-of-type p")?.textContent === "<img src=x onerror=alert(1)>"'),'mensagem persistida');
  conferir(await p.avaliar('document.querySelectorAll("main img").length'),0,'sem interpretação de HTML');
  await p.avaliar('document.querySelector("[name=mensagem]").value="x".repeat(2000)');
  await p.clicar('.composer button');
  await aguardar(()=>p.avaliar('document.querySelector(".bubble:last-of-type p")?.textContent.length === 2000'),'mensagem no limite');
  await p.chamar('Emulation.setDeviceMetricsOverride',{width:320,height:844,deviceScaleFactor:1,mobile:true});
  conferir(await p.avaliar('document.documentElement.scrollWidth<=innerWidth'),true,'mensagem sem espaços não transborda');
  await p.abrir('/mobile/mensagens.html');
  conferir(await p.avaliar('document.documentElement.scrollWidth<=innerWidth'),true,'resumo longo não transborda');
  await p.abrir('/mobile/encomendas.html');
  await p.clicar('.filters button:nth-child(3)');
  conferir(await p.avaliar('document.querySelector("main")?.textContent.includes("Nenhuma encomenda")'),true,'filtro sem entregues da Marina');
  await p.abrir('/mobile/solicitacoes.html?estado=nova');
  await p.clicar('button[type=submit]');
  conferir(await p.avaliar('location.search'),'?estado=nova','formulário vazio não envia');
  await p.avaliar('for(const [id,value] of Object.entries({titulo:"Ocorrência fictícia",especifico:"Torre A · 302",descricao:"Descrição fictícia"}))document.getElementById(id).value=value');
  await p.clicar('button[type=submit]');
  await aguardar(()=>p.avaliar('document.querySelector("h1")?.textContent === "Acompanhar solicitação"'),'solicitação persistida');
  conferir(await p.avaliar('document.querySelector(".request-detail")?.textContent.includes("Ocorrência fictícia")'),true,'formulário cria solicitação');
  await captura(p,'24-solicitacao-persistida');
  const dia=DIA_FUTURO;
  await p.abrir('/mobile/reservas.html?espaco=ESP-003&data=2026-02-30');
  conferir(await p.avaliar('new URLSearchParams(location.search).get("data")'),'2026-11-18','query com dia inexistente volta a hoje');
  await p.abrir('/mobile/reservas.html?espaco=ESP-003&data='+dia);
  const mesInicial=await p.avaliar('document.querySelector(".calendar").parentElement.querySelector("h3").textContent');
  await p.clicar('[aria-label="Próximo mês"]');
  conferir(await p.avaliar('document.querySelector(".calendar").parentElement.querySelector("h3").textContent')!==mesInicial,true,'navegação mensal');
  await p.clicar('[aria-label="Mês anterior"]');
  await p.clicar('[data-dia="'+Number(dia.slice(8,10))+'"]');
  conferir(await p.avaliar('document.querySelector("main > button")?.disabled'),true,'confirmar exige horário');
  conferir(await p.avaliar('document.querySelectorAll(".calendar-day").length'),new Date(Number(dia.slice(0,4)),Number(dia.slice(5,7)),0).getDate(),'calendário dinâmico');
  await p.clicar('.slot-list button');await p.clicar('main > button');
  await aguardar(()=>p.avaliar('document.querySelector("h1")?.textContent === "Reserva confirmada"'),'reserva persistida');
  const reserva=await p.avaliar('new URLSearchParams(location.search).get("id")');
  conferir(!!reserva,true,'identificador atribuído');await captura(p,'25-reserva-confirmada');
  await p.abrir('/mobile/reservas.html?espaco=ESP-003&data='+dia);
  conferir(await p.avaliar('document.querySelector(".slot-list button")?.disabled'),true,'ocupado inclusive para proprietário');
  await p.abrir('/mobile/reservas.html?estado=minhas');
  await p.clicar('[data-reserva="'+reserva+'"] button');await p.clicar('dialog button');
  await aguardar(()=>p.avaliar('!document.querySelector("dialog") && document.querySelector("main")?.textContent.includes("Cancelada")'),'cancelamento persistido');await captura(p,'26-reserva-cancelada');
  await p.abrir('/mobile/reservas.html?estado=confirmada&id='+reserva);
  conferir(await p.avaliar('document.querySelector("h1")?.textContent'),'Reserva cancelada','URL antiga de confirmação mostra cancelamento atual');
  await p.abrir('/mobile/reservas.html?espaco=ESP-003&data='+dia);
  conferir(await p.avaliar('document.querySelector(".slot-list button")?.disabled'),false,'cancelamento libera horário');
  for(const route of ['encomendas.html?id=ENC-023','solicitacoes.html?id=SOL-013','mensagens.html?id=CNV-003','reservas.html?espaco=INVALIDO']) {
    await p.abrir('/mobile/'+route);
    conferir(await p.avaliar('document.querySelector("main")?.textContent.includes("não encontrad")'),true,'registro não pertencente ou ausente');
  }
  await p.abrir('/mobile/notificacoes.html');
  conferir(await p.avaliar('document.querySelectorAll("main .card").length>=3'),true,'eventos dos fluxos');
  await p.abrir('/mobile/solicitacoes.html');
  conferir(await p.avaliar('document.querySelector("main")?.textContent.includes("Ocorrência fictícia")'),true,'persistência após reabertura');
  await p.abrir('/mobile/perfil.html');await p.clicar('.danger');
  await aguardar(()=>p.avaliar('location.pathname==="/mobile/login.html"'),'saída');
  conferir(await p.avaliar('sessionStorage.getItem("condoconnect.sessao.v1")'),null,'sessão encerrada');
  await p.chamar('Page.navigate',{url:origem+'/mobile/inicio.html'});
  await aguardar(()=>p.avaliar('location.pathname==="/mobile/login.html"'),'sem sessão');verificacoes++;
  conferir(erros,[],'exceções JS e recursos HTTP');
  console.log(JSON.stringify({rotas:rotas.length,larguras:[320,360,375,390,430],verificacoes,falhas:0,capturas,loginSemGravacao:loginBase==='{}'}));
} finally {
  for(const ws of sockets)ws.close();navegador.kill();servidor.kill();
}

