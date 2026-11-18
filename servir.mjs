import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const tipos = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ttf': 'font/ttf',
};
const porta = Number(process.argv[2] ?? 8000);
const base = new URL(process.argv[3] === '--publicacao' ? './dist/' : './', import.meta.url);
async function naoEncontrado(resposta, metodo) {
  const conteudo = await readFile(new URL('404.html', base)).catch(() => Buffer.from('Página não encontrada.'));
  resposta.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': conteudo.length });
  resposta.end(metodo === 'HEAD' ? undefined : conteudo);
}

createServer(async (pedido, resposta) => {
  if (pedido.method !== 'GET' && pedido.method !== 'HEAD') {
    resposta.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const caminho = pedido.url.split('?')[0];
  const arquivo = caminho === '/' ? '/index.html' : caminho;
  // Sirva somente os arquivos estáticos da aplicação, com segmentos simples.
  const rota = /^(?:\/(?:index|404)\.html|\/(?:web|mobile|shared)(?:\/[a-z0-9-]+)*\/[a-z0-9-]+\.(?:html|css|js|ttf))$/;
  if (!rota.test(arquivo)) {
    await naoEncontrado(resposta, pedido.method);
    return;
  }

  try {
    const conteudo = await readFile(new URL(arquivo.slice(1), base));
    resposta.writeHead(200, {
      'Content-Type': tipos[extname(arquivo)] + '; charset=utf-8',
      'Content-Length': conteudo.length,
      'Cache-Control': 'no-store',
    });
    resposta.end(pedido.method === 'HEAD' ? undefined : conteudo);
  } catch (erro) {
    if (erro.code === 'ENOENT') await naoEncontrado(resposta, pedido.method);
    else resposta.writeHead(500).end();
  }
}).listen(porta, '127.0.0.1', () => {
  console.log('CondoConnect em http://127.0.0.1:' + porta + '/');
});
