// Main application controller
const App = {
  lessons: [],
  userData: null,

  // Initialize app
  async init() {
    console.log('Initializing Lithuanian Learning App...');

    // Load user data
    this.userData = Storage.getUserData();

    // Check if onboarding needed
    if (!this.userData.onboardingCompleted) {
      this.showOnboarding();
      return;
    }

    // Initialize components
    StreakManager.init();
    await NotificationManager.init();
    if (window.QuestManager) {
      QuestManager.init();
    }

    // Load lessons
    this.lessons = await LessonManager.loadLessons();

    // Display lessons
    this.displayLessonPath();

    // Display user stats
    this.displayUserStats();

    // Set up event listeners
    this.setupEventListeners();

    // Check for install prompt
    this.setupInstallPrompt();

    console.log('App initialized successfully');
  },

  // Show onboarding flow
  showOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      
      // Setup goal option selection
      document.querySelectorAll('.goal-option').forEach(option => {
        option.addEventListener('click', () => {
          document.querySelectorAll('.goal-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
        });
      });
    }
  },

  // Complete onboarding
  finishOnboarding(enableNotifications) {
    const userData = Storage.getUserData();
    userData.onboardingCompleted = true;
    userData.settings.notificationsEnabled = enableNotifications;
    
    // Get selected goal (minutes to XP conversion)
    const selectedOption = document.querySelector('.goal-option.selected');
    const minutes = parseInt(selectedOption?.dataset.minutes || 10);
    userData.dailyGoalXP = minutes * 5; // 5 XP per minute estimate
    
    Storage.saveUserData(userData);
    
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    if (enableNotifications) {
      NotificationManager.requestPermission();
    }
    
    // Continue initialization
    this.init();
  },

  // Display lesson path
  displayLessonPath() {
    const lessonPath = document.querySelector('.lesson-path');
    lessonPath.innerHTML = '';
    const unitSize = 5;
    const totalUnits = Math.ceil(this.lessons.length / unitSize);

    for (let unitIndex = 0; unitIndex < totalUnits; unitIndex++) {
      const unitStart = unitIndex * unitSize;
      const unitLessons = this.lessons.slice(unitStart, unitStart + unitSize);
      const unitCompleted = unitLessons.filter(lesson =>
        this.userData.lessonsCompleted.some(l => l.id === lesson.id)
      ).length;

      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.innerHTML = `
        <h3>Unit ${unitIndex + 1} · ${this.getUnitTitle(unitIndex)}</h3>
        <div class="section-progress">${unitCompleted}/${unitLessons.length} lessons completed</div>
      `;
      lessonPath.appendChild(sectionHeader);

      unitLessons.forEach((lesson, index) => {
        const globalIndex = unitStart + index;
        const isCompleted = this.userData.lessonsCompleted.some(l => l.id === lesson.id);
        const isLocked = !StateLogic.isLessonUnlocked(this.userData.lessonsCompleted, globalIndex);
        const isCurrent = !isCompleted && !isLocked;

        const lessonCard = document.createElement('div');
        lessonCard.className = `lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}`;
        
        lessonCard.innerHTML = `
          <div class="lesson-icon">${isCompleted ? '✓' : isLocked ? '🔒' : '📚'}</div>
          <div class="lesson-info">
            <h3>${lesson.titleLT}</h3>
            <p>${lesson.descriptionLT}</p>
            <div class="lesson-meta">
              <span class="xp-badge">+${lesson.xp} XP</span>
              <span class="difficulty-badge">${lesson.difficulty}</span>
            </div>
          </div>
        `;

        if (!isLocked) {
          lessonCard.style.cursor = 'pointer';
          lessonCard.onclick = () => this.startLesson(lesson.id);
        }

        lessonPath.appendChild(lessonCard);
      });

      const reviewCard = document.createElement('div');
      reviewCard.className = 'lesson-card review-card';
      reviewCard.innerHTML = `
        <div class="lesson-icon">🔁</div>
        <div class="lesson-info">
          <h3>Unit ${unitIndex + 1} Review</h3>
          <p>Practice what you learned in this unit</p>
          <div class="lesson-meta">
            <span class="xp-badge">+10 XP</span>
            <span class="difficulty-badge">review</span>
          </div>
        </div>
      `;

      reviewCard.onclick = () => this.startUnitReview(unitLessons.map(lesson => lesson.id));
      lessonPath.appendChild(reviewCard);
    }
  },

  getUnitTitle(unitIndex) {
    const unitTitles = [
      'Basics & Greetings',
      'Numbers & Essentials',
      'Everyday Life',
      'Grammar Foundations',
      'Real Conversations'
    ];
    return unitTitles[unitIndex] || 'Practice & Progress';
  },

  startUnitReview(lessonIds) {
    const unitLessons = this.lessons.filter(lesson => lessonIds.includes(lesson.id));
    const exercises = unitLessons.flatMap(lesson => lesson.exercises || []);
    if (exercises.length === 0) {
      alert('No exercises available for this unit yet.');
      return;
    }
    const shuffled = [...exercises].sort(() => Math.random() - 0.5).slice(0, 10);
    LessonManager.startReviewSession(shuffled);
  },

  // Display user stats
  displayUserStats() {
    this.userData = Storage.getUserData();
    document.getElementById('total-xp').textContent = this.userData.xpTotal;
    document.getElementById('streak-count').textContent = this.userData.streakCount;
    this.updateDailyGoal();
    this.updateReviewSection();
    if (window.QuestManager) {
      QuestManager.renderDailyQuests();
    }
    this.updateProfile();
  },

  // Update daily goal progress
  updateDailyGoal() {
    const dailyXP = Storage.getDailyXP();
    const goalXP = this.userData.dailyGoalXP;
    const percentage = Math.min((dailyXP / goalXP) * 100, 100);
    
    const currentXPEl = document.getElementById('current-daily-xp');
    const goalXPEl = document.getElementById('daily-xp-goal');
    const progressFillEl = document.getElementById('goal-progress-fill');
    const statusEl = document.getElementById('goal-status');
    const ringEl = document.getElementById('goal-ring');
    const ringTextEl = document.getElementById('goal-ring-text');
    
    if (currentXPEl) currentXPEl.textContent = dailyXP;
    if (goalXPEl) goalXPEl.textContent = goalXP;
    if (progressFillEl) progressFillEl.style.width = `${percentage}%`;
    if (ringEl) {
      ringEl.style.background = `conic-gradient(var(--primary-color) ${percentage}%, rgba(255, 255, 255, 0.6) ${percentage}%)`;
    }
    if (ringTextEl) ringTextEl.textContent = `${Math.round(percentage)}%`;
    
    if (statusEl) {
      if (percentage >= 100) {
        statusEl.textContent = '🎉 Goal complete! Puikiai!';
        statusEl.classList.add('completed');
      } else if (percentage >= 75) {
        statusEl.textContent = '💪 Almost there!';
        statusEl.classList.remove('completed');
      } else if (percentage >= 50) {
        statusEl.textContent = '🚀 Keep going!';
        statusEl.classList.remove('completed');
      } else if (percentage >= 25) {
        statusEl.textContent = '📚 Great start!';
        statusEl.classList.remove('completed');
      } else {
        statusEl.textContent = '✨ Start learning today!';
        statusEl.classList.remove('completed');
      }
    }
  },

  // Update review section visibility
  updateReviewSection() {
    const dueCount = ReviewManager.getDueWordsCount();
    const reviewSection = document.getElementById('review-section');
    const dueCountEl = document.getElementById('due-count');
    
    if (reviewSection) {
      if (dueCount > 0) {
        reviewSection.style.display = 'block';
        if (dueCountEl) dueCountEl.textContent = dueCount;
      } else {
        reviewSection.style.display = 'none';
      }
    }
  },

  // Start lesson
  startLesson(lessonId) {
    LessonManager.startLesson(lessonId);
  },

  // Set up event listeners
  setupEventListeners() {
    // Start lesson button
    document.getElementById('start-lesson-btn')?.addEventListener('click', () => {
      const nextLesson = this.getNextLesson();
      if (nextLesson) {
        this.startLesson(nextLesson.id);
      }
    });

    // Check answer button
    document.getElementById('check-answer-btn')?.addEventListener('click', () => {
      LessonManager.checkAnswer();
    });

    // Continue button in feedback
    document.getElementById('continue-btn')?.addEventListener('click', () => {
      LessonManager.continueLesson();
    });

    // Continue learning button in results
    document.getElementById('continue-learning-btn')?.addEventListener('click', () => {
      document.getElementById('results-screen').classList.remove('active');
      document.getElementById('home-screen').classList.add('active');
      this.userData = Storage.getUserData();
      this.displayLessonPath();
      this.displayUserStats();
    });

    // Exit lesson button
    document.getElementById('exit-lesson-btn')?.addEventListener('click', () => {
      LessonManager.exitLesson();
    });

    // Start review button
    document.getElementById('start-review-btn')?.addEventListener('click', async () => {
      const exercises = await ReviewManager.generateReviewExercises(10);
      if (exercises.length > 0) {
        LessonManager.startReviewSession(exercises);
      }
    });

    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const screen = e.currentTarget.dataset.screen;
        this.navigateToScreen(screen);
      });
    });
  },

  // Get next lesson to study
  getNextLesson() {
    const lastCompleted = this.userData.lessonsCompleted.length;
    return this.lessons[lastCompleted] || this.lessons[0];
  },

  // Navigate to screen
  navigateToScreen(screenName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.screen === screenName) {
        item.classList.add('active');
      }
    });

    // Show corresponding screen
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    document.getElementById(`${screenName}-screen`)?.classList.add('active');

    // Initialize screen content if needed
    if (screenName === 'wordbank' && typeof WordBankManager !== 'undefined') {
      WordBankManager.init();
    } else if (screenName === 'sentencebuilder' && typeof SentenceBuilderManager !== 'undefined') {
      SentenceBuilderManager.init();
    } else if (screenName === 'practicemode' && typeof PracticeManager !== 'undefined') {
      PracticeManager.init();
    } else if (screenName === 'sentences' && typeof SentenceManager !== 'undefined') {
      SentenceManager.init();
    } else if (screenName === 'profile') {
      this.updateProfile();
    }
  },

  updateProfile() {
    const userData = Storage.getUserData();
    const level = this.getUserLevel(userData.xpTotal);
    const lessonsCompleted = userData.lessonsCompleted.length;
    const vocabCount = Object.values(userData.srsItems || {}).filter(item => item.kind === 'word').length;
    const dailyXP = Storage.getDailyXP();
    const dailyGoal = userData.dailyGoalXP;
    const goalPct = Math.min(Math.round((dailyXP / dailyGoal) * 100), 100);

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('profile-xp', userData.xpTotal);
    setText('profile-streak', userData.streakCount);
    setText('profile-lessons', lessonsCompleted);
    setText('profile-vocab', vocabCount);
    setText('user-level', level);
    setText('profile-daily-xp', `${dailyXP}/${dailyGoal}`);
    setText('profile-goal-percent', `${goalPct}%`);

    const goalFill = document.getElementById('profile-goal-fill');
    if (goalFill) goalFill.style.width = `${goalPct}%`;

    const recentList = document.getElementById('profile-recent-list');
    if (recentList) {
      const recentLessons = [...userData.lessonsCompleted]
        .slice(-3)
        .reverse()
        .map(lesson => {
          const lessonInfo = this.lessons.find(l => l.id === lesson.id);
          const title = lessonInfo?.titleLT || `Lesson ${lesson.id}`;
          const date = new Date(lesson.completedAt).toLocaleDateString();
          return `<li><strong>${title}</strong><span>${date}</span></li>`;
        });

      recentList.innerHTML = recentLessons.length > 0
        ? recentLessons.join('')
        : '<li class="empty">Complete lessons to see your recent activity.</li>';
    }

    const achievementsContainer = document.getElementById('achievements-container');
    if (achievementsContainer && typeof AchievementManager !== 'undefined') {
      const unlocked = AchievementManager.getUnlockedAchievements();
      const locked = AchievementManager.getLockedAchievements();
      const cards = [
        ...unlocked.map(achievement => `
          <div class="achievement-card unlocked">
            <div class="achievement-icon">${achievement.icon}</div>
            <div>
              <h4>${achievement.name}</h4>
              <p>${achievement.descriptionLT}</p>
            </div>
          </div>
        `),
        ...locked.map(achievement => `
          <div class="achievement-card locked">
            <div class="achievement-icon">🔒</div>
            <div>
              <h4>${achievement.name}</h4>
              <p>${achievement.descriptionLT}</p>
            </div>
          </div>
        `)
      ];
      achievementsContainer.innerHTML = cards.join('') || '<p class="empty">Unlock achievements as you learn.</p>';
    }
  },

  getUserLevel(totalXP) {
    return Math.floor(totalXP / 100) + 1;
  },

  // Set up install prompt for PWA
  setupInstallPrompt() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install prompt
      const installPrompt = document.getElementById('install-prompt');
      installPrompt.classList.remove('hidden');

      // Install button
      document.getElementById('install-btn').addEventListener('click', async () => {
        installPrompt.classList.add('hidden');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
      });

      // Dismiss button
      document.getElementById('install-dismiss').addEventListener('click', () => {
        installPrompt.classList.add('hidden');
      });
    });
  }
};

// Helper functions for onboarding (global scope for inline onclick)
function showOnboardingScreen(screenNumber) {
  document.querySelectorAll('.onboarding-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  const targetScreen = document.getElementById(`onboarding-${screenNumber}`);
  if (targetScreen) targetScreen.classList.add('active');
}

function finishOnboarding(enableNotifications) {
  App.finishOnboarding(enableNotifications);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
