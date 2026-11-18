import { readdir, mkdir, copyFile, rm, lstat } from 'node:fs/promises';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
const destino = resolve(raiz, 'dist');
// Somente esta saída gerada pode ser substituída. Nunca siga links simbólicos.
if (dirname(destino) !== raiz || destino !== join(raiz, 'dist')) throw new Error('Destino inválido.');
const anterior = await lstat(destino).catch(e => { if (e.code !== 'ENOENT') throw e; });
if (anterior?.isSymbolicLink() || (anterior && !anterior.isDirectory())) throw new Error('dist deve ser um diretório comum gerado pelo projeto.');

const arquivos = ['index.html', '404.html'];
async function coletar(pasta) {
  for (const item of await readdir(join(raiz, pasta), { withFileTypes: true })) {
    if (item.isFile() && item.name === '.gitkeep') continue;
    const relativo = join(pasta, item.name);
    if (item.isSymbolicLink()) throw new Error('Link simbólico não permitido: ' + relativo);
    if (item.isDirectory()) await coletar(relativo);
    else if (item.isFile() && (['.html', '.css', '.js', '.ttf'].includes(extname(item.name)) || relativo === join('web', 'assets', 'fonts', 'inter-license.txt'))) arquivos.push(relativo);
    else throw new Error('Revise o arquivo antes de publicar: ' + relativo);
  }
}
for (const pasta of ['web', 'mobile', 'shared']) await coletar(pasta);
// Validação completa da lista antes de substituir a pasta de saída fixa.
if (anterior) await rm(destino, { recursive: true });
await mkdir(destino);
for (const arquivo of arquivos) {
  await mkdir(dirname(join(destino, arquivo)), { recursive: true });
  await copyFile(join(raiz, arquivo), join(destino, arquivo));
}
console.log(`Publicação preparada: ${arquivos.length} arquivos em dist/. Nenhum envio externo realizado.`);
