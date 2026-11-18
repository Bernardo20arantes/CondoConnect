import { PERFIS } from './data/demo-data.js';
import { carregarDados } from './storage.js';

const chave = 'condoconnect.sessao.v1';

export function iniciarSessao(perfil, usuarioId) {
  if (!Object.hasOwn(PERFIS, perfil)) return false;

  const { dados } = carregarDados();
  const usuario = dados.usuarios.find(item => item.perfil === perfil && (usuarioId === undefined || item.id === usuarioId));
  if (!usuario) return false;

  try {
    sessionStorage.setItem(chave, JSON.stringify({ usuarioId: usuario.id, perfil }));
    return true;
  } catch {
    return false;
  }
}

export function obterUsuarioDaSessao() {
  try {
    const sessao = JSON.parse(sessionStorage.getItem(chave));
    if (!sessao || !Object.hasOwn(PERFIS, sessao.perfil)) return null;
    const { dados } = carregarDados();
    return dados.usuarios.find(usuario =>
      usuario.id === sessao.usuarioId && usuario.perfil === sessao.perfil) ?? null;
  } catch {
    return null;
  }
}

export function encerrarSessao() {
  try {
    sessionStorage.removeItem(chave);
    return true;
  } catch {
    return false;
  }
}
