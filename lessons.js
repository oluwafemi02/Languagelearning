const LessonManager = {
  currentLesson: null,
  currentExercise: 0,
  correctAnswers: 0,
  totalExercises: 0,
  selectedAnswer: null,

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

    questionContainer.innerHTML = `
      <div class="question">
        <button class="audio-btn" onclick="LessonManager.playAudio('${exercise.audio}')">
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
      this.selectedAnswer = e.target.value.trim().toLowerCase();
      document.getElementById('check-answer-btn').disabled = !this.selectedAnswer;
    });
    
    // Allow Enter key to submit
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.selectedAnswer) {
        document.getElementById('check-answer-btn').click();
      }
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
    const isCorrect = this.selectedAnswer.toLowerCase() === exercise.answer.toLowerCase();

    if (isCorrect) {
      this.correctAnswers++;
    }

    // Update word strength if this is a review
    if (exercise.reviewWord) {
      ReviewManager.updateWordStrength(exercise.reviewWord, isCorrect);
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
    const xpEarned = this.currentLesson.xp;

    // Only update progress for non-review sessions
    if (!this.isReviewSession) {
      Storage.completeLesson(this.currentLesson.id, accuracy);
      
      // Add vocabulary to learned list
      this.currentLesson.vocabulary.forEach(word => {
        Storage.addVocabulary(word.lithuanian);
      });
    }

    // Always add XP and update streak
    Storage.addXP(xpEarned);
    Storage.addDailyXP(xpEarned);
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
  },

  // Play audio
  playAudio(audioPath) {
    const audio = new Audio(audioPath);
    audio.play().catch(err => console.log('Audio playback failed:', err));
  },

  // Exit lesson
  exitLesson() {
    if (confirm('Ar tikrai nori išeiti? Pažanga nebus išsaugota.')) {
      document.getElementById('lesson-screen').classList.remove('active');
      document.getElementById('home-screen').classList.add('active');
    }
  }
};
