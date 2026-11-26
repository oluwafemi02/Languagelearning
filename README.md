# 🇱🇹 Mokykis Lietuvių - Learn Lithuanian

A Progressive Web App for learning Lithuanian language with daily lessons, streak tracking, and gamification - inspired by Duolingo.

## Features

- ✅ Daily lessons with multiple exercise types
- 🔥 Streak tracking to maintain motivation
- 📱 Progressive Web App (works offline)
- 🔔 Daily reminders and a streak-at-risk nudge that work on iPhone (Web Push, see `push-worker/README.md`)
- 📅 Week view of the days you practised, with streak freezes shown
- ⭐ XP and progress tracking
- 🎯 Gamified learning experience
- 📚 Linguistically accurate Lithuanian content

## Installation

### GitHub Pages Deployment

1. Fork this repository
2. Go to Settings > Pages
3. Select "main" branch as source
4. Your app will be available at `https://yourusername.github.io/lithuanian-learning-pwa/`

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/lithuanian-learning-pwa.git

# Navigate to directory
cd lithuanian-learning-pwa

# Serve with any local server
python -m http.server 8000
# or
npx serve
```

Open `http://localhost:8000` and the app will load from `index.html`.

### Tests
```bash
npm test                      # app logic, run in three time zones
cd push-worker && npm test    # reminder server
```

### Reminders on iPhone

iOS web apps cannot schedule notifications themselves, so reminders come from a small free
Cloudflare Worker in `push-worker/`. Setup takes a few minutes: see
[push-worker/README.md](push-worker/README.md).

The test runner is a lightweight Node script in `tests/run-tests.js` that validates streak logic, daily XP resets, SRS updates, and lesson unlocking.

## Adding Content

Edit `vocabulary.json` to add more lessons, vocabulary, and exercises. Each lesson contains:

- `vocabulary`: Lithuanian/English pairs with pronunciation and optional audio.
- `exercises`: exercise objects with a `type` and the prompts/answers for that type.

Supported exercise types include:
- `translation`
- `listening`
- `multiple-choice`
- `typing`
- `sentence-build`
- `fill-blank`

## Lithuanian Language Features

- 7 grammatical cases
- Special characters: ą, č, ė, ę, į, š, ų, ū, ž
- Phonetic spelling system
- Gender-specific nouns and adjectives

## License

MIT License - feel free to modify and use for your learning journey!
## Progress & State

Progress is stored in `localStorage` under the key `lithuanianLearner`, with a versioned state schema. Key fields include:

- `xpTotal`, `xpToday`, `dailyGoalXP`
- `streakCount`, `lastActiveDate`, `lastGoalMetDate`
- `lessonsCompleted`
- `srsItems` (spaced repetition scheduling data)
- `settings` (sound, reminders, diacritics toggle)

State is loaded and migrated in `storage.js`.

## Deployment Notes (GitHub Pages)

1. Push to the `main` branch.
2. In GitHub → Settings → Pages, select the `main` branch.
3. The app will deploy at `https://<username>.github.io/Languagelearning/`.
