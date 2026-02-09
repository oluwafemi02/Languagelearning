const SRS = (() => {
  const DEFAULT_EASE = 2.5;

  const createItem = ({ id, kind, now = new Date() }) => {
    const timestamp = now.toISOString();
    return {
      id,
      kind,
      ease: DEFAULT_EASE,
      interval: 1,
      dueAt: timestamp,
      lastReviewedAt: null,
      correctStreak: 0,
      incorrectCount: 0,
      box: 1
    };
  };

  const updateItem = (item, isCorrect, now = new Date()) => {
    const next = { ...item };
    next.lastReviewedAt = now.toISOString();
    if (isCorrect) {
      next.correctStreak += 1;
      next.ease = Math.max(1.3, next.ease + 0.1);
      if (next.correctStreak === 1) {
        next.interval = 1;
      } else if (next.correctStreak === 2) {
        next.interval = 3;
      } else {
        next.interval = Math.round(next.interval * next.ease);
      }
      next.box = Math.min(next.box + 1, 5);
    } else {
      next.incorrectCount += 1;
      next.correctStreak = 0;
      next.ease = Math.max(1.3, next.ease - 0.2);
      next.interval = 1;
      next.box = 1;
    }
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + next.interval);
    next.dueAt = dueDate.toISOString();
    return next;
  };

  const getDueItems = (items, now = new Date()) => {
    const nowTime = now.getTime();
    return items.filter(item => new Date(item.dueAt).getTime() <= nowTime);
  };

  return { createItem, updateItem, getDueItems };
})();

if (typeof module !== 'undefined') {
  module.exports = SRS;
}
