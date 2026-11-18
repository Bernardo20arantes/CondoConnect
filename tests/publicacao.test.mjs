import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn, execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as esperar } from 'node:timers/promises';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(raiz, 'dist');
async function arquivos(pasta) {
  const lista=[];
  for(const item of await readdir(pasta,{withFileTypes:true})) {
    const path=resolve(pasta,item.name);
    if(item.isDirectory())lista.push(...await arquivos(path));else lista.push(path);
  }
  return lista;
}

test('pacote estático contém somente recursos públicos e referências com caixa exata',async()=>{
  execFileSync(process.execPath,['preparar-publicacao.mjs'],{cwd:raiz});
  // Simula sobra de publicação antiga, que não pode continuar pública.
  await writeFile(resolve(dist,'obsoleto.txt'),'não publicar');
  execFileSync(process.execPath,['preparar-publicacao.mjs'],{cwd:raiz});
  const lista=await arquivos(dist), exatos=new Set(lista);
  assert.ok(!lista.some(p=>/obsoleto|README|docs|tests|servir|netlify|\.env/.test(p.slice(dist.length))));
  for(const entrada of ['index.html','404.html','web/login.html','mobile/login.html'])assert.ok(exatos.has(resolve(dist,entrada)));
  let referencias=0;
  for(const path of lista){
    const extensao=extname(path);
    assert.deepEqual(await readFile(path),await readFile(resolve(raiz,path.slice(dist.length+1))),'cópia fiel: '+path);
    if(!['.html','.css','.js'].includes(extensao))continue;
    const texto=await readFile(path,'utf8');
    assert.ok(!/serviceWorker\.register|navigator\.userAgent|innerHTML\s*=|\beval\s*\(/.test(texto),'sem instalação, detecção de dispositivo ou execução de entrada: '+path);
    const padroes=extensao==='.html'?[/\b(?:href|src)="([^"]+)"/g]:extensao==='.css'?[/url\(['"]?([^)'"\s]+)['"]?\)/g]:[/\bfrom\s*['"]([^'"]+)['"]/g];
    for(const padrao of padroes)for(const match of texto.matchAll(padrao)){
      const href=match[1];if(/^(?:#|data:|https?:)/.test(href))continue;
      const limpo=href.split(/[?#]/)[0];
      const destino=limpo==='/'?resolve(dist,'index.html'):limpo.startsWith('/')?resolve(dist,'.'+limpo):resolve(dirname(path),limpo);
      assert.ok(exatos.has(destino),'referência local exata: '+path+' → '+href);referencias++;
    }
  }
  console.log(JSON.stringify({arquivos:lista.length,referencias}));
});

test('saída publicada responde HTML, módulos, fonte, HEAD, 404 e nega arquivos de desenvolvimento',async()=>{
  const servidor=spawn(process.execPath,['servir.mjs','8233','--publicacao'],{cwd:raiz,windowsHide:true,stdio:'inherit'});
  try {
    const origem='http://127.0.0.1:8233';let pronto=false;
    for(let i=0;i<100;i++){try{pronto=(await fetch(origem)).ok;}catch{}if(pronto)break;await esperar(50);}
    assert.ok(pronto,'servidor de publicação disponível');
    for(const path of await arquivos(dist)){
      if(path.endsWith('.txt'))continue;
      const rota='/'+path.slice(dist.length+1).replaceAll('\\','/');
      const resposta=await fetch(origem+rota);assert.equal(resposta.status,200,rota);
      assert.deepEqual(Buffer.from(await resposta.arrayBuffer()),await readFile(path),rota);
      if(path.endsWith('.js'))assert.match(resposta.headers.get('content-type'),/^text\/javascript/);
    }
    for(const rota of ['/ausente.html','/web/ausente.html','/mobile/ausente.html','/README.md','/tests/services.test.mjs','/shared/../docs/regras.md','/.env','/Web/login.html']){
      const r=await fetch(origem+rota);assert.equal(r.status,404,rota);assert.match(await r.text(),/Página não encontrada/);
    }
    const head=await fetch(origem+'/mobile/login.html',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
    assert.equal((await fetch(origem+'/mobile/login.html',{method:'POST'})).status,405);
    assert.equal((await fetch(origem+'/web/login.html',{redirect:'manual'})).status,200);
    assert.equal((await fetch(origem+'/mobile/login.html',{headers:{'User-Agent':'desktop'},redirect:'manual'})).status,200);
  } finally {servidor.kill();}
});

test('pares de texto do Design System atendem contraste básico de 4,5:1',async()=>{
  const css=await readFile(resolve(raiz,'shared/css/tokens.css'),'utf8');
  const tokens=Object.fromEntries([...css.matchAll(/--(color-[a-z-]+):\s*(#[a-f\d]{3,6})/gi)].map(m=>[m[1],m[2]]));
  function luminancia(hex){const h=hex.slice(1);const full=h.length===3?[...h].map(x=>x+x).join(''):h;return [0.2126,0.7152,0.0722].reduce((s,p,i)=>{const v=parseInt(full.slice(i*2,i*2+2),16)/255;return s+p*(v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);},0);}
  for(const [a,b] of [['text','surface'],['text','background'],['brand','surface'],['secondary','background'],['primary','surface'],['info-text','info-bg'],['warning-text','warning-bg'],['success-text','success-bg'],['error-text','error-bg']]){
    const x=luminancia(tokens['color-'+a]),y=luminancia(tokens['color-'+b]);assert.ok((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)>=4.5,a+'/'+b);
  }
});
