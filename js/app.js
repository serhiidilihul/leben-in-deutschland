(() => {
  let test = [];
  let responses = [];
  let currentIndex = 0;
  let selectedIndex = null;
  let remainingSeconds = TestEngine.TEST_CONFIG.durationSeconds;
  let timerId = null;
  let startedAt = null;
  let finished = false;

  function startTest() {
    stopTimer();

    try {
      test = TestEngine.createTest(QUESTION_BANK);
    } catch (error) {
      UI.renderIntro(startTest);
      alert(error.message);
      return;
    }

    responses = test.map(() => ({ selectedAnswer: null }));
    currentIndex = 0;
    selectedIndex = null;
    remainingSeconds = TestEngine.TEST_CONFIG.durationSeconds;
    startedAt = Date.now();
    finished = false;

    renderCurrentQuestion();
    startTimer();
  }

  function startTimer() {
    stopTimer();
    timerId = window.setInterval(() => {
      if (finished) return;

      remainingSeconds = Math.max(0, remainingSeconds - 1);
      UI.updateTimer(remainingSeconds);

      if (remainingSeconds === 0) {
        finishTest(true);
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function renderCurrentQuestion() {
    const question = test[currentIndex];
    selectedIndex = responses[currentIndex]?.selectedAnswer ?? null;

    UI.renderQuestion({
      question,
      index: currentIndex,
      total: test.length,
      selectedIndex,
      remainingSeconds,
      onSelect: selectAnswer,
      onNext: nextQuestion,
    });
  }

  function selectAnswer(answerIndex) {
    if (finished || !test[currentIndex]) return;

    selectedIndex = answerIndex;
    responses[currentIndex].selectedAnswer = answerIndex;
    renderCurrentQuestion();
  }

  function nextQuestion() {
    if (finished || selectedIndex === null) return;

    if (currentIndex === test.length - 1) {
      finishTest(false);
      return;
    }

    currentIndex += 1;
    selectedIndex = responses[currentIndex]?.selectedAnswer ?? null;
    renderCurrentQuestion();
  }

  function finishTest(timeExpired) {
    if (finished) return;
    finished = true;
    stopTimer();

    const elapsedSeconds = timeExpired
      ? TestEngine.TEST_CONFIG.durationSeconds
      : Math.min(
          TestEngine.TEST_CONFIG.durationSeconds,
          Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        );

    const result = TestEngine.calculateResult(
      test,
      responses,
      elapsedSeconds,
      timeExpired
    );

    UI.renderResult(result, startTest);
  }

  UI.renderIntro(startTest);
})();
