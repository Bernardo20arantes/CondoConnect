import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { iniciarSessao } from '../shared/js/session.js';
import { carregarDados, salvarDados, CHAVE_DADOS, restaurarDados } from '../shared/js/storage.js';
import { criarDadosDemo } from '../shared/js/data/demo-data.js';
import * as encomendas from '../shared/js/services/encomendas.js';
import * as mensagens from '../shared/js/services/mensagens.js';
import * as solicitacoes from '../shared/js/services/solicitacoes.js';
import * as reservas from '../shared/js/services/reservas.js';
import * as comunicados from '../shared/js/services/comunicados.js';
import * as notificacoes from '../shared/js/services/notificacoes.js';
import { AGORA } from './relogio.mjs';
function memoria(){return Object.assign(Object.create({getItem(k){return this[k]??null;},setItem(k,v){this[k]=String(v);},removeItem(k){delete this[k];}}),{});}
beforeEach(t=>{t.mock.timers.enable({apis:['Date'],now:Date.parse(AGORA)});Object.defineProperty(globalThis,'localStorage',{configurable:true,value:memoria()});Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:memoria()});});
const morador=(id='MOR-302-01')=>iniciarSessao('morador',id);
const futuro=()=>{const d=new Date(Date.now()+5*86400000);return d.toISOString().slice(0,10);};
const abertura={tipo:'Vazamento',local:'Área comum',titulo:'Teste fictício',descricao:'Descrição fictícia',prioridade:'Alta'};
const triagem=status=>({status,responsabilidade:'Condomínio',responsavel:'Administração',encaminhamento:'Atendimento fictício registrado.'});
test('encomenda integra destinatário, histórico, retirada única, indicadores e notificações',()=>{
 iniciarSessao('porteiro');
 assert.throws(()=>encomendas.registrarEncomenda({moradorId:'MOR-302-01',unidadeId:'UNI-B105',recebidaEm:'2026-01-01T09:00'}));
 const e=encomendas.registrarEncomenda({moradorId:'MOR-302-01',unidadeId:'UNI-A302',recebidaEm:'2026-01-01T09:00',observacao:'Caixa fictícia'});
 assert.equal(e.registradoPorId,'POR-001');morador();assert.ok(encomendas.listarEncomendas().some(x=>x.id===e.id));
 assert.equal(notificacoes.listarNotificacoes().length,1);assert.throws(()=>encomendas.confirmarRetirada(e.id,{retiradoPorId:'MOR-302-01'}));
 morador('MOR-302-02');assert.ok(!encomendas.listarEncomendas().some(x=>x.id===e.id));assert.equal(notificacoes.listarNotificacoes().length,0);
 iniciarSessao('porteiro');encomendas.confirmarRetirada(e.id,{retiradoPorId:'MOR-302-02'});assert.throws(()=>encomendas.confirmarRetirada(e.id,{retiradoPorId:'MOR-302-02'}));
 morador();const atual=encomendas.listarEncomendas().find(x=>x.id===e.id);assert.equal(atual.status,'Entregue');assert.equal(atual.recebidaEm,e.recebidaEm);assert.equal(notificacoes.listarNotificacoes().length,2);
});
test('mensagens persistem, ordenam, restringem participantes e registram leitura',()=>{
 morador();assert.throws(()=>mensagens.criarConversa('MOR-302-01'));const c=mensagens.criarConversa('MOR-302-02');assert.equal(mensagens.criarConversa('MOR-302-02').id,c.id);
 assert.throws(()=>mensagens.enviarMensagem(c.id,'   '));assert.throws(()=>mensagens.enviarMensagem(c.id,'x'.repeat(2001)));
 const m=mensagens.enviarMensagem(c.id,'<script>texto literal</script>');assert.equal(mensagens.listarConversas()[0].id,c.id);
 morador('MOR-302-02');assert.equal(mensagens.listarMensagens(c.id).at(-1).id,m.id);assert.equal(notificacoes.listarNotificacoes().length,1);mensagens.marcarConversaLida(c.id);assert.ok(mensagens.listarMensagens(c.id)[0].lidaPorIds.includes('MOR-302-02'));
 morador('MOR-403-01');assert.deepEqual(mensagens.listarMensagens(c.id),[]);assert.throws(()=>mensagens.enviarMensagem(c.id,'Invasão'));iniciarSessao('administrador');assert.throws(()=>mensagens.listarConversas());
});
test('solicitações seguem transições sequenciais, triagem, histórico e perfil',()=>{
 morador();assert.throws(()=>solicitacoes.criarSolicitacao({...abertura,titulo:' '}));assert.throws(()=>solicitacoes.criarSolicitacao({...abertura,imagem:'data:image/svg+xml;base64,xxx'}));
 const s=solicitacoes.criarSolicitacao(abertura);assert.equal(s.status,'Aberto');assert.throws(()=>solicitacoes.atualizarSolicitacao(s.id,triagem('Em análise')));
 iniciarSessao('administrador');assert.ok(solicitacoes.listarSolicitacoes().some(x=>x.id===s.id));assert.throws(()=>solicitacoes.atualizarSolicitacao(s.id,triagem('Concluído')));
 for(const status of ['Em análise','Em andamento','Concluído'])solicitacoes.atualizarSolicitacao(s.id,triagem(status));assert.throws(()=>solicitacoes.atualizarSolicitacao(s.id,triagem('Aberto')));
 morador();const atual=solicitacoes.listarSolicitacoes().find(x=>x.id===s.id);assert.equal(atual.historico.length,4);assert.equal(atual.status,'Concluído');assert.equal(notificacoes.listarNotificacoes().length,4);
 morador('MOR-302-02');assert.ok(!solicitacoes.listarSolicitacoes({moradorId:'MOR-302-01'}).length);
});
test('reservas rejeitam conflitos, permitem intervalos consecutivos e liberam cancelamentos',()=>{
 morador();const v={espacoId:'ESP-003',dia:futuro(),inicio:10,fim:11};const a=reservas.criarReserva(v);assert.throws(()=>reservas.criarReserva(v));const b=reservas.criarReserva({...v,inicio:11,fim:12});assert.ok(b.id!==a.id);
 morador('MOR-302-02');assert.throws(()=>reservas.cancelarReserva(a.id));const ocupada=reservas.listarReservas({espacoId:'ESP-003'}).find(x=>x.id===a.id);assert.equal(ocupada.moradorId,undefined);assert.throws(()=>reservas.criarReserva(v));
 morador();reservas.cancelarReserva(a.id);assert.equal(reservas.listarReservas().find(x=>x.id===a.id).status,'Cancelada');reservas.criarReserva(v);assert.throws(()=>reservas.criarReserva({...v,dia:'2026-02-30'}));assert.throws(()=>reservas.criarReserva({...v,dia:'2020-01-01'}));assert.throws(()=>reservas.criarReserva({...v,inicio:10,fim:14}));
});
test('comunicados respeitam público, torre e autoria; leitura não duplica eventos',()=>{
 iniciarSessao('porteiro');assert.throws(()=>comunicados.publicarComunicado({}));iniciarSessao('administrador');
 const geral=comunicados.publicarComunicado({titulo:'Geral',mensagem:'Teste',publico:'geral'});const priv=comunicados.publicarComunicado({titulo:'Privado',mensagem:'Teste',publico:'portaria'});const torre=comunicados.publicarComunicado({titulo:'Torre B',mensagem:'Teste',publico:'moradores',torre:'B'});
 morador();assert.ok(comunicados.listarComunicados().some(c=>c.id===geral.id));assert.ok(!comunicados.listarComunicados().some(c=>[priv.id,torre.id].includes(c.id)));const lista=notificacoes.listarNotificacoes();assert.equal(lista.length,1);notificacoes.marcarNotificacaoLida(lista[0].id);assert.equal(notificacoes.listarNotificacoes().filter(n=>!n.lida).length,0);assert.equal(notificacoes.listarNotificacoes().length,1);
 iniciarSessao('porteiro');assert.ok(comunicados.listarComunicados().some(c=>c.id===priv.id));assert.ok(!comunicados.listarComunicados().some(c=>c.id===torre.id));
});
test('migração preserva base e operações legadas; restauração determinística',()=>{
 const legado=criarDadosDemo();delete legado.notificacoes;for(const m of legado.mensagens)delete m.lidaPorIds;const original=JSON.stringify({versao:1,dados:legado});localStorage.setItem(CHAVE_DADOS,original);
 morador();assert.ok(carregarDados().persistido);mensagens.enviarMensagem('CNV-001','Migrada');assert.equal(localStorage.getItem(CHAVE_DADOS),original);assert.equal(carregarDados().dados.mensagens.at(-1).texto,'Migrada');assert.ok(restaurarDados().persistido);assert.deepEqual(carregarDados().dados,criarDadosDemo());
});
test('falhas de gravação preservam registros e não emitem notificações parciais',()=>{
 morador();const antes=carregarDados().dados;localStorage.setItem=()=>{throw new Error('Quota');};assert.throws(()=>solicitacoes.criarSolicitacao(abertura),/Não foi possível salvar/);assert.deepEqual(carregarDados().dados,antes);
});

test('persistência rejeita IDs repetidos, estados e relacionamentos inválidos',()=>{
 morador();for(const corromper of [d=>d.encomendas.push({...d.encomendas[0]}),d=>d.encomendas[0].status='Perdida',d=>d.reservas[0].espacoId='Inexistente',d=>d.conversas[0].participanteIds=['MOR-302-01','MOR-302-01'],d=>d.mensagens[0].autorId='ADM-001',d=>d.comunicados[0].publico='Inválido']){const {dados}=carregarDados();corromper(dados);assert.equal(salvarDados(dados),false);}
});
test('duas abas com reservas concorrentes convergem descartando a operação conflitante inteira',()=>{
 morador();const origem=localStorage;const base={...origem};const v={espacoId:'ESP-003',dia:futuro(),inicio:10,fim:11};const a=reservas.criarReserva(v);
 const segunda=Object.assign(memoria(),base);Object.defineProperty(globalThis,'localStorage',{configurable:true,value:segunda});morador('MOR-302-02');const b=reservas.criarReserva(v);
 Object.assign(segunda,origem);const estado=carregarDados();const ativas=estado.dados.reservas.filter(r=>[a.id,b.id].includes(r.id));assert.equal(ativas.length,1);assert.equal(estado.conflitos.length,1);assert.equal(estado.dados.notificacoes.length,1);
});
test('reproduz operação da versão 1 sem perder campos novos ou regravar base',()=>{
 const legado=criarDadosDemo();delete legado.notificacoes;for(const e of legado.encomendas){delete e.unidadeId;delete e.registradoPorId;delete e.retiradoPorNome;}
 const antes=legado.encomendas[0],depois={...antes,observacao:'Alteração legada preservada'};const bruto=JSON.stringify({versao:1,dados:legado});localStorage.setItem(CHAVE_DADOS,bruto);localStorage.setItem(CHAVE_DADOS+'.operacao.legada',JSON.stringify({tipo:'editar',ordem:1,reinicio:null,alteracoes:[{colecao:'encomendas',id:antes.id,antes,depois}]}));
 assert.equal(carregarDados().dados.encomendas[0].observacao,'Alteração legada preservada');assert.equal(localStorage.getItem(CHAVE_DADOS),bruto);assert.deepEqual(carregarDados().conflitos,[]);
});

test('imagens pequenas persistem; tamanho, formato e leitura alheia são rejeitados',()=>{
 morador();const imagem='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';const s=solicitacoes.criarSolicitacao({...abertura,imagem});assert.equal(solicitacoes.listarSolicitacoes().find(x=>x.id===s.id).imagem,imagem);
 assert.throws(()=>solicitacoes.criarSolicitacao({...abertura,imagem:'data:image/png;base64,'+'A'.repeat(140001)}));const n=notificacoes.listarNotificacoes()[0];notificacoes.marcarNotificacaoLida(n.id);notificacoes.marcarNotificacaoLida(n.id);assert.equal(notificacoes.listarNotificacoes().length,1);morador('MOR-302-02');assert.throws(()=>notificacoes.marcarNotificacaoLida(n.id));
});
test('JSON corrompido ou esquema desconhecido não são sobrescritos silenciosamente',()=>{
 for(const bruto of ['{',JSON.stringify({versao:99,dados:criarDadosDemo()}),JSON.stringify({versao:1,dados:null})]){localStorage.setItem(CHAVE_DADOS,bruto);assert.equal(carregarDados().persistido,false);assert.equal(localStorage.getItem(CHAVE_DADOS),bruto);assert.ok(restaurarDados().persistido);assert.deepEqual(carregarDados().dados,criarDadosDemo());}
});

test('ordena mensagens, atividade, comunicados e notificações por instante entre fusos',()=>{
 morador();
 const {dados}=carregarDados();
 dados.mensagens.find(m=>m.id==='MSG-001').enviadaEm='2026-11-18T10:30:00-03:00';
 dados.mensagens.find(m=>m.id==='MSG-002').enviadaEm='2026-11-18T12:00:00Z';
 dados.mensagens.find(m=>m.id==='MSG-003').enviadaEm='2026-11-18T13:00:00Z';
 dados.comunicados.find(c=>c.id==='COM-003').publicadoEm='2026-11-18T10:30:00-03:00';
 dados.comunicados.find(c=>c.id==='COM-002').publicadoEm='2026-11-18T12:00:00Z';
 assert.ok(salvarDados(dados));
 assert.deepEqual(mensagens.listarMensagens('CNV-001').map(m=>m.id),['MSG-002','MSG-001']);
 assert.equal(mensagens.listarConversas()[0].id,'CNV-001');
 assert.equal(comunicados.listarComunicados()[0].id,'COM-003');
 mensagens.enviarMensagem('CNV-001','Primeira');mensagens.enviarMensagem('CNV-001','Segunda');
 morador('MOR-105-01');const estado=carregarDados();
 estado.dados.notificacoes[0].criadaEm='2026-11-18T10:30:00-03:00';
 estado.dados.notificacoes[1].criadaEm='2026-11-18T12:00:00Z';
 assert.ok(salvarDados(estado.dados));assert.equal(notificacoes.listarNotificacoes()[0].descricao,'Marina Lopes enviou uma mensagem.');
 assert.equal(notificacoes.listarNotificacoes()[0].id,estado.dados.notificacoes[0].id);
});

test('reservas validam sobreposição parcial, espaços diferentes e virada do ano',()=>{
 morador();const v={espacoId:'ESP-001',dia:'2027-01-01',inicio:14,fim:17};
 const r=reservas.criarReserva(v);const {dados}=carregarDados();
 dados.reservas.find(x=>x.id===r.id).fim='2027-01-01T18:30:00-03:00';
 assert.ok(salvarDados(dados));
 assert.throws(()=>reservas.criarReserva({...v,inicio:18,fim:21}),/ocupado/);
 assert.ok(reservas.criarReserva({...v,espacoId:'ESP-002'}));
 for(const dia of ['2026-02-29','2026-13-01','2026-11-00','invalida'])assert.throws(()=>reservas.criarReserva({...v,dia}));
});

test('sessões inválidas e armazenamento indisponível não autorizam operações',async()=>{
 const {obterUsuarioDaSessao,encerrarSessao}=await import('../shared/js/session.js');
 for(const valor of ['{','null','{}','{"perfil":"morador","usuarioId":"ADM-001"}']){
  sessionStorage.setItem('condoconnect.sessao.v1',valor);assert.equal(obterUsuarioDaSessao(),null);assert.throws(()=>mensagens.listarConversas());
 }
 morador();assert.ok(encerrarSessao());assert.equal(obterUsuarioDaSessao(),null);
 sessionStorage.setItem=()=>{throw new Error('Bloqueado');};assert.equal(iniciarSessao('morador'),false);
 localStorage.getItem=()=>{throw new Error('Bloqueado');};assert.equal(carregarDados().persistido,false);
});
