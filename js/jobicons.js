/**
 * Job icon resolver using Kagerou-style PNG icons.
 * Files live at icons/jobs/<lowercase>.png
 */

// Maps ACT job strings (uppercase) → icon filename (lowercase)
// Handles both base classes and advanced jobs
const JOB_MAP = {
  // Tanks
  PLD: 'pld', GLA: 'gla',
  WAR: 'war', MRD: 'mrd',
  DRK: 'drk',
  GNB: 'gnb',
  // Healers
  WHM: 'whm', CNJ: 'cnj',
  SCH: 'sch',
  AST: 'ast',
  SGE: 'sge',
  // Melee
  MNK: 'mnk', PGL: 'pgl',
  DRG: 'drg', LNC: 'lnc',
  NIN: 'nin', ROG: 'rog',
  SAM: 'sam',
  RPR: 'rpr',
  VPR: 'vpr',
  // Physical Ranged
  BRD: 'brd', ARC: 'arc',
  MCH: 'mch',
  DNC: 'dnc',
  // Magical Ranged
  BLM: 'blm', THM: 'thm',
  SMN: 'smn', ACN: 'acn',
  RDM: 'rdm',
  PCT: 'pct',
  // Blue Mage
  BLU: 'blu',
};

export function jobIconSrc(job) {
  const key = (job || '').toUpperCase();
  const file = JOB_MAP[key];
  return file ? `icons/jobs/${file}.png` : 'icons/placeholder.png';
}

export function hasIcon(job) {
  return (job || '').toUpperCase() in JOB_MAP;
}
