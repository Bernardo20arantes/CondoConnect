// Relógio fixo apenas nos testes: não altera datas da aplicação publicada.
export const AGORA = '2026-11-18T15:00:00.000Z';
export const DIA_FUTURO = '2026-11-23';
export async function fixarRelogio(chamar) {
  await chamar('Page.enable');
  await chamar('Emulation.setTimezoneOverride', { timezoneId: 'America/Sao_Paulo' });
  await chamar('Page.addScriptToEvaluateOnNewDocument', { source: `
    {
      const Original = Date, instante = Original.parse('${AGORA}');
      globalThis.Date = class extends Original {
        constructor(...args) { super(...(args.length ? args : [instante])); }
        static now() { return instante; }
      };
    }
  ` });
}
