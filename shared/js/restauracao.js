import { restaurarDados } from './storage.js';
export function botaoRestaurar(classe = 'button button-outline') {
  const botao = document.createElement('button'); botao.type = 'button'; botao.className = classe;
  botao.textContent = 'Restaurar dados da demonstração';
  botao.addEventListener('click', () => {
    const dialogo = document.createElement('dialog');
    const titulo = document.createElement('h2'); titulo.textContent = 'Restaurar dados fictícios?';
    const aviso = document.createElement('p'); aviso.textContent = 'Esta ação apaga as alterações locais da demonstração e restaura os registros originais em todas as abas desta origem.';
    const cancelar = document.createElement('button'); cancelar.type = 'button'; cancelar.className = 'button button-outline'; cancelar.textContent = 'Cancelar'; cancelar.onclick = () => dialogo.close();
    const confirmar = document.createElement('button'); confirmar.type = 'button'; confirmar.className = 'button'; confirmar.textContent = 'Apagar alterações e restaurar';
    confirmar.onclick = () => { const estado = restaurarDados(); if (estado.persistido) { dialogo.close(); location.reload(); } else aviso.textContent = 'Não foi possível restaurar: verifique o armazenamento do navegador.'; };
    dialogo.append(titulo,aviso,cancelar,confirmar); dialogo.setAttribute('aria-label','Restaurar dados da demonstração');
    dialogo.addEventListener('close',()=>{dialogo.remove();botao.focus();}); document.body.append(dialogo);dialogo.showModal();cancelar.focus();
  }); return botao;
}
