// Sentence Builder Manager - Grammar and sentence formation module
const SentenceBuilderManager = {
  lessons: [],
  completedLessons: new Set(),
  currentLesson: null,
  currentExerciseIndex: 0,
  correctAnswers: 0,

  // Initialize Sentence Builder
  async init() {
    await this.loadLessons();
    this.loadProgress();
    this.displayLessons();
  },

  // Load lessons from JSON
  async loadLessons() {
    try {
      const response = await fetch('sentence-builder-data.json');
      const data = await response.json();
      this.lessons = data.lessons;
      console.log(`Loaded ${this.lessons.length} sentence lessons`);
    } catch (error) {
      console.error('Error loading sentence lessons:', error);
      this.lessons = [];
    }
  },

  // Load progress
  loadProgress() {
    const userData = Storage.getUserData();
    this.completedLessons = new Set(userData.sentenceBuilderCompleted || []);
  },

  // Save progress
  saveProgress() {
    const userData = Storage.getUserData();
    userData.sentenceBuilderCompleted = Array.from(this.completedLessons);
    Storage.saveUserData(userData);
  },

  // Display lessons
  displayLessons() {
    const container = document.getElementById('sentencebuilder-content');
    if (!container) return;

    const levelsHTML = this.groupLessonsByLevel().map((levelGroup, index) => {
      const levelNum = index + 1;
      const lessonsInLevel = levelGroup.lessons;
      const completedInLevel = lessonsInLevel.filter(l => this.completedLessons.has(l.id)).length;

      return `
        <div class="level-section">
          <div class="level-header">
            <h3>Level ${levelNum} - ${this.getLevelName(levelNum)}</h3>
            <span class="level-progress">${completedInLevel}/${lessonsInLevel.length} completed</span>
          </div>
          <div class="lesson-grid">
            ${lessonsInLevel.map((lesson, idx) => {
              const isCompleted = this.completedLessons.has(lesson.id);
              const isLocked = idx > 0 && !this.completedLessons.has(lessonsInLevel[idx - 1].id);
              
              return `
                <div class="sentence-lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}"
                     onclick="${!isLocked ? `SentenceBuilderManager.startLesson(${lesson.id})` : ''}">
                  <div class="lesson-icon">${isCompleted ? '✓' : isLocked ? '🔒' : '📝'}</div>
                  <div class="lesson-info">
                    <h4>${lesson.title}</h4>
                    <p>${lesson.titleLT}</p>
                    <span class="lesson-level">Level ${lesson.level}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    const statsHTML = `
      <div class="sentencebuilder-stats">
        <div class="stat-box">
          <span class="stat-value">${this.completedLessons.size}</span>
          <span class="stat-label">Lessons Completed</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${this.lessons.length}</span>
          <span class="stat-label">Total Lessons</span>
        </div>
      </div>
    `;

    container.innerHTML = statsHTML + levelsHTML;
  },

  // Group lessons by level
  groupLessonsByLevel() {
    const groups = {};
    this.lessons.forEach(lesson => {
      if (!groups[lesson.level]) {
        groups[lesson.level] = { level: lesson.level, lessons: [] };
      }
      groups[lesson.level].lessons.push(lesson);
    });
    return Object.values(groups).sort((a, b) => a.level - b.level);
  },

  // Get level name
  getLevelName(level) {
    const names = {
      1: 'Beginner Basics',
      2: 'Building Blocks',
      3: 'Intermediate Skills',
      4: 'Advanced Structures'
    };
    return names[level] || `Level ${level}`;
  },

  // Start lesson
  startLesson(lessonId) {
    this.currentLesson = this.lessons.find(l => l.id === lessonId);
    if (!this.currentLesson) return;

    this.currentExerciseIndex = 0;
    this.correctAnswers = 0;
    this.displayLessonIntro();
  },

  // Display lesson intro
  displayLessonIntro() {
    const container = document.getElementById('sentencebuilder-content');
    if (!container || !this.currentLesson) return;

    const examplesHTML = this.currentLesson.examples.map(ex => `
      <div class="example-card">
        <p class="example-lithuanian">${ex.lithuanian}</p>
        <p class="example-english">${ex.english}</p>
        <p class="example-breakdown">${ex.breakdown}</p>
        <button class="audio-btn" onclick="SentenceBuilderManager.playAudio('${ex.lithuanian}')">
          🔊 Listen
        </button>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="lesson-intro">
        <button class="btn-icon" onclick="SentenceBuilderManager.exitLesson()">✕ Back</button>
        
        <h2>${this.currentLesson.title}</h2>
        <h3>${this.currentLesson.titleLT}</h3>
        
        <div class="explanation-box">
          <h4>📖 Explanation</h4>
          <p>${this.currentLesson.explanation}</p>
        </div>
        
        <div class="examples-section">
          <h4>💡 Examples</h4>
          ${examplesHTML}
        </div>
        
        <button class="btn btn-primary btn-large" onclick="SentenceBuilderManager.startExercises()">
          Start Exercises →
        </button>
      </div>
    `;
  },

  // Start exercises
  startExercises() {
    this.displayExercise();
  },

  // Display current exercise
  displayExercise() {
    const container = document.getElementById('sentencebuilder-content');
    if (!container || !this.currentLesson) return;

    const exercise = this.currentLesson.exercises[this.currentExerciseIndex];
    const progress = Math.round(((this.currentExerciseIndex + 1) / this.currentLesson.exercises.length) * 100);

    let exerciseHTML = '';
    
    if (exercise.type === 'reorder') {
      exerciseHTML = this.createReorderExercise(exercise);
    } else if (exercise.type === 'fill') {
      exerciseHTML = this.createFillExercise(exercise);
    }

    container.innerHTML = `
      <div class="exercise-screen">
        <div class="exercise-header">
          <button class="btn-icon" onclick="SentenceBuilderManager.exitLesson()">✕</button>
          <div class="exercise-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span>${this.currentExerciseIndex + 1}/${this.currentLesson.exercises.length}</span>
          </div>
        </div>
        
        <div class="exercise-content">
          <h3>${exercise.question}</h3>
          ${exerciseHTML}
        </div>
        
        <div class="exercise-actions">
          <button class="btn btn-primary" id="check-exercise-btn" onclick="SentenceBuilderManager.checkExercise()" disabled>
            Check Answer
          </button>
        </div>
        
        <div id="exercise-feedback" class="feedback-panel hidden"></div>
      </div>
    `;
  },

  // Create reorder exercise
  createReorderExercise(exercise) {
    const shuffled = [...exercise.words].sort(() => Math.random() - 0.5);
    
    return `
      <div class="reorder-exercise">
        <div class="answer-area" id="answer-area" ondrop="SentenceBuilderManager.drop(event)" ondragover="SentenceBuilderManager.allowDrop(event)">
          <span class="placeholder">Drag words here</span>
        </div>
        <div class="word-options" id="word-options">
          ${shuffled.map((word, idx) => `
            <div class="word-tile" draggable="true" data-word="${word}" id="word-${idx}"
                 ondragstart="SentenceBuilderManager.drag(event)">
              ${word}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Create fill exercise
  createFillExercise(exercise) {
    return `
      <div class="fill-exercise">
        <div class="fill-options">
          ${exercise.options.map(option => `
            <button class="answer-option" onclick="SentenceBuilderManager.selectFillAnswer('${option}')">
              ${option}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Drag and drop handlers
  drag(ev) {
    ev.dataTransfer.setData('text', ev.target.dataset.word);
    ev.dataTransfer.setData('id', ev.target.id);
  },

  allowDrop(ev) {
    ev.preventDefault();
  },

  drop(ev) {
    ev.preventDefault();
    const word = ev.dataTransfer.getData('text');
    const id = ev.dataTransfer.getData('id');
    const answerArea = document.getElementById('answer-area');
    const wordElement = document.getElementById(id);
    
    // Remove placeholder
    const placeholder = answerArea.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    
    // Add word to answer area
    const wordClone = wordElement.cloneNode(true);
    wordClone.draggable = false;
    wordClone.onclick = () => {
      wordClone.remove();
      wordElement.style.display = 'block';
      this.checkAnswerAreaEmpty();
    };
    answerArea.appendChild(wordClone);
    
    // Hide original
    wordElement.style.display = 'none';
    
    // Enable check button
    document.getElementById('check-exercise-btn').disabled = false;
  },

  checkAnswerAreaEmpty() {
    const answerArea = document.getElementById('answer-area');
    if (answerArea.children.length === 0) {
      answerArea.innerHTML = '<span class="placeholder">Drag words here</span>';
      document.getElementById('check-exercise-btn').disabled = true;
    }
  },

  // Select fill answer
  selectFillAnswer(answer) {
    // Remove previous selection
    document.querySelectorAll('.answer-option').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Mark as selected
    event.target.classList.add('selected');
    this.selectedAnswer = answer;
    
    // Enable check button
    document.getElementById('check-exercise-btn').disabled = false;
  },

  // Check exercise answer
  checkExercise() {
    const exercise = this.currentLesson.exercises[this.currentExerciseIndex];
    let userAnswer = '';
    let isCorrect = false;

    if (exercise.type === 'reorder') {
      const answerArea = document.getElementById('answer-area');
      const words = Array.from(answerArea.querySelectorAll('.word-tile')).map(tile => tile.dataset.word);
      userAnswer = words.join(' ');
      isCorrect = userAnswer === exercise.answer;
    } else if (exercise.type === 'fill') {
      userAnswer = this.selectedAnswer;
      isCorrect = userAnswer === exercise.answer;
    }

    if (isCorrect) {
      this.correctAnswers++;
    }

    this.showExerciseFeedback(isCorrect, exercise.answer);
  },

  // Show feedback
  showExerciseFeedback(isCorrect, correctAnswer) {
    const feedbackEl = document.getElementById('exercise-feedback');
    feedbackEl.className = `feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.innerHTML = `
      <div class="feedback-content">
        <h3>${isCorrect ? '✓ Teisingai!' : '✗ Neteisingai'}</h3>
        <p>${isCorrect ? 'Puiku! Tęsk taip pat.' : `Teisingas atsakymas: ${correctAnswer}`}</p>
        <button class="btn btn-primary" onclick="SentenceBuilderManager.nextExercise()">
          ${this.currentExerciseIndex < this.currentLesson.exercises.length - 1 ? 'Continue' : 'Finish'}
        </button>
      </div>
    `;
    feedbackEl.classList.remove('hidden');
  },

  // Next exercise
  nextExercise() {
    this.currentExerciseIndex++;
    
    if (this.currentExerciseIndex >= this.currentLesson.exercises.length) {
      this.completeLesson();
    } else {
      this.displayExercise();
    }
  },

  // Complete lesson
  completeLesson() {
    const accuracy = Math.round((this.correctAnswers / this.currentLesson.exercises.length) * 100);
    const xpEarned = 15;

    this.completedLessons.add(this.currentLesson.id);
    this.saveProgress();

    Storage.addXP(xpEarned);
    Storage.addDailyXP(xpEarned);
    StreakManager.updateStreak();

    const container = document.getElementById('sentencebuilder-content');
    container.innerHTML = `
      <div class="lesson-complete">
        <h2>🎉 Lesson Complete!</h2>
        <h3>${this.currentLesson.title}</h3>
        
        <div class="results-stats">
          <div class="stat">
            <span class="stat-value">${this.correctAnswers}/${this.currentLesson.exercises.length}</span>
            <span class="stat-label">Correct Answers</span>
          </div>
          <div class="stat">
            <span class="stat-value">${accuracy}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
          <div class="stat">
            <span class="stat-value">+${xpEarned}</span>
            <span class="stat-label">XP Earned</span>
          </div>
        </div>
        
        <div class="lesson-complete-actions">
          <button class="btn btn-secondary" onclick="SentenceBuilderManager.practiceAgain()">
            🔄 Practice Again
          </button>
          <button class="btn btn-primary" onclick="SentenceBuilderManager.exitLesson()">
            Continue Learning →
          </button>
        </div>
      </div>
    `;
  },

  // Practice again
  practiceAgain() {
    this.currentExerciseIndex = 0;
    this.correctAnswers = 0;
    this.startExercises();
  },

  // Exit lesson
  exitLesson() {
    this.currentLesson = null;
    this.displayLessons();
  },

  // Play audio
  async playAudio(text) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'lt-LT';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  }
};
