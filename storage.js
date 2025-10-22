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
                    lessonsCompleted: [],
                    currentLesson: 1,
                    vocabulary: {},
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
            }
        };
