/**
 * Number and string formatting utilities.
 */

const numFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Full comma-formatted number: 13,690.40 */
export function fmtDps(val) {
  const n = parseFloat(val) || 0;
  return numFmt.format(n);
}

export function fmtPct(val) {
  const s = String(val || '');
  const n = parseFloat(s);
  if (isNaN(n)) return '0.0%';
  return n.toFixed(1) + '%';
}

export function firstName(name) {
  return (name || '').split(' ')[0];
}

export function jobAbbr(job) {
  return (job || '???').toUpperCase().slice(0, 3);
}
