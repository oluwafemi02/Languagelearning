// The 12-week Journey: a teacher's plan to get from zero to simple, real conversations in Lithuanian.
//
// How it is built:
// - Speaking first. Every week ends with something you say out loud, and from week 4 to a person.
// - Three phases: Foundations (weeks 1-4), Everyday life (5-8), Real conversations (9-12).
// - A small, steady daily routine beats long weekend sessions: about 25 minutes a day.
// - Grammar comes in small pieces, only when a conversation needs it.
// - Tasks link to the app's lessons, phrases, practice and review, so the plan and the app work together.

const JOURNEY_PHASES = [
  { id: 1, name: 'Foundations', weeks: [1, 4], aim: 'Sounds, survival phrases, and talking about yourself.' },
  { id: 2, name: 'Everyday life', weeks: [5, 8], aim: 'Cafés, shops, directions, your day, and the past.' },
  { id: 3, name: 'Real conversations', weeks: [9, 12], aim: 'Plans, problems, opinions, and keeping a conversation going.' },
];

const JOURNEY_ROUTINE = [
  { minutes: 5, text: 'Review the words that are due' },
  { minutes: 10, text: 'Learn something new: a lesson or today\'s phrases' },
  { minutes: 5, text: 'Listen and repeat out loud (shadowing)' },
  { minutes: 5, text: 'Say three sentences about your day in Lithuanian' },
];

// Task actions: lesson:<id>, phrases, words, builder, scenario, review, practice:<mode>. No action = do it away from the app.
const JOURNEY_WEEKS = [
  {
    week: 1, title: 'Sounds and first words', titleLT: 'Garsai ir pirmieji žodžiai',
    goal: 'Read Lithuanian out loud and handle the first ten seconds of any conversation.',
    canDo: ['Greet people and say goodbye', 'Say thank you, please and sorry', 'Say when you don\'t understand'],
    grammar: 'The alphabet and its special letters: ą č ę ė į š ų ū ž. Every letter is pronounced, and the spelling is regular.',
    phrases: [
      { lt: 'Labas!', en: 'Hi!' },
      { lt: 'Laba diena.', en: 'Good day (polite hello).' },
      { lt: 'Ačiū.', en: 'Thank you.' },
      { lt: 'Prašau.', en: 'Please. / You\'re welcome.' },
      { lt: 'Atsiprašau.', en: 'Excuse me. / Sorry.' },
      { lt: 'Nesuprantu.', en: 'I don\'t understand.' },
      { lt: 'Viso gero!', en: 'Goodbye!' },
    ],
    tasks: [
      { id: 'w1-lesson', text: 'Complete lesson 1: Basics', action: 'lesson:1' },
      { id: 'w1-phrases', text: 'Learn today\'s phrases on three different days', action: 'phrases' },
      { id: 'w1-letters', text: 'Read the alphabet out loud twice, slowly' },
      { id: 'w1-shadow', text: 'Play each phrase above and repeat it five times' },
      { id: 'w1-speak', text: 'Say all seven phrases from memory', speaking: true },
    ],
  },
  {
    week: 2, title: 'Introducing yourself', titleLT: 'Prisistatymas',
    goal: 'Introduce yourself and ask someone about themselves.',
    canDo: ['Say your name and where you are from', 'Ask how someone is', 'Ask someone to repeat or slow down'],
    grammar: 'The verb būti (to be): aš esu, tu esi, jis / ji yra. Tu is informal, Jūs is polite.',
    phrases: [
      { lt: 'Mano vardas ...', en: 'My name is ...' },
      { lt: 'Aš esu iš ...', en: 'I am from ...' },
      { lt: 'Malonu susipažinti.', en: 'Nice to meet you.' },
      { lt: 'Kaip sekasi?', en: 'How are you doing?' },
      { lt: 'Gerai, ačiū. O tau?', en: 'Good, thanks. And you?' },
      { lt: 'Ar galite pakartoti?', en: 'Could you repeat that?' },
      { lt: 'Kalbėkite lėčiau, prašau.', en: 'Please speak more slowly.' },
    ],
    tasks: [
      { id: 'w2-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w2-phrases', text: 'Learn today\'s phrases on three different days', action: 'phrases' },
      { id: 'w2-builder', text: 'Do one sentence builder lesson', action: 'builder' },
      { id: 'w2-write', text: 'Write a five-line introduction about yourself' },
      { id: 'w2-speak', text: 'Record yourself giving that introduction, then listen back', speaking: true },
    ],
  },
  {
    week: 3, title: 'Numbers, time and prices', titleLT: 'Skaičiai, laikas ir kainos',
    goal: 'Understand prices and times, and ask for them.',
    canDo: ['Count to twenty', 'Ask how much something costs', 'Ask and tell the time'],
    grammar: 'Numbers 1 to 20. After 1 you say euras, after 2 to 9 eurai, and from 10 to 20 eurų.',
    phrases: [
      { lt: 'Kiek kainuoja?', en: 'How much does it cost?' },
      { lt: 'Du eurai.', en: 'Two euros.' },
      { lt: 'Kiek valandų?', en: 'What time is it?' },
      { lt: 'Dabar trečia valanda.', en: 'It is three o\'clock now.' },
      { lt: 'Mano telefono numeris ...', en: 'My phone number is ...' },
    ],
    tasks: [
      { id: 'w3-lesson', text: 'Complete lesson 2: Numbers 1-10', action: 'lesson:2' },
      { id: 'w3-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w3-practice', text: 'Do one vocabulary practice session', action: 'practice:words' },
      { id: 'w3-life', text: 'Read prices out loud next time you shop or browse a shop online' },
      { id: 'w3-speak', text: 'Say your phone number and today\'s date in Lithuanian', speaking: true },
    ],
  },
  {
    week: 4, title: 'Family and the people in your life', titleLT: 'Šeima',
    goal: 'Talk for one minute about yourself and your family.',
    canDo: ['Name family members', 'Say what you have and don\'t have', 'Hold a one-minute introduction'],
    grammar: 'The verb turėti (to have): aš turiu, tu turi. After "not", the object changes: turiu brolį, but neturiu brolio.',
    phrases: [
      { lt: 'Aš turiu brolį ir seserį.', en: 'I have a brother and a sister.' },
      { lt: 'Ar turi vaikų?', en: 'Do you have children?' },
      { lt: 'Neturiu.', en: 'I don\'t have (any).' },
      { lt: 'Mano šeima gyvena ...', en: 'My family lives in ...' },
      { lt: 'Čia mano draugas.', en: 'This is my friend.' },
    ],
    tasks: [
      { id: 'w4-lesson', text: 'Complete lesson 3: Family', action: 'lesson:3' },
      { id: 'w4-phrases', text: 'Learn today\'s phrases on three different days', action: 'phrases' },
      { id: 'w4-words', text: 'Mark ten words as learned in the word bank', action: 'words' },
      { id: 'w4-tutor', text: 'Book a first session with a tutor or language partner (italki, Tandem, or a local course)' },
      { id: 'w4-speak', text: 'Checkpoint: introduce yourself and your family for one minute without notes', speaking: true, checkpoint: true },
    ],
  },
  {
    week: 5, title: 'Food and cafés', titleLT: 'Maistas ir kavinės',
    goal: 'Order food and drinks and pay, all in Lithuanian.',
    canDo: ['Order in a café or restaurant', 'Ask for the bill', 'Say what you like to eat'],
    grammar: 'Asking politely: noriu (I want) and norėčiau (I would like). After them, the thing you want takes a new ending: kava becomes kavos.',
    phrases: [
      { lt: 'Norėčiau kavos.', en: 'I would like a coffee.' },
      { lt: 'Vieną arbatą, prašau.', en: 'One tea, please.' },
      { lt: 'Ką rekomenduojate?', en: 'What do you recommend?' },
      { lt: 'Sąskaitą, prašau.', en: 'The bill, please.' },
      { lt: 'Labai skanu!', en: 'Very tasty!' },
    ],
    tasks: [
      { id: 'w5-lesson-food', text: 'Complete lesson 5: Food Basics', action: 'lesson:5' },
      { id: 'w5-lesson-rest', text: 'Complete lesson 8: At the Restaurant', action: 'lesson:8' },
      { id: 'w5-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w5-roleplay', text: 'Role-play ordering a meal with your tutor or partner' },
      { id: 'w5-speak', text: 'Order something in Lithuanian, in real life or out loud at home', speaking: true },
    ],
  },
  {
    week: 6, title: 'Shopping and getting around', titleLT: 'Apsipirkimas ir kelionės po miestą',
    goal: 'Find your way, buy things, and pay without switching to English.',
    canDo: ['Ask where something is', 'Understand left, right and straight on', 'Ask to pay by card'],
    grammar: 'Where things are: kur yra ...? and words for places. Colours agree with the thing: raudonas obuolys, raudona suknelė.',
    phrases: [
      { lt: 'Kur yra stotis?', en: 'Where is the station?' },
      { lt: 'Į kairę, į dešinę, tiesiai.', en: 'Left, right, straight on.' },
      { lt: 'Ar toli?', en: 'Is it far?' },
      { lt: 'Ar galiu sumokėti kortele?', en: 'Can I pay by card?' },
      { lt: 'Ar turite didesnį dydį?', en: 'Do you have a bigger size?' },
    ],
    tasks: [
      { id: 'w6-lesson', text: 'Complete lesson 4: Colors', action: 'lesson:4' },
      { id: 'w6-scenario', text: 'Play the shop scenario', action: 'scenario' },
      { id: 'w6-practice', text: 'Do one mixed practice session', action: 'practice:mixed' },
      { id: 'w6-map', text: 'Describe the way from your home to a shop, out loud' },
      { id: 'w6-speak', text: 'Ask for directions in Lithuanian, with a person or your tutor', speaking: true },
    ],
  },
  {
    week: 7, title: 'Your day and your week', titleLT: 'Mano diena',
    goal: 'Describe a normal day and talk about your week.',
    canDo: ['Say what you do every day', 'Use the days of the week', 'Say when you do things'],
    grammar: 'The present tense of common verbs: dirbti (to work) is dirbu, dirbi, dirba. Days: pirmadienis, antradienis, trečiadienis, ketvirtadienis, penktadienis, šeštadienis, sekmadienis.',
    phrases: [
      { lt: 'Aš keliuosi septintą valandą.', en: 'I get up at seven.' },
      { lt: 'Aš dirbu nuo devynių iki penkių.', en: 'I work from nine to five.' },
      { lt: 'Vakare aš mokausi lietuvių kalbos.', en: 'In the evening I study Lithuanian.' },
      { lt: 'Šeštadienį aš ilsiuosi.', en: 'On Saturday I rest.' },
      { lt: 'Ką tu veiki?', en: 'What are you doing?' },
    ],
    tasks: [
      { id: 'w7-lesson', text: 'Complete lesson 6: Common Verbs', action: 'lesson:6' },
      { id: 'w7-builder', text: 'Do two sentence builder lessons', action: 'builder' },
      { id: 'w7-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w7-diary', text: 'Write three sentences a day about your day, for five days' },
      { id: 'w7-speak', text: 'Describe your typical day for one minute to your tutor or partner', speaking: true },
    ],
  },
  {
    week: 8, title: 'What happened: the past', titleLT: 'Kas buvo: būtasis laikas',
    goal: 'Tell a short story about your weekend.',
    canDo: ['Say where you were and what you did', 'Ask someone about their weekend', 'Link sentences with then and after that'],
    grammar: 'The past tense: buvau (I was), dirbau (I worked), mačiau (I saw), valgiau (I ate). Link ideas with paskui (then) and po to (after that).',
    phrases: [
      { lt: 'Vakar aš buvau namie.', en: 'Yesterday I was at home.' },
      { lt: 'Ką veikei savaitgalį?', en: 'What did you do at the weekend?' },
      { lt: 'Aš mačiau gerą filmą.', en: 'I saw a good film.' },
      { lt: 'Paskui mes valgėme picą.', en: 'Then we ate pizza.' },
      { lt: 'Buvo labai smagu.', en: 'It was a lot of fun.' },
    ],
    tasks: [
      { id: 'w8-lesson', text: 'Complete lesson 7: Questions', action: 'lesson:7' },
      { id: 'w8-phrases', text: 'Learn today\'s phrases on three different days', action: 'phrases' },
      { id: 'w8-practice', text: 'Do one mixed practice session', action: 'practice:mixed' },
      { id: 'w8-story', text: 'Write your weekend story in eight sentences' },
      { id: 'w8-speak', text: 'Checkpoint: tell your weekend story for two minutes and answer two questions about it', speaking: true, checkpoint: true },
    ],
  },
  {
    week: 9, title: 'Plans and meeting up', titleLT: 'Planai ir susitikimai',
    goal: 'Make plans, invite someone, and agree on a time.',
    canDo: ['Say what you will do', 'Invite someone and accept or decline', 'Agree on a day and time'],
    grammar: 'The future tense adds -s-: būsiu (I will be), eisiu (I will go), darysiu (I will do).',
    phrases: [
      { lt: 'Rytoj aš eisiu į darbą.', en: 'Tomorrow I will go to work.' },
      { lt: 'Ar nori susitikti?', en: 'Do you want to meet up?' },
      { lt: 'Kada tau patogu?', en: 'When suits you?' },
      { lt: 'Gal penktadienį?', en: 'Maybe Friday?' },
      { lt: 'Puiku, iki penktadienio!', en: 'Great, see you Friday!' },
    ],
    tasks: [
      { id: 'w9-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w9-phrases', text: 'Learn today\'s phrases on three different days', action: 'phrases' },
      { id: 'w9-builder', text: 'Do two sentence builder lessons', action: 'builder' },
      { id: 'w9-message', text: 'Send a message in Lithuanian to plan a meet-up (a tutor, partner or friend)' },
      { id: 'w9-speak', text: 'Talk about your plans for next week for two minutes', speaking: true },
    ],
  },
  {
    week: 10, title: 'Health and getting help', titleLT: 'Sveikata ir pagalba',
    goal: 'Explain a problem and ask for help.',
    canDo: ['Say what hurts and how you feel', 'Ask for help politely', 'Handle a pharmacy or doctor visit'],
    grammar: 'Saying how you feel uses man (to me): man skauda (it hurts me), man reikia (I need), man šalta (I\'m cold).',
    phrases: [
      { lt: 'Man skauda galvą.', en: 'I have a headache.' },
      { lt: 'Man reikia gydytojo.', en: 'I need a doctor.' },
      { lt: 'Ar galite man padėti?', en: 'Can you help me?' },
      { lt: 'Aš jaučiuosi blogai.', en: 'I feel unwell.' },
      { lt: 'Kur yra vaistinė?', en: 'Where is the pharmacy?' },
    ],
    tasks: [
      { id: 'w10-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w10-phrases', text: 'Learn today\'s phrases on three different days', action: 'phrases' },
      { id: 'w10-practice', text: 'Do two practice sessions', action: 'practice:mixed' },
      { id: 'w10-roleplay', text: 'Role-play a pharmacy visit with your tutor or partner' },
      { id: 'w10-speak', text: 'Explain a problem (lost keys, feeling ill, a late bus) for one minute', speaking: true },
    ],
  },
  {
    week: 11, title: 'Opinions and small talk', titleLT: 'Nuomonės ir pokalbiai',
    goal: 'Give your opinion and keep small talk going.',
    canDo: ['Say what you like and why', 'Agree and disagree', 'Talk about the weather and news'],
    grammar: 'Liking also uses man: man patinka muzika (I like music). Connect ideas with kad (that), nes (because) and bet (but).',
    phrases: [
      { lt: 'Man patinka Vilnius, nes ...', en: 'I like Vilnius because ...' },
      { lt: 'Manau, kad ...', en: 'I think that ...' },
      { lt: 'Sutinku. / Nesutinku.', en: 'I agree. / I disagree.' },
      { lt: 'Koks šiandien oras?', en: 'What is the weather like today?' },
      { lt: 'Šiandien šalta ir lyja.', en: 'It is cold and raining today.' },
    ],
    tasks: [
      { id: 'w11-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w11-builder', text: 'Do two sentence builder lessons', action: 'builder' },
      { id: 'w11-listen', text: 'Watch or listen to 10 minutes of Lithuanian (LRT, a podcast, or a YouTube channel) on three days' },
      { id: 'w11-opinion', text: 'Write five opinions using nes (because)' },
      { id: 'w11-speak', text: 'Have a 10-minute small-talk conversation with your tutor or partner', speaking: true },
    ],
  },
  {
    week: 12, title: 'Real conversations', titleLT: 'Tikri pokalbiai',
    goal: 'Hold a 15-minute conversation, and know how to keep going when you get stuck.',
    canDo: ['Keep a conversation going when you miss a word', 'Ask what something means', 'Talk about yourself, your plans and your opinions'],
    grammar: 'No new grammar. Mix everything: present, past and future in one conversation.',
    phrases: [
      { lt: 'Kaip pasakyti lietuviškai ...?', en: 'How do you say ... in Lithuanian?' },
      { lt: 'Ką tai reiškia?', en: 'What does that mean?' },
      { lt: 'Aš mokausi lietuvių kalbos tris mėnesius.', en: 'I have been learning Lithuanian for three months.' },
      { lt: 'Pamiršau žodį.', en: 'I forgot the word.' },
      { lt: 'Ačiū už pokalbį!', en: 'Thanks for the conversation!' },
    ],
    tasks: [
      { id: 'w12-review', text: 'Do your word review on five days', action: 'review' },
      { id: 'w12-practice', text: 'Do an intensive practice session', action: 'practice:intensive' },
      { id: 'w12-phrases', text: 'Review every phrase from weeks 1 to 11 on this page' },
      { id: 'w12-next', text: 'Choose your next goal: an A2 course, a weekly tutor, or a language exchange' },
      { id: 'w12-speak', text: 'Final checkpoint: a 15-minute conversation in Lithuanian with a native speaker', speaking: true, checkpoint: true },
    ],
  },
];

const JourneyLogic = {
  TOTAL_WEEKS: JOURNEY_WEEKS.length,

  dayKey(date = new Date()) {
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  },

  daysBetween(a, b) {
    const [y1, m1, d1] = a.split('-').map(Number);
    const [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  },

  // Which week of the plan today falls in, counted from the day you started (1 to 12).
  calendarWeek(startedAt, today = this.dayKey()) {
    if (!startedAt) return 1;
    const days = Math.max(0, this.daysBetween(startedAt, today));
    return Math.min(this.TOTAL_WEEKS, Math.floor(days / 7) + 1);
  },

  dayOfJourney(startedAt, today = this.dayKey()) {
    if (!startedAt) return 1;
    return Math.max(0, this.daysBetween(startedAt, today)) + 1;
  },

  phaseFor(week) {
    return JOURNEY_PHASES.find((p) => week >= p.weeks[0] && week <= p.weeks[1]) || JOURNEY_PHASES[0];
  },

  // A lesson task counts as done when the lesson itself is completed.
  isTaskDone(task, journey = {}, lessonsCompleted = []) {
    if (journey.done?.[task.id]) return true;
    const m = /^lesson:(\d+)$/.exec(task.action || '');
    return Boolean(m && lessonsCompleted.some((l) => String(l.id) === m[1]));
  },

  weekProgress(weekNo, journey = {}, lessonsCompleted = []) {
    const week = JOURNEY_WEEKS[weekNo - 1];
    const done = week.tasks.filter((t) => this.isTaskDone(t, journey, lessonsCompleted)).length;
    return { done, total: week.tasks.length, complete: done === week.tasks.length };
  },

  overallProgress(journey = {}, lessonsCompleted = []) {
    let done = 0;
    let total = 0;
    JOURNEY_WEEKS.forEach((w) => {
      const p = this.weekProgress(w.week, journey, lessonsCompleted);
      done += p.done;
      total += p.total;
    });
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  },

  toggleTask(journey, taskId, today = this.dayKey()) {
    journey.done = journey.done || {};
    if (journey.done[taskId]) delete journey.done[taskId];
    else journey.done[taskId] = today;
    return journey;
  },
};

const JourneyManager = {
  openWeek: null,

  state() {
    const data = Storage.getUserData();
    data.journey = data.journey || { startedAt: null, done: {} };
    return data;
  },

  start() {
    const data = this.state();
    data.journey.startedAt = JourneyLogic.dayKey();
    Storage.saveUserData(data);
    this.openWeek = 1;
    this.render();
  },

  esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text.replace(/\.\.\./g, ''));
    u.lang = 'lt-LT';
    u.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  },

  toggle(taskId) {
    const data = this.state();
    JourneyLogic.toggleTask(data.journey, taskId);
    Storage.saveUserData(data);
    this.render();
    if (typeof App !== 'undefined' && App.renderJourneyCard) App.renderJourneyCard();
  },

  async run(action) {
    const [kind, arg] = action.split(':');
    if (kind === 'lesson') return App.startLesson(Number(arg));
    if (kind === 'phrases') return App.navigateToScreen('sentences');
    if (kind === 'words') return App.navigateToScreen('wordbank');
    if (kind === 'builder') return App.navigateToScreen('sentencebuilder');
    if (kind === 'scenario') return App.navigateToScreen('scenario');
    if (kind === 'review') {
      const exercises = await ReviewManager.generateReviewExercises(10);
      if (exercises.length) return LessonManager.startReviewSession(exercises);
      return App.navigateToScreen('practicemode');
    }
    if (kind === 'practice') {
      App.navigateToScreen('practicemode');
      return arg === 'intensive' ? PracticeManager.startSession('mixed', 20) : PracticeManager.startSession(arg || 'mixed', 10);
    }
    return null;
  },

  showWeek(n) {
    this.openWeek = this.openWeek === n ? null : n;
    this.render();
    document.getElementById(`journey-week-${n}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },

  taskHTML(task, journey, lessons) {
    const done = JourneyLogic.isTaskDone(task, journey, lessons);
    const auto = /^lesson:/.test(task.action || '') && done && !journey.done?.[task.id];
    const tag = task.checkpoint ? '<span class="j-tag j-tag-check">Checkpoint</span>' : task.speaking ? '<span class="j-tag">Speaking</span>' : '';
    const go = task.action ? `<button class="j-go" onclick="JourneyManager.run('${task.action}')">Open</button>` : '';
    return `<li class="j-task${done ? ' done' : ''}">
      <button class="j-check" role="checkbox" aria-checked="${done}" aria-label="${this.esc(task.text)}" ${auto ? 'disabled title="Done in the app"' : ''} onclick="JourneyManager.toggle('${task.id}')"></button>
      <span class="j-task-text">${this.esc(task.text)}${tag}</span>${go}
    </li>`;
  },

  weekBodyHTML(week, journey, lessons) {
    return `
      <p class="j-goal">${this.esc(week.goal)}</p>
      <h4 class="j-sub">By the end of the week you can</h4>
      <ul class="j-cando">${week.canDo.map((c) => `<li>${this.esc(c)}</li>`).join('')}</ul>
      <h4 class="j-sub">Key phrases</h4>
      <ul class="j-phrases">${week.phrases.map((p) => `
        <li><button class="j-say" aria-label="Play ${this.esc(p.lt)}" onclick="JourneyManager.speak(this.dataset.lt)" data-lt="${this.esc(p.lt)}"></button>
        <span><b lang="lt">${this.esc(p.lt)}</b><small>${this.esc(p.en)}</small></span></li>`).join('')}
      </ul>
      <h4 class="j-sub">Grammar in small pieces</h4>
      <p class="j-grammar">${this.esc(week.grammar)}</p>
      <h4 class="j-sub">This week's tasks</h4>
      <ul class="j-tasks">${week.tasks.map((t) => this.taskHTML(t, journey, lessons)).join('')}</ul>`;
  },

  render() {
    const root = document.getElementById('journey-content');
    if (!root) return;
    const data = this.state();
    const { journey } = data;
    const lessons = data.lessonsCompleted || [];

    if (!journey.startedAt) {
      root.innerHTML = `
        <section class="hero j-intro">
          <p class="j-kicker">A teacher's plan</p>
          <h2 class="j-hero-title">Speak Lithuanian in 12 weeks</h2>
          <p class="hero-caption">Twelve weekly steps from your first "Labas!" to a 15-minute conversation with a native speaker. About 25 minutes a day, speaking out loud every week.</p>
          <ol class="j-phase-list">${JOURNEY_PHASES.map((p) => `<li><b>Weeks ${p.weeks[0]}–${p.weeks[1]} · ${p.name}</b><span>${p.aim}</span></li>`).join('')}</ol>
          <button class="btn btn-primary btn-wide" id="journey-start-btn" onclick="JourneyManager.start()">Start my journey today</button>
        </section>
        ${this.routineHTML()}
        ${this.weekListHTML(journey, lessons, 0)}`;
      return;
    }

    const current = JourneyLogic.calendarWeek(journey.startedAt);
    const day = JourneyLogic.dayOfJourney(journey.startedAt);
    const phase = JourneyLogic.phaseFor(current);
    const week = JOURNEY_WEEKS[current - 1];
    const wp = JourneyLogic.weekProgress(current, journey, lessons);
    const overall = JourneyLogic.overallProgress(journey, lessons);
    const finished = day > JourneyLogic.TOTAL_WEEKS * 7;

    root.innerHTML = `
      <section class="hero j-current">
        <p class="j-kicker">${finished ? 'Journey complete' : `Week ${current} of 12 · Day ${day}`} · ${phase.name}</p>
        <h2 class="j-hero-title">${this.esc(week.title)}</h2>
        <p class="j-lt" lang="lt">${this.esc(week.titleLT)}</p>
        <p class="hero-caption">${this.esc(week.goal)}</p>
        <div class="goal-line">
          <div class="goal-line-text"><span>This week</span><b id="journey-week-progress">${wp.done} / ${wp.total} tasks</b></div>
          <div class="bar"><span style="width:${Math.round((wp.done / wp.total) * 100)}%"></span></div>
        </div>
        <div class="goal-line">
          <div class="goal-line-text"><span>Whole journey</span><b id="journey-overall">${overall.percent}%</b></div>
          <div class="bar bar-calm"><span style="width:${overall.percent}%"></span></div>
        </div>
        <button class="btn btn-primary btn-wide" onclick="JourneyManager.showWeek(${current})">${this.openWeek === current ? 'Hide this week' : 'Open this week'}</button>
      </section>
      ${this.routineHTML()}
      ${this.weekListHTML(journey, lessons, current)}`;
  },

  routineHTML() {
    return `
      <section class="block">
        <h2 class="block-title">Every day, about 25 minutes</h2>
        <ul class="list j-routine">${JOURNEY_ROUTINE.map((r) => `<li><span class="j-min">${r.minutes} min</span><span>${this.esc(r.text)}</span></li>`).join('')}</ul>
      </section>`;
  },

  weekListHTML(journey, lessons, current) {
    return JOURNEY_PHASES.map((phase) => `
      <section class="block">
        <div class="section-header"><h3>${phase.name}</h3><span class="muted small">Weeks ${phase.weeks[0]}–${phase.weeks[1]}</span></div>
        <div class="list">${JOURNEY_WEEKS.filter((w) => w.week >= phase.weeks[0] && w.week <= phase.weeks[1]).map((w) => {
          const p = JourneyLogic.weekProgress(w.week, journey, lessons);
          const open = this.openWeek === w.week;
          const cls = ['j-week', p.complete ? 'complete' : '', w.week === current ? 'current' : '', open ? 'open' : ''].join(' ').trim();
          return `<div class="${cls}" id="journey-week-${w.week}">
            <button class="row j-week-row" aria-expanded="${open}" onclick="JourneyManager.showWeek(${w.week})">
              <span class="row-icon j-week-no">${p.complete ? '✓' : w.week}</span>
              <span class="row-main"><b>${this.esc(w.title)}</b><small>${w.week === current ? 'This week · ' : ''}${p.done}/${p.total} tasks</small></span>
              <span class="chev"></span>
            </button>
            ${open ? `<div class="j-week-body">${this.weekBodyHTML(w, journey, lessons)}</div>` : ''}
          </div>`;
        }).join('')}</div>
      </section>`).join('');
  },

  init() {
    const data = this.state();
    if (this.openWeek === null && data.journey.startedAt) this.openWeek = JourneyLogic.calendarWeek(data.journey.startedAt);
    this.render();
  },
};

if (typeof window !== 'undefined') {
  window.JourneyManager = JourneyManager;
  window.JourneyLogic = JourneyLogic;
}
if (typeof module !== 'undefined') {
  module.exports = { JOURNEY_WEEKS, JOURNEY_PHASES, JourneyLogic };
}
