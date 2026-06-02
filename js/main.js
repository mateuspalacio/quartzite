import ACT     from './act.js';
import Config   from './config.js';
import History  from './history.js';
import { fmtDps, fmtPct, firstName, jobAbbr } from './format.js';

// ── DOM refs ──────────────────────────────────────────────────────────────
const $app           = document.getElementById('app');
const $zone          = document.getElementById('encounter-zone');
const $duration      = document.getElementById('encounter-duration');
const $rdps          = document.getElementById('encounter-rdps');
const $rhps          = document.getElementById('encounter-rhps');
const $list          = document.getElementById('combatant-list');
const $empty         = document.getElementById('empty-state');
const $tabs          = document.getElementById('mode-tabs');

const $historyPanel  = document.getElementById('history-panel');
const $historyList   = document.getElementById('history-list');
const $settingsPanel = document.getElementById('settings-panel');

// ── State ─────────────────────────────────────────────────────────────────
let mode         = Config.get('mode');         // 'dps' | 'hps' | 'tank'
let lastData     = null;
let historyOpen  = false;
let settingsOpen = false;

// ── Apply saved settings ──────────────────────────────────────────────────
applyTheme(Config.get('theme'));
applyBlur(Config.get('blurNames'));

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
}

function applyBlur(v) {
  $app.classList.toggle('blur-names', v);
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

$blurNames.checked  = Config.get('blurNames');
$mergePets.checked  = Config.get('mergePets');
$showJobs.checked   = Config.get('showJobs');
$maxRows.value      = Config.get('maxRows');
$theme.value        = Config.get('theme');

$blurNames.addEventListener('change', () => {
  Config.set('blurNames', $blurNames.checked);
  applyBlur($blurNames.checked);
});

$mergePets.addEventListener('change', () => {
  Config.set('mergePets', $mergePets.checked);
  if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant);
});

$showJobs.addEventListener('change', () => {
  Config.set('showJobs', $showJobs.checked);
  if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant);
});

$maxRows.addEventListener('change', () => {
  Config.set('maxRows', parseInt($maxRows.value, 10) || 0);
  if (lastData) renderCombatants(lastData.Encounter, lastData.Combatant);
});

$theme.addEventListener('change', () => {
  Config.set('theme', $theme.value);
  applyTheme($theme.value);
});

// ── Render helpers ────────────────────────────────────────────────────────
function sortKey(c) {
  if (mode === 'dps')  return parseFloat(c.encdps)     || 0;
  if (mode === 'hps')  return parseFloat(c.enchps)     || 0;
  if (mode === 'tank') return parseFloat(c.damagetaken) || 0;
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
  const petSuffixes = [' (Pet)', "'s Eos", "'s Selene", "'s Seraph",
                       "'s Carbuncle", "'s Emerald", "'s Topaz", "'s Ruby",
                       "'s Garuda", "'s Titan", "'s Ifrit",
                       "'s Bahamut", "'s Phoenix", "'s Demi-Bahamut", "'s Demi-Phoenix",
                       "'s Solar Bahamut"];

  function ownerOf(name) {
    for (const suf of petSuffixes) {
      if (name.endsWith(suf)) return name.slice(0, -suf.length);
    }
    return null;
  }

  // First pass: copy all real players
  Object.values(combatants).forEach(c => {
    const owner = ownerOf(c.name);
    if (!owner) merged[c.name] = { ...c };
  });

  // Second pass: merge pet damage into owner
  Object.values(combatants).forEach(c => {
    const owner = ownerOf(c.name);
    if (!owner || !merged[owner]) return;
    const o = merged[owner];
    const addNum = (k) => { o[k] = String((parseFloat(o[k]) || 0) + (parseFloat(c[k]) || 0)); };
    ['damage', 'healed', 'damagetaken'].forEach(addNum);
    // Recalculate rates
    const dur = parseFloat(c.DURATION) || 1;
    o.encdps = String((parseFloat(o.damage) / dur).toFixed(2));
    o.enchps = String((parseFloat(o.healed) / dur).toFixed(2));
  });

  return merged;
}

function buildRow(c, rank, maxVal) {
  const pct   = maxVal > 0 ? ((parseFloat(sortKey(c)) / maxVal) * 100).toFixed(1) : 0;
  const dmgPct = fmtPct(c['damage%'] || '0%');
  const job    = (c.Job || 'DEFAULT').toUpperCase();
  const showJobs = Config.get('showJobs');

  const row = document.createElement('div');
  row.className = 'combatant-row';
  row.setAttribute('data-name', c.name);

  row.innerHTML = `
    <div class="combatant-bar" style="--bar-pct:${pct}%"></div>
    <span class="combatant-rank ${rank <= 3 ? 'rank-' + rank : ''}">${rank}</span>
    ${showJobs ? `<div class="combatant-job job-${job}" title="${job}">${jobAbbr(job)}</div>` : ''}
    <span class="combatant-name">${firstName(c.name)}</span>
    <div class="combatant-stats">
      <span class="combatant-pct">${dmgPct}</span>
      <span class="combatant-primary">${primaryStat(c)}</span>
    </div>
  `;

  return row;
}

function renderCombatants(encounter, rawCombatants) {
  const combatants = mergePets(rawCombatants);
  const maxRows    = Config.get('maxRows') || Infinity;

  let players = Object.values(combatants)
    .filter(c => c.name && c.name !== 'YOU' /* ACT placeholder */ );

  players.sort((a, b) => sortKey(b) - sortKey(a));

  if (maxRows) players = players.slice(0, maxRows);

  const maxVal = players.length ? sortKey(players[0]) : 1;

  // Diff-based update: reuse existing rows where possible
  const existing = {};
  $list.querySelectorAll('.combatant-row').forEach(el => {
    existing[el.dataset.name] = el;
  });

  const fragment = document.createDocumentFragment();
  const seen = new Set();

  players.forEach((c, i) => {
    seen.add(c.name);
    const newRow = buildRow(c, i + 1, maxVal);

    if (existing[c.name]) {
      // Update bar width and stats in place (no re-insert = no flash)
      const old = existing[c.name];
      old.querySelector('.combatant-bar').style.setProperty('--bar-pct', `${(maxVal > 0 ? (sortKey(c) / maxVal * 100) : 0).toFixed(1)}%`);
      old.querySelector('.combatant-primary').textContent = primaryStat(c);
      old.querySelector('.combatant-pct').textContent = fmtPct(c['damage%'] || '0%');
      old.querySelector('.combatant-rank').textContent = i + 1;
      old.querySelector('.combatant-rank').className = `combatant-rank${i < 3 ? ' rank-' + (i + 1) : ''}`;
      fragment.appendChild(old);
    } else {
      fragment.appendChild(newRow);
    }
  });

  // Remove rows no longer present
  Object.keys(existing).forEach(name => {
    if (!seen.has(name)) existing[name].remove();
  });

  $empty.style.display = players.length ? 'none' : 'block';
  $list.appendChild(fragment);
}

function renderHeader(encounter) {
  $zone.textContent     = encounter.CurrentZoneName || encounter.title || 'Unknown Zone';
  $duration.textContent = encounter.duration || '';
  $rdps.textContent     = fmtDps(encounter.encdps);
  $rhps.textContent     = fmtDps(encounter.enchps);
}

// ── History panel render ──────────────────────────────────────────────────
function renderHistoryList() {
  const entries = History.getAll();
  $historyList.innerHTML = '';

  if (!entries.length) {
    $historyList.innerHTML = '<li style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:12px;">No history yet</li>';
    return;
  }

  entries.forEach((entry, i) => {
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
      renderHeader(enc);
      renderCombatants(enc, entry.combatants);
    });
    $historyList.appendChild(li);
  });
}

// ── ACT data handler ──────────────────────────────────────────────────────
ACT.on('CombatData', data => {
  // Save to history if encounter just ended
  if (lastData && lastData.isActive === 'true' && data.isActive === 'false') {
    History.push(lastData.Encounter, lastData.Combatant);
  }

  lastData = data;

  // Don't update display if user is browsing history
  if ($historyList.querySelector('.active')) return;

  renderHeader(data.Encounter);
  renderCombatants(data.Encounter, data.Combatant);
});

// ── Start ─────────────────────────────────────────────────────────────────
ACT.init();
