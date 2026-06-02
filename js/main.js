import ACT                    from './act.js';
import Config                 from './config.js';
import History                from './history.js';
import { fmtDps, fmtPct, firstName } from './format.js';
import { jobIconSrc, hasIcon } from './jobicons.js';

// ── DOM refs ──────────────────────────────────────────────────────────────
const $app           = document.getElementById('app');
const $zone          = document.getElementById('encounter-zone');
const $duration      = document.getElementById('encounter-duration');
const $rdps          = document.getElementById('encounter-rdps');
const $rhps          = document.getElementById('encounter-rhps');
const $list          = document.getElementById('combatant-list');
const $empty         = document.getElementById('empty-state');
const $tabs          = document.getElementById('mode-tabs');
const $header        = document.getElementById('encounter-header');
const $historyPanel  = document.getElementById('history-panel');
const $historyList   = document.getElementById('history-list');
const $settingsPanel = document.getElementById('settings-panel');

// ── State ─────────────────────────────────────────────────────────────────
let mode         = Config.get('mode');
let lastData     = null;
let historyOpen  = false;
let settingsOpen = false;

// Live timer state — updated by rAF between ACT ticks
let timerBase    = 0;   // seconds reported by last ACT event
let timerTickAt  = 0;   // performance.now() when that event arrived
let timerActive  = false;

function formatDuration(totalSeconds) {
  const s = Math.floor(totalSeconds);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// rAF loop — only updates the duration text, nothing else
(function tickTimer() {
  if (timerActive) {
    const elapsed = (performance.now() - timerTickAt) / 1000;
    $duration.textContent = formatDuration(timerBase + elapsed);
  }
  requestAnimationFrame(tickTimer);
})();

// ── Boot ──────────────────────────────────────────────────────────────────
ACT.init();

// ── Apply saved settings ──────────────────────────────────────────────────
applyTheme(Config.get('theme'));
applyBlur(Config.get('blurNames'));
applyMaxRows(Config.get('maxRows'));

function applyTheme(t)    { document.documentElement.setAttribute('data-theme', t); }
function applyBlur(v)     { $app.classList.toggle('blur-names', v); }
function applyMaxRows(n)  { $list.style.setProperty('--max-rows', n || 8); }

// ── Encounter-end flash ───────────────────────────────────────────────────
function flashEncounterEnd() {
  $app.classList.remove('encounter-end-flash');
  // Force reflow so re-adding the class restarts the animation
  void $app.offsetWidth;
  $app.classList.add('encounter-end-flash');
  $app.addEventListener('animationend', () => {
    $app.classList.remove('encounter-end-flash');
  }, { once: true });
}

// ── Tabs ──────────────────────────────────────────────────────────────────
$tabs.querySelectorAll('.tab').forEach(tab => {
  if (tab.dataset.mode === mode) tab.classList.add('active');
  tab.addEventListener('click', () => {
    mode = tab.dataset.mode;
    Config.set('mode', mode);
    $tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
    if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant);
  });
});

// ── Panel toggles ─────────────────────────────────────────────────────────
document.getElementById('btn-history').addEventListener('click', () => {
  historyOpen = !historyOpen;
  $historyPanel.classList.toggle('open', historyOpen);
  $historyPanel.setAttribute('aria-hidden', String(!historyOpen));
  document.getElementById('btn-history').classList.toggle('active', historyOpen);
  if (historyOpen) renderHistoryList();
});

document.getElementById('btn-history-close').addEventListener('click', () => {
  historyOpen = false;
  $historyPanel.classList.remove('open');
  $historyPanel.setAttribute('aria-hidden', 'true');
  document.getElementById('btn-history').classList.remove('active');
});

document.getElementById('btn-settings').addEventListener('click', () => {
  settingsOpen = !settingsOpen;
  $settingsPanel.classList.toggle('open', settingsOpen);
  $settingsPanel.setAttribute('aria-hidden', String(!settingsOpen));
  document.getElementById('btn-settings').classList.toggle('active', settingsOpen);
});

document.getElementById('btn-settings-close').addEventListener('click', () => {
  settingsOpen = false;
  $settingsPanel.classList.remove('open');
  $settingsPanel.setAttribute('aria-hidden', 'true');
  document.getElementById('btn-settings').classList.remove('active');
});

// ── Settings controls ─────────────────────────────────────────────────────
const $blurNames  = document.getElementById('set-blur-names');
const $mergePets  = document.getElementById('set-merge-pets');
const $showJobs   = document.getElementById('set-show-jobs');
const $maxRows    = document.getElementById('set-max-rows');
const $theme      = document.getElementById('set-theme');
const $yourName   = document.getElementById('set-your-name');
const $yourLabel  = document.getElementById('set-your-label');

$blurNames.checked = Config.get('blurNames');
$mergePets.checked = Config.get('mergePets');
$showJobs.checked  = Config.get('showJobs');
$maxRows.value     = Config.get('maxRows');
$theme.value       = Config.get('theme');
$yourName.value    = Config.get('yourName');
$yourLabel.value   = Config.get('yourLabel');

$blurNames.addEventListener('change', () => { Config.set('blurNames', $blurNames.checked); applyBlur($blurNames.checked); });
$mergePets.addEventListener('change', () => { Config.set('mergePets', $mergePets.checked); if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant); });
$showJobs.addEventListener('change',  () => { Config.set('showJobs', $showJobs.checked);   if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant); });
$maxRows.addEventListener('change',   () => { const n = parseInt($maxRows.value, 10) || 0; Config.set('maxRows', n); applyMaxRows(n); if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant); });
$theme.addEventListener('change',     () => { Config.set('theme', $theme.value); applyTheme($theme.value); });

function saveAndRerender() { if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant); }
$yourName.addEventListener('input',  () => { Config.set('yourName',  $yourName.value.trim());  saveAndRerender(); });
$yourLabel.addEventListener('input', () => { Config.set('yourLabel', $yourLabel.value.trim()); saveAndRerender(); });

// ── Render helpers ────────────────────────────────────────────────────────
function sortKey(c) {
  if (mode === 'dps')  return parseFloat(c.encdps)      || 0;
  if (mode === 'hps')  return parseFloat(c.enchps)      || 0;
  if (mode === 'tank') return parseFloat(c.damagetaken)  || 0;
  return 0;
}

function primaryStat(c) {
  if (mode === 'dps')  return fmtDps(c.encdps);
  if (mode === 'hps')  return fmtDps(c.enchps);
  if (mode === 'tank') return fmtDps(c.damagetaken);
  return '—';
}

function mergePets(combatants) {
  if (!Config.get('mergePets')) return combatants;
  const merged = {};
  const petSuffixes = [
    " (Pet)","'s Eos","'s Selene","'s Seraph","'s Carbuncle",
    "'s Emerald","'s Topaz","'s Ruby","'s Garuda","'s Titan","'s Ifrit",
    "'s Bahamut","'s Phoenix","'s Demi-Bahamut","'s Demi-Phoenix","'s Solar Bahamut",
  ];
  function ownerOf(name) {
    for (const s of petSuffixes) if (name.endsWith(s)) return name.slice(0, -s.length);
    return null;
  }
  Object.values(combatants).forEach(c => { if (!ownerOf(c.name)) merged[c.name] = { ...c }; });
  Object.values(combatants).forEach(c => {
    const owner = ownerOf(c.name);
    if (!owner || !merged[owner]) return;
    const o = merged[owner];
    ['damage','healed','damagetaken'].forEach(k => { o[k] = String((parseFloat(o[k])||0)+(parseFloat(c[k])||0)); });
    const dur = parseFloat(c.DURATION) || 1;
    o.encdps = String((parseFloat(o.damage) / dur).toFixed(2));
    o.enchps = String((parseFloat(o.healed) / dur).toFixed(2));
  });
  return merged;
}

function buildRow(c, rank, maxVal) {
  const pct      = maxVal > 0 ? ((sortKey(c) / maxVal) * 100).toFixed(1) : 0;
  const dmgPct   = fmtPct(c['damage%'] || '0%');
  const job      = (c.Job || 'DEFAULT').toUpperCase();
  const showJobs = Config.get('showJobs');

  // "You" highlighting — match full name or first name
  const yourName  = Config.get('yourName').toLowerCase();
  const yourLabel = Config.get('yourLabel') || 'YOU';
  const isYou     = yourName && (
    c.name.toLowerCase() === yourName ||
    firstName(c.name).toLowerCase() === yourName
  );
  const displayName = isYou ? yourLabel : firstName(c.name);

  const row = document.createElement('div');
  row.className = `combatant-row job-${job}${isYou ? ' is-you' : ''}`;
  row.setAttribute('data-name', c.name);
  // Bar starts at 0; double-rAF lets the element paint before transitioning
  row.style.setProperty('--bar-pct', '0%');

  const iconHtml = showJobs
    ? `<div class="combatant-job" title="${job}"><img src="${jobIconSrc(job)}" alt="${job}" loading="lazy" /></div>`
    : '';

  row.innerHTML = `
    <div class="combatant-bar"></div>
    <span class="combatant-rank ${rank <= 3 ? 'rank-' + rank : ''}">${rank}</span>
    ${iconHtml}
    <span class="combatant-name">${displayName}</span>
    <div class="combatant-stats">
      <span class="combatant-pct">${dmgPct}</span>
      <span class="combatant-primary">${primaryStat(c)}</span>
    </div>
  `;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    row.style.setProperty('--bar-pct', `${pct}%`);
  }));

  return row;
}

function renderCombatants(rawEncounter, rawCombatants) {
  const combatants = mergePets(rawCombatants);
  const maxRows    = Config.get('maxRows') || Infinity;

  let players = Object.values(combatants).filter(c => !!c.name);
  players.sort((a, b) => sortKey(b) - sortKey(a));
  if (maxRows) players = players.slice(0, maxRows);

  const maxVal = players.length ? sortKey(players[0]) : 1;

  // Index existing rows by name — never move them, use CSS order instead
  const existing = {};
  $list.querySelectorAll('.combatant-row').forEach(el => { existing[el.dataset.name] = el; });

  const seen = new Set();

  players.forEach((c, i) => {
    seen.add(c.name);
    const newPct = maxVal > 0 ? ((sortKey(c) / maxVal) * 100).toFixed(1) : 0;

    if (existing[c.name]) {
      // Update in-place — no DOM move, no animation replay
      const row = existing[c.name];
      const yourName  = Config.get('yourName').toLowerCase();
      const yourLabel = Config.get('yourLabel') || 'YOU';
      const isYou     = yourName && (
        c.name.toLowerCase() === yourName ||
        firstName(c.name).toLowerCase() === yourName
      );
      row.classList.toggle('is-you', isYou);
      row.style.order = i;
      row.style.setProperty('--bar-pct', `${newPct}%`);
      row.querySelector('.combatant-name').textContent = isYou ? yourLabel : firstName(c.name);
      row.querySelector('.combatant-primary').textContent = primaryStat(c);
      row.querySelector('.combatant-pct').textContent = fmtPct(c['damage%'] || '0%');
      const rankEl = row.querySelector('.combatant-rank');
      rankEl.textContent = i + 1;
      rankEl.className = `combatant-rank${i < 3 ? ' rank-' + (i + 1) : ''}`;
    } else {
      // New player — build, set order, append once
      const row = buildRow(c, i + 1, maxVal);
      row.style.order = i;
      $list.appendChild(row);
    }
  });

  // Remove players no longer in the list
  Object.keys(existing).forEach(name => { if (!seen.has(name)) existing[name].remove(); });

  $empty.style.display = players.length ? 'none' : 'block';
}

function renderHeader(encounter, isActive) {
  $zone.textContent = encounter.CurrentZoneName || encounter.title || 'Unknown Zone';
  $rdps.textContent = fmtDps(encounter.encdps);
  $rhps.textContent = fmtDps(encounter.enchps);

  // Sync the rAF timer to this tick's reported duration
  const secs = parseFloat(encounter.DURATION) || 0;
  timerBase   = secs;
  timerTickAt = performance.now();
  timerActive = isActive;

  // If encounter ended, freeze the display at the final time
  if (!isActive) $duration.textContent = encounter.duration || formatDuration(secs);
}

function renderHistoryList() {
  const entries = History.getAll();
  $historyList.innerHTML = '';
  if (!entries.length) {
    $historyList.innerHTML = '<li style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:12px;">No history yet</li>';
    return;
  }
  entries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'history-item';
    const enc = entry.encounter;
    li.innerHTML = `
      <div class="history-item-info">
        <div class="history-item-title">${enc.CurrentZoneName || enc.title || 'Unknown'}</div>
        <div class="history-item-meta">${enc.duration || '—'}</div>
      </div>
      <span class="history-item-dps">${fmtDps(enc.encdps)}</span>
    `;
    li.addEventListener('click', () => {
      $historyList.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      renderHeader(enc, false);
      renderCombatants(enc, entry.combatants);
    });
    $historyList.appendChild(li);
  });
}

// ── ACT data handler ──────────────────────────────────────────────────────
ACT.on('CombatData', data => {
  const wasActive = lastData?.isActive === 'true';
  const nowActive = data.isActive === 'true';

  if (wasActive && !nowActive) {
    History.push(lastData.Encounter, lastData.Combatant);
    flashEncounterEnd();
  }

  lastData = data;

  if ($historyList.querySelector('.active')) return;

  renderHeader(data.Encounter, nowActive);
  renderCombatants(data.Encounter, data.Combatant);
});
