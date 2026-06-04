/**
 * Stores up to MAX_ENTRIES past encounters in memory.
 */

const MAX_ENTRIES = 5;

const History = (() => {
  const entries = [];
  let currentKey = null;

  function keyFor(enc) {
    return `${enc.CurrentZoneName}__${enc.title}__${enc.duration}`;
  }

  function push(encounter, combatants) {
    const key = keyFor(encounter);
    if (key === currentKey) return;
    currentKey = key;

    entries.unshift({ encounter: { ...encounter }, combatants: { ...combatants }, ts: Date.now() });
    if (entries.length > MAX_ENTRIES) entries.pop();
  }

  function getAll() { return entries; }

  return { push, getAll };
})();

// History is a global
