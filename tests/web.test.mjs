import assert from 'node:assert/strict';
import { fixarRelogio } from './relogio.mjs';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as esperar } from 'node:timers/promises';

const origem = 'http://127.0.0.1:8230';
const depuracao = 'http://127.0.0.1:9360';
const perfil = await mkdtemp(join(tmpdir(), 'condoconnect-web-'));
const pastaCapturas = process.env.CONDO_CAPTURAS;
const edge = process.env.CONDO_EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const servidor = spawn(process.execPath, ['servir.mjs', '8230', ...(process.env.CONDO_PUBLICACAO ? ['--publicacao'] : [])], { stdio: 'inherit' });
const navegador = spawn(edge, [
  '--headless=new', '--remote-debugging-port=9360', '--user-data-dir=' + perfil,
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
  console.error(JSON.stringify(erros));
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
  const imagem = await pagina.chamar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(join(pastaCapturas, nome + '.png'), Buffer.from(imagem.data, 'base64'));
  capturas++;
}

async function prepararLogin(pagina, perfil) {
  await pagina.chamar('Page.navigate', { url: origem + '/web/login.html' });
  await aguardar(() => pagina.avaliar('!!document.querySelector("[data-acessos]:not([hidden])")'), 'login');
  await pagina.clicar('[data-perfil="' + perfil + '"]');
  await aguardar(() => pagina.avaliar('!!document.querySelector("[data-pronto]")'), perfil);
}

const rotas = [
  ['portaria/dashboard.html', 'Dashboard da portaria'],
  ['portaria/encomendas.html', 'Encomendas'],
  ['portaria/encomendas.html?estado=registrar', 'Registrar encomenda'],
  ['portaria/encomendas.html?estado=registrada&id=ENC-024', 'Encomenda registrada'],
  ['portaria/encomendas.html?estado=confirmar&id=ENC-024', 'Confirmar retirada'],
  ['portaria/encomendas.html?estado=retirada&id=ENC-024', 'Detalhes da encomenda'],
  ['portaria/moradores.html', 'Moradores e unidades'],
  ['portaria/comunicados.html', 'Avisos operacionais'],
  ['portaria/comunicados.html?estado=novo', 'Publicação restrita à Administração'],
  ['administracao/dashboard.html', 'Dashboard administrativo'],
  ['administracao/moradores.html', 'Moradores e unidades'],
  ['administracao/moradores.html?aba=unidades', 'Moradores e unidades'],
  ['administracao/moradores.html?estado=novo', 'Cadastrar morador'],
  ['administracao/moradores.html?estado=editar&id=MOR-302-01', 'Editar cadastro'],
  ['administracao/solicitacoes.html', 'Solicitações'],
  ['administracao/solicitacoes.html?estado=triagem&id=SOL-018', 'Triagem de solicitação'],
  ['administracao/reservas.html', 'Espaços e reservas'],
  ['administracao/reservas.html?estado=gerenciar', 'Espaços de lazer'],
  ['administracao/reservas.html?estado=editar&id=ESP-001', 'Editar espaço'],
  ['administracao/comunicados.html', 'Comunicados oficiais'],
  ['administracao/comunicados.html?estado=novo', 'Novo comunicado oficial'],
];

try {
  await aguardar(async () => {
    try { return (await fetch(depuracao + '/json/version')).ok; } catch { return false; }
  }, 'inicialização do Edge');
  const portaria = await aba();
  const administracao = await aba();
  await portaria.chamar('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await prepararLogin(portaria, 'porteiro');
  conferir(await portaria.avaliar('new Date().toISOString()'),'2026-11-18T15:00:00.000Z','relógio fixo');
  await prepararLogin(administracao, 'administrador');
  const baseInicial = await portaria.avaliar('JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k,localStorage.getItem(k)])))');

  for (const largura of [1440, 1280, 1920]) {
    for (const [indice, [rota, titulo]] of rotas.entries()) {
      const pagina = rota.startsWith('portaria') ? portaria : administracao;
      await pagina.chamar('Emulation.setDeviceMetricsOverride', { width: largura, height: 900, deviceScaleFactor: 1, mobile: false });
      await pagina.abrir('/web/' + rota);
      conferir(await pagina.avaliar('document.querySelector("h1")?.textContent'), titulo, rota);
      if (!(await pagina.avaliar('document.documentElement.scrollWidth <= innerWidth'))) {
        console.log(await pagina.avaliar(`[...document.querySelectorAll('body *')]
          .filter(e => e.getBoundingClientRect().right > innerWidth + 1)
          .map(e => [e.tagName,e.className,e.getBoundingClientRect().right]).slice(0,20)`));
        await captura(pagina, 'overflow');
      }
      conferir(await pagina.avaliar('document.documentElement.scrollWidth <= innerWidth'), true, 'largura · ' + rota);
      conferir(await pagina.avaliar('document.querySelectorAll("[data-menu] [aria-current=page]").length'), 1, 'menu ativo');
      conferir(await pagina.avaliar('!document.querySelector(".page-heading")?.textContent.includes("false")'), true, 'conteúdo condicional');
      conferir(await pagina.avaliar(`[...document.querySelectorAll('input:not([type=radio]), select, textarea')]
        .every(campo => !!document.querySelector('label[for="' + campo.id + '"]'))`), true, 'rótulos');
      conferir(await pagina.avaliar(`[...document.querySelectorAll('[data-pagina] a[href]')]
        .every(a => a.origin === location.origin)`), true, 'links locais');
      if (largura === 1440) await captura(pagina, String(indice + 2).padStart(2, '0') + '-' + rota.replace(/[^a-z0-9]/gi, '-'));
    }
  }
  console.log(rotas.length * 3 + ' combinações de estado e resolução conferidas.');
  conferir(await portaria.avaliar('document.fonts.check("400 16px Inter") && document.fonts.check("700 28px Inter")'), true, 'fonte Inter local');
  conferir(await administracao.avaliar(`(async()=>{
    const s=await import('/shared/js/storage.js');const {dados}=s.carregarDados();
    dados.solicitacoes.find(x=>x.id==='SOL-017').local='Área comum · Jardim';
    const r=dados.reservas.find(x=>x.id==='RES-018');r.inicio='2026-11-23T09:00:00-03:00';r.fim='2026-11-23T10:00:00-03:00';
    return s.salvarDados(dados);
  })()`),true,'preparar regressões de filtro e quadra');
  await administracao.abrir('/web/administracao/solicitacoes.html');
  await administracao.avaliar('const c=document.querySelector("[name=local]");c.value="comum";c.dispatchEvent(new Event("input",{bubbles:true}))');
  conferir(await administracao.avaliar('document.querySelector("tbody").textContent.includes("SOL-017")'),true,'área comum com local específico');
  await administracao.abrir('/web/administracao/reservas.html?data=2026-11-23');
  await administracao.avaliar('const c=document.querySelector("[name=espaco]");c.value="ESP-003";c.dispatchEvent(new Event("input",{bubbles:true}))');
  conferir(await administracao.avaliar('[...document.querySelectorAll(".results .table tbody tr")].filter(r=>/^0?9h/.test(r.querySelector("th")?.textContent)).map(r=>r.querySelector(".status")?.textContent)'),['Confirmada'],'9h ocupada não gera horário livre duplicado');
  conferir(await administracao.avaliar('document.querySelector(".results .table tbody tr th")?.textContent'),'09h às 10h','quadra em ordem cronológica');
  await administracao.avaliar(`(async()=>{const s=await import('/shared/js/storage.js');const {dados}=s.carregarDados();const demo=(await import('/shared/js/data/demo-data.js')).criarDadosDemo();dados.solicitacoes=demo.solicitacoes;dados.reservas=demo.reservas;s.salvarDados(dados);})()`);
  const fonte = await fetch(origem + '/web/assets/fonts/inter-variable.ttf');
  conferir(fonte.headers.get('content-type'), 'font/ttf; charset=utf-8', 'tipo da fonte');
  conferir((await fonte.arrayBuffer()).byteLength > 100000, true, 'arquivo de fonte servido');

  await administracao.abrir('/web/administracao/comunicados.html');
  conferir(await administracao.avaliar('[...document.querySelectorAll("tbody tr")].find(r=>r.textContent.includes("Acesso de veículos")).children[3].textContent'),'Portaria','autoria operacional legada preservada');
  await administracao.abrir('/web/administracao/moradores.html?estado=novo');
  await administracao.clicar('button[type=submit]');
  conferir(await administracao.avaliar('document.querySelector("[name=nome]").getAttribute("aria-invalid")'), 'true', 'nome obrigatório');
  conferir(await administracao.avaliar('document.activeElement.name'), 'nome', 'foco no erro');
  conferir(await administracao.avaliar('!document.querySelector("#nome-erro").hidden'), true, 'erro junto ao campo');
  const arvore = await administracao.chamar('Accessibility.getFullAXTree');
  conferir(arvore.nodes.some(no => no.role?.value === 'textbox' && no.name?.value === 'Nome' &&
    no.properties?.some(p => p.name === 'invalid' && p.value.value === 'true')), true, 'erro na árvore de acessibilidade');
  await administracao.avaliar('document.querySelector("[name=nome]").value="Pessoa Fictícia"; document.querySelector("[name=email]").value="email-invalido"; document.querySelector("[name=unidadeId]").value="UNI-A302"');
  await administracao.clicar('button[type=submit]');
  conferir(await administracao.avaliar('document.querySelector("[name=email]").getAttribute("aria-invalid")'), 'true', 'e-mail inválido');
  await administracao.avaliar('document.querySelector("[name=nome]").value="Pessoa Fictícia"; document.querySelector("[name=email]").value="ficticia@example.com"; document.querySelector("[name=unidadeId]").value="UNI-A302"');
  await administracao.clicar('button[type=submit]');
  conferir(await administracao.avaliar('document.querySelector("h1")?.textContent'), 'Prévia do cadastro', 'cadastro visual');
  conferir(await administracao.avaliar('document.querySelector("[data-pagina]")?.textContent.includes("Pessoa Fictícia")'), true, 'dados da prévia');
  await administracao.abrir('/web/administracao/moradores.html?estado=editar&id=MOR-302-01');
  conferir(await administracao.avaliar('document.querySelector("[name=nome]").value'), 'Marina Lopes', 'edição preenchida');
  await administracao.clicar('button[type=submit]');
  conferir(await administracao.avaliar('document.querySelector("[data-pagina]")?.textContent.includes("MOR-302-01")'), true, 'referência preservada');
  await administracao.abrir('/web/administracao/reservas.html?estado=editar&id=ESP-001');
  await administracao.avaliar('document.querySelector("[name=nome]").value="Salão de festas · prévia"');
  await administracao.clicar('button[type=submit]');
  conferir(await administracao.avaliar('document.querySelector("h1")?.textContent'), 'Prévia do espaço', 'edição visual do espaço');
  conferir(await administracao.avaliar('document.querySelector("h2")?.textContent'), 'Salão de festas · prévia', 'nome da prévia');

  await portaria.abrir('/web/portaria/dashboard.html');
  conferir(await portaria.avaliar('[...document.querySelectorAll(".indicator-number")].map(n => n.textContent)'), await portaria.avaliar(`(async()=>{const {dados}= (await import('/shared/js/storage.js')).carregarDados();const {hoje}=await import('/shared/js/services/base.js');const d=v=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date(v));return [dados.encomendas.filter(e=>e.status==='Aguardando retirada').length,dados.encomendas.filter(e=>d(e.recebidaEm)===hoje()).length,dados.encomendas.filter(e=>e.retiradaEm&&d(e.retiradaEm)===hoje()).length].map(String);})()`),'indicadores da data atual');
  await administracao.abrir('/web/administracao/dashboard.html');
  conferir(await administracao.avaliar('[...document.querySelectorAll(".indicator-number")].map(n => n.textContent)'), await administracao.avaliar(`(async()=>{const {dados}=(await import('/shared/js/storage.js')).carregarDados();return [dados.solicitacoes.filter(s=>s.status!=='Concluído').length,dados.reservas.filter(r=>r.status==='Confirmada'&&Date.parse(r.inicio)>=Date.now()).length,dados.comunicados.filter(c=>c.tipo==='oficial'&&Date.parse(c.publicadoEm)>=Date.now()-7*86400000&&Date.parse(c.publicadoEm)<=Date.now()).length].map(String);})()`),'indicadores administrativos dinâmicos');

  await portaria.abrir('/web/portaria/encomendas.html');
  await portaria.avaliar('document.querySelector("[name=busca]").value="Marina"; document.querySelector("[name=busca]").dispatchEvent(new Event("input",{bubbles:true}))');
  conferir(await portaria.avaliar('document.querySelectorAll("tbody tr").length'), 1, 'busca');
  conferir(await portaria.avaliar('document.querySelector("tbody th")?.textContent'), 'ENC-024', 'destinatária');
  await portaria.avaliar('document.querySelector("[name=busca]").value="inexistente"; document.querySelector("[name=busca]").dispatchEvent(new Event("input",{bubbles:true}))');
  conferir(await portaria.avaliar('document.querySelector("tbody")?.textContent'), 'Nenhum registro encontrado.', 'estado vazio');

  await portaria.abrir('/web/portaria/encomendas.html?estado=registrar');
  conferir(await portaria.avaliar('document.querySelector("form.card").checkValidity()'),true,'formulário preenchido');
  await portaria.clicar('button[type=submit]');
  await aguardar(()=>portaria.avaliar('document.querySelector("h1")?.textContent === "Encomenda registrada"'),'registro persistido');
  await portaria.abrir('/web/portaria/encomendas.html?estado=confirmar&id=ENC-024');
  await portaria.avaliar('document.querySelector("[name=retiradoPorId]").value="MOR-302-02"');
  await portaria.clicar('button[type=submit]');
  await aguardar(()=>portaria.avaliar('document.querySelector("h1")?.textContent === "Retirada confirmada"'),'retirada persistida');
  conferir(await portaria.avaliar('document.querySelector("[data-pagina]")?.textContent.includes("Gabriel Lopes")'),true,'rastreabilidade');
  await administracao.abrir('/web/administracao/comunicados.html?estado=novo');
  await administracao.avaliar('document.querySelector("[name=titulo]").value="<img src=x onerror=alert(1)>"');
  await administracao.clicar('button[type=submit]');
  await aguardar(()=>administracao.avaliar('location.search === "" && document.querySelector("tbody")?.textContent.includes("<img src=x")'),'publicação persistida');
  conferir(await administracao.avaliar('document.querySelectorAll("[data-pagina] img").length'),0,'HTML não interpretado');
  await administracao.abrir('/web/administracao/solicitacoes.html?estado=triagem&id=SOL-018');
  await administracao.avaliar('document.querySelector("[name=responsabilidade]").value="Condomínio";document.querySelector("[name=encaminhamento]").value="Equipe realizará reparo fictício."');
  await administracao.clicar('button[type=submit]');
  await aguardar(()=>administracao.avaliar('document.querySelector(".triage-grid .status")?.textContent === "Em andamento"'),'triagem persistida');
  await administracao.avaliar('document.querySelector("[name=status]").value="Concluído"');
  await administracao.clicar('button[type=submit]');
  await aguardar(()=>administracao.avaliar('document.querySelector(".triage-grid .status")?.textContent === "Concluído"'),'conclusão persistida');
  await administracao.abrir('/web/administracao/moradores.html?aba=unidades');
  conferir(await administracao.avaliar('document.querySelector("thead")?.textContent.includes("Moradores vinculados")'), true, 'título aprovado');
  conferir(await administracao.avaliar('document.querySelector("tbody tr")?.textContent.includes("Marina Lopes, Gabriel Lopes")'), true, 'múltiplos moradores');

  await administracao.abrir('/web/administracao/reservas.html?data=2026-11-21');
  conferir(await administracao.avaliar('document.querySelectorAll(".calendar-day[aria-pressed=true]").length'), 1, 'dia selecionado');
  await administracao.clicar('.calendar-day[aria-label^="22/"]');
  conferir(await administracao.avaliar('document.querySelector("[name=dia]").value'), '2026-11-22', 'seleção do calendário');
  await administracao.avaliar('document.querySelector("[name=espaco]").value="ESP-002"; document.querySelector("[name=espaco]").dispatchEvent(new Event("input",{bubbles:true}))');
  conferir(await administracao.avaliar('document.querySelector("tbody")?.textContent.includes("Cancelada")'), true, 'reserva cancelada');
  await administracao.clicar('tbody button');
  conferir(await administracao.avaliar('!!document.querySelector("dialog[open]")'), true, 'detalhes');
  await administracao.chamar('Page.bringToFront');
  await administracao.chamar('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await administracao.chamar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await aguardar(() => administracao.avaliar('!document.querySelector("dialog[open]")'), 'fechar com Escape');
  verificacoes++;

  await portaria.abrir('/web/portaria/moradores.html');
  await portaria.chamar('Page.bringToFront');
  await portaria.chamar('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await portaria.chamar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await portaria.avaliar('document.querySelector("tbody button").focus()');
  conferir(await portaria.avaliar('document.activeElement.textContent'), 'Ver unidade', 'controle focado');
  await portaria.chamar('Page.bringToFront');
  await portaria.chamar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await portaria.chamar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await aguardar(() => portaria.avaliar('!!document.querySelector("dialog[open]")'), 'abrir por teclado');
  verificacoes++;
  await portaria.clicar('dialog button');
  await aguardar(() => portaria.avaliar('!document.querySelector("dialog")'), 'concluir fechamento e retorno de foco');
  conferir(await portaria.avaliar('document.activeElement.textContent'), 'Ver unidade', 'retorno de foco do diálogo');
  await portaria.clicar('.skip-link');
  conferir(await portaria.avaliar('document.activeElement.id'), 'conteudo-principal', 'atalho de conteúdo');

  for (const rota of [
    '/web/administracao/moradores.html?estado=novo',
    '/web/administracao/reservas.html?estado=editar&id=ESP-001',
    '/web/administracao/solicitacoes.html?estado=triagem&id=SOL-018',
  ]) {
    await administracao.chamar('Emulation.setDeviceMetricsOverride', { width: 640, height: 450, deviceScaleFactor: 1, mobile: false });
    await administracao.abrir(rota);
    conferir(await administracao.avaliar('document.documentElement.scrollWidth <= innerWidth'), true, 'reflow equivalente a 200%');
  }

  for (const [pagina, area, perfil] of [[portaria, 'portaria', 'porteiro'], [administracao, 'administracao', 'administrador']]) {
    const links = await pagina.avaliar('[...document.querySelectorAll("[data-menu] a")].map(a => a.pathname)');
    for (const rota of links) {
      await pagina.abrir(rota);
      conferir(await pagina.avaliar('JSON.parse(sessionStorage.getItem("condoconnect.sessao.v1")).perfil'), perfil, 'sessão na navegação');
      conferir(rota.includes('/' + area + '/'), true, 'menu do perfil');
    }
  }

  const baseFinal = await portaria.avaliar('JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k,localStorage.getItem(k)])))');
  conferir(baseFinal !== baseInicial, true, 'operações persistidas nos fluxos');

  conferir(await portaria.avaliar(`(async () => {
    const storage = await import('/shared/js/storage.js');
    const { dados } = storage.carregarDados();
    const encomenda = dados.encomendas.find(e => e.id === 'ENC-024');
    encomenda.status = 'Entregue';
    encomenda.retiradaEm = '2026-11-14T12:10:00-03:00';
    encomenda.retiradoPorId = encomenda.moradorId;
    return storage.salvarDados(dados);
  })()`), true, 'preparar registro de referência entregue');
  await portaria.abrir('/web/portaria/encomendas.html?estado=registrar');
  await portaria.clicar('button[type=submit]');
  await aguardar(()=>portaria.avaliar('document.querySelector("h1")?.textContent === "Encomenda registrada"'),'novo registro depois de entrega');
  conferir(await portaria.avaliar('document.querySelector("[data-pagina] .status")?.textContent'), 'Aguardando retirada', 'novo registro depois de entrega');
  conferir(await portaria.avaliar('document.querySelector("[data-pagina]")?.textContent.includes("Retirado por")'), false, 'prévia sem retirada anterior');
  await portaria.abrir('/web/portaria/encomendas.html?estado=registrada&id=ENC-024');
  conferir(await portaria.avaliar('document.querySelector("h1")?.textContent'),'Detalhes da encomenda','URL antiga de registro não promete disponibilidade após retirada');
  conferir(await portaria.avaliar('document.querySelector(".page-heading")?.textContent.includes("está disponível")'),false,'descrição coerente após retirada');
  conferir(await portaria.avaliar('document.querySelector("[data-pagina] .status")?.textContent'), 'Entregue', 'URL apresenta status persistido');
  conferir(await portaria.avaliar(`(async () => {
    const { carregarDados } = await import('/shared/js/storage.js');
    return carregarDados().dados.encomendas.find(e => e.id === 'ENC-024').status;
  })()`), 'Entregue', 'prévia mantém o registro persistido');
  conferir(await portaria.avaliar(`(async () => {
    const ui = await import('/web/js/ui.js');
    return [ui.data('data-invalida'), ui.hora(null), ui.dataCurta('data-invalida')];
  })()`), ['Data indisponível', 'Horário indisponível', 'Data indisponível'], 'apresentação de datas inválidas');
  conferir(await portaria.avaliar(`(async () => {
    const storage = await import('/shared/js/storage.js');
    const { dados } = storage.carregarDados();
    dados.encomendas[0].recebidaEm = 'data-invalida';
    return storage.salvarDados(dados);
  })()`), false, 'rejeitar data inválida');
  await portaria.abrir('/web/portaria/encomendas.html');
  conferir(await portaria.avaliar('document.querySelectorAll("tbody tr").length'), 7, 'listagem continua disponível');

  for (const [fim, livre] of [['14:30', false], ['14:00', true]]) {
    conferir(await administracao.avaliar(`(async () => {
      const storage = await import('/shared/js/storage.js');
      const { dados } = storage.carregarDados();
      dados.reservas.find(r => r.id === 'RES-020').fim = '2026-11-21T${fim}:00-03:00';
      dados.reservas.find(r => r.id === 'RES-021').status = 'Cancelada';
      return storage.salvarDados(dados);
    })()`), true, 'preparar limite de reserva ' + fim);
    await administracao.abrir('/web/administracao/reservas.html?data=2026-11-21');
    conferir(await administracao.avaliar(`[...document.querySelectorAll('.results > div > .table-frame tbody tr')]
      .some(tr => tr.querySelector('th').textContent === '14h às 17h' && tr.querySelector('.status')?.textContent === 'Disponível')`),
    livre, 'faixa das 14h com término às ' + fim);
  }

  await portaria.chamar('Page.navigate', { url: origem + '/web/administracao/dashboard.html' });
  await aguardar(() => portaria.avaliar('location.pathname === "/web/login.html"'), 'restrição de perfil');
  verificacoes++;
  await administracao.clicar('[data-sair]');
  await aguardar(() => administracao.avaliar('location.pathname === "/web/login.html"'), 'saída');
  conferir(await administracao.avaliar('sessionStorage.getItem("condoconnect.sessao.v1")'), null, 'sessão encerrada');
  await administracao.chamar('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await captura(administracao, '01-login');
  conferir(erros, [], 'exceções JS e recursos HTTP');
  console.log(JSON.stringify({ verificacoes, falhas: 0, capturas }));
} finally {
  for (const ws of sockets) ws.close();
  navegador.kill();
  servidor.kill();
}
