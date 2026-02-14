const LessonManager = {
  currentLesson: null,
  currentExercise: 0,
  correctAnswers: 0,
  totalExercises: 0,
  selectedAnswer: null,
  minAccuracy: 80,

  // Load vocabulary data
  async loadLessons() {
    try {
      const response = await fetch('vocabulary.json');
      const data = await response.json();
      return data.lessons;
    } catch (error) {
      console.error('Error loading lessons:', error);
      return [];
    }
  },

  // Start a lesson
  async startLesson(lessonId) {
    const lessons = await this.loadLessons();
    this.currentLesson = lessons.find(l => l.id === lessonId);
    
    if (!this.currentLesson) {
      console.error('Lesson not found');
      return;
    }

    this.currentExercise = 0;
    this.correctAnswers = 0;
    this.totalExercises = this.currentLesson.exercises.length;
    this.selectedAnswer = null;
    this.isReviewSession = false;

    // Show lesson screen
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('lesson-screen').classList.add('active');

    // Display first exercise
    this.displayExercise();
  },

  // Start a review session
  startReviewSession(exercises) {
    // Create a temporary lesson for review
    this.currentLesson = {
      id: 'review',
      title: 'Review',
      titleLT: 'Pakartojimas',
      xp: 10,
      exercises: exercises,
      vocabulary: []
    };

    this.currentExercise = 0;
    this.correctAnswers = 0;
    this.totalExercises = exercises.length;
    this.selectedAnswer = null;
    this.isReviewSession = true;

    // Show lesson screen
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('lesson-screen').classList.add('active');

    // Display first exercise
    this.displayExercise();
  },

  // Display current exercise
  displayExercise() {
    const exercise = this.currentLesson.exercises[this.currentExercise];
    const questionContainer = document.getElementById('question-container');
    const answerOptions = document.getElementById('answer-options');
    const checkBtn = document.getElementById('check-answer-btn');

    // Update progress bar
    const progress = ((this.currentExercise + 1) / this.totalExercises) * 100;
    document.getElementById('lesson-progress').style.width = `${progress}%`;

    // Clear previous content
    questionContainer.innerHTML = '';
    answerOptions.innerHTML = '';
    this.selectedAnswer = null;
    checkBtn.disabled = true;

    // Display question based on type
    switch (exercise.type) {
      case 'translation':
        this.displayTranslationExercise(exercise);
        break;
      case 'listening':
        this.displayListeningExercise(exercise);
        break;
      case 'multiple-choice':
        this.displayMultipleChoiceExercise(exercise);
        break;
      case 'typing':
        this.displayTypingExercise(exercise);
        break;
      case 'sentence-build':
        this.displaySentenceBuildExercise(exercise);
        break;
      case 'fill-blank':
        this.displayFillBlankExercise(exercise);
        break;
      default:
        this.displayTranslationExercise(exercise);
    }
  },

  // Display translation exercise
  displayTranslationExercise(exercise) {
    const questionContainer = document.getElementById('question-container');
    const answerOptions = document.getElementById('answer-options');

    questionContainer.innerHTML = `
      <div class="question">
        <h3>${exercise.question}</h3>
      </div>
    `;

    // Shuffle options
    const shuffled = [...exercise.options].sort(() => Math.random() - 0.5);

    shuffled.forEach(option => {
      const button = document.createElement('button');
      button.className = 'answer-option';
      button.textContent = option;
      button.onclick = () => this.selectAnswer(option, button);
      answerOptions.appendChild(button);
    });
  },

  // Display listening exercise
  displayListeningExercise(exercise) {
    const questionContainer = document.getElementById('question-container');
    const answerOptions = document.getElementById('answer-options');

    const fallbackText = [exercise.text, exercise.answerLT, exercise.questionLT, exercise.answer, exercise.question]
      .find(value => typeof value === 'string' && value.trim().length > 0) || '';
    const safeText = fallbackText.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    questionContainer.innerHTML = `
      <div class="question">
        <button class="audio-btn" onclick="LessonManager.playAudio('${exercise.audio || ''}', '${safeText}')">
          🔊 Klausyti
        </button>
        <p>${exercise.question}</p>
      </div>
    `;

    const shuffled = [...exercise.options].sort(() => Math.random() - 0.5);

    shuffled.forEach(option => {
      const button = document.createElement('button');
      button.className = 'answer-option';
      button.textContent = option;
      button.onclick = () => this.selectAnswer(option, button);
      answerOptions.appendChild(button);
    });
  },

  // Display multiple choice exercise
  displayMultipleChoiceExercise(exercise) {
    const questionContainer = document.getElementById('question-container');
    const answerOptions = document.getElementById('answer-options');

    questionContainer.innerHTML = `
      <div class="question">
        <h3>${exercise.question}</h3>
      </div>
    `;

    const shuffled = [...exercise.options].sort(() => Math.random() - 0.5);

    shuffled.forEach(option => {
      const button = document.createElement('button');
      button.className = 'answer-option';
      button.textContent = option;
      button.onclick = () => this.selectAnswer(option, button);
      answerOptions.appendChild(button);
    });
  },

  // Display typing exercise
  displayTypingExercise(exercise) {
    const questionContainer = document.getElementById('question-container');
    const answerOptions = document.getElementById('answer-options');

    questionContainer.innerHTML = `
      <div class="question">
        <h3>${exercise.question}</h3>
        ${exercise.hint ? `<p class="hint">💡 Užuomina: ${exercise.hint}</p>` : ''}
      </div>
    `;

    answerOptions.innerHTML = `
      <input type="text" 
             id="typing-answer" 
             class="typing-input"
             placeholder="Rašyk atsakymą..."
             autocomplete="off"
             autocorrect="off"
             autocapitalize="off">
    `;

    const input = document.getElementById('typing-answer');
    input.focus();
    
    input.addEventListener('input', (e) => {
      this.selectedAnswer = e.target.value.trim();
      document.getElementById('check-answer-btn').disabled = !this.selectedAnswer;
    });
    
    // Allow Enter key to submit
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.selectedAnswer) {
        document.getElementById('check-answer-btn').click();
      }
    });
  },

  displaySentenceBuildExercise(exercise) {
    const questionContainer = document.getElementById('question-container');
    const answerOptions = document.getElementById('answer-options');
    const tiles = [...exercise.tiles].sort(() => Math.random() - 0.5);
    this.selectedAnswer = '';

    questionContainer.innerHTML = `
      <div class="question">
        <h3>${exercise.question}</h3>
        <div class="built-sentence" id="built-sentence"></div>
      </div>
    `;

    answerOptions.innerHTML = `
      <div class="word-tiles" id="word-tiles">
        ${tiles.map((tile, idx) => `<button class="tile-btn" data-word="${tile}" data-index="${idx}">${tile}</button>`).join('')}
      </div>
      <button class="btn btn-secondary" id="reset-tiles-btn">Reset</button>
    `;

    const builtSentence = document.getElementById('built-sentence');
    const tilesContainer = document.getElementById('word-tiles');
    tilesContainer.addEventListener('click', (event) => {
      const target = event.target.closest('.tile-btn');
      if (!target || target.disabled) return;
      const word = target.dataset.word;
      target.disabled = true;
      const current = this.selectedAnswer ? `${this.selectedAnswer} ${word}` : word;
      this.selectedAnswer = current.trim();
      builtSentence.textContent = this.selectedAnswer;
      document.getElementById('check-answer-btn').disabled = !this.selectedAnswer;
    });

    document.getElementById('reset-tiles-btn').addEventListener('click', () => {
      this.selectedAnswer = '';
      builtSentence.textContent = '';
      document.querySelectorAll('.tile-btn').forEach(btn => {
        btn.disabled = false;
      });
      document.getElementById('check-answer-btn').disabled = true;
    });
  },

  displayFillBlankExercise(exercise) {
    const questionContainer = document.getElementById('question-container');
    const answerOptions = document.getElementById('answer-options');
    questionContainer.innerHTML = `
      <div class="question">
        <h3>${exercise.question}</h3>
        <p class="hint">Fill in the blank</p>
      </div>
    `;

    const shuffled = [...exercise.options].sort(() => Math.random() - 0.5);
    shuffled.forEach(option => {
      const button = document.createElement('button');
      button.className = 'answer-option';
      button.textContent = option;
      button.onclick = () => this.selectAnswer(option, button);
      answerOptions.appendChild(button);
    });
  },

  // Select answer
  selectAnswer(answer, button) {
    // Remove previous selection
    document.querySelectorAll('.answer-option').forEach(btn => {
      btn.classList.remove('selected');
    });

    // Mark as selected
    button.classList.add('selected');
    this.selectedAnswer = answer;

    // Enable check button
    document.getElementById('check-answer-btn').disabled = false;
  },

  // Check answer
  checkAnswer() {
    const exercise = this.currentLesson.exercises[this.currentExercise];
    const isCorrect = this.normalizeAnswer(this.selectedAnswer) === this.normalizeAnswer(exercise.answer);

    if (isCorrect) {
      this.correctAnswers++;
    }

    // Update word strength if this is a review
    if (exercise.reviewItemId) {
      ReviewManager.updateReviewItem(exercise.reviewItemId, isCorrect);
    }

    this.showFeedback(isCorrect, exercise.answer);
  },

  // Show feedback
  showFeedback(isCorrect, correctAnswer) {
    const feedbackPanel = document.getElementById('feedback-panel');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackMessage = document.getElementById('feedback-message');

    feedbackPanel.classList.remove('hidden');
    feedbackPanel.classList.add(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      feedbackTitle.textContent = '✓ Teisingai!';
      feedbackMessage.textContent = 'Puiku! Tęsk taip pat.';
    } else {
      feedbackTitle.textContent = '✗ Neteisingai';
      feedbackMessage.textContent = `Teisingas atsakymas: ${correctAnswer}`;
    }

    // Highlight correct/incorrect answer
    document.querySelectorAll('.answer-option').forEach(btn => {
      if (btn.textContent === correctAnswer) {
        btn.classList.add('correct');
      } else if (btn.classList.contains('selected') && !isCorrect) {
        btn.classList.add('incorrect');
      }
      btn.disabled = true;
    });

    document.querySelectorAll('.tile-btn').forEach(btn => {
      btn.disabled = true;
    });
  },

  // Continue to next exercise
  continueLesson() {
    const feedbackPanel = document.getElementById('feedback-panel');
    feedbackPanel.classList.add('hidden');
    feedbackPanel.classList.remove('correct', 'incorrect');

    this.currentExercise++;

    if (this.currentExercise >= this.totalExercises) {
      this.completeLesson();
    } else {
      this.displayExercise();
    }
  },

  // Complete lesson
  completeLesson() {
    const accuracy = Math.round((this.correctAnswers / this.totalExercises) * 100);
    const passed = accuracy >= this.minAccuracy;
    const xpEarned = passed ? this.currentLesson.xp : 0;

    // Only update progress for non-review sessions
    if (!this.isReviewSession) {
      Storage.completeLesson(this.currentLesson.id, accuracy, passed);
      
      // Add vocabulary to learned list
      this.currentLesson.vocabulary.forEach(word => {
        Storage.addVocabulary(word.lithuanian, 'word');
      });
    }

    // Always add XP and update streak
    if (xpEarned > 0) {
      Storage.awardXP(xpEarned);
    }
    StreakManager.updateStreak();

    // Check for achievements
    AchievementManager.checkAchievements();

    // Show results screen
    document.getElementById('lesson-screen').classList.remove('active');
    document.getElementById('results-screen').classList.add('active');

    // Display results
    document.getElementById('correct-answers').textContent = 
      `${this.correctAnswers}/${this.totalExercises}`;
    document.getElementById('xp-earned').textContent = xpEarned;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    const titleEl = document.getElementById('results-title');
    if (titleEl) {
      titleEl.textContent = passed ? 'Lesson Complete! 🎉' : 'Keep Practicing 💪';
    }
  },

  // Play audio
  playAudio(audioPath, text) {
    const speakFallback = () => {
      if ('speechSynthesis' in window && text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'lt-LT';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    };

    if (audioPath) {
      const audio = new Audio(audioPath);
      audio.addEventListener('error', () => speakFallback(), { once: true });
      audio.play().catch(() => speakFallback());
      return;
    }

    speakFallback();
  },

  normalizeAnswer(value) {
    if (!value) return '';
    const state = Storage.getUserData();
    const ignoreDiacritics = state.settings?.ignoreDiacritics;
    let normalized = value.trim().toLowerCase();
    if (ignoreDiacritics) {
      normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return normalized;
  },

  // Exit lesson
  exitLesson() {
    if (confirm('Ar tikrai nori išeiti? Pažanga nebus išsaugota.')) {
      document.getElementById('lesson-screen').classList.remove('active');
      document.getElementById('home-screen').classList.add('active');
    }
  }
};
