const ScenarioLearningManager = {
  data: null,
  currentScenario: null,
  currentLesson: null,
  currentExerciseIndex: 0,
  correctAnswers: 0,
  selectedAnswer: null,
  inputValue: '',
  stateKey: 'scenarioLearningStateV1',

  getState() {
    try {
      return JSON.parse(localStorage.getItem(this.stateKey)) || { completedLessons: {}, generatedByScenario: {} };
    } catch {
      return { completedLessons: {}, generatedByScenario: {} };
    }
  },

  saveState(state) {
    localStorage.setItem(this.stateKey, JSON.stringify(state));
  },

  getLearnedWords() {
    const state = Storage.getUserData();
    return new Set(
      Object.values(state.srsItems || {})
        .filter(item => item.kind === 'word')
        .map(item => this.normalize(item.id))
    );
  },

  lessonUsesLearnedWords(lesson) {
    const learned = this.getLearnedWords();
    const vocab = lesson.vocabulary || [];
    if (!vocab.length) return true;
    return vocab.some(word => learned.has(this.normalize(word.lithuanian)));
  },

  async init() {
    const container = document.getElementById('scenario-content');
    if (!container) return;
    if (!this.data) await this.loadData();
    this.renderScenarioList();
  },

  async loadData() {
    try {
      const response = await fetch('vocabulary_v2.json');
      this.data = await response.json();
    } catch (error) {
      console.error('Failed to load v2 scenario curriculum:', error);
      this.data = { scenarios: [] };
    }
  },

  getScenarioLessons(scenario) {
    const base = scenario.lessons || [];
    const state = this.getState();
    return [...base, ...(state.generatedByScenario[scenario.id] || [])];
  },

  renderScenarioList() {
    const container = document.getElementById('scenario-content');
    const scenarios = this.data?.scenarios || [];
    if (!scenarios.length) {
      container.innerHTML = '<div class="progress-overview"><h3>Scenario learning coming soon</h3><p>Add data to <code>vocabulary_v2.json</code>.</p></div>';
      return;
    }

    container.innerHTML = '<div class="progress-overview"><h2>🗣️ Scenario-Based Learning</h2><p>Context-first production drills for real Lithuanian usage.</p></div><div class="lesson-path" id="scenario-list"></div>';
    const list = document.getElementById('scenario-list');

    scenarios.forEach((scenario) => {
      const lessonCount = this.getScenarioLessons(scenario).length;
      const card = document.createElement('div');
      card.className = 'lesson-card';
      card.innerHTML = `<div class="lesson-icon">🎭</div><div class="lesson-info"><h3>${scenario.title || scenario.id}</h3><p>${scenario.goal || 'Learn through real-world context'}</p><div class="lesson-meta"><span class="xp-badge">${lessonCount} lessons</span><span class="difficulty-badge">scenario</span></div></div>`;
      card.onclick = () => this.openScenario(scenario.id);
      list.appendChild(card);
    });
  },

  openScenario(scenarioId) {
    const scenario = (this.data?.scenarios || []).find(s => s.id === scenarioId);
    if (!scenario) return;
    this.currentScenario = scenario;

    const lessons = this.getScenarioLessons(scenario);
    const state = this.getState();
    const container = document.getElementById('scenario-content');
    container.innerHTML = '<div class="progress-overview"><button class="btn btn-secondary" id="scenario-back-btn" style="margin-bottom:12px;">← Back</button><h2>' + scenario.title + '</h2><p>' + (scenario.goal || '') + '</p></div><div class="lesson-path" id="scenario-lessons"></div>';
    document.getElementById('scenario-back-btn').onclick = () => this.renderScenarioList();

    const lessonsEl = document.getElementById('scenario-lessons');
    lessons.forEach((lesson) => {
      const done = !!state.completedLessons[lesson.id];
      const buildsOnLearned = this.lessonUsesLearnedWords(lesson);
      const lessonCard = document.createElement('div');
      lessonCard.className = `lesson-card ${done ? 'completed' : ''}`;
      lessonCard.innerHTML = `<div class="lesson-icon">${done ? '✓' : '🧩'}</div><div class="lesson-info"><h3>${lesson.id} · ${lesson.title}</h3><p>${lesson.description || ''} ${buildsOnLearned ? '✅ Uses your learned words' : '🆕 New words ahead'}</p><div class="lesson-meta"><span class="xp-badge">+${lesson.xp || 10} XP</span><span class="difficulty-badge">${lesson.focusCase || 'grammar'}</span></div></div>`;
      lessonCard.onclick = () => this.startLesson(lesson.id);
      lessonsEl.appendChild(lessonCard);
    });
  },

  startLesson(lessonId) {
    const lessons = this.getScenarioLessons(this.currentScenario);
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    this.currentLesson = lesson;
    this.currentExerciseIndex = 0;
    this.correctAnswers = 0;
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('scenario-lesson-screen').classList.add('active');
    this.renderExercise();
  },

  renderExercise() {
    const exercise = this.currentLesson.exercises[this.currentExerciseIndex];
    const question = document.getElementById('scenario-question-container');
    const answers = document.getElementById('scenario-answer-options');
    const checkBtn = document.getElementById('scenario-check-answer-btn');
    this.selectedAnswer = null; this.inputValue = ''; checkBtn.disabled = true;
    document.getElementById('scenario-lesson-progress').style.width = `${((this.currentExerciseIndex + 1) / this.currentLesson.exercises.length) * 100}%`;

    const prompt = exercise.instruction || exercise.question || 'Type the full Lithuanian sentence';
    question.innerHTML = `<div class="question"><h3>${prompt}</h3></div>`;
    answers.innerHTML = '';

    const typedTypes = ['case-transform', 'typing', 'scenario-dialogue'];
    if (typedTypes.includes(exercise.type)) {
      const template = exercise.template || (exercise.type === 'scenario-dialogue' ? this.getDialogueTemplate(exercise) : '___');
      if (exercise.type === 'scenario-dialogue') {
        const dialogueHtml = (exercise.dialogue || []).map(turn => turn.speaker === 'You'
          ? `<p><strong>You:</strong> ${turn.prompt || 'Respond'} <em>${turn.template || ''}</em></p>`
          : `<p><strong>${turn.speaker}:</strong> ${turn.lt || ''} <span style="color:var(--text-light)">(${turn.en || ''})</span></p>`).join('');
        question.querySelector('.question').innerHTML += `<div style="text-align:left">${dialogueHtml}</div>`;
      }
      question.querySelector('.question').innerHTML += `<p class="hint">Type the full sentence. Focus target: <strong>${template}</strong></p>`;
      answers.innerHTML = `<input id="scenario-typing" class="typing-input" placeholder="Type full Lithuanian sentence..." />`;
      document.getElementById('scenario-typing').addEventListener('input', (e) => {
        this.inputValue = e.target.value.trim();
        checkBtn.disabled = !this.inputValue;
      });
      return;
    }

    if (exercise.options) {
      [...exercise.options].sort(() => Math.random() - 0.5).forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-option';
        btn.textContent = option;
        btn.onclick = () => { document.querySelectorAll('#scenario-answer-options .answer-option').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); this.selectedAnswer = option; checkBtn.disabled = false; };
        answers.appendChild(btn);
      });
    }
  },

  getDialogueTemplate(exercise) {
    const youTurn = (exercise.dialogue || []).find(d => d.speaker === 'You');
    return youTurn?.template || '___';
  },

  normalize(text) { return (text || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); },

  checkAnswer() {
    const exercise = this.currentLesson.exercises[this.currentExerciseIndex];
    const expectedRaw = exercise.answer || exercise.expected || exercise.answerPart || '';
    const given = this.normalize(this.selectedAnswer || this.inputValue);
    const expected = this.normalize(expectedRaw);
    const isCorrect = expected === given;
    if (isCorrect) this.correctAnswers += 1;

    const panel = document.getElementById('scenario-feedback-panel');
    panel.classList.remove('hidden');
    document.getElementById('scenario-feedback-title').textContent = isCorrect ? 'Correct! ✅' : 'Try again ❌';
    document.getElementById('scenario-feedback-message').textContent = isCorrect ? (exercise.caseNote || 'Great context production.') : `Expected full sentence: ${expectedRaw}. ${exercise.caseNote || ''}`;
  },

  continueLesson() {
    document.getElementById('scenario-feedback-panel').classList.add('hidden');
    this.currentExerciseIndex += 1;
    if (this.currentExerciseIndex >= this.currentLesson.exercises.length) return this.finishLesson();
    this.renderExercise();
  },

  async generateLessonWithAI() {
    const scenario = this.currentScenario;
    const lesson = this.currentLesson;
    const targetCase = lesson.focusCase || 'locative';
    const learnedWords = Array.from(this.getLearnedWords());

    if (!scenario?.aiGeneration?.enabled) return null;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'scenario_lesson_generation',
          constraints: {
            language: 'lt-LT',
            onlyUseLearnedVocabulary: true,
            learnedVocabulary: learnedWords,
            targetCase,
            lessonShape: {
              exercises: ['case-transform', 'scenario-dialogue'],
              requireFullSentenceAnswers: true,
              count: 2
            }
          },
          context: {
            scenarioId: scenario.id,
            scenarioTitle: scenario.title,
            previousLessonId: lesson.id,
            previousVocabulary: (lesson.vocabulary || []).map(v => ({
              lithuanian: v.lithuanian,
              productionForms: v.productionForms || {}
            }))
          }
        })
      });

      if (!response.ok) return null;
      const payload = await response.json();
      const candidate = payload.lesson || payload.generatedLesson;
      if (!candidate || !Array.isArray(candidate.exercises) || candidate.exercises.length === 0) return null;

      const normalizedLearned = new Set(learnedWords);
      const badExercise = candidate.exercises.some(ex => {
        const ans = this.normalize(ex.answer || ex.expected || '');
        if (!ans) return true;
        const words = ans.split(/\s+/).map(w => w.replace(/[^\p{L}-]/gu, '')).filter(Boolean);
        return words.some(w => w.length > 2 && !normalizedLearned.has(this.normalize(w)));
      });
      if (badExercise) return null;

      candidate.title = candidate.title || 'AI Drill';
      candidate.description = candidate.description || 'AI-generated drill using your learned vocabulary.';
      candidate.focusCase = candidate.focusCase || targetCase;
      candidate.xp = candidate.xp || 10;
      candidate.vocabulary = lesson.vocabulary || [];
      return candidate;
    } catch (error) {
      console.warn('AI lesson generation failed; fallback to deterministic template.', error);
      return null;
    }
  },

  async maybeGenerateNextLesson() {
    const baseVocab = this.currentLesson.vocabulary || [];
    if (!baseVocab.length) return;
    const forms = baseVocab[0].productionForms || {};
    const nominative = forms.nominative;
    const locative = forms.locative;
    if (!nominative || !locative) return;

    const state = this.getState();
    const generated = state.generatedByScenario[this.currentScenario.id] || [];
    const nextIndex = generated.length + 1;
    const newLessonId = `${this.currentScenario.id}_drill_${String(nextIndex).padStart(2, '0')}`;

    let lesson = await this.generateLessonWithAI();
    if (!lesson) {
      lesson = {
        id: newLessonId,
        title: `Auto Drill ${nextIndex}`,
        description: 'Generated production drill from completed lesson.',
        xp: 10,
        focusCase: 'locative',
        vocabulary: this.currentLesson.vocabulary,
        exercises: [
          { type: 'case-transform', instruction: `Type full sentence: Mes esame ___`, template: 'Mes esame ___', answer: `Mes esame ${locative}`, caseNote: `Use locative of ${nominative}.` },
          { type: 'scenario-dialogue', instruction: 'Respond with the full sentence.', dialogue: [{ speaker: 'Jonas', lt: 'Kur jūs esate?', en: 'Where are you?' }, { speaker: 'You', prompt: 'Say we are in the shop', template: 'Mes esame ___.' }], answer: `Mes esame ${locative}`, caseNote: 'Location answer takes locative.' }
        ]
      };
    }

    lesson.id = lesson.id || newLessonId;
    state.generatedByScenario[this.currentScenario.id] = [...generated, lesson];
    this.saveState(state);
  },

  async finishLesson() {
    const accuracy = Math.round((this.correctAnswers / this.currentLesson.exercises.length) * 100);
    const passed = accuracy >= 70;
    const state = this.getState();
    state.completedLessons[this.currentLesson.id] = { accuracy, at: new Date().toISOString() };
    this.saveState(state);
    if (passed) {
      Storage.awardXP(this.currentLesson.xp || 10);
      await this.maybeGenerateNextLesson();
    }
    document.getElementById('scenario-lesson-screen').classList.remove('active');
    document.getElementById('scenario-screen').classList.add('active');
    alert(`${this.currentLesson.id} complete: ${accuracy}% ${passed ? '✅ New drill unlocked' : '💪 Keep practicing'}`);
    this.openScenario(this.currentScenario.id);
  },

  exitLesson() {
    if (!confirm('Exit scenario lesson? Progress in this lesson will reset.')) return;
    document.getElementById('scenario-lesson-screen').classList.remove('active');
    document.getElementById('scenario-screen').classList.add('active');
  }
};
