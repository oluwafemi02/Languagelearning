const SentenceManager = {
  allSentences: [],
  currentSentences: [],
  currentSentenceIndex: 0,
  selectedAnswer: null,

  // Initialize the sentence learning system
  async init() {
    await this.loadSentences();
    this.renderSentenceScreen();
  },

  // Load sentences from JSON file
  async loadSentences() {
    try {
      const response = await fetch('sentences-data.json');
      const data = await response.json();
      this.allSentences = data.sentences;
    } catch (error) {
      console.error('Error loading sentences:', error);
      this.allSentences = [];
    }
  },

  // Render the main sentence learning screen
  renderSentenceScreen() {
    const container = document.getElementById('sentences-content');
    if (!container) return;

    const userData = Storage.getUserData();
    
    // Initialize sentences object if it doesn't exist
    if (!userData.sentences) {
      userData.sentences = {
        learned: [],
        lastLearningDate: null,
        dailyCount: 0,
        weeklyReviewDate: null,
        reviewScores: []
      };
      Storage.saveUserData(userData);
    }

    const today = new Date().toDateString();
    const lastDate = userData.sentences.lastLearningDate ? 
      new Date(userData.sentences.lastLearningDate).toDateString() : null;
    
    // Reset daily count if it's a new day
    if (lastDate !== today) {
      userData.sentences.dailyCount = 0;
      userData.sentences.lastLearningDate = today;
      Storage.saveUserData(userData);
    }

    const dailyCount = userData.sentences.dailyCount;
    const totalLearned = userData.sentences.learned.length;
    const canLearnMore = dailyCount < 10;
    
    // Check if weekly review is needed (every 7 days)
    const needsWeeklyReview = this.needsWeeklyReview();
    const reviewableSentences = this.getReviewableSentences();

    container.innerHTML = `
      <div class="sentences-header">
        <h2>📚 Daily Sentence Learning</h2>
        <p class="subtitle">Master Lithuanian one sentence at a time</p>
      </div>

      <div class="sentence-stats-grid">
        <div class="sentence-stat-card">
          <div class="sentence-stat-icon">🎯</div>
          <div class="sentence-stat-value">${dailyCount}/10</div>
          <div class="sentence-stat-label">Today's Progress</div>
        </div>
        <div class="sentence-stat-card">
          <div class="sentence-stat-icon">✨</div>
          <div class="sentence-stat-value">${totalLearned}</div>
          <div class="sentence-stat-label">Total Learned</div>
        </div>
        <div class="sentence-stat-card ${needsWeeklyReview ? 'review-due' : ''}">
          <div class="sentence-stat-icon">📝</div>
          <div class="sentence-stat-value">${reviewableSentences.length}</div>
          <div class="sentence-stat-label">Ready to Review</div>
        </div>
      </div>

      ${needsWeeklyReview ? `
        <div class="weekly-review-banner">
          <div class="review-banner-content">
            <h3>🎉 Weekly Review Time!</h3>
            <p>Test your knowledge of the sentences you've learned this week</p>
            <button class="btn btn-primary" onclick="SentenceManager.startWeeklyReview()">
              Start Weekly Review (${reviewableSentences.length} sentences)
            </button>
          </div>
        </div>
      ` : ''}

      <div class="daily-learning-section">
        <h3>📖 Today's Learning</h3>
        ${canLearnMore ? `
          <p class="section-description">Learn ${10 - dailyCount} more sentence${10 - dailyCount !== 1 ? 's' : ''} today to complete your daily goal!</p>
          <button class="btn btn-primary btn-large" onclick="SentenceManager.startDailyLearning()">
            ${dailyCount === 0 ? 'Start Learning Today' : 'Continue Learning'} 
            (${10 - dailyCount} remaining)
          </button>
        ` : `
          <div class="goal-complete-card">
            <div class="goal-icon">🎉</div>
            <h4>Daily Goal Complete!</h4>
            <p>You've learned 10 sentences today. Puikiai! Come back tomorrow for more.</p>
          </div>
        `}
      </div>

      ${reviewableSentences.length > 0 && !needsWeeklyReview ? `
        <div class="quick-review-section">
          <h3>🔄 Quick Review</h3>
          <p class="section-description">Practice sentences you've already learned</p>
          <button class="btn btn-secondary" onclick="SentenceManager.startQuickReview()">
            Practice ${reviewableSentences.length} Sentences
          </button>
        </div>
      ` : ''}

      ${totalLearned > 0 ? `
        <div class="progress-timeline">
          <h3>📊 Your Progress</h3>
          <div class="timeline-content">
            ${this.renderProgressTimeline(userData)}
          </div>
        </div>
      ` : ''}
    `;
  },

  // Render progress timeline
  renderProgressTimeline(userData) {
    const weeks = Math.ceil(userData.sentences.learned.length / 10);
    let html = '<div class="week-progress-grid">';
    
    for (let i = 1; i <= Math.max(weeks, 1); i++) {
      const weekSentences = userData.sentences.learned.filter(
        id => id >= (i - 1) * 10 + 1 && id <= i * 10
      );
      const percentage = (weekSentences.length / 10) * 100;
      
      html += `
        <div class="week-progress-item">
          <div class="week-label">Week ${i}</div>
          <div class="week-progress-bar">
            <div class="week-progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="week-count">${weekSentences.length}/10</div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  },

  // Check if weekly review is needed
  needsWeeklyReview() {
    const userData = Storage.getUserData();
    if (!userData.sentences || userData.sentences.learned.length === 0) return false;
    
    const lastReview = userData.sentences.weeklyReviewDate;
    if (!lastReview) {
      // Check if user has learned at least 10 sentences
      return userData.sentences.learned.length >= 10;
    }
    
    const daysSinceReview = (Date.now() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceReview >= 7 && userData.sentences.learned.length > 0;
  },

  // Get sentences available for review
  getReviewableSentences() {
    const userData = Storage.getUserData();
    if (!userData.sentences) return [];
    
    return this.allSentences.filter(s => userData.sentences.learned.includes(s.id));
  },

  // Start daily learning session
  startDailyLearning() {
    const userData = Storage.getUserData();
    const dailyCount = userData.sentences.dailyCount;
    
    if (dailyCount >= 10) {
      alert('You\'ve already learned 10 sentences today! Come back tomorrow.');
      return;
    }

    // Get next sentences to learn
    const nextSentences = this.getNextSentencesToLearn();
    if (nextSentences.length === 0) {
      alert('Congratulations! You\'ve learned all available sentences!');
      return;
    }

    this.currentSentences = nextSentences.slice(0, 10 - dailyCount);
    this.currentSentenceIndex = 0;
    this.startLearningSession();
  },

  // Get next sentences to learn
  getNextSentencesToLearn() {
    const userData = Storage.getUserData();
    return this.allSentences.filter(s => !userData.sentences.learned.includes(s.id));
  },

  // Start learning session
  startLearningSession() {
    document.getElementById('sentences-screen').classList.remove('active');
    document.getElementById('sentence-learning-screen').classList.add('active');
    this.displayCurrentSentence();
  },

  // Display current sentence
  displayCurrentSentence() {
    const sentence = this.currentSentences[this.currentSentenceIndex];
    const container = document.getElementById('sentence-learning-content');
    
    const progress = ((this.currentSentenceIndex + 1) / this.currentSentences.length) * 100;
    document.getElementById('sentence-learning-progress').style.width = `${progress}%`;
    
    container.innerHTML = `
      <div class="sentence-learning-card">
        <div class="sentence-type-badge">${sentence.category}</div>
        <div class="sentence-difficulty-badge">${sentence.difficulty}</div>
        
        <div class="sentence-lithuanian">
          <h2>${sentence.lithuanian}</h2>
          <button class="audio-btn" onclick="SentenceManager.playSentenceAudio('${sentence.lithuanian}')">
            🔊 Listen
          </button>
        </div>
        
        <div class="sentence-pronunciation">
          <strong>Pronunciation:</strong> ${sentence.pronunciation}
        </div>
        
        <div class="sentence-english">
          <strong>English:</strong> ${sentence.english}
        </div>
        
        <div class="sentence-actions">
          <button class="btn btn-primary" onclick="SentenceManager.markSentenceLearned()">
            Got it! Next Sentence →
          </button>
        </div>
      </div>
    `;
  },

  // Play sentence audio using Web Speech API
  playSentenceAudio(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'lt-LT';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  },

  // Mark sentence as learned
  markSentenceLearned() {
    const userData = Storage.getUserData();
    const sentence = this.currentSentences[this.currentSentenceIndex];
    
    // Add to learned sentences
    if (!userData.sentences.learned.includes(sentence.id)) {
      userData.sentences.learned.push(sentence.id);
      userData.sentences.dailyCount++;
      
      // Award XP
      const xpEarned = 5;
      Storage.awardXP(xpEarned);

      Storage.addSrsItem({ id: `sentence:${sentence.id}`, kind: 'sentence' });
      
      Storage.saveUserData(userData);
    }
    
    // Move to next sentence
    this.currentSentenceIndex++;
    
    if (this.currentSentenceIndex >= this.currentSentences.length) {
      this.completeLearningSession();
    } else {
      this.displayCurrentSentence();
    }
  },

  // Complete learning session
  completeLearningSession() {
    const userData = Storage.getUserData();
    const sentencesLearned = this.currentSentences.length;
    const xpEarned = sentencesLearned * 5;
    
    document.getElementById('sentence-learning-screen').classList.remove('active');
    document.getElementById('sentence-results-screen').classList.add('active');
    
    document.getElementById('sentences-learned-count').textContent = sentencesLearned;
    document.getElementById('sentences-xp-earned').textContent = xpEarned;
    document.getElementById('sentences-total-count').textContent = userData.sentences.learned.length;
    
    // Update streak
    StreakManager.updateStreak();
    
    // Update daily goal
    if (typeof App !== 'undefined' && App.updateDailyGoal) {
      App.updateDailyGoal();
    }
  },

  // Exit learning session
  exitLearning() {
    if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
      document.getElementById('sentence-learning-screen').classList.remove('active');
      document.getElementById('sentences-screen').classList.add('active');
      this.renderSentenceScreen();
    }
  },

  // Back to sentences screen from results
  backToSentences() {
    document.getElementById('sentence-results-screen').classList.remove('active');
    document.getElementById('sentences-screen').classList.add('active');
    this.renderSentenceScreen();
  },

  // Start weekly review
  startWeeklyReview() {
    const reviewSentences = this.getReviewableSentences();
    if (reviewSentences.length === 0) {
      alert('No sentences to review yet!');
      return;
    }
    
    // Shuffle and take up to 20 sentences for review
    this.currentSentences = reviewSentences
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(20, reviewSentences.length));
    
    this.currentSentenceIndex = 0;
    this.reviewCorrectCount = 0;
    this.isReviewMode = true;
    
    document.getElementById('sentences-screen').classList.remove('active');
    document.getElementById('sentence-review-screen').classList.add('active');
    
    this.displayReviewQuestion();
  },

  // Start quick review
  startQuickReview() {
    this.startWeeklyReview(); // Use same logic as weekly review
  },

  // Display review question
  displayReviewQuestion() {
    const sentence = this.currentSentences[this.currentSentenceIndex];
    const container = document.getElementById('sentence-review-content');
    
    const progress = ((this.currentSentenceIndex + 1) / this.currentSentences.length) * 100;
    document.getElementById('sentence-review-progress').style.width = `${progress}%`;
    document.getElementById('sentence-review-counter').textContent = 
      `${this.currentSentenceIndex + 1}/${this.currentSentences.length}`;
    
    // Random question type
    const questionType = Math.random() > 0.5 ? 'translate-to-english' : 'translate-to-lithuanian';
    
    let options = [];
    if (questionType === 'translate-to-english') {
      // Generate wrong answers
      const wrongAnswers = this.allSentences
        .filter(s => s.id !== sentence.id && s.category === sentence.category)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(s => s.english);
      
      options = [sentence.english, ...wrongAnswers].sort(() => Math.random() - 0.5);
      
      container.innerHTML = `
        <div class="review-question-card">
          <h3>What does this mean in English?</h3>
          <div class="sentence-to-translate">
            <p class="lithuanian-text">${sentence.lithuanian}</p>
            <button class="audio-btn-small" onclick="SentenceManager.playSentenceAudio('${sentence.lithuanian}')">
              🔊
            </button>
          </div>
          <div class="review-options" id="review-options">
            ${options.map(opt => `
              <button class="review-option" onclick="SentenceManager.selectReviewAnswer('${opt.replace(/'/g, "\\'")}', this, '${sentence.english.replace(/'/g, "\\'")}')">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      const wrongAnswers = this.allSentences
        .filter(s => s.id !== sentence.id && s.category === sentence.category)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(s => s.lithuanian);
      
      options = [sentence.lithuanian, ...wrongAnswers].sort(() => Math.random() - 0.5);
      
      container.innerHTML = `
        <div class="review-question-card">
          <h3>How do you say this in Lithuanian?</h3>
          <div class="sentence-to-translate">
            <p class="english-text">${sentence.english}</p>
          </div>
          <div class="review-options" id="review-options">
            ${options.map(opt => `
              <button class="review-option" onclick="SentenceManager.selectReviewAnswer('${opt.replace(/'/g, "\\'")}', this, '${sentence.lithuanian.replace(/'/g, "\\'")}')">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
  },

  // Select review answer
  selectReviewAnswer(answer, button, correctAnswer) {
    this.selectedAnswer = answer;
    const isCorrect = answer === correctAnswer;
    
    if (isCorrect) {
      this.reviewCorrectCount++;
      button.classList.add('correct');
    } else {
      button.classList.add('incorrect');
      // Highlight correct answer
      document.querySelectorAll('.review-option').forEach(opt => {
        if (opt.textContent.trim() === correctAnswer) {
          opt.classList.add('correct');
        }
      });
    }
    
    // Disable all options
    document.querySelectorAll('.review-option').forEach(opt => {
      opt.disabled = true;
    });
    
    // Show continue button
    setTimeout(() => {
      this.continueReview();
    }, 1500);
  },

  // Continue to next review question
  continueReview() {
    this.currentSentenceIndex++;
    
    if (this.currentSentenceIndex >= this.currentSentences.length) {
      this.completeReview();
    } else {
      this.displayReviewQuestion();
    }
  },

  // Complete review session
  completeReview() {
    const userData = Storage.getUserData();
    const accuracy = Math.round((this.reviewCorrectCount / this.currentSentences.length) * 100);
    const xpEarned = this.reviewCorrectCount * 3;
    
    // Update review date
    userData.sentences.weeklyReviewDate = new Date().toISOString();
    userData.sentences.reviewScores.push({
      date: new Date().toISOString(),
      correct: this.reviewCorrectCount,
      total: this.currentSentences.length,
      accuracy: accuracy
    });
    
    Storage.awardXP(xpEarned);
    Storage.saveUserData(userData);
    
    document.getElementById('sentence-review-screen').classList.remove('active');
    document.getElementById('sentence-review-results-screen').classList.add('active');
    
    document.getElementById('review-correct-count').textContent = 
      `${this.reviewCorrectCount}/${this.currentSentences.length}`;
    document.getElementById('review-xp-earned').textContent = xpEarned;
    document.getElementById('review-accuracy').textContent = `${accuracy}%`;
    
    this.isReviewMode = false;
  },

  // Exit review session
  exitReview() {
    if (confirm('Are you sure you want to exit? Progress will not be saved.')) {
      document.getElementById('sentence-review-screen').classList.remove('active');
      document.getElementById('sentences-screen').classList.add('active');
      this.isReviewMode = false;
    }
  },

  // Back to sentences from review results
  backToSentencesFromReview() {
    document.getElementById('sentence-review-results-screen').classList.remove('active');
    document.getElementById('sentences-screen').classList.add('active');
    this.renderSentenceScreen();
  }
};
