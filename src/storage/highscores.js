const HighScores = (() => {
  'use strict';

  const KEY        = 'reaction_game_v1';
  const MAX_SCORES = 10;

  const ACHIEVEMENTS = [
    { id: 'first_attempt', label: 'First Step',  icon: '🏁', desc: 'Complete your first attempt',   check: d => d.totalAttempts >= 1   },
    { id: 'sub_300',       label: 'Sharp',        icon: '🎯', desc: 'React in under 300 ms',         check: d => d.scores.some(s => s.ms < 300) },
    { id: 'sub_250',       label: 'Precise',      icon: '⚡', desc: 'React in under 250 ms',         check: d => d.scores.some(s => s.ms < 250) },
    { id: 'sub_200',       label: 'Elite',        icon: '🚀', desc: 'React in under 200 ms',         check: d => d.scores.some(s => s.ms < 200) },
    { id: 'sub_150',       label: 'Superhuman',   icon: '🌟', desc: 'React in under 150 ms',         check: d => d.scores.some(s => s.ms < 150) },
    { id: 'dedicated',     label: 'Dedicated',    icon: '💪', desc: 'Complete 25 attempts',          check: d => d.totalAttempts >= 25  },
    { id: 'centurion',     label: 'Centurion',    icon: '🏅', desc: 'Complete 100 attempts',         check: d => d.totalAttempts >= 100 },
  ];

  function defaultData() {
    return { version: 1, scores: [], achievements: {}, totalAttempts: 0 };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : defaultData();
    } catch (_) {
      return defaultData();
    }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
  }

  function addScore(ms) {
    const data   = load();
    const rounded = Math.round(ms);

    const prevBest = data.scores.length ? data.scores[0].ms : null;
    const isNewBest = prevBest === null || rounded < prevBest;

    data.scores.push({ ms: rounded, ts: Date.now() });
    data.scores.sort((a, b) => a.ms - b.ms);
    if (data.scores.length > MAX_SCORES) data.scores.length = MAX_SCORES;
    data.totalAttempts++;

    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (!data.achievements[ach.id] && ach.check(data)) {
        data.achievements[ach.id] = Date.now();
        newlyUnlocked.push(ach);
      }
    }

    save(data);
    return { data, newlyUnlocked, isNewBest };
  }

  function getPersonalBest() {
    const { scores } = load();
    return scores.length ? scores[0].ms : null;
  }

  function getTopScores()      { return load().scores; }
  function getTotalAttempts()  { return load().totalAttempts; }

  function getUnlocked() {
    const { achievements } = load();
    return ACHIEVEMENTS
      .filter(a => achievements[a.id])
      .map(a => ({ ...a, unlockedAt: achievements[a.id] }));
  }

  function reset() { localStorage.removeItem(KEY); }

  return { addScore, getPersonalBest, getTopScores, getTotalAttempts, getUnlocked, ACHIEVEMENTS, reset };
})();

if (typeof module !== 'undefined') module.exports = HighScores;
