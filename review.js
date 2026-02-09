const ReviewManager = {
  getDueItems() {
    return Storage.getDueSrsItems();
  },

  getDueWordsCount() {
    return this.getDueItems().filter(item => item.kind === 'word').length;
  },

  async generateReviewExercises(limit = 10) {
    const dueItems = this.getDueItems();
    const lessons = await LessonManager.loadLessons();
    const exercises = [];
    const reviewItems = dueItems.slice(0, limit);

    reviewItems.forEach(({ id, kind }) => {
      let wordData = null;
      if (kind === 'word') {
        for (const lesson of lessons) {
          wordData = lesson.vocabulary.find(v => v.lithuanian === id);
          if (wordData) break;
        }
      }

      if (wordData) {
        exercises.push({
          type: 'translation',
          question: `What does '${wordData.lithuanian}' mean?`,
          answer: wordData.english,
          options: this.generateDistractors(wordData.english, wordData.type, lessons),
          reviewItemId: id
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
  
  updateReviewItem(itemId, correct) {
    Storage.updateSrsItem(itemId, correct);
    if (window.QuestManager) {
      window.QuestManager.recordReviewWord();
    }
  }
};
