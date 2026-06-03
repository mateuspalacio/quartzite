/**
 * Kagerou sprite-based job icon resolver.
 * Single sprite: icons/classes.png (11×6 grid, same file as Kagerou share/img/classes.png)
 * background-size: 1100% 600% → each cell is selected by background-position.
 */

const SPRITE = {
  // Row 0%
  GLA: '0% 0%',   GLD: '0% 0%',
  MRD: '10% 0%',
  PGL: '20% 0%',
  LNC: '30% 0%',
  ROG: '40% 0%',
  ARC: '50% 0%',
  THM: '60% 0%',
  ACN: '70% 0%',
  CNJ: '90% 0%',
  // Row 20%
  PLD: '0% 20%',
  WAR: '10% 20%',
  MNK: '20% 20%',
  DRG: '30% 20%',
  NIN: '40% 20%',
  BRD: '50% 20%',
  BLM: '60% 20%',
  SMN: '70% 20%',
  SCH: '80% 20%',
  WHM: '90% 20%',
  // Row 40%
  DRK: '0% 40%',
  MCH: '10% 40%',
  AST: '20% 40%',
  SAM: '30% 40%',
  RDM: '40% 40%',
  BLU: '50% 40%',
  GNB: '60% 40%',
  DNC: '70% 40%',
  RPR: '80% 40%',
  SGE: '90% 40%',
  // Row 100%
  VPR: '30% 100%',
  PCT: '40% 100%',
};

export function jobSpritePos(job) {
  return SPRITE[(job || '').toUpperCase()] || null;
}

export function hasIcon(job) {
  return (job || '').toUpperCase() in SPRITE;
}
