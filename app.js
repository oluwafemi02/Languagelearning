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
    userData.settings.dailyGoal = minutes * 5; // 5 XP per minute estimate
    
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

    this.lessons.forEach((lesson, index) => {
      const isCompleted = this.userData.lessonsCompleted.some(l => l.id === lesson.id);
      const isLocked = index > 0 && !this.userData.lessonsCompleted.some(l => l.id === this.lessons[index - 1].id);

      const lessonCard = document.createElement('div');
      lessonCard.className = `lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
      
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
  },

  // Display user stats
  displayUserStats() {
    document.getElementById('total-xp').textContent = this.userData.totalXP;
    document.getElementById('streak-count').textContent = this.userData.streak;
    this.updateDailyGoal();
    this.updateReviewSection();
  },

  // Update daily goal progress
  updateDailyGoal() {
    const dailyXP = Storage.getDailyXP();
    const goalXP = this.userData.settings.dailyGoal;
    const percentage = Math.min((dailyXP / goalXP) * 100, 100);
    
    const currentXPEl = document.getElementById('current-daily-xp');
    const goalXPEl = document.getElementById('daily-xp-goal');
    const progressFillEl = document.getElementById('goal-progress-fill');
    const statusEl = document.getElementById('goal-status');
    
    if (currentXPEl) currentXPEl.textContent = dailyXP;
    if (goalXPEl) goalXPEl.textContent = goalXP;
    if (progressFillEl) progressFillEl.style.width = `${percentage}%`;
    
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
    }
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
