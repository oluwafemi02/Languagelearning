const ReviewManager = {
  // Get words that are due for review
  getDueWords() {
    const userData = Storage.getUserData();
    const dueWords = [];
    const now = Date.now();
    
    Object.entries(userData.vocabulary).forEach(([word, data]) => {
      const lastReview = new Date(data.lastReviewed).getTime();
      const daysSince = (now - lastReview) / (1000 * 60 * 60 * 24);
      const nextInterval = this.getNextInterval(data.timesReviewed);
      
      if (daysSince >= nextInterval) {
        dueWords.push({
          word: word,
          data: data
        });
      }
    });
    
    return dueWords;
  },
  
  // Simple spaced repetition intervals (1, 3, 7, 14, 30, 60, 120 days)
  getNextInterval(reviewCount) {
    const intervals = [1, 3, 7, 14, 30, 60, 120];
    return intervals[Math.min(reviewCount - 1, intervals.length - 1)] || 1;
  },
  
  // Get review exercises from due words
  async generateReviewExercises(limit = 10) {
    const dueWords = this.getDueWords();
    const lessons = await LessonManager.loadLessons();
    const exercises = [];
    
    // Limit to prevent overwhelming users
    const reviewWords = dueWords.slice(0, limit);
    
    reviewWords.forEach(({word}) => {
      // Find the word in lessons to get full data
      let wordData = null;
      for (const lesson of lessons) {
        wordData = lesson.vocabulary.find(v => v.lithuanian === word);
        if (wordData) break;
      }
      
      if (wordData) {
        // Create a translation exercise
        exercises.push({
          type: 'translation',
          question: `What does '${wordData.lithuanian}' mean?`,
          answer: wordData.english,
          options: this.generateDistractors(wordData.english, wordData.type, lessons),
          reviewWord: word
        });
      }
    });
    
    return exercises;
  },
  
  // Generate plausible wrong answers
  generateDistractors(correctAnswer, wordType, lessons) {
    // Collect similar words from lessons
    const similarWords = [];
    
    lessons.forEach(lesson => {
      lesson.vocabulary.forEach(vocab => {
        if (vocab.type === wordType && vocab.english !== correctAnswer) {
          similarWords.push(vocab.english);
        }
      });
    });
    
    // If we have enough similar words, use them
    if (similarWords.length >= 3) {
      const shuffled = similarWords.sort(() => Math.random() - 0.5).slice(0, 3);
      return [correctAnswer, ...shuffled].sort(() => Math.random() - 0.5);
    }
    
    // Fallback distractor sets
    const distractorSets = {
      greeting: ['goodbye', 'please', 'thank you', 'sorry'],
      phrase: ['hello', 'goodbye', 'yes', 'no'],
      number: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
      noun: ['house', 'car', 'book', 'table', 'chair', 'friend', 'dog', 'cat'],
      verb: ['to eat', 'to drink', 'to go', 'to see', 'to speak', 'to live'],
      adjective: ['red', 'blue', 'green', 'yellow', 'white', 'black', 'big', 'small'],
      word: ['yes', 'no', 'good', 'bad', 'big', 'small']
    };
    
    const pool = distractorSets[wordType] || distractorSets.word;
    const distractors = pool.filter(d => d !== correctAnswer).slice(0, 3);
    
    return [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
  },
  
  // Update word strength after review
  updateWordStrength(word, correct) {
    const userData = Storage.getUserData();
    
    if (userData.vocabulary[word]) {
      if (correct) {
        userData.vocabulary[word].timesReviewed += 1;
        userData.vocabulary[word].strength = Math.min(
          (userData.vocabulary[word].strength || 1) + 0.2, 
          5
        );
      } else {
        userData.vocabulary[word].strength = Math.max(
          (userData.vocabulary[word].strength || 1) - 0.5, 
          0
        );
      }
      
      userData.vocabulary[word].lastReviewed = new Date().toISOString();
      Storage.saveUserData(userData);
      if (window.QuestManager) {
        window.QuestManager.recordReviewWord();
      }
    }
  },
  
  // Get count of due words
  getDueWordsCount() {
    return this.getDueWords().length;
  }
};
