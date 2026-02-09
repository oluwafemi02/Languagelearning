// Word Bank Manager - Vocabulary learning module
const WordBankManager = {
  words: [],
  filteredWords: [],
  currentWordIndex: 0,
  currentFilter: 'all',
  currentDifficulty: 'all',
  learnedWords: new Set(),
  favoriteWords: new Set(),
  reviewWords: new Set(),
  isLearningMode: false,

  // Initialize Word Bank
  async init() {
    await this.loadWords();
    this.loadUserProgress();
    this.displayWordBank();
  },

  // Load words from JSON
  async loadWords() {
    try {
      const response = await fetch('wordbank-data.json');
      const data = await response.json();
      this.words = data.words;
      this.filteredWords = [...this.words];
      console.log(`Loaded ${this.words.length} words`);
    } catch (error) {
      console.error('Error loading word bank:', error);
      this.words = [];
    }
  },

  // Load user progress from storage
  loadUserProgress() {
    const userData = Storage.getUserData();
    this.learnedWords = new Set(userData.wordBankLearned || []);
    this.favoriteWords = new Set(userData.wordBankFavorites || []);
    this.reviewWords = new Set(userData.wordBankReview || []);
  },

  // Save user progress
  saveProgress() {
    const userData = Storage.getUserData();
    userData.wordBankLearned = Array.from(this.learnedWords);
    userData.wordBankFavorites = Array.from(this.favoriteWords);
    userData.wordBankReview = Array.from(this.reviewWords);
    Storage.saveUserData(userData);
  },

  // Display Word Bank main view
  displayWordBank() {
    const container = document.getElementById('wordbank-content');
    if (!container) return;

    // Show stats
    const statsHTML = `
      <div class="wordbank-stats">
        <div class="stat-box">
          <span class="stat-value">${this.learnedWords.size}</span>
          <span class="stat-label">Learned</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${this.reviewWords.size}</span>
          <span class="stat-label">To Review</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${this.favoriteWords.size}</span>
          <span class="stat-label">Favorites</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">${this.words.length}</span>
          <span class="stat-label">Total Words</span>
        </div>
      </div>
    `;

    // Show filters
    const filtersHTML = `
      <div class="wordbank-filters">
        <div class="filter-group">
          <label>Topic:</label>
          <select id="topic-filter" onchange="WordBankManager.filterByTopic(this.value)">
            <option value="all">All Topics</option>
            <option value="greetings">Greetings</option>
            <option value="food">Food</option>
            <option value="family">Family</option>
            <option value="verbs">Verbs</option>
            <option value="adjectives">Adjectives</option>
            <option value="numbers">Numbers</option>
            <option value="colors">Colors</option>
            <option value="animals">Animals</option>
            <option value="places">Places</option>
            <option value="time">Time</option>
            <option value="emotions">Emotions</option>
            <option value="education">Education</option>
            <option value="work">Work</option>
            <option value="professions">Professions</option>
            <option value="weather">Weather</option>
            <option value="hobbies">Hobbies</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Difficulty:</label>
          <select id="difficulty-filter" onchange="WordBankManager.filterByDifficulty(this.value)">
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <button class="btn btn-secondary" onclick="WordBankManager.shuffleWords()">
          🎲 Random
        </button>
        <button class="btn btn-primary" onclick="WordBankManager.startLearningMode()">
          📚 Learning Mode
        </button>
      </div>
    `;

    // Display word list
    const wordsHTML = this.filteredWords.map(word => {
      const isLearned = this.learnedWords.has(word.id);
      const isFavorite = this.favoriteWords.has(word.id);
      const isReview = this.reviewWords.has(word.id);

      return `
        <div class="word-card ${isLearned ? 'learned' : ''}" data-word-id="${word.id}">
          <div class="word-card-header">
            <div class="word-main">
              <h3 class="word-lithuanian">${word.lithuanian}</h3>
              <button class="btn-icon" onclick="WordBankManager.playWordAudio('${word.lithuanian}')" title="Pronounce">
                🔊
              </button>
            </div>
            <button class="btn-icon ${isFavorite ? 'active' : ''}" 
                    onclick="WordBankManager.toggleFavorite(${word.id})"
                    title="Favorite">
              ${isFavorite ? '⭐' : '☆'}
            </button>
          </div>
          <p class="word-english">${word.english}</p>
          <p class="word-example">${word.example}</p>
          <div class="word-meta">
            <span class="word-topic">${word.topic}</span>
            <span class="word-difficulty">${word.difficulty}</span>
          </div>
          <div class="word-actions">
            <button class="btn btn-success" 
                    onclick="WordBankManager.markAsLearned(${word.id})"
                    ${isLearned ? 'disabled' : ''}>
              ${isLearned ? '✓ Learned' : 'Mark as Learned'}
            </button>
            <button class="btn btn-secondary" 
                    onclick="WordBankManager.addToReview(${word.id})"
                    ${isReview ? 'disabled' : ''}>
              ${isReview ? '✓ In Review' : 'Add to Review'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = statsHTML + filtersHTML + `<div class="wordbank-list">${wordsHTML || '<p class="no-words">No words found for this filter.</p>'}</div>`;
  },

  // Filter by topic
  filterByTopic(topic) {
    this.currentFilter = topic;
    this.applyFilters();
  },

  // Filter by difficulty
  filterByDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    this.applyFilters();
  },

  // Apply all filters
  applyFilters() {
    this.filteredWords = this.words.filter(word => {
      const topicMatch = this.currentFilter === 'all' || word.topic === this.currentFilter;
      const difficultyMatch = this.currentDifficulty === 'all' || word.difficulty === this.currentDifficulty;
      return topicMatch && difficultyMatch;
    });
    this.displayWordBank();
  },

  // Shuffle words
  shuffleWords() {
    this.filteredWords = [...this.filteredWords].sort(() => Math.random() - 0.5);
    this.displayWordBank();
  },

  // Mark word as learned
  markAsLearned(wordId) {
    this.learnedWords.add(wordId);
    this.saveProgress();
    
    // Add word to vocabulary storage for review system
    const word = this.words.find(w => w.id === wordId);
    if (word) {
      Storage.addVocabulary(word.lithuanian);
    }
    
    // Add XP
    Storage.awardXP(2);
    
    this.displayWordBank();
    this.showNotification('✓ Word learned! +2 XP');
  },

  // Toggle favorite
  toggleFavorite(wordId) {
    if (this.favoriteWords.has(wordId)) {
      this.favoriteWords.delete(wordId);
    } else {
      this.favoriteWords.add(wordId);
    }
    this.saveProgress();
    this.displayWordBank();
  },

  // Add to review
  addToReview(wordId) {
    this.reviewWords.add(wordId);
    this.saveProgress();
    this.displayWordBank();
    this.showNotification('✓ Added to review list');
  },

  // Play word audio using Google TTS
  async playWordAudio(word) {
    try {
      // Use Web Speech API or Google TTS
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'lt-LT';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  },

  // Start Learning Mode
  startLearningMode() {
    if (this.filteredWords.length === 0) {
      alert('No words to learn! Try changing filters.');
      return;
    }

    this.isLearningMode = true;
    this.currentWordIndex = 0;
    this.displayLearningMode();
  },

  // Display Learning Mode (one word at a time)
  displayLearningMode() {
    const container = document.getElementById('wordbank-content');
    if (!container || !this.isLearningMode) return;

    const word = this.filteredWords[this.currentWordIndex];
    const isLearned = this.learnedWords.has(word.id);
    const isFavorite = this.favoriteWords.has(word.id);
    const progress = Math.round(((this.currentWordIndex + 1) / this.filteredWords.length) * 100);

    container.innerHTML = `
      <div class="learning-mode">
        <div class="learning-header">
          <button class="btn-icon" onclick="WordBankManager.exitLearningMode()">✕ Exit</button>
          <div class="learning-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${this.currentWordIndex + 1} / ${this.filteredWords.length}</span>
          </div>
        </div>
        
        <div class="learning-card">
          <button class="btn-icon favorite-btn ${isFavorite ? 'active' : ''}" 
                  onclick="WordBankManager.toggleFavorite(${word.id})">
            ${isFavorite ? '⭐' : '☆'}
          </button>
          
          <div class="learning-word">
            <h2 class="word-lithuanian-large">${word.lithuanian}</h2>
            <button class="audio-btn-large" onclick="WordBankManager.playWordAudio('${word.lithuanian}')">
              🔊 Klausyti
            </button>
          </div>
          
          <p class="word-english-large">${word.english}</p>
          
          <div class="word-example-box">
            <p class="word-example-large">${word.example}</p>
          </div>
          
          <div class="word-meta-large">
            <span class="word-topic">${word.topic}</span>
            <span class="word-difficulty">${word.difficulty}</span>
            <span class="word-pos">${word.partOfSpeech}</span>
          </div>
          
          <div class="learning-actions">
            <button class="btn btn-secondary" onclick="WordBankManager.addToReview(${word.id})">
              Add to Review
            </button>
            ${!isLearned ? `
              <button class="btn btn-success" onclick="WordBankManager.markAsLearnedAndNext(${word.id})">
                ✓ Learned & Next
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="learning-navigation">
          <button class="btn btn-secondary" 
                  onclick="WordBankManager.previousWord()"
                  ${this.currentWordIndex === 0 ? 'disabled' : ''}>
            ← Previous
          </button>
          <button class="btn btn-primary" 
                  onclick="WordBankManager.nextWord()"
                  ${this.currentWordIndex === this.filteredWords.length - 1 ? 'disabled' : ''}>
            Next →
          </button>
        </div>
      </div>
    `;
  },

  // Mark as learned and go to next
  markAsLearnedAndNext(wordId) {
    this.markAsLearned(wordId);
    this.nextWord();
  },

  // Next word in learning mode
  nextWord() {
    if (this.currentWordIndex < this.filteredWords.length - 1) {
      this.currentWordIndex++;
      this.displayLearningMode();
    } else {
      this.completeLearningSession();
    }
  },

  // Previous word in learning mode
  previousWord() {
    if (this.currentWordIndex > 0) {
      this.currentWordIndex--;
      this.displayLearningMode();
    }
  },

  // Exit learning mode
  exitLearningMode() {
    this.isLearningMode = false;
    this.displayWordBank();
  },

  // Complete learning session
  completeLearningSession() {
    this.isLearningMode = false;
    const wordsLearned = this.filteredWords.filter(w => this.learnedWords.has(w.id)).length;
    
    alert(`🎉 Learning session complete!\n\nWords learned: ${wordsLearned}/${this.filteredWords.length}\nKeep up the great work!`);
    
    this.displayWordBank();
  },

  // Show notification
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'wordbank-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
};
