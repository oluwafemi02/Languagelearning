const LessonManager = {
  currentLesson: null,
  currentExercise: 0,
  correctAnswers: 0,
  totalExercises: 0,
  selectedAnswer: null,

  // Load vocabulary data
  async loadLessons() {
    try {
      const response = await fetch('data/vocabulary.json');
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
    const isCorrect = this.selectedAnswer === exercise.answer;

    if (isCorrect) {
      this.correctAnswers++;
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
      feedbackTitle.textContent = '
