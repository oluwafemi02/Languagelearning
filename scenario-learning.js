const ScenarioLearningManager = {
  data: null,
  currentScenario: null,
  currentLesson: null,
  currentExerciseIndex: 0,
  correctAnswers: 0,
  selectedAnswer: null,
  inputValue: '',

  async init() {
    const container = document.getElementById('scenario-content');
    if (!container) return;

    if (!this.data) {
      await this.loadData();
    }

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

  renderScenarioList() {
    const container = document.getElementById('scenario-content');
    if (!container) return;

    const scenarios = this.data?.scenarios || [];
    if (scenarios.length === 0) {
      container.innerHTML = '<div class="progress-overview"><h3>Scenario learning coming soon</h3><p>Add data to <code>vocabulary_v2.json</code>.</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="progress-overview">
        <h2>🗣️ Scenario-Based Learning</h2>
        <p>Practice grammar through context and production, not isolated recognition.</p>
      </div>
      <div class="lesson-path" id="scenario-list"></div>
    `;

    const list = document.getElementById('scenario-list');
    scenarios.forEach((scenario) => {
      const card = document.createElement('div');
      card.className = 'lesson-card';
      card.innerHTML = `
        <div class="lesson-icon">🎭</div>
        <div class="lesson-info">
          <h3>${scenario.title || scenario.id}</h3>
          <p>${scenario.goal || 'Learn through real-world context'}</p>
          <div class="lesson-meta">
            <span class="xp-badge">${(scenario.lessons || []).length} lessons</span>
            <span class="difficulty-badge">scenario</span>
          </div>
        </div>
      `;
      card.onclick = () => this.openScenario(scenario.id);
      list.appendChild(card);
    });
  },

  openScenario(scenarioId) {
    const scenario = (this.data?.scenarios || []).find(s => s.id === scenarioId);
    if (!scenario) return;

    this.currentScenario = scenario;
    const container = document.getElementById('scenario-content');
    container.innerHTML = `
      <div class="progress-overview">
        <button class="btn btn-secondary" id="scenario-back-btn" style="margin-bottom: 12px;">← Back</button>
        <h2>${scenario.title}</h2>
        <p>${scenario.goal || ''}</p>
      </div>
      <div class="lesson-path" id="scenario-lessons"></div>
    `;

    document.getElementById('scenario-back-btn').onclick = () => this.renderScenarioList();

    const lessonsEl = document.getElementById('scenario-lessons');
    (scenario.lessons || []).forEach((lesson) => {
      const lessonCard = document.createElement('div');
      lessonCard.className = 'lesson-card';
      lessonCard.innerHTML = `
        <div class="lesson-icon">🧩</div>
        <div class="lesson-info">
          <h3>${lesson.id} · ${lesson.title}</h3>
          <p>${lesson.description || ''}</p>
          <div class="lesson-meta">
            <span class="xp-badge">+${lesson.xp || 10} XP</span>
            <span class="difficulty-badge">${lesson.focusCase || 'grammar'}</span>
          </div>
        </div>
      `;
      lessonCard.onclick = () => this.startLesson(lesson.id);
      lessonsEl.appendChild(lessonCard);
    });
  },

  startLesson(lessonId) {
    const lesson = (this.currentScenario?.lessons || []).find(l => l.id === lessonId);
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
    this.selectedAnswer = null;
    this.inputValue = '';
    checkBtn.disabled = true;

    const progress = ((this.currentExerciseIndex + 1) / this.currentLesson.exercises.length) * 100;
    document.getElementById('scenario-lesson-progress').style.width = `${progress}%`;

    question.innerHTML = `<div class="question"><h3>${exercise.instruction || exercise.question || 'Respond in Lithuanian'}</h3></div>`;
    answers.innerHTML = '';

    if (exercise.type === 'case-transform' || exercise.type === 'typing') {
      answers.innerHTML = `<input id="scenario-typing" class="typing-input" placeholder="Type Lithuanian answer..." />`;
      const input = document.getElementById('scenario-typing');
      input.addEventListener('input', (e) => {
        this.inputValue = e.target.value.trim();
        checkBtn.disabled = !this.inputValue;
      });
      if (exercise.baseForm || exercise.template) {
        const helper = document.createElement('p');
        helper.className = 'hint';
        helper.textContent = `${exercise.template || ''} ${exercise.baseForm ? `(base: ${exercise.baseForm})` : ''}`.trim();
        question.querySelector('.question').appendChild(helper);
      }
    } else if (exercise.type === 'scenario-dialogue') {
      const dialogueHtml = (exercise.dialogue || []).map(turn => {
        if (turn.speaker === 'You') {
          return `<p><strong>You:</strong> ${turn.prompt || 'Respond'} ${turn.template ? `<em>(${turn.template})</em>` : ''}</p>`;
        }
        return `<p><strong>${turn.speaker}:</strong> ${turn.lt || ''} <span style="color:var(--text-light)">(${turn.en || ''})</span></p>`;
      }).join('');
      question.querySelector('.question').innerHTML += `<div style="text-align:left">${dialogueHtml}</div>`;
      answers.innerHTML = `<input id="scenario-typing" class="typing-input" placeholder="Your turn in Lithuanian..." />`;
      const input = document.getElementById('scenario-typing');
      input.addEventListener('input', (e) => {
        this.inputValue = e.target.value.trim();
        checkBtn.disabled = !this.inputValue;
      });
    } else if (exercise.options) {
      const opts = [...exercise.options].sort(() => Math.random() - 0.5);
      opts.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-option';
        btn.textContent = option;
        btn.onclick = () => {
          document.querySelectorAll('#scenario-answer-options .answer-option').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.selectedAnswer = option;
          checkBtn.disabled = false;
        };
        answers.appendChild(btn);
      });
    }
  },

  normalize(text) {
    return (text || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  checkAnswer() {
    const exercise = this.currentLesson.exercises[this.currentExerciseIndex];
    const answer = this.normalize(exercise.answer || exercise.expected || '');
    const given = this.normalize(this.selectedAnswer || this.inputValue);
    const isCorrect = answer === given;
    if (isCorrect) this.correctAnswers += 1;

    const panel = document.getElementById('scenario-feedback-panel');
    panel.classList.remove('hidden');
    document.getElementById('scenario-feedback-title').textContent = isCorrect ? 'Correct! ✅' : 'Not quite ❌';
    document.getElementById('scenario-feedback-message').textContent = isCorrect
      ? (exercise.caseNote || 'Great production in context.')
      : `Expected: ${exercise.answer || exercise.expected}. ${exercise.caseNote || ''}`;
  },

  continueLesson() {
    document.getElementById('scenario-feedback-panel').classList.add('hidden');
    this.currentExerciseIndex += 1;
    if (this.currentExerciseIndex >= this.currentLesson.exercises.length) {
      this.finishLesson();
      return;
    }
    this.renderExercise();
  },

  finishLesson() {
    const accuracy = Math.round((this.correctAnswers / this.currentLesson.exercises.length) * 100);
    const passed = accuracy >= 70;
    if (passed) {
      Storage.awardXP(this.currentLesson.xp || 10);
    }
    document.getElementById('scenario-lesson-screen').classList.remove('active');
    document.getElementById('scenario-screen').classList.add('active');
    alert(`${this.currentLesson.id} complete: ${accuracy}% ${passed ? '✅' : '💪 Keep practicing'}`);
    this.openScenario(this.currentScenario.id);
  },

  exitLesson() {
    if (!confirm('Exit scenario lesson? Progress in this lesson will reset.')) return;
    document.getElementById('scenario-lesson-screen').classList.remove('active');
    document.getElementById('scenario-screen').classList.add('active');
  }
};
