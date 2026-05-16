const fs = require('fs');
const vm = require('vm');

function createLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };
}

async function testLegacyLessonGeneration() {
  const localStorage = createLocalStorage();
  const context = {
    console,
    localStorage,
    fetch: async (url, opts) => {
      if (url === '/api/chat') {
        return {
          ok: true,
          async json() {
            return {
              lesson: {
                id: 'ai_legacy_1',
                titleLT: 'AI Pamoka Test',
                exercises: [
                  { type: 'typing', question: 'Type labas', answer: 'labas' }
                ],
                vocabulary: [{ lithuanian: 'labas' }]
              }
            };
          }
        };
      }
      if (url === 'vocabulary.json') {
        return { ok: true, async json() { return { lessons: [] }; } };
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
    Storage: {
      getUserData() {
        return {
          srsItems: { labas: { id: 'labas', kind: 'word' } },
          lessonsCompleted: [{ id: 1 }]
        };
      },
      completeLesson() {},
      addVocabulary() {},
      awardXP() {}
    },
    StreakManager: { updateStreak() {} },
    AchievementManager: { checkAchievements() {} },
    ReviewManager: { updateReviewItem() {} },
    document: {},
    window: {}
  };

  vm.createContext(context);
  const src = fs.readFileSync('lessons.js', 'utf8') + '\n;globalThis.LessonManager = LessonManager;';
  vm.runInContext(src, context);
  const lm = context.LessonManager;
  lm.currentLesson = { id: 1, vocabulary: [{ lithuanian: 'labas' }] };
  await lm.maybeGenerateNextLesson([]);
  const generated = lm.getGeneratedLessons();
  if (!generated.length || generated[0].id !== 'ai_legacy_1') {
    throw new Error('Legacy AI generation failed to persist generated lesson');
  }
}

async function testScenarioGenerationFallback() {
  const localStorage = createLocalStorage();
  const context = {
    console,
    localStorage,
    fetch: async (url) => {
      if (url === '/api/chat') throw new Error('API down');
      throw new Error(`Unexpected URL: ${url}`);
    },
    Storage: {
      getUserData() {
        return { srsItems: { parduotuve: { id: 'parduotuvė', kind: 'word' } } };
      },
      awardXP() {}
    },
    document: {},
    window: {}
  };

  vm.createContext(context);
  const src = fs.readFileSync('scenario-learning.js', 'utf8') + '\n;globalThis.ScenarioLearningManager = ScenarioLearningManager;';
  vm.runInContext(src, context);
  const sm = context.ScenarioLearningManager;
  sm.currentScenario = { id: 'scenario_01', title: 'At the Shop', aiGeneration: { enabled: true } };
  sm.currentLesson = {
    id: 'L01',
    focusCase: 'locative',
    vocabulary: [{ lithuanian: 'parduotuvė', productionForms: { nominative: 'parduotuvė', locative: 'parduotuvėje' } }]
  };

  await sm.maybeGenerateNextLesson();
  const state = sm.getState();
  const generated = state.generatedByScenario.scenario_01 || [];
  if (!generated.length) {
    throw new Error('Scenario fallback generation failed');
  }
}

(async () => {
  await testLegacyLessonGeneration();
  await testScenarioGenerationFallback();
  console.log('✓ legacy lesson generation via AI path works');
  console.log('✓ scenario lesson generation fallback works when AI fails');
})();
