const VocabularyManager = {
  allWords: [],
  categories: {},
  currentFilter: 'all',
  currentSearch: '',
  learnedWords: new Set(),
  reviewLaterWords: new Set(),

  // Initialize vocabulary manager
  async init() {
    await this.loadVocabulary();
    this.loadUserProgress();
    this.displayCategories();
    this.displayWords();
    this.updateStats();
    this.setupEventListeners();
  },

  // Load vocabulary from JSON
  async loadVocabulary() {
    try {
      const response = await fetch('vocabulary-bank.json');
      const data = await response.json();
      this.allWords = data.words;
      this.categories = data.categories;
      return true;
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      return false;
    }
  },

  // Load user progress from storage
  loadUserProgress() {
    const userData = Storage.getUserData();
    if (userData.vocabularyProgress) {
      this.learnedWords = new Set(userData.vocabularyProgress.learned || []);
      this.reviewLaterWords = new Set(userData.vocabularyProgress.reviewLater || []);
    }
  },

  // Save user progress
  saveUserProgress() {
    const userData = Storage.getUserData();
    userData.vocabularyProgress = {
      learned: Array.from(this.learnedWords),
      reviewLater: Array.from(this.reviewLaterWords)
    };
    Storage.saveUserData(userData);
    this.updateStats();
  },

  // Display category filters
  displayCategories() {
    const container = document.getElementById('vocab-categories');
    if (!container) return;

    container.innerHTML = `
      <button class="category-filter active" data-category="all">
        <span class="category-icon">📚</span>
        <span class="category-name">All Words</span>
      </button>
    `;

    Object.entries(this.categories).forEach(([key, cat]) => {
      const count = this.allWords.filter(w => w.category === key).length;
      const button = document.createElement('button');
      button.className = 'category-filter';
      button.dataset.category = key;
      button.innerHTML = `
        <span class="category-icon">${cat.icon}</span>
        <span class="category-name">${cat.name}</span>
        <span class="category-count">${count}</span>
      `;
      container.appendChild(button);
    });
  },

  // Display words
  displayWords() {
    const container = document.getElementById('vocab-words-container');
    if (!container) return;

    let filteredWords = this.getFilteredWords();
    
    if (filteredWords.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <p>😕 No words found</p>
          <p class="text-light">Try adjusting your filters or search</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filteredWords.forEach(word => {
      const wordCard = this.createWordCard(word);
      container.appendChild(wordCard);
    });

    this.updateResultCount(filteredWords.length);
  },

  // Get filtered words based on category and search
  getFilteredWords() {
    let words = this.allWords;

    // Filter by category
    if (this.currentFilter !== 'all') {
      if (this.currentFilter === 'learned') {
        words = words.filter(w => this.learnedWords.has(w.id));
      } else if (this.currentFilter === 'review-later') {
        words = words.filter(w => this.reviewLaterWords.has(w.id));
      } else {
        words = words.filter(w => w.category === this.currentFilter);
      }
    }

    // Filter by search
    if (this.currentSearch) {
      const search = this.currentSearch.toLowerCase();
      words = words.filter(w => 
        w.lithuanian.toLowerCase().includes(search) ||
        w.english.toLowerCase().includes(search)
      );
    }

    return words;
  },

  // Create word card element
  createWordCard(word) {
    const card = document.createElement('div');
    card.className = 'vocab-word-card';
    
    const isLearned = this.learnedWords.has(word.id);
    const isReviewLater = this.reviewLaterWords.has(word.id);
    
    if (isLearned) card.classList.add('learned');
    if (isReviewLater) card.classList.add('review-later');

    const categoryInfo = this.categories[word.category];
    
    card.innerHTML = `
      <div class="word-card-header">
        <div class="word-main">
          <h3 class="word-lithuanian">${word.lithuanian}</h3>
          <p class="word-english">${word.english}</p>
        </div>
        <button class="btn-icon audio-word-btn" data-text="${word.lithuanian}" title="Listen">
          🔊
        </button>
      </div>
      
      <div class="word-card-body">
        <div class="word-details">
          <span class="word-badge pronunciation">${word.pronunciation}</span>
          <span class="word-badge category" style="background-color: ${categoryInfo?.color || '#ccc'}20; color: ${categoryInfo?.color || '#666'}">
            ${categoryInfo?.icon || '📚'} ${categoryInfo?.name || word.category}
          </span>
          <span class="word-badge difficulty">${word.difficulty}</span>
        </div>
        
        <div class="word-example">
          <p class="example-lt">${word.example}</p>
          <p class="example-en">${word.exampleEN}</p>
        </div>
      </div>
      
      <div class="word-card-actions">
        <button class="btn-word-action ${isLearned ? 'active' : ''}" data-action="learned" data-word-id="${word.id}">
          <span class="action-icon">${isLearned ? '✓' : '○'}</span>
          <span class="action-label">${isLearned ? 'Learned' : 'Mark Learned'}</span>
        </button>
        <button class="btn-word-action ${isReviewLater ? 'active' : ''}" data-action="review-later" data-word-id="${word.id}">
          <span class="action-icon">${isReviewLater ? '⭐' : '☆'}</span>
          <span class="action-label">${isReviewLater ? 'Saved' : 'Review Later'}</span>
        </button>
      </div>
    `;

    return card;
  },

  // Mark word as learned
  markAsLearned(wordId) {
    if (this.learnedWords.has(wordId)) {
      this.learnedWords.delete(wordId);
    } else {
      this.learnedWords.add(wordId);
      // Also add to storage vocabulary for review system
      const word = this.allWords.find(w => w.id === wordId);
      if (word) {
        Storage.addVocabulary(word.lithuanian, 1);
      }
    }
    this.saveUserProgress();
    this.displayWords();
  },

  // Mark word for review later
  markReviewLater(wordId) {
    if (this.reviewLaterWords.has(wordId)) {
      this.reviewLaterWords.delete(wordId);
    } else {
      this.reviewLaterWords.add(wordId);
    }
    this.saveUserProgress();
    this.displayWords();
  },

  // Get random word
  getRandomWord() {
    const filteredWords = this.getFilteredWords();
    if (filteredWords.length === 0) {
      alert('No words available with current filters!');
      return;
    }
    
    const randomWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    this.displayWordDetail(randomWord);
  },

  // Display word detail modal
  displayWordDetail(word) {
    const modal = document.getElementById('vocab-detail-modal');
    if (!modal) return;

    const categoryInfo = this.categories[word.category];
    const isLearned = this.learnedWords.has(word.id);
    const isReviewLater = this.reviewLaterWords.has(word.id);

    modal.innerHTML = `
      <div class="modal-content vocab-detail-content">
        <button class="modal-close" onclick="VocabularyManager.closeDetailModal()">✕</button>
        
        <div class="vocab-detail-header">
          <h2 class="word-lithuanian-large">${word.lithuanian}</h2>
          <button class="btn-audio-large" data-text="${word.lithuanian}">
            🔊 Listen
          </button>
        </div>

        <div class="vocab-detail-body">
          <div class="detail-section">
            <h3>Translation</h3>
            <p class="word-english-large">${word.english}</p>
          </div>

          <div class="detail-section">
            <h3>Pronunciation</h3>
            <p class="pronunciation-large">${word.pronunciation}</p>
          </div>

          <div class="detail-section">
            <h3>Example</h3>
            <p class="example-lt-large">${word.example}</p>
            <p class="example-en-large">${word.exampleEN}</p>
          </div>

          <div class="detail-meta">
            <span class="meta-badge" style="background-color: ${categoryInfo?.color || '#ccc'}20; color: ${categoryInfo?.color || '#666'}">
              ${categoryInfo?.icon || '📚'} ${categoryInfo?.name || word.category}
            </span>
            <span class="meta-badge">${word.difficulty}</span>
            <span class="meta-badge">${word.partOfSpeech}</span>
            ${word.frequency ? `<span class="meta-badge">${word.frequency} frequency</span>` : ''}
          </div>
        </div>

        <div class="vocab-detail-actions">
          <button class="btn btn-primary ${isLearned ? 'active' : ''}" 
                  onclick="VocabularyManager.markAsLearned(${word.id}); VocabularyManager.closeDetailModal();">
            ${isLearned ? '✓ Learned' : 'Mark as Learned'}
          </button>
          <button class="btn btn-secondary ${isReviewLater ? 'active' : ''}" 
                  onclick="VocabularyManager.markReviewLater(${word.id}); VocabularyManager.closeDetailModal();">
            ${isReviewLater ? '⭐ Saved' : 'Review Later'}
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  // Close detail modal
  closeDetailModal() {
    const modal = document.getElementById('vocab-detail-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  // Update statistics
  updateStats() {
    const totalWords = this.allWords.length;
    const learnedCount = this.learnedWords.size;
    const reviewCount = this.reviewLaterWords.size;
    const percentage = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

    const totalEl = document.getElementById('vocab-total-words');
    if (totalEl) totalEl.textContent = totalWords;
    
    const learnedEl = document.getElementById('vocab-learned-count');
    if (learnedEl) learnedEl.textContent = learnedCount;
    
    const reviewEl = document.getElementById('vocab-review-count');
    if (reviewEl) reviewEl.textContent = reviewCount;
    
    const progressBar = document.getElementById('vocab-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    const progressText = document.getElementById('vocab-progress-text');
    if (progressText) {
      progressText.textContent = `${percentage}% mastered`;
    }
  },

  // Update result count
  updateResultCount(count) {
    const element = document.getElementById('vocab-result-count');
    if (element) {
      element.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    }
  },

  // Search words
  searchWords(query) {
    this.currentSearch = query;
    this.displayWords();
  },

  // Filter by category
  filterByCategory(category) {
    this.currentFilter = category;
    
    // Update active state
    document.querySelectorAll('.category-filter').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      }
    });

    this.displayWords();
  },

  // Play audio using Google TTS
  playAudio(text) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'lt-LT';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('Text-to-speech not supported');
    }
  },

  // Setup event listeners
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('vocab-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchWords(e.target.value);
      });
    }

    // Category filters
    document.addEventListener('click', (e) => {
      if (e.target.closest('.category-filter')) {
        const category = e.target.closest('.category-filter').dataset.category;
        this.filterByCategory(category);
      }

      // Word actions
      if (e.target.closest('.btn-word-action')) {
        const btn = e.target.closest('.btn-word-action');
        const action = btn.dataset.action;
        const wordId = parseInt(btn.dataset.wordId);
        
        if (action === 'learned') {
          this.markAsLearned(wordId);
        } else if (action === 'review-later') {
          this.markReviewLater(wordId);
        }
      }

      // Audio buttons
      if (e.target.closest('.audio-word-btn') || e.target.closest('.btn-audio-large')) {
        const btn = e.target.closest('.audio-word-btn') || e.target.closest('.btn-audio-large');
        const text = btn.dataset.text;
        this.playAudio(text);
      }

      // Word card click (show detail)
      if (e.target.closest('.vocab-word-card') && !e.target.closest('button')) {
        const card = e.target.closest('.vocab-word-card');
        const wordId = parseInt(card.querySelector('.btn-word-action').dataset.wordId);
        const word = this.allWords.find(w => w.id === wordId);
        if (word) {
          this.displayWordDetail(word);
        }
      }
    });

    // Random word button
    const randomBtn = document.getElementById('vocab-random-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => this.getRandomWord());
    }

    // Show learned words
    const learnedBtn = document.getElementById('show-learned-btn');
    if (learnedBtn) {
      learnedBtn.addEventListener('click', () => this.filterByCategory('learned'));
    }

    // Show review later words
    const reviewBtn = document.getElementById('show-review-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => this.filterByCategory('review-later'));
    }
  }
};
