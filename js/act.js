/**
 * ACT / OverlayPlugin / IINACT communication layer.
 * Priority: modern addOverlayListener API → WebSocket → mock data
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

  // ── Modern OverlayPlugin / IINACT (injected API) ──────────────────────
  function connectModern() {
    console.info('[Quartzite] Using addOverlayListener API');
    window.addOverlayListener('CombatData', d => emit('CombatData', d));
    window.addOverlayListener('ChangeZone', d => emit('ChangeZone', d));
    window.addOverlayListener('LogLine',    d => emit('LogLine', d));
    window.startOverlayEvents?.();
  }

  // ── WebSocket (OVERLAY_WS / HOST_PORT params) ─────────────────────────
  function connectLegacy() {
    const params = new URLSearchParams(window.location.search);
    let raw = params.get('OVERLAY_WS') || params.get('HOST_PORT') || '';

    // Normalise to a full ws:// URL ending in /ws
    let url;
    if (!raw) {
      url = 'ws://127.0.0.1:10501/ws';
    } else if (!raw.startsWith('ws://') && !raw.startsWith('wss://')) {
      url = `ws://${raw}/ws`;
    } else {
      try {
        const u = new URL(raw);
        if (!u.pathname || u.pathname === '/') u.pathname = '/ws';
        url = u.toString();
      } catch {
        url = raw.replace(/\/?$/, '/ws');
      }
    }

    console.info('[Quartzite] WebSocket ->', url);

    const socket = new WebSocket(url);
    let heartbeatTimer = null;

    // If IINACT goes silent (zombie connection — open but no messages),
    // force-close so the 'close' handler reconnects.
    function resetHeartbeat() {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => {
        console.warn('[Quartzite] No data for 30s — reconnecting');
        socket.close();
      }, 30000);
    }

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        call: 'subscribe',
        events: ['CombatData', 'ChangeZone', 'LogLine'],
      }));
      resetHeartbeat();
    });

    socket.addEventListener('message', e => {
      resetHeartbeat();
      try {
        const msg = JSON.parse(e.data);
        if (msg.type) { emit(msg.type, msg); return; }
        if (msg.msgtype) emit(msg.msgtype, msg.msg || msg);
      } catch { /* malformed packet */ }
    });

    socket.addEventListener('close', () => {
      clearTimeout(heartbeatTimer);
      setTimeout(connectLegacy, 3000);
    });
    socket.addEventListener('error', () => { /* close fires after */ });
  }

  // ── Mock data for browser dev ─────────────────────────────────────────
  function connectMock() {
    const players = [
      { name: 'Estinien Wyrmblood',   job: 'DRG', base: 14200 },
      { name: 'Thancred Waters',      job: 'GNB',  base: 9800  },
      { name: "Y'shtola Rhul",        job: 'WHM',  base: 5100  },
      { name: 'Alphinaud Leveilleur', job: 'SCH',  base: 4800  },
      { name: "G'raha Tia",           job: 'RDM',  base: 12600 },
      { name: 'Alisaie Leveilleur',   job: 'BLM',  base: 13400 },
      { name: 'Urianger Augurelt',    job: 'AST',  base: 4600  },
      { name: 'Krile Baldesion',      job: 'SMN',  base: 11900 },
    ];

    let elapsed = 0;
    function rng(base) { return base + Math.round((Math.random() - 0.5) * base * 0.08); }

    setInterval(() => {
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
          name: p.name, Job: p.job,
          damage: String(dmg),
          encdps: String((dmg / duration).toFixed(2)),
          dps:    String((dmg / duration).toFixed(2)),
          'damage%': '0',
          healed:      String(p.base < 6000 ? rng(p.base) * duration * 4 : 0),
          enchps:      String(p.base < 6000 ? ((rng(p.base) * duration * 4) / duration).toFixed(2) : '0'),
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
          kills: '0', deaths: '0',
          CurrentZoneName: 'The Unending Coil of Bahamut (Ultimate)',
        },
        Combatant: combatants,
      });
    }, 250);
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init() {
    const hasWsParam = /OVERLAY_WS|HOST_PORT/.test(window.location.search);

    if (typeof window.addOverlayListener === 'function') {
      connectModern();
    } else if (hasWsParam) {
      // Params present but API not injected — connect via WebSocket
      connectLegacy();
    } else {
      // Wait 300ms in case OverlayPlugin injects the API after page load
      setTimeout(() => {
        if (typeof window.addOverlayListener === 'function') {
          connectModern();
        } else {
          console.info('[Quartzite] No ACT detected — running mock data');
          connectMock();
        }
      }, 300);
    }
  }

  return { init, on, off };
})();

export default ACT;
