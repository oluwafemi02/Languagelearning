// Main application controller
const App = {
  lessons: [],
  userData: null,

  // Initialize app
  async init() {
    console.log('Initializing Lithuanian Learning App...');

    // Load user data
    this.userData = Storage.getUserData();

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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
