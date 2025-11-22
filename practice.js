// Practice Mode Manager - Combined adaptive practice
const PracticeManager = {
  exercises: [],
  currentExercise: 0,
  correctAnswers: 0,
  selectedAnswer: null,
  sessionType: 'mixed', // mixed, words, sentences
  
  // Initialize Practice Mode
  async init() {
    this.displayPracticeHome();
  },

  // Display practice home
  displayPracticeHome() {
    const container = document.getElementById('practice-content');
    if (!container) return;

    const userData = Storage.getUserData();
    const wordsLearned = (userData.wordBankLearned || []).length;
    const sentencesLearned = (userData.sentenceBuilderCompleted || []).length;
    const dueWords = ReviewManager.getDueWordsCount();

    container.innerHTML = `
      <div class="practice-home">
        <h2>🧠 Practice Mode</h2>
        <p class="practice-subtitle">Strengthen your Lithuanian skills with adaptive exercises</p>
        
        <div class="practice-stats">
          <div class="stat-box">
            <span class="stat-value">${wordsLearned}</span>
            <span class="stat-label">Words Learned</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${sentencesLearned}</span>
            <span class="stat-label">Lessons Completed</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${dueWords}</span>
            <span class="stat-label">Due for Review</span>
          </div>
        </div>

        <div class="practice-modes">
          <div class="practice-mode-card" onclick="PracticeManager.startSession('mixed', 10)">
            <div class="mode-icon">🎯</div>
            <h3>Mixed Practice</h3>
            <p>Vocabulary + Grammar combined</p>
            <span class="mode-duration">10 questions</span>
          </div>
          
          <div class="practice-mode-card" onclick="PracticeManager.startSession('words', 10)">
            <div class="mode-icon">📖</div>
            <h3>Vocabulary Focus</h3>
            <p>Test your word knowledge</p>
            <span class="mode-duration">10 questions</span>
          </div>
          
          <div class="practice-mode-card" onclick="PracticeManager.startSession('sentences', 10)">
            <div class="mode-icon">📝</div>
            <h3>Grammar Focus</h3>
            <p>Practice sentence building</p>
            <span class="mode-duration">10 questions</span>
          </div>

          ${dueWords > 0 ? `
            <div class="practice-mode-card highlight" onclick="PracticeManager.startSession('review', ${Math.min(dueWords, 15)})">
              <div class="mode-icon">🔄</div>
              <h3>Review Due Words</h3>
              <p>Practice words you've learned</p>
              <span class="mode-duration">${dueWords} words due</span>
            </div>
          ` : ''}
          
          <div class="practice-mode-card" onclick="PracticeManager.startSession('mixed', 20)">
            <div class="mode-icon">⚡</div>
            <h3>Intensive Practice</h3>
            <p>Challenge yourself!</p>
            <span class="mode-duration">20 questions</span>
          </div>
        </div>
      </div>
    `;
  },

  // Start practice session
  async startSession(type, questionCount) {
    this.sessionType = type;
    this.currentExercise = 0;
    this.correctAnswers = 0;
    this.selectedAnswer = null;

    // Generate exercises based on type
    this.exercises = await this.generateExercises(type, questionCount);

    if (this.exercises.length === 0) {
      alert('Not enough learned content to practice. Learn some words and sentences first!');
      return;
    }

    this.displayExercise();
  },

  // Generate exercises
  async generateExercises(type, count) {
    const exercises = [];
    const userData = Storage.getUserData();

    if (type === 'review') {
      // Generate review exercises from due words
      return await ReviewManager.generateReviewExercises(count);
    }

    if (type === 'mixed' || type === 'words') {
      // Add word exercises
      const learnedWordIds = userData.wordBankLearned || [];
      const wordData = await this.loadWordData();
      
      // If no learned words, use first 20 words from the bank for practice
      const wordsToUse = learnedWordIds.length > 0 
        ? wordData.filter(w => learnedWordIds.includes(w.id))
        : wordData.slice(0, 20);
      
      if (wordsToUse.length > 0) {
        const selectedWords = this.shuffleArray(wordsToUse).slice(0, Math.ceil(count / (type === 'mixed' ? 2 : 1)));
        
        selectedWords.forEach(word => {
          exercises.push(this.createWordExercise(word));
        });
      }
    }

    if (type === 'mixed' || type === 'sentences') {
      // Add sentence exercises
      const completedLessons = userData.sentenceBuilderCompleted || [];
      const sentenceData = await this.loadSentenceData();
      
      // If no completed lessons, use first 2 lessons for practice
      const lessonsToUse = completedLessons.length > 0
        ? sentenceData.filter(l => completedLessons.includes(l.id))
        : sentenceData.slice(0, 2);
      
      if (lessonsToUse.length > 0) {
        const allExercises = lessonsToUse.flatMap(lesson => 
          lesson.exercises.map(ex => ({ ...ex, lessonTitle: lesson.title }))
        );
        
        const selectedExercises = this.shuffleArray(allExercises).slice(0, Math.ceil(count / (type === 'mixed' ? 2 : 1)));
        exercises.push(...selectedExercises);
      }
    }

    return this.shuffleArray(exercises).slice(0, count);
  },

  // Load word data
  async loadWordData() {
    try {
      const response = await fetch('wordbank-data.json');
      const data = await response.json();
      return data.words;
    } catch (error) {
      console.error('Error loading word data:', error);
      return [];
    }
  },

  // Load sentence data
  async loadSentenceData() {
    try {
      const response = await fetch('sentence-builder-data.json');
      const data = await response.json();
      return data.lessons;
    } catch (error) {
      console.error('Error loading sentence data:', error);
      return [];
    }
  },

  // Create word exercise
  createWordExercise(word) {
    const exerciseType = Math.random() > 0.5 ? 'translation-lt-en' : 'translation-en-lt';
    
    return {
      type: exerciseType,
      question: exerciseType === 'translation-lt-en' ? word.lithuanian : word.english,
      answer: exerciseType === 'translation-lt-en' ? word.english : word.lithuanian,
      options: this.generateWordOptions(word, exerciseType),
      word: word.lithuanian
    };
  },

  // Generate word options
  generateWordOptions(correctWord, exerciseType) {
    const allWords = WordBankManager.words || [];
    const targetField = exerciseType === 'translation-lt-en' ? 'english' : 'lithuanian';
    const correctAnswer = correctWord[targetField];
    
    // Get wrong options from same topic or random
    let wrongOptions = allWords
      .filter(w => w.id !== correctWord.id && w[targetField] !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w[targetField]);
    
    const options = [correctAnswer, ...wrongOptions];
    return this.shuffleArray(options);
  },

  // Shuffle array
  shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
  },

  // Display exercise
  displayExercise() {
    const container = document.getElementById('practice-content');
    if (!container) return;

    const exercise = this.exercises[this.currentExercise];
    const progress = Math.round(((this.currentExercise + 1) / this.exercises.length) * 100);

    let exerciseHTML = '';
    
    if (exercise.type === 'translation-lt-en' || exercise.type === 'translation-en-lt' || exercise.type === 'translation' || exercise.type === 'multiple-choice') {
      exerciseHTML = this.createMultipleChoiceHTML(exercise);
    } else if (exercise.type === 'reorder') {
      exerciseHTML = this.createReorderHTML(exercise);
    } else if (exercise.type === 'fill') {
      exerciseHTML = this.createFillHTML(exercise);
    } else if (exercise.type === 'listening') {
      exerciseHTML = this.createListeningHTML(exercise);
    } else if (exercise.type === 'typing') {
      exerciseHTML = this.createTypingHTML(exercise);
    }

    container.innerHTML = `
      <div class="practice-screen">
        <div class="practice-header">
          <button class="btn-icon" onclick="PracticeManager.exitPractice()">✕ Exit</button>
          <div class="practice-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span>${this.currentExercise + 1}/${this.exercises.length}</span>
          </div>
        </div>
        
        <div class="practice-question">
          <h3>${exercise.question}</h3>
          ${exercise.hint ? `<p class="hint">💡 ${exercise.hint}</p>` : ''}
        </div>
        
        ${exerciseHTML}
        
        <button class="btn btn-primary" id="practice-check-btn" onclick="PracticeManager.checkAnswer()" disabled>
          Check Answer
        </button>
        
        <div id="practice-feedback" class="feedback-panel hidden"></div>
      </div>
    `;
  },

  // Create multiple choice HTML
  createMultipleChoiceHTML(exercise) {
    return `
      <div class="practice-options">
        ${exercise.options.map(option => `
          <button class="answer-option" onclick="PracticeManager.selectAnswer('${option.replace(/'/g, "\\'")}', event)">
            ${option}
          </button>
        `).join('')}
      </div>
    `;
  },

  // Create reorder HTML
  createReorderHTML(exercise) {
    const shuffled = this.shuffleArray(exercise.words);
    return `
      <div class="reorder-exercise">
        <div class="answer-area" id="practice-answer-area">
          <span class="placeholder">Tap words to build the sentence</span>
        </div>
        <div class="word-options" id="practice-word-options">
          ${shuffled.map((word, idx) => `
            <button class="word-tile" data-word="${word}" id="practice-word-${idx}"
                    onclick="PracticeManager.addWordToAnswer('${word}', 'practice-word-${idx}')">
              ${word}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Create fill HTML
  createFillHTML(exercise) {
    return `
      <div class="fill-options">
        ${exercise.options.map(option => `
          <button class="answer-option" onclick="PracticeManager.selectAnswer('${option}', event)">
            ${option}
          </button>
        `).join('')}
      </div>
    `;
  },

  // Create listening HTML
  createListeningHTML(exercise) {
    return `
      <div class="listening-exercise">
        <button class="audio-btn-large" onclick="PracticeManager.playAudio('${exercise.audio || exercise.word}')">
          🔊 Listen
        </button>
        <div class="practice-options">
          ${exercise.options.map(option => `
            <button class="answer-option" onclick="PracticeManager.selectAnswer('${option}', event)">
              ${option}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Create typing HTML
  createTypingHTML(exercise) {
    return `
      <div class="typing-exercise">
        <input type="text" id="practice-typing-input" class="typing-input"
               placeholder="Type your answer..."
               oninput="PracticeManager.onTypingInput()"
               onkeypress="PracticeManager.onTypingKeypress(event)">
      </div>
    `;
  },

  // Select answer
  selectAnswer(answer, event) {
    document.querySelectorAll('.answer-option').forEach(btn => {
      btn.classList.remove('selected');
    });
    if (event && event.target) {
      event.target.classList.add('selected');
    } else {
      // Fallback: find the button that was clicked
      document.querySelectorAll('.answer-option').forEach(btn => {
        if (btn.textContent === answer) {
          btn.classList.add('selected');
        }
      });
    }
    this.selectedAnswer = answer;
    document.getElementById('practice-check-btn').disabled = false;
  },

  // Add word to answer (for reorder exercises)
  addWordToAnswer(word, buttonId) {
    const answerArea = document.getElementById('practice-answer-area');
    const button = document.getElementById(buttonId);
    
    // Remove placeholder
    const placeholder = answerArea.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    
    // Add word
    const wordSpan = document.createElement('span');
    wordSpan.className = 'answer-word';
    wordSpan.textContent = word;
    wordSpan.onclick = () => {
      wordSpan.remove();
      button.style.display = 'inline-block';
      this.updateReorderAnswer();
    };
    answerArea.appendChild(wordSpan);
    
    // Hide button
    button.style.display = 'none';
    
    this.updateReorderAnswer();
  },

  // Update reorder answer
  updateReorderAnswer() {
    const answerArea = document.getElementById('practice-answer-area');
    const words = Array.from(answerArea.querySelectorAll('.answer-word')).map(span => span.textContent);
    this.selectedAnswer = words.join(' ');
    document.getElementById('practice-check-btn').disabled = words.length === 0;
    
    if (words.length === 0) {
      answerArea.innerHTML = '<span class="placeholder">Tap words to build the sentence</span>';
    }
  },

  // On typing input
  onTypingInput() {
    const input = document.getElementById('practice-typing-input');
    this.selectedAnswer = input.value.trim();
    document.getElementById('practice-check-btn').disabled = !this.selectedAnswer;
  },

  // On typing keypress
  onTypingKeypress(event) {
    if (event.key === 'Enter' && this.selectedAnswer) {
      this.checkAnswer();
    }
  },

  // Check answer
  checkAnswer() {
    const exercise = this.exercises[this.currentExercise];
    const isCorrect = this.selectedAnswer.toLowerCase().trim() === exercise.answer.toLowerCase().trim();

    if (isCorrect) {
      this.correctAnswers++;
    }

    // Update word strength if applicable
    if (exercise.reviewWord) {
      ReviewManager.updateWordStrength(exercise.reviewWord, isCorrect);
    }

    this.showFeedback(isCorrect, exercise.answer);
  },

  // Show feedback
  showFeedback(isCorrect, correctAnswer) {
    const feedbackEl = document.getElementById('practice-feedback');
    const checkBtn = document.getElementById('practice-check-btn');
    
    feedbackEl.className = `feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.innerHTML = `
      <div class="feedback-content">
        <h3>${isCorrect ? '✓ Teisingai!' : '✗ Neteisingai'}</h3>
        <p>${isCorrect ? 'Puiku! Tęsk taip pat.' : `Teisingas atsakymas: ${correctAnswer}`}</p>
        <button class="btn btn-primary" onclick="PracticeManager.nextExercise()">
          Continue →
        </button>
      </div>
    `;
    feedbackEl.classList.remove('hidden');
    checkBtn.style.display = 'none';

    // Highlight correct/incorrect answers
    document.querySelectorAll('.answer-option').forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === correctAnswer) {
        btn.classList.add('correct');
      } else if (btn.classList.contains('selected') && !isCorrect) {
        btn.classList.add('incorrect');
      }
    });
  },

  // Next exercise
  nextExercise() {
    this.currentExercise++;
    this.selectedAnswer = null;

    if (this.currentExercise >= this.exercises.length) {
      this.completeSession();
    } else {
      this.displayExercise();
    }
  },

  // Complete practice session
  completeSession() {
    const accuracy = Math.round((this.correctAnswers / this.exercises.length) * 100);
    const xpEarned = Math.round(this.exercises.length * (accuracy / 100) * 3);

    Storage.addXP(xpEarned);
    Storage.addDailyXP(xpEarned);
    StreakManager.updateStreak();

    const container = document.getElementById('practice-content');
    container.innerHTML = `
      <div class="practice-complete">
        <h2>🎉 Practice Complete!</h2>
        
        <div class="results-stats">
          <div class="stat">
            <span class="stat-value">${this.correctAnswers}/${this.exercises.length}</span>
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

        <div class="performance-message">
          ${this.getPerformanceMessage(accuracy)}
        </div>
        
        <div class="practice-complete-actions">
          <button class="btn btn-secondary" onclick="PracticeManager.init()">
            Back to Practice
          </button>
          <button class="btn btn-primary" onclick="App.navigateToScreen('home')">
            Go Home
          </button>
        </div>
      </div>
    `;

    // Update app stats
    if (App.displayUserStats) {
      App.displayUserStats();
    }
  },

  // Get performance message
  getPerformanceMessage(accuracy) {
    if (accuracy >= 90) return '🌟 Puikiai! You\'re mastering Lithuanian!';
    if (accuracy >= 75) return '💪 Gerai! Keep up the great work!';
    if (accuracy >= 60) return '📚 Good effort! Practice makes perfect!';
    return '🎯 Keep practicing! You\'ll improve with time!';
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
  },

  // Exit practice
  exitPractice() {
    if (confirm('Are you sure you want to exit? Your progress won\'t be saved.')) {
      this.init();
    }
  }
};
