const HighScores = require('../src/storage/highscores');

beforeEach(() => localStorage.clear());

/* ─── addScore ─── */

describe('addScore', () => {
  test('returns isNewBest true on first score', () => {
    const { isNewBest } = HighScores.addScore(300);
    expect(isNewBest).toBe(true);
  });

  test('returns isNewBest true when new score is lower than current best', () => {
    HighScores.addScore(300);
    const { isNewBest } = HighScores.addScore(200);
    expect(isNewBest).toBe(true);
  });

  test('returns isNewBest false when new score is higher than current best', () => {
    HighScores.addScore(200);
    const { isNewBest } = HighScores.addScore(300);
    expect(isNewBest).toBe(false);
  });

  test('scores are sorted ascending', () => {
    HighScores.addScore(300);
    HighScores.addScore(150);
    HighScores.addScore(250);
    expect(HighScores.getTopScores().map(s => s.ms)).toEqual([150, 250, 300]);
  });

  test('is capped at 10 scores', () => {
    for (let i = 0; i < 15; i++) HighScores.addScore(200 + i);
    expect(HighScores.getTopScores()).toHaveLength(10);
  });

  test('retains the 10 fastest scores when cap is exceeded', () => {
    for (let i = 0; i < 15; i++) HighScores.addScore(200 + i);
    const scores = HighScores.getTopScores();
    expect(scores[0].ms).toBe(200);
    expect(scores[9].ms).toBe(209);
  });

  test('rounds fractional milliseconds', () => {
    HighScores.addScore(234.7);
    expect(HighScores.getTopScores()[0].ms).toBe(235);
  });

  test('each score entry has a timestamp', () => {
    const before = Date.now();
    HighScores.addScore(300);
    const [score] = HighScores.getTopScores();
    expect(score.ts).toBeGreaterThanOrEqual(before);
  });

  test('increments totalAttempts on every call', () => {
    HighScores.addScore(300);
    HighScores.addScore(250);
    expect(HighScores.getTotalAttempts()).toBe(2);
  });
});

/* ─── getPersonalBest ─── */

describe('getPersonalBest', () => {
  test('returns null when no scores recorded', () => {
    expect(HighScores.getPersonalBest()).toBeNull();
  });

  test('returns the lowest recorded score', () => {
    HighScores.addScore(300);
    HighScores.addScore(150);
    HighScores.addScore(250);
    expect(HighScores.getPersonalBest()).toBe(150);
  });
});

/* ─── achievements ─── */

describe('achievements', () => {
  test('first_attempt unlocks on first score', () => {
    const { newlyUnlocked } = HighScores.addScore(400);
    expect(newlyUnlocked.map(a => a.id)).toContain('first_attempt');
  });

  test('sub_300 unlocks when score < 300', () => {
    const { newlyUnlocked } = HighScores.addScore(250);
    expect(newlyUnlocked.map(a => a.id)).toContain('sub_300');
  });

  test('sub_300 does not unlock when score is exactly 300', () => {
    const { newlyUnlocked } = HighScores.addScore(300);
    expect(newlyUnlocked.map(a => a.id)).not.toContain('sub_300');
  });

  test('sub_250 unlocks when score < 250', () => {
    const { newlyUnlocked } = HighScores.addScore(200);
    expect(newlyUnlocked.map(a => a.id)).toContain('sub_250');
  });

  test('sub_200 unlocks when score < 200', () => {
    const { newlyUnlocked } = HighScores.addScore(150);
    expect(newlyUnlocked.map(a => a.id)).toContain('sub_200');
  });

  test('sub_150 unlocks when score < 150', () => {
    const { newlyUnlocked } = HighScores.addScore(100);
    expect(newlyUnlocked.map(a => a.id)).toContain('sub_150');
  });

  test('dedicated unlocks after exactly 25 attempts', () => {
    let result;
    for (let i = 0; i < 25; i++) result = HighScores.addScore(400);
    expect(result.newlyUnlocked.map(a => a.id)).toContain('dedicated');
  });

  test('achievements do not unlock twice across separate calls', () => {
    HighScores.addScore(250);
    const { newlyUnlocked } = HighScores.addScore(200);
    expect(newlyUnlocked.map(a => a.id)).not.toContain('first_attempt');
    expect(newlyUnlocked.map(a => a.id)).not.toContain('sub_300');
  });

  test('getUnlocked returns all unlocked achievements', () => {
    HighScores.addScore(249); // 249 < 250 so unlocks sub_250, sub_300, first_attempt
    const ids = HighScores.getUnlocked().map(a => a.id);
    expect(ids).toContain('first_attempt');
    expect(ids).toContain('sub_300');
    expect(ids).toContain('sub_250');
  });

  test('unlocked achievements include an unlockedAt timestamp', () => {
    const before = Date.now();
    HighScores.addScore(250);
    const unlocked = HighScores.getUnlocked();
    unlocked.forEach(a => expect(a.unlockedAt).toBeGreaterThanOrEqual(before));
  });
});

/* ─── reset ─── */

describe('reset', () => {
  test('clears all scores', () => {
    HighScores.addScore(250);
    HighScores.reset();
    expect(HighScores.getTopScores()).toHaveLength(0);
  });

  test('clears personal best', () => {
    HighScores.addScore(250);
    HighScores.reset();
    expect(HighScores.getPersonalBest()).toBeNull();
  });

  test('resets total attempts to 0', () => {
    HighScores.addScore(250);
    HighScores.reset();
    expect(HighScores.getTotalAttempts()).toBe(0);
  });

  test('clears unlocked achievements', () => {
    HighScores.addScore(250);
    HighScores.reset();
    expect(HighScores.getUnlocked()).toHaveLength(0);
  });
});
