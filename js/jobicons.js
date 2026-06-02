/**
 * Loads the SVG sprite and returns a helper to render job icons.
 */

let spriteLoaded = false;

export async function loadSprite() {
  if (spriteLoaded) return;
  try {
    const res = await fetch('icons/jobs.svg');
    const text = await res.text();
    document.getElementById('svg-sprite').innerHTML = text;
    spriteLoaded = true;
  } catch (e) {
    console.warn('[Quartzite] Could not load job icon sprite:', e);
  }
}

/**
 * Returns an SVG <use> element referencing the job symbol,
 * or null if the symbol doesn't exist in the sprite.
 */
export function jobIcon(job) {
  const id = `job-${(job || '').toUpperCase()}`;
  return `<svg class="job-svg" viewBox="0 0 20 20" aria-hidden="true"><use href="#${id}"/></svg>`;
}

export const KNOWN_JOBS = new Set([
  'PLD','WAR','DRK','GNB',
  'WHM','SCH','AST','SGE',
  'MNK','DRG','NIN','SAM','RPR','VPR',
  'BRD','MCH','DNC',
  'BLM','SMN','RDM','PCT',
]);
