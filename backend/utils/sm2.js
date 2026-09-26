/**
 * SM-2 spaced repetition algorithm — the same scheduling logic behind
 * Anki and SuperMemo. Given how well the student did on a topic (a
 * quality score from 0-5) and their history with that topic, it computes
 * when they should see it again.
 *
 * quality scale (matches SuperMemo's original definition):
 *   0-2 = failed / struggled  → reset, review again tomorrow
 *   3   = correct, but hard   → short interval, ease drops slightly
 *   4-5 = correct, easy       → interval grows, ease stays/improves
 */
export function sm2(quality, { easeFactor = 2.5, interval = 0, repetitions = 0 } = {}) {
  quality = Math.max(0, Math.min(5, quality));

  let newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEase < 1.3) newEase = 1.3;

  let newRepetitions;
  let newInterval;

  if (quality < 3) {
    // Failed — reset the streak, review again very soon.
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEase);
    }
  }

  return {
    easeFactor: Number(newEase.toFixed(2)),
    interval: newInterval,
    repetitions: newRepetitions,
  };
}
