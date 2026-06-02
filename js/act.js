/**
 * ACT / OverlayPlugin communication layer.
 * Supports: modern addOverlayListener API, legacy ACTWebSocket, and
 * a mock data mode for development in a regular browser.
 */

const ACT = (() => {
  const listeners = {};

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function off(event, fn) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(f => f !== fn);
  }

  // ── Modern OverlayPlugin (ngld fork) ──────────────────────────────────
  function connectModern() {
    window.addOverlayListener('CombatData',   d => emit('CombatData', d));
    window.addOverlayListener('ChangeZone',   d => emit('ChangeZone', d));
    window.addOverlayListener('LogLine',      d => emit('LogLine', d));
    window.startOverlayEvents?.();
  }

  // ── Legacy WebSocket ──────────────────────────────────────────────────
  function connectLegacy() {
    const url = (() => {
      const params = new URLSearchParams(window.location.search);
      const ws = params.get('OVERLAY_WS') || params.get('HOST_PORT');
      if (ws) return ws;
      return 'ws://127.0.0.1:10501/ws';
    })();

    const socket = new WebSocket(url);

    socket.addEventListener('message', e => {
      try {
        const data = JSON.parse(e.data);
        if (data.type) emit(data.type, data);
      } catch { /* malformed */ }
    });

    socket.addEventListener('close', () => {
      setTimeout(connectLegacy, 5000);
    });
  }

  // ── Mock data for browser development ────────────────────────────────
  function connectMock() {
    const JOBS = ['DRG','BLM','SMN','RDM','MNK','NIN','SAM','RPR',
                  'BRD','MCH','DNC','WHM','SCH','AST','SGE','GNB','WAR','PLD'];

    const players = [
      { name: 'Estinien Wyrmblood', job: 'DRG', base: 14200 },
      { name: 'Thancred Waters',    job: 'GNB',  base: 9800  },
      { name: 'Y\'shtola Rhul',     job: 'WHM',  base: 5100  },
      { name: 'Alphinaud Leveilleur', job: 'SCH', base: 4800 },
      { name: 'G\'raha Tia',        job: 'RDM',  base: 12600 },
      { name: 'Alisaie Leveilleur', job: 'BLM',  base: 13400 },
      { name: 'Urianger Augurelt',  job: 'AST',  base: 4600  },
      { name: 'Krile Baldesion',    job: 'SMN',  base: 11900 },
    ];

    let elapsed = 0;  // seconds
    let active = true;

    function rng(base) { return base + Math.round((Math.random() - 0.5) * base * 0.08); }

    setInterval(() => {
      if (!active) return;
      elapsed++;
      const duration = elapsed;
      const mm = String(Math.floor(duration / 60)).padStart(2, '0');
      const ss = String(duration % 60).padStart(2, '0');

      const combatants = {};
      let totalDmg = 0;

      players.forEach(p => {
        const dmg = rng(p.base) * duration;
        totalDmg += dmg;
        combatants[p.name] = {
          name: p.name,
          Job: p.job,
          damage: String(dmg),
          encdps: String((dmg / duration).toFixed(2)),
          dps:    String((dmg / duration).toFixed(2)),
          'damage%': '0',
          healed: String(p.base < 6000 ? rng(p.base) * duration * 4 : 0),
          enchps: String(p.base < 6000 ? ((rng(p.base) * duration * 4) / duration).toFixed(2) : '0'),
          damagetaken: String(rng(800) * duration),
          crithits: String(Math.floor(rng(30))),
          hits:     String(Math.floor(rng(200))),
          maxhit:   `${p.job} Combo-${rng(80000)}`,
          deaths:   '0',
          DURATION: String(duration),
        };
      });

      Object.values(combatants).forEach(c => {
        c['damage%'] = ((parseFloat(c.damage) / totalDmg) * 100).toFixed(1) + '%';
      });

      emit('CombatData', {
        type: 'CombatData',
        isActive: 'true',
        Encounter: {
          title:    'The Unending Coil of Bahamut (Ultimate)',
          duration: `${mm}:${ss}`,
          DURATION: String(duration),
          damage:   String(totalDmg),
          encdps:   String((totalDmg / duration).toFixed(2)),
          healed:   String(totalDmg * 0.3),
          enchps:   String((totalDmg * 0.3 / duration).toFixed(2)),
          maxhit:   'DRG Combo-318450',
          kills:    '0',
          deaths:   '0',
          CurrentZoneName: 'The Unending Coil of Bahamut (Ultimate)',
        },
        Combatant: combatants,
      });
    }, 1000);
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    if (typeof window.addOverlayListener === 'function') {
      connectModern();
    } else if (window.location.search.includes('OVERLAY_WS') ||
               window.location.search.includes('HOST_PORT')) {
      connectLegacy();
    } else {
      // Dev mode — no ACT running
      console.info('[Quartzite] No ACT detected — running mock data');
      connectMock();
    }
  }

  return { init, on, off };
})();

export default ACT;
