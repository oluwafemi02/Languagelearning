const GrammarManager = {
  allLessons: [],
  currentLesson: null,
  currentExercise: 0,
  correctAnswers: 0,
  totalExercises: 0,
  completedLessons: new Set(),

  // Initialize grammar manager
  async init() {
    await this.loadGrammarLessons();
    this.loadUserProgress();
    this.displayGrammarLessons();
    this.setupEventListeners();
  },

  // Load grammar lessons from JSON
  async loadGrammarLessons() {
    try {
      const response = await fetch('grammar-lessons.json');
      const data = await response.json();
      this.allLessons = data.lessons;
      return true;
    } catch (error) {
      console.error('Error loading grammar lessons:', error);
      return false;
    }
  },

  // Load user progress
  loadUserProgress() {
    const userData = Storage.getUserData();
    if (userData.grammarProgress) {
      this.completedLessons = new Set(userData.grammarProgress.completed || []);
    }
  },

  // Save user progress
  saveUserProgress() {
    const userData = Storage.getUserData();
    userData.grammarProgress = {
      completed: Array.from(this.completedLessons)
    };
    Storage.saveUserData(userData);
  },

  // Display grammar lessons list
  displayGrammarLessons() {
    const container = document.getElementById('grammar-lessons-container');
    if (!container) return;

    container.innerHTML = '';

    this.allLessons.forEach((lesson, index) => {
      const isCompleted = this.completedLessons.has(lesson.id);
      const isLocked = index > 0 && !this.completedLessons.has(this.allLessons[index - 1].id);

      const lessonCard = document.createElement('div');
      lessonCard.className = `grammar-lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
      
      lessonCard.innerHTML = `
        <div class="grammar-lesson-icon">${lesson.icon}</div>
        <div class="grammar-lesson-info">
          <h3>${lesson.titleLT}</h3>
          <p class="lesson-title-en">${lesson.title}</p>
          <p class="lesson-description">${lesson.descriptionLT}</p>
          <div class="lesson-meta">
            <span class="xp-badge">+${lesson.xp} XP</span>
            <span class="difficulty-badge">${lesson.difficulty}</span>
            ${isCompleted ? '<span class="completed-badge">✓ Completed</span>' : ''}
          </div>
        </div>
        ${isLocked ? '<div class="lock-icon">🔒</div>' : ''}
      `;

      if (!isLocked) {
        lessonCard.style.cursor = 'pointer';
        lessonCard.onclick = () => this.startGrammarLesson(lesson.id);
      }

      container.appendChild(lessonCard);
    });
  },

  // Start a grammar lesson
  startGrammarLesson(lessonId) {
    this.currentLesson = this.allLessons.find(l => l.id === lessonId);
    if (!this.currentLesson) return;

    this.currentExercise = 0;
    this.correctAnswers = 0;
    this.totalExercises = this.currentLesson.exercises.length;

    // Show grammar lesson screen
    document.getElementById('grammar-screen').classList.remove('active');
    document.getElementById('grammar-lesson-screen').classList.add('active');

    // Display theory first
    this.displayTheory();
  },

  // Display theory/explanation
  displayTheory() {
    const container = document.getElementById('grammar-theory-container');
    if (!container) return;

    const theory = this.currentLesson.theory;
    let theoryHTML = `
      <div class="theory-section">
        <h2>${this.currentLesson.titleLT}</h2>
        <h3 class="subtitle-en">${this.currentLesson.title}</h3>
        
        <div class="theory-intro">
          <p class="theory-text-lt">${theory.introductionLT}</p>
          <p class="theory-text-en">${theory.introduction}</p>
        </div>
    `;

    // Display rules
    if (theory.rules && theory.rules.length > 0) {
      theoryHTML += '<div class="theory-rules"><h4>Rules / Taisyklės:</h4>';
      theory.rules.forEach(rule => {
        theoryHTML += `
          <div class="rule-item">
            <p class="rule-lt">📌 ${rule.ruleLT}</p>
            <p class="rule-en">${rule.rule}</p>
            <div class="rule-example">
              <p class="example-lt">💬 ${rule.example}</p>
              <p class="example-en">${rule.exampleEN}</p>
            </div>
          </div>
        `;
      });
      theoryHTML += '</div>';
    }

    // Display conjugation table if available
    if (theory.conjugationTable) {
      const table = theory.conjugationTable;
      theoryHTML += `
        <div class="conjugation-table">
          <h4>Conjugation: ${table.verb}</h4>
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Lithuanian</th>
                <th>English</th>
              </tr>
            </thead>
            <tbody>
      `;
      table.forms.forEach(form => {
        theoryHTML += `
          <tr>
            <td>${form.person}</td>
            <td><strong>${form.form}</strong></td>
            <td>${form.english}</td>
          </tr>
        `;
      });
      theoryHTML += '</tbody></table></div>';
    }

    // Display common phrases if available
    if (theory.commonPhrases) {
      theoryHTML += '<div class="common-phrases"><h4>Common Phrases:</h4>';
      theory.commonPhrases.forEach(category => {
        theoryHTML += `<div class="phrase-category"><h5>${category.category}</h5>`;
        category.phrases.forEach(phrase => {
          theoryHTML += `
            <div class="phrase-item">
              <span class="phrase-lt">${phrase.lt}</span>
              <span class="phrase-arrow">→</span>
              <span class="phrase-en">${phrase.en}</span>
            </div>
          `;
        });
        theoryHTML += '</div>';
      });
      theoryHTML += '</div>';
    }

    // Display common questions if available
    if (theory.commonQuestions) {
      theoryHTML += '<div class="common-questions"><h4>Common Q&A:</h4>';
      theory.commonQuestions.forEach(q => {
        theoryHTML += `
          <div class="qa-item">
            <p class="question-lt">❓ ${q.lt}</p>
            <p class="question-en">${q.en}</p>
            <p class="answer-lt">💡 ${q.answer}</p>
          </div>
        `;
      });
      theoryHTML += '</div>';
    }

    // Cultural note
    if (theory.culturalNote) {
      theoryHTML += `
        <div class="cultural-note">
          <h4>🇱🇹 Cultural Note</h4>
          <p>${theory.culturalNote}</p>
        </div>
      `;
    }

    theoryHTML += `
        <button class="btn btn-primary" onclick="GrammarManager.startExercises()">
          Start Exercises / Pradėti Pratimus
        </button>
      </div>
    `;

    container.innerHTML = theoryHTML;
    container.style.display = 'block';
    document.getElementById('grammar-exercises-container').style.display = 'none';
  },

  // Start exercises
  startExercises() {
    document.getElementById('grammar-theory-container').style.display = 'none';
    document.getElementById('grammar-exercises-container').style.display = 'block';
    this.displayExercise();
  },

  // Display current exercise
  displayExercise() {
    if (this.currentExercise >= this.totalExercises) {
      this.completeGrammarLesson();
      return;
    }

    const exercise = this.currentLesson.exercises[this.currentExercise];
    const container = document.getElementById('grammar-exercise-content');
    if (!container) return;

    // Update progress
    const progress = ((this.currentExercise + 1) / this.totalExercises) * 100;
    const progressBar = document.getElementById('grammar-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    const progressText = document.getElementById('grammar-progress-text');
    if (progressText) {
      progressText.textContent = `${this.currentExercise + 1} / ${this.totalExercises}`;
    }

    // Render exercise based on type
    switch (exercise.type) {
      case 'word-order':
        this.displayWordOrderExercise(exercise);
        break;
      case 'fill-blank':
        this.displayFillBlankExercise(exercise);
        break;
      case 'multiple-choice':
        this.displayMultipleChoiceExercise(exercise);
        break;
      case 'matching':
        this.displayMatchingExercise(exercise);
        break;
      case 'translation':
        this.displayTranslationExercise(exercise);
        break;
      case 'transformation':
        this.displayTransformationExercise(exercise);
        break;
      case 'scenario':
        this.displayScenarioExercise(exercise);
        break;
      default:
        this.displayMultipleChoiceExercise(exercise);
    }
  },

  // Display word order exercise
  displayWordOrderExercise(exercise) {
    const container = document.getElementById('grammar-exercise-content');
    container.innerHTML = `
      <div class="exercise-header">
        <h3>${exercise.instructionLT || exercise.instruction}</h3>
        <p class="exercise-instruction-en">${exercise.instruction}</p>
        ${exercise.translation ? `<p class="translation-hint">Translation: ${exercise.translation}</p>` : ''}
        ${exercise.hint ? `<p class="hint">💡 ${exercise.hint}</p>` : ''}
      </div>
      
      <div class="word-order-container">
        <div class="word-pool" id="word-pool"></div>
        <div class="word-answer-area" id="word-answer-area">
          <p class="drop-instruction">Drag words here / Tempk žodžius čia</p>
        </div>
      </div>
      
      <button class="btn btn-primary" id="check-grammar-btn" onclick="GrammarManager.checkWordOrder()">
        Check Answer / Tikrinti
      </button>
    `;

    // Create draggable words
    const pool = document.getElementById('word-pool');
    const shuffled = [...exercise.words].sort(() => Math.random() - 0.5);
    
    shuffled.forEach((word, index) => {
      const wordEl = document.createElement('div');
      wordEl.className = 'word-draggable';
      wordEl.textContent = word;
      wordEl.draggable = true;
      wordEl.dataset.word = word;
      wordEl.dataset.index = index;
      pool.appendChild(wordEl);
    });

    this.setupDragAndDrop();
  },

  // Setup drag and drop functionality
  setupDragAndDrop() {
    let draggedElement = null;

    document.querySelectorAll('.word-draggable').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        draggedElement = e.target;
        e.target.classList.add('dragging');
      });

      el.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
      });

      // Also allow click to move
      el.addEventListener('click', (e) => {
        const answerArea = document.getElementById('word-answer-area');
        const pool = document.getElementById('word-pool');
        
        if (e.target.parentElement === pool) {
          answerArea.appendChild(e.target);
        } else {
          pool.appendChild(e.target);
        }
      });
    });

    const answerArea = document.getElementById('word-answer-area');
    answerArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      answerArea.classList.add('drag-over');
    });

    answerArea.addEventListener('dragleave', () => {
      answerArea.classList.remove('drag-over');
    });

    answerArea.addEventListener('drop', (e) => {
      e.preventDefault();
      answerArea.classList.remove('drag-over');
      if (draggedElement) {
        answerArea.appendChild(draggedElement);
      }
    });

    const pool = document.getElementById('word-pool');
    pool.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    pool.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedElement) {
        pool.appendChild(draggedElement);
      }
    });
  },

  // Check word order answer
  checkWordOrder() {
    const exercise = this.currentLesson.exercises[this.currentExercise];
    const answerArea = document.getElementById('word-answer-area');
    const userAnswer = Array.from(answerArea.querySelectorAll('.word-draggable'))
      .map(el => el.textContent);

    const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(exercise.correctOrder);
    
    if (isCorrect) {
      this.correctAnswers++;
      this.showFeedback(true, exercise.correctOrder.join(' '));
    } else {
      this.showFeedback(false, exercise.correctOrder.join(' '));
    }
  },

  // Display fill-in-blank exercise
  displayFillBlankExercise(exercise) {
    const container = document.getElementById('grammar-exercise-content');
    const options = exercise.options.sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
      <div class="exercise-header">
        <h3>Fill in the blank / Užpildyk</h3>
        ${exercise.translation ? `<p class="translation-hint">Translation: ${exercise.translation}</p>` : ''}
      </div>
      
      <div class="sentence-display">
        <p class="sentence-text">${exercise.sentence}</p>
      </div>
      
      <div class="options-container" id="fill-blank-options">
        ${options.map(opt => `
          <button class="option-btn" data-answer="${opt}">${opt}</button>
        `).join('')}
      </div>
    `;

    // Add click handlers
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.checkFillBlank(exercise, btn.dataset.answer);
      });
    });
  },

  // Check fill-blank answer
  checkFillBlank(exercise, answer) {
    const acceptable = exercise.acceptableAnswers || [exercise.correctAnswer];
    const isCorrect = acceptable.includes(answer);
    
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    this.showFeedback(isCorrect, exercise.correctAnswer, exercise.note);
  },

  // Display multiple choice exercise
  displayMultipleChoiceExercise(exercise) {
    const container = document.getElementById('grammar-exercise-content');
    const options = [...exercise.options].sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
      <div class="exercise-header">
        <h3>${exercise.questionLT || exercise.question}</h3>
        <p class="exercise-instruction-en">${exercise.question}</p>
      </div>
      
      <div class="options-container" id="mc-options">
        ${options.map(opt => `
          <button class="option-btn" data-answer="${opt}">${opt}</button>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.checkMultipleChoice(exercise, btn.dataset.answer);
      });
    });
  },

  // Check multiple choice answer
  checkMultipleChoice(exercise, answer) {
    const isCorrect = answer === exercise.correctAnswer;
    
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    this.showFeedback(isCorrect, exercise.correctAnswer, exercise.explanation);
  },

  // Display matching exercise
  displayMatchingExercise(exercise) {
    const container = document.getElementById('grammar-exercise-content');
    const shuffledRight = [...exercise.pairs].map(p => p.right).sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
      <div class="exercise-header">
        <h3>${exercise.instructionLT || exercise.instruction}</h3>
        <p class="exercise-instruction-en">${exercise.instruction}</p>
      </div>
      
      <div class="matching-container">
        <div class="matching-left">
          ${exercise.pairs.map((pair, i) => `
            <div class="match-item" data-left="${pair.left}" data-index="${i}">
              ${pair.left}
            </div>
          `).join('')}
        </div>
        <div class="matching-right">
          ${shuffledRight.map((right, i) => `
            <button class="match-btn" data-right="${right}" data-index="${i}">
              ${right}
            </button>
          `).join('')}
        </div>
      </div>
      
      <div class="matches-display" id="matches-display"></div>
      
      <button class="btn btn-primary" id="check-matching-btn" onclick="GrammarManager.checkMatching()" disabled>
        Check Answer / Tikrinti
      </button>
    `;

    this.setupMatching(exercise);
  },

  // Setup matching functionality
  setupMatching(exercise) {
    let selectedLeft = null;
    const matches = new Map();
    const matchesDisplay = document.getElementById('matches-display');

    document.querySelectorAll('.match-item').forEach(item => {
      item.addEventListener('click', () => {
        if (matches.has(item.dataset.left)) return; // Already matched
        
        document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedLeft = item;
      });
    });

    document.querySelectorAll('.match-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!selectedLeft || btn.disabled) return;
        
        matches.set(selectedLeft.dataset.left, btn.dataset.right);
        
        // Show match
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match-pair';
        matchDiv.innerHTML = `${selectedLeft.dataset.left} → ${btn.dataset.right}`;
        matchesDisplay.appendChild(matchDiv);
        
        selectedLeft.classList.remove('selected');
        selectedLeft.classList.add('matched');
        btn.disabled = true;
        btn.classList.add('matched');
        selectedLeft = null;
        
        if (matches.size === exercise.pairs.length) {
          document.getElementById('check-matching-btn').disabled = false;
        }
      });
    });

    this.currentMatches = matches;
    this.currentMatchingExercise = exercise;
  },

  // Check matching answer
  checkMatching() {
    const exercise = this.currentMatchingExercise;
    let correct = 0;
    
    exercise.pairs.forEach(pair => {
      if (this.currentMatches.get(pair.left) === pair.right) {
        correct++;
      }
    });
    
    const isCorrect = correct === exercise.pairs.length;
    
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    this.showFeedback(isCorrect, `All ${exercise.pairs.length} pairs matched correctly`);
  },

  // Display translation exercise
  displayTranslationExercise(exercise) {
    const container = document.getElementById('grammar-exercise-content');
    
    container.innerHTML = `
      <div class="exercise-header">
        <h3>Translate to Lithuanian / Išversk į lietuvių kalbą</h3>
        <p class="translation-prompt">${exercise.english}</p>
        ${exercise.hint ? `<p class="hint">💡 ${exercise.hint}</p>` : ''}
      </div>
      
      <div class="translation-input-container">
        <textarea 
          id="translation-input" 
          class="translation-textarea"
          placeholder="Type your translation here..."
          rows="3"
        ></textarea>
      </div>
      
      <button class="btn btn-primary" onclick="GrammarManager.checkTranslation()">
        Check Answer / Tikrinti
      </button>
    `;
  },

  // Check translation answer
  checkTranslation() {
    const exercise = this.currentLesson.exercises[this.currentExercise];
    const input = document.getElementById('translation-input');
    const userAnswer = input.value.trim().toLowerCase();
    
    const correctAnswers = exercise.correctAnswers.map(a => a.toLowerCase());
    const isCorrect = correctAnswers.some(answer => 
      userAnswer === answer || this.similarityCheck(userAnswer, answer) > 0.9
    );
    
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    this.showFeedback(isCorrect, exercise.correctAnswers[0]);
  },

  // Similarity check for translations (allows minor typos)
  similarityCheck(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  },

  // Levenshtein distance for string similarity
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  },

  // Display transformation exercise
  displayTransformationExercise(exercise) {
    const container = document.getElementById('grammar-exercise-content');
    
    container.innerHTML = `
      <div class="exercise-header">
        <h3>${exercise.instructionLT || exercise.instruction}</h3>
        <p class="exercise-instruction-en">${exercise.instruction}</p>
      </div>
      
      <div class="transformation-display">
        <p class="original-sentence">${exercise.positive}</p>
        <p class="arrow">↓</p>
        <textarea 
          id="transformation-input" 
          class="transformation-textarea"
          placeholder="Type transformed sentence..."
          rows="2"
        ></textarea>
      </div>
      
      <button class="btn btn-primary" onclick="GrammarManager.checkTransformation()">
        Check Answer / Tikrinti
      </button>
    `;
  },

  // Check transformation answer
  checkTransformation() {
    const exercise = this.currentLesson.exercises[this.currentExercise];
    const input = document.getElementById('transformation-input');
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = exercise.correctAnswer.toLowerCase();
    
    const isCorrect = userAnswer === correctAnswer || 
                      this.similarityCheck(userAnswer, correctAnswer) > 0.85;
    
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    this.showFeedback(isCorrect, exercise.correctAnswer);
  },

  // Display scenario exercise
  displayScenarioExercise(exercise) {
    const container = document.getElementById('grammar-exercise-content');
    const options = [...exercise.options].sort(() => Math.random() - 0.5);
    
    container.innerHTML = `
      <div class="exercise-header">
        <h3>Scenario / Situacija</h3>
        <p class="scenario-text">${exercise.situationLT || exercise.situation}</p>
        <p class="scenario-text-en">${exercise.situation}</p>
      </div>
      
      <div class="options-container" id="scenario-options">
        ${options.map(opt => `
          <button class="option-btn" data-answer="${opt}">${opt}</button>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.checkScenario(exercise, btn.dataset.answer);
      });
    });
  },

  // Check scenario answer
  checkScenario(exercise, answer) {
    const isCorrect = answer === exercise.correctAnswer;
    
    if (isCorrect) {
      this.correctAnswers++;
    }
    
    this.showFeedback(isCorrect, exercise.correctAnswer);
  },

  // Show feedback
  showFeedback(isCorrect, correctAnswer, note) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `grammar-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    
    feedbackDiv.innerHTML = `
      <div class="feedback-content">
        <h3>${isCorrect ? '✓ Teisingai! Correct!' : '✗ Neteisingai / Incorrect'}</h3>
        ${!isCorrect ? `<p>Correct answer: <strong>${correctAnswer}</strong></p>` : ''}
        ${note ? `<p class="feedback-note">📝 ${note}</p>` : ''}
        <button class="btn btn-primary" onclick="GrammarManager.nextExercise()">
          ${isCorrect ? 'Continue / Tęsti' : 'Try Next / Bandyti kitą'}
        </button>
      </div>
    `;
    
    document.getElementById('grammar-exercise-content').appendChild(feedbackDiv);
    
    // Disable interaction
    document.querySelectorAll('.option-btn, .word-draggable').forEach(el => {
      el.style.pointerEvents = 'none';
    });
  },

  // Move to next exercise
  nextExercise() {
    this.currentExercise++;
    this.displayExercise();
  },

  // Complete grammar lesson
  completeGrammarLesson() {
    const accuracy = Math.round((this.correctAnswers / this.totalExercises) * 100);
    const xpEarned = this.currentLesson.xp;

    // Mark lesson as completed
    this.completedLessons.add(this.currentLesson.id);
    this.saveUserProgress();

    // Add XP
    Storage.addXP(xpEarned);
    Storage.addDailyXP(xpEarned);

    // Update streak
    StreakManager.updateStreak();

    // Check achievements
    AchievementManager.checkAchievements();

    // Show results
    const container = document.getElementById('grammar-exercise-content');
    container.innerHTML = `
      <div class="grammar-results">
        <h2>🎉 Lesson Complete!</h2>
        <h3>Pamoka užbaigta!</h3>
        
        <div class="results-stats">
          <div class="stat">
            <span class="stat-value">${this.correctAnswers}/${this.totalExercises}</span>
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
        
        <div class="results-actions">
          <button class="btn btn-primary" onclick="GrammarManager.returnToGrammarList()">
            Back to Lessons / Grįžti
          </button>
          ${this.getNextLessonButton()}
        </div>
      </div>
    `;
  },

  // Get next lesson button
  getNextLessonButton() {
    const currentIndex = this.allLessons.findIndex(l => l.id === this.currentLesson.id);
    const nextLesson = this.allLessons[currentIndex + 1];
    
    if (nextLesson) {
      return `
        <button class="btn btn-secondary" onclick="GrammarManager.startGrammarLesson(${nextLesson.id})">
          Next Lesson / Kita Pamoka →
        </button>
      `;
    }
    
    return '';
  },

  // Return to grammar lessons list
  returnToGrammarList() {
    document.getElementById('grammar-lesson-screen').classList.remove('active');
    document.getElementById('grammar-screen').classList.add('active');
    this.displayGrammarLessons();
  },

  // Exit grammar lesson
  exitGrammarLesson() {
    if (confirm('Are you sure you want to exit? Progress will not be saved. / Ar tikrai nori išeiti? Pažanga nebus išsaugota.')) {
      this.returnToGrammarList();
    }
  },

  // Setup event listeners
  setupEventListeners() {
    // Exit button
    const exitBtn = document.getElementById('exit-grammar-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.exitGrammarLesson());
    }
  }
};
