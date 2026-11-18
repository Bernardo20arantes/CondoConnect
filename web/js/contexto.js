import { carregarDados } from '../../shared/js/storage.js';

export function contexto() {
  const { dados } = carregarDados();
  const usuario = id => dados.usuarios.find(item => item.id === id);
  const unidade = id => dados.unidades.find(item => item.id === id);
  const unidadeDoMorador = id => unidade(usuario(id)?.unidadeId);
  return { dados, usuario, unidade, unidadeDoMorador };
}
