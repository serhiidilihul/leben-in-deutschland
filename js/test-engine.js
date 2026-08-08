window.TestEngine = (() => {
  const TEST_CONFIG = Object.freeze({
    generalCount: 30,
    stateCount: 3,
    durationSeconds: 60 * 60,
  });

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function prepareQuestion(question) {
    const answers = question.answers.map((text, index) => ({
      text,
      isCorrect: index === question.correctAnswer,
      originalIndex: index,
    }));

    return {
      ...question,
      answers: shuffle(answers),
    };
  }

  function createTest(bank = window.QUESTION_BANK) {
    if (!bank || !Array.isArray(bank.general) || !Array.isArray(bank.berlin)) {
      throw new Error("Der Fragenkatalog konnte nicht geladen werden.");
    }

    if (bank.general.length < TEST_CONFIG.generalCount) {
      throw new Error(`Zu wenige allgemeine Fragen: ${bank.general.length} statt ${TEST_CONFIG.generalCount}.`);
    }

    if (bank.berlin.length < TEST_CONFIG.stateCount) {
      throw new Error(`Zu wenige Berlin-Fragen: ${bank.berlin.length} statt ${TEST_CONFIG.stateCount}.`);
    }

    const general = shuffle(bank.general)
      .slice(0, TEST_CONFIG.generalCount)
      .map(prepareQuestion);

    const berlin = shuffle(bank.berlin)
      .slice(0, TEST_CONFIG.stateCount)
      .map(prepareQuestion);

    return shuffle([...general, ...berlin]);
  }

  function getCorrectAnswerIndex(question) {
    return question.answers.findIndex(answer => answer.isCorrect);
  }

  function calculateResult(test, responses, elapsedSeconds, timeExpired = false) {
    const details = test.map((question, index) => {
      const selected = responses[index]?.selectedAnswer ?? null;
      const correct = getCorrectAnswerIndex(question);
      const isCorrect = selected !== null && selected === correct;

      return {
        question,
        testNumber: index + 1,
        selected,
        correct,
        isCorrect,
      };
    });

    const correctCount = details.filter(item => item.isCorrect).length;

    return {
      total: test.length,
      correctCount,
      incorrectCount: test.length - correctCount,
      percentage: test.length ? (correctCount / test.length) * 100 : 0,
      elapsedSeconds: Math.max(0, Math.floor(elapsedSeconds)),
      timeExpired,
      details,
      errors: details.filter(item => !item.isCorrect),
    };
  }

  return {
    TEST_CONFIG,
    shuffle,
    createTest,
    getCorrectAnswerIndex,
    calculateResult,
  };
})();
