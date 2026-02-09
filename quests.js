const QuestManager = {
  isRewarding: false,
  dailyBonusXP: 15,
  questTemplates: [
    {
      id: 'lessons-1',
      title: 'Complete a Lesson',
      description: 'Finish 1 lesson today',
      type: 'lessons',
      target: 1,
      rewardXP: 5
    },
    {
      id: 'xp-20',
      title: 'Earn XP',
      description: 'Gain 20 XP today',
      type: 'xp',
      target: 20,
      rewardXP: 10
    },
    {
      id: 'review-5',
      title: 'Review Words',
      description: 'Review 5 words',
      type: 'review',
      target: 5,
      rewardXP: 5
    }
  ],

  init() {
    this.ensureDailyQuests();
    this.renderDailyQuests();
  },

  ensureDailyQuests() {
    const userData = Storage.getUserData();
    const today = new Date().toDateString();

    if (!userData.dailyQuests) {
      userData.dailyQuests = { date: today, quests: [], bonusClaimed: false };
    }

    if (userData.dailyQuests.date !== today) {
      userData.dailyQuests.date = today;
      userData.dailyQuests.quests = this.questTemplates.map(template => ({
        ...template,
        progress: 0,
        completed: false
      }));
      userData.dailyQuests.bonusClaimed = false;
      Storage.saveUserData(userData);
    }

    if (userData.dailyQuests.quests.length === 0) {
      userData.dailyQuests.quests = this.questTemplates.map(template => ({
        ...template,
        progress: 0,
        completed: false
      }));
      Storage.saveUserData(userData);
    }
  },

  updateProgress(type, amount) {
    this.ensureDailyQuests();
    const userData = Storage.getUserData();
    const quests = userData.dailyQuests.quests;
    let updated = false;

    quests.forEach(quest => {
      if (quest.type === type && !quest.completed) {
        quest.progress = Math.min(quest.progress + amount, quest.target);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          this.rewardQuest(quest.rewardXP);
        }
        updated = true;
      }
    });

    if (updated) {
      Storage.saveUserData(userData);
      this.checkDailyBonus();
      this.renderDailyQuests();
    }
  },

  rewardQuest(xp) {
    if (!xp) return;
    this.isRewarding = true;
    Storage.awardXP(xp);
    this.isRewarding = false;
  },

  checkDailyBonus() {
    const userData = Storage.getUserData();
    const quests = userData.dailyQuests.quests;
    const allComplete = quests.length > 0 && quests.every(q => q.completed);

    if (allComplete && !userData.dailyQuests.bonusClaimed) {
      userData.dailyQuests.bonusClaimed = true;
      Storage.saveUserData(userData);
      this.rewardQuest(this.dailyBonusXP);
    }
  },

  recordReviewWord() {
    this.updateProgress('review', 1);
  },

  renderDailyQuests() {
    const container = document.getElementById('daily-quests');
    if (!container) return;

    this.ensureDailyQuests();
    const userData = Storage.getUserData();

    const quests = userData.dailyQuests.quests;
    const bonusClaimed = userData.dailyQuests.bonusClaimed;

    const questsHTML = quests.map(quest => {
      const progressPct = Math.round((quest.progress / quest.target) * 100);
      return `
        <div class="quest-card ${quest.completed ? 'completed' : ''}">
          <div class="quest-header">
            <h4>${quest.title}</h4>
            <span class="quest-reward">+${quest.rewardXP} XP</span>
          </div>
          <p>${quest.description}</p>
          <div class="quest-progress">
            <div class="quest-progress-bar">
              <div class="quest-progress-fill" style="width: ${progressPct}%"></div>
            </div>
            <span>${quest.progress}/${quest.target}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="daily-quests-header">
        <h3>🏆 Daily Quests</h3>
        <span class="bonus-badge ${bonusClaimed ? 'claimed' : ''}">
          ${bonusClaimed ? 'Bonus claimed!' : `Complete all: +${this.dailyBonusXP} XP`}
        </span>
      </div>
      <div class="quests-grid">
        ${questsHTML}
      </div>
    `;
  }
};

window.QuestManager = QuestManager;
