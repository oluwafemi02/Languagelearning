const AchievementManager = {
  achievements: [
    {
      id: 'first-lesson',
      name: 'Pirmasis Žingsnis',
      nameEN: 'First Step',
      description: 'Complete your first lesson',
      descriptionLT: 'Užbaik pirmąją pamoką',
      icon: '🎉',
      xpBonus: 10,
      condition: (userData) => userData.lessonsCompleted.length >= 1
    },
    {
      id: 'three-lessons',
      name: 'Smalsuolis',
      nameEN: 'Curious Learner',
      description: 'Complete 3 lessons',
      descriptionLT: 'Užbaik 3 pamokas',
      icon: '📚',
      xpBonus: 25,
      condition: (userData) => userData.lessonsCompleted.length >= 3
    },
    {
      id: 'five-lessons',
      name: 'Darbštuolis',
      nameEN: 'Hard Worker',
      description: 'Complete 5 lessons',
      descriptionLT: 'Užbaik 5 pamokas',
      icon: '💪',
      xpBonus: 50,
      condition: (userData) => userData.lessonsCompleted.length >= 5
    },
    {
      id: 'week-streak',
      name: 'Savaitės Serija',
      nameEN: 'Week Streak',
      description: 'Maintain a 7-day streak',
      descriptionLT: 'Išlaikyk 7 dienų seriją',
      icon: '🔥',
      xpBonus: 50,
      condition: (userData) => userData.streak >= 7
    },
    {
      id: 'two-week-streak',
      name: 'Dviejų Savaičių Čempionas',
      nameEN: 'Two Week Champion',
      description: 'Maintain a 14-day streak',
      descriptionLT: 'Išlaikyk 14 dienų seriją',
      icon: '🏅',
      xpBonus: 100,
      condition: (userData) => userData.streak >= 14
    },
    {
      id: 'thirty-words',
      name: 'Žodžių Rinkėjas',
      nameEN: 'Word Collector',
      description: 'Learn 30 words',
      descriptionLT: 'Išmok 30 žodžių',
      icon: '📖',
      xpBonus: 30,
      condition: (userData) => Object.keys(userData.vocabulary).length >= 30
    },
    {
      id: 'fifty-words',
      name: 'Žodžių Žinovas',
      nameEN: 'Word Expert',
      description: 'Learn 50 words',
      descriptionLT: 'Išmok 50 žodžių',
      icon: '📚',
      xpBonus: 50,
      condition: (userData) => Object.keys(userData.vocabulary).length >= 50
    },
    {
      id: 'hundred-xp',
      name: 'XP Meistras',
      nameEN: 'XP Master',
      description: 'Earn 100 XP',
      descriptionLT: 'Uždirbk 100 XP',
      icon: '⭐',
      xpBonus: 20,
      condition: (userData) => userData.totalXP >= 100
    },
    {
      id: 'two-fifty-xp',
      name: 'XP Profesionalas',
      nameEN: 'XP Professional',
      description: 'Earn 250 XP',
      descriptionLT: 'Uždirbk 250 XP',
      icon: '🌟',
      xpBonus: 50,
      condition: (userData) => userData.totalXP >= 250
    },
    {
      id: 'month-streak',
      name: 'Mėnesio Čempionas',
      nameEN: 'Month Champion',
      description: 'Maintain a 30-day streak',
      descriptionLT: 'Išlaikyk 30 dienų seriją',
      icon: '🏆',
      xpBonus: 100,
      condition: (userData) => userData.streak >= 30
    },
    {
      id: 'perfect-lesson',
      name: 'Tobulas',
      nameEN: 'Perfect',
      description: 'Complete a lesson with 100% accuracy',
      descriptionLT: 'Užbaik pamoką su 100% tikslumu',
      icon: '💯',
      xpBonus: 25,
      condition: (userData) => {
        return userData.lessonsCompleted.some(lesson => lesson.score === 100);
      }
    }
  ],
  
  checkAchievements() {
    const userData = Storage.getUserData();
    const unlockedAchievements = userData.achievements || [];
    const newAchievements = [];
    
    this.achievements.forEach(achievement => {
      // Check if not already unlocked
      if (!unlockedAchievements.includes(achievement.id)) {
        if (achievement.condition(userData)) {
          newAchievements.push(achievement);
          unlockedAchievements.push(achievement.id);
        }
      }
    });
    
    if (newAchievements.length > 0) {
      userData.achievements = unlockedAchievements;
      Storage.saveUserData(userData);
      
      // Show achievement popup for each new one
      newAchievements.forEach(achievement => {
        this.showAchievementPopup(achievement);
        Storage.addXP(achievement.xpBonus);
      });
    }
    
    return newAchievements;
  },
  
  showAchievementPopup(achievement) {
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <h3>Pasiekimas Atrakinta!</h3>
        <h4>${achievement.name}</h4>
        <p>${achievement.description}</p>
        <p class="achievement-bonus">+${achievement.xpBonus} XP</p>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Animate in
    setTimeout(() => popup.classList.add('show'), 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }, 5000);
    
    // Play celebration sound if available (optional)
    this.playCelebrationSound();
  },
  
  playCelebrationSound() {
    // Optional: add achievement sound
    try {
      const audio = new Audio('audio/achievement.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      // Audio not available, silent fail
    }
  },
  
  getUnlockedAchievements() {
    const userData = Storage.getUserData();
    return (userData.achievements || []).map(id => 
      this.achievements.find(a => a.id === id)
    ).filter(Boolean);
  },
  
  getLockedAchievements() {
    const userData = Storage.getUserData();
    const unlocked = userData.achievements || [];
    return this.achievements.filter(a => !unlocked.includes(a.id));
  }
};
