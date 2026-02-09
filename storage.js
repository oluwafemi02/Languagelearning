// ============ STORAGE ============
        const Storage = {
            getUserData() {
                const data = localStorage.getItem('lithuanianLearner');
                return data ? JSON.parse(data) : this.getDefaultUserData();
            },

            getDefaultUserData() {
                return {
                    streak: 0,
                    lastStudyDate: null,
                    totalXP: 0,
                    dailyXP: 0,
                    lessonsCompleted: [],
                    currentLesson: 1,
                    vocabulary: {},
                    achievements: [],
                    onboardingCompleted: false,
                    dailyQuests: {
                        date: null,
                        quests: [],
                        bonusClaimed: false
                    },
                    // Sentence learning tracking
                    sentences: {
                        learned: [],           // Array of sentence IDs learned
                        lastLearningDate: null, // Last date sentences were learned
                        dailyCount: 0,         // Sentences learned today
                        weeklyReviewDate: null, // Last weekly review date
                        reviewScores: []       // Array of review session scores
                    },
                    settings: {
                        dailyGoal: 50,
                        soundEnabled: true,
                        notificationsEnabled: true,
                        reminderTime: '19:00'
                    }
                };
            },

            saveUserData(data) {
                localStorage.setItem('lithuanianLearner', JSON.stringify(data));
            },

            updateField(field, value) {
                const data = this.getUserData();
                data[field] = value;
                this.saveUserData(data);
            },

            addXP(amount) {
                const data = this.getUserData();
                data.totalXP += amount;
                this.saveUserData(data);
                if (window.QuestManager && !window.QuestManager.isRewarding) {
                    window.QuestManager.updateProgress('xp', amount);
                }
                return data.totalXP;
            },

            completeLesson(lessonId, score) {
                const data = this.getUserData();
                if (!data.lessonsCompleted.find(l => l.id === lessonId)) {
                    data.lessonsCompleted.push({
                        id: lessonId,
                        completedAt: new Date().toISOString(),
                        score: score
                    });
                }
                this.saveUserData(data);
                if (window.QuestManager) {
                    window.QuestManager.updateProgress('lessons', 1);
                }
            },

            addVocabulary(word, strength = 1) {
                const data = this.getUserData();
                if (!data.vocabulary[word]) {
                    data.vocabulary[word] = {
                        strength: strength,
                        lastReviewed: new Date().toISOString(),
                        timesReviewed: 1
                    };
                } else {
                    data.vocabulary[word].timesReviewed += 1;
                    data.vocabulary[word].lastReviewed = new Date().toISOString();
                }
                this.saveUserData(data);
            },

            getDailyXP() {
                const userData = this.getUserData();
                const today = new Date().toDateString();
                const lastDate = userData.lastStudyDate ? new Date(userData.lastStudyDate).toDateString() : null;
                
                if (lastDate === today) {
                    return userData.dailyXP || 0;
                } else {
                    // New day, reset
                    userData.dailyXP = 0;
                    this.saveUserData(userData);
                    return 0;
                }
            },

            addDailyXP(amount) {
                const userData = this.getUserData();
                const today = new Date().toDateString();
                const lastDate = userData.lastStudyDate ? new Date(userData.lastStudyDate).toDateString() : null;
                
                if (lastDate !== today) {
                    userData.dailyXP = 0;
                }
                
                userData.dailyXP = (userData.dailyXP || 0) + amount;
                this.saveUserData(userData);
                return userData.dailyXP;
            }
        };
