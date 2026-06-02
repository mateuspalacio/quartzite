/**
 * Number and string formatting utilities.
 */

export function fmtDps(val) {
  const n = parseFloat(val) || 0;
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toString();
}

export function fmtPct(val) {
  const s = String(val || '');
  return s.endsWith('%') ? s : parseFloat(s).toFixed(1) + '%';
}

export function firstName(name) {
  return (name || '').split(' ')[0];
}

export function jobAbbr(job) {
  return (job || '???').toUpperCase().slice(0, 3);
}
