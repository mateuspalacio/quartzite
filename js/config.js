/**
 * Persistent settings via localStorage.
 */

const DEFAULTS = {
  blurNames:  false,
  mergePets:  true,
  showJobs:   true,
  maxRows:    8,
  theme:      'dark',
  mode:       'dps',
  yourName:   '',      // character name to highlight
  yourLabel:  'YOU',   // what to display instead
};

const KEY = 'quartzite_settings';

const Config = (() => {
  let data = { ...DEFAULTS };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      data = { ...DEFAULTS, ...saved };
    } catch { data = { ...DEFAULTS }; }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get(key) { return data[key]; }

  function set(key, value) {
    data[key] = value;
    save();
  }

  load();
  return { get, set };
})();

export default Config;
