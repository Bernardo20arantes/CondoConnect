import { migrarDados } from '../migracao.js';
export const PERFIS = Object.freeze({
  morador: 'Morador',
  porteiro: 'Portaria',
  administrador: 'Administração',
});

const usuarios = [
  ['MOR-302-01', 'Marina Lopes', 'marina.lopes', 'morador', 'UNI-A302'],
  ['MOR-302-02', 'Gabriel Lopes', 'gabriel.lopes', 'morador', 'UNI-A302'],
  ['MOR-204-01', 'Lívia Martins', 'livia.martins', 'morador', 'UNI-A204'],
  ['MOR-105-01', 'Rafael Costa', 'rafael.costa', 'morador', 'UNI-B105'],
  ['MOR-403-01', 'Beatriz Nunes', 'beatriz.nunes', 'morador', 'UNI-B403'],
  ['POR-001', 'André Rocha', 'andre.rocha', 'porteiro', null],
  ['POR-002', 'Camila Reis', 'camila.reis', 'porteiro', null],
  ['ADM-001', 'Renata Duarte', 'renata.duarte', 'administrador', null],
].map(([id, nome, email, perfil, unidadeId]) => ({
  id, nome, email: email + '@example.com', perfil, unidadeId,
}));

const unidades = [
  ['UNI-A302', 'A', '302'], ['UNI-A204', 'A', '204'],
  ['UNI-B105', 'B', '105'], ['UNI-B403', 'B', '403'],
].map(([id, torre, apartamento]) => ({ id, torre, apartamento }));

const encomendas = [
  ['ENC-024', 'MOR-302-01', '14T10:25', null, 'Correios', 'Caixa pequena'],
  ['ENC-023', 'MOR-105-01', '14T09:40', '14T11:05', null, null],
  ['ENC-022', 'MOR-204-01', '13T16:10', null, null, null],
  ['ENC-021', 'MOR-403-01', '12T14:30', '13T08:20', null, null],
  ['ENC-020', 'MOR-302-02', '10T15:00', '11T18:00', null, null],
].map(([id, moradorId, recebida, retirada, transportadora, observacao]) => ({
  id, moradorId, transportadora, observacao,
  recebidaEm: dataHora(recebida), retiradaEm: retirada ? dataHora(retirada) : null,
  retiradoPorId: retirada ? moradorId : null,
  status: retirada ? 'Entregue' : 'Aguardando retirada',
}));

const solicitacoes = [
  ['SOL-018', 'MOR-302-01', 'Vazamento na cozinha', 'Dentro da unidade · cozinha', 'Normal', 'Em análise', 'Há água sob a pia, mesmo com a torneira fechada.'],
  ['SOL-017', 'MOR-105-01', 'Portão com falha', 'Área comum', 'Alta', 'Aberto', 'O portão principal interrompe o fechamento.'],
  ['SOL-013', 'MOR-204-01', 'Luz apagada no corredor', 'Área comum', 'Normal', 'Concluído', 'Lâmpada do corredor do segundo andar.'],
  ['SOL-012', 'MOR-403-01', 'Ajuste no interfone', 'Dentro da unidade', 'Normal', 'Concluído', 'O áudio do interfone estava baixo.'],
].map(([id, moradorId, titulo, local, prioridade, status, descricao]) => ({
  id, moradorId, titulo, local, prioridade, status, descricao,
}));

const espacos = [
  ['ESP-001', 'Salão de festas'], ['ESP-002', 'Churrasqueira'], ['ESP-003', 'Quadra'],
].map(([id, nome]) => ({ id, nome }));

const reservas = [
  ['RES-021', 'ESP-001', 'MOR-302-01', '21T14:00', '21T17:00', 'Confirmada'],
  ['RES-020', 'ESP-001', 'MOR-105-01', '21T10:00', '21T13:00', 'Confirmada'],
  ['RES-019', 'ESP-002', 'MOR-204-01', '22T11:00', '22T14:00', 'Cancelada'],
  ['RES-018', 'ESP-003', 'MOR-403-01', '10T17:00', '10T18:00', 'Confirmada'],
].map(([id, espacoId, moradorId, inicio, fim, status]) => ({
  id, espacoId, moradorId, inicio: dataHora(inicio), fim: dataHora(fim), status,
}));

const conversas = [
  { id: 'CNV-001', participanteIds: ['MOR-302-01', 'MOR-105-01'] },
  { id: 'CNV-002', participanteIds: ['MOR-302-01', 'MOR-204-01'] },
  { id: 'CNV-003', participanteIds: ['MOR-403-01', 'MOR-302-02'] },
];

const mensagens = [
  ['MSG-001', 'CNV-001', 'MOR-105-01', '14T10:00', 'Você vai à reunião de moradores?'],
  ['MSG-002', 'CNV-001', 'MOR-302-01', '14T10:15', 'Sim, estarei lá.'],
  ['MSG-003', 'CNV-002', 'MOR-204-01', '15T09:00', 'A manutenção do elevador foi confirmada.'],
  ['MSG-004', 'CNV-003', 'MOR-403-01', '15T10:00', 'A quadra está aberta hoje?'],
].map(([id, conversaId, autorId, data, texto]) => ({
  id, conversaId, autorId, enviadaEm: dataHora(data), texto,
}));

const comunicados = [
  ['COM-003', 'ADM-001', 'oficial', 'A', '14T10:00', 'Manutenção no elevador', 'O elevador da Torre A ficará indisponível na segunda-feira, 16/11, a partir das 9h.'],
  ['COM-002', 'ADM-001', 'oficial', null, '13T10:00', 'Reunião de moradores', 'A reunião será realizada no salão de festas.'],
  ['COM-001', 'POR-001', 'operacional', null, '14T11:00', 'Acesso de veículos pelo portão lateral', 'No dia 14/11, das 14h às 17h, use o portão lateral.'],
].map(([id, autorId, tipo, torre, data, titulo, mensagem]) => ({
  id, autorId, tipo, torre, publicadoEm: dataHora(data), titulo, mensagem,
}));

function dataHora(diaEHora) {
  return '2026-11-' + diaEHora + ':00-03:00';
}

export function criarDadosDemo() {
  return migrarDados(structuredClone({
    usuarios, unidades, encomendas, solicitacoes, espacos, reservas,
    conversas, mensagens, comunicados, notificacoes: [],
  }));
}
