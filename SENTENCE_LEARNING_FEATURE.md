# 📚 Daily Sentence Learning Feature

## Overview
A new tab has been added to help you learn 10 Lithuanian sentences per day, with weekly review sessions to reinforce your learning.

## Features

### 📖 Daily Learning
- **Learn 10 sentences per day** - A proven method for language acquisition
- Each sentence includes:
  - Lithuanian text
  - English translation
  - Pronunciation guide
  - Category (Greetings, Food, Travel, etc.)
  - Difficulty level (beginner, intermediate, advanced)
  - Audio playback using text-to-speech

### 📝 Weekly Review System
- **Automatic weekly reviews** trigger after learning 10+ sentences
- Review format:
  - Multiple choice questions
  - Translation exercises (both directions)
  - 20 sentences per review session
  - Tracks accuracy and awards XP

### 🎯 Progress Tracking
- **Daily progress**: Shows how many sentences you've learned today (0/10)
- **Total mastery**: Tracks all sentences learned
- **Week-by-week progress**: Visual timeline showing your learning journey
- **Review scores**: Historical data of your review sessions

### ⭐ XP & Rewards
- **5 XP per sentence learned** during daily practice
- **3 XP per correct answer** during reviews
- Contributes to your daily XP goal
- Updates your streak

## How to Use

### Starting Daily Learning
1. Click on the **📚 Sentences** tab in the bottom navigation
2. Click **"Start Learning Today"** button
3. Read each sentence, listen to pronunciation
4. Click **"Got it! Next Sentence →"** to move forward
5. Complete up to 10 sentences per day

### Taking Reviews
- **Weekly Review**: Appears automatically when you've learned 10+ sentences and it's been 7 days
- **Quick Review**: Available anytime to practice previously learned sentences
- Answer multiple-choice questions
- Get instant feedback on your answers

## Data Structure

The feature includes **70 Lithuanian sentences** organized into:
- **Week 1-7**: 10 sentences per week
- Progressive difficulty (beginner → intermediate → advanced)
- 14 categories: Greetings, Questions, Food, Travel, Work, etc.

## Files Added

1. **sentences-data.json** - Contains all 70 Lithuanian sentences with translations
2. **sentences.js** - Main logic for sentence learning and reviews
3. **sentences.css** - Styling for all sentence learning components
4. Updated **index.html** - Added new screens and navigation
5. Updated **app.js** - Integrated sentence manager
6. Updated **storage.js** - Added sentence progress tracking

## Technical Features

- **Local storage** persistence - Progress is saved automatically
- **Daily reset** - Sentence counter resets at midnight
- **Smart review timing** - Tracks last review date
- **Responsive design** - Works on mobile and desktop
- **Web Speech API** - Audio pronunciation (if supported by browser)

## Tips for Best Results

1. **Be consistent**: Learn 10 sentences every day
2. **Use audio**: Listen to pronunciation multiple times
3. **Review regularly**: Don't skip weekly reviews
4. **Practice speaking**: Say sentences out loud
5. **Apply in context**: Try to use sentences in real conversations

## Future Enhancements (Potential)

- Spaced repetition algorithm for individual sentences
- User-created sentence collections
- Conversation practice mode
- Sentence difficulty adjustment based on performance
- Export/import sentence progress

---

**Puikiai! (Excellent!)** - Start your daily sentence learning journey today! 🚀
