window.UI = (() => {
  const app = document.getElementById("app");

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function renderIntro(onStart) {
    app.innerHTML = `
      <section class="screen screen-intro">
        <div class="intro-card">
          <div class="intro-visual" aria-hidden="true">
            <span class="intro-orbit orbit-one"></span>
            <span class="intro-orbit orbit-two"></span>
            <span class="intro-dot dot-one"></span>
            <span class="intro-dot dot-two"></span>
            <span class="intro-mark">LiD</span>
          </div>
          <div class="eyebrow">PRÜFUNGSSIMULATION</div>
          <h1>Leben in Deutschland</h1>
          <p class="intro-lead">Bereite dich unter realistischen Bedingungen auf den Test vor.</p>

          <div class="exam-facts">
            <div class="fact"><strong>33</strong><span>Fragen</span></div>
            <div class="fact"><strong>60</strong><span>Minuten</span></div>
            <div class="fact"><strong>30 + 3</strong><span>Allgemein + Berlin</span></div>
          </div>

          <div class="intro-info">
            <h2>So funktioniert der Test</h2>
            <ul>
              <li>30 Fragen werden zufällig aus dem allgemeinen Katalog ausgewählt.</li>
              <li>3 weitere Fragen kommen zufällig aus dem Berlin-Katalog.</li>
              <li>Du beantwortest immer nur eine Frage auf einmal.</li>
              <li>Für den gesamten Test stehen dir 60 Minuten zur Verfügung.</li>
              <li>Am Ende erhältst du Ergebnis, Bearbeitungszeit und Fehleranalyse.</li>
            </ul>
          </div>

          <button class="primary-button primary-button-large" id="start-button">
            Prüfung starten <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>`;
    document.getElementById("start-button").addEventListener("click", onStart);
  }

  function renderQuestion({ question, index, total, selectedIndex, remainingSeconds, onSelect, onNext }) {
    const progress = ((index + 1) / total) * 100;
    const cachedTranslation = window.TranslationService?.get(question.id) || null;
    const hasTranslation = Boolean(cachedTranslation?.questionRu && (question.answerImages || cachedTranslation.answersRu?.length === 4));
    const imageMarkup = question.image ? `<div class="question-image"><img src="${escapeHtml(question.image)}" alt=""></div>` : "";

    const renderAnswers = (answers, isRu) => {
      if (question.answerImages && question.answerImages.length === 4) {
        return `<div class="answers answers-images">
          ${question.answerImages.map((src, i) => `
            <button class="answer-card answer-image-card ${selectedIndex === i ? "is-selected" : ""}" data-answer="${i}" type="button">
              <img src="${escapeHtml(src)}" alt="">
            </button>`).join("")}
        </div>`;
      }
      return `<div class="answers">
        ${answers.map((answer, i) => `
          <button class="answer-card ${selectedIndex === i ? "is-selected" : ""}" data-answer="${i}" type="button">
            ${escapeHtml(answer)}
          </button>`).join("")}
      </div>`;
    };

    const deQuestion = question.question;
    const deAnswers = question.answers.map(a => a.text);
    const ruQuestion = cachedTranslation?.questionRu || "Übersetzung wird geladen …";
    const ruAnswers = cachedTranslation?.answersRu?.length === 4 ? cachedTranslation.answersRu : deAnswers;

    const renderSide = (lang) => {
      const ru = lang === "ru";
      const sideClass = ru ? "card-face card-face-back" : "card-face card-face-front";
      const toggle = ru ? "DE" : "RU";
      const disabled = ru && !hasTranslation && !cachedTranslation;
      const questionText = ru ? ruQuestion : deQuestion;
      const answers = ru ? ruAnswers : deAnswers;
      return `
        <div class="${sideClass}">
          <button class="language-toggle ${disabled ? "is-disabled" : ""}" data-flip="${toggle.toLowerCase()}" type="button" ${disabled ? "disabled" : ""} aria-label="${ru ? "Deutsch anzeigen" : "Russischen Übersetzung anzeigen"}">${toggle}</button>
          <div class="question-number">FRAGE ${index + 1}</div>
          <h1>${escapeHtml(questionText)}</h1>
          ${imageMarkup}
          ${renderAnswers(answers, ru)}
        </div>`;
    };

    app.innerHTML = `
      <section class="screen screen-test">
        <header class="test-header">
          <div class="test-header-top">
            <div class="brand">Leben in Deutschland</div>
            <div class="timer-wrap">
              <span class="timer-label">VERBLEIBEND</span>
              <span class="timer" id="timer">${formatTime(remainingSeconds)}</span>
            </div>
          </div>
          <div class="test-meta"><span>Frage ${index + 1} von ${total}</span><span>${Math.round(progress)}%</span></div>
          <div class="progress-track"><div class="progress-value" style="width:${progress}%"></div></div>
        </header>
        <div class="question-layout">
          <div class="question-flip-card ${cachedTranslation ? "has-translation" : ""}" id="question-flip-card">
            <div class="question-flip-inner">
              ${renderSide("de")}
              ${renderSide("ru")}
            </div>
          </div>
          <div class="question-footer">
            <span class="selection-hint" id="selection-hint">${selectedIndex === null ? "Wähle eine Antwort." : "Antwort ausgewählt."}</span>
            <button class="primary-button next-button" id="next-button" ${selectedIndex === null ? "disabled" : ""}>${index === total - 1 ? "Test beenden" : "Weiter"} <span aria-hidden="true">→</span></button>
          </div>
        </div>
      </section>`;

    const card = document.getElementById("question-flip-card");
    const flipToRu = async () => {
      if (!window.TranslationService) return;
      const ruButton = card.querySelector('[data-flip="ru"]');
      ruButton.disabled = true;
      ruButton.classList.add("is-loading");
      try {
        const value = await window.TranslationService.translate(question);
        question.questionRu = value.questionRu;
        question.answersRu = value.answersRu;
        renderQuestion({ question, index, total, selectedIndex, remainingSeconds, onSelect, onNext });
        document.getElementById("question-flip-card")?.classList.add("is-flipped");
      } catch (error) {
        ruButton.disabled = false;
        ruButton.classList.remove("is-loading");
        ruButton.textContent = "RU";
        const hint = document.getElementById("selection-hint");
        if (hint) hint.textContent = "Übersetzung konnte nicht geladen werden.";
        console.warn("Russian translation failed", error);
      }
    };

    card.querySelectorAll("[data-flip]").forEach(button => {
      button.addEventListener("click", async () => {
        if (button.disabled) return;
        if (button.dataset.flip === "ru") {
          await flipToRu();
        } else {
          card.classList.remove("is-flipped");
        }
      });
    });

    document.querySelectorAll(".answer-card").forEach(button => {
      button.addEventListener("click", () => onSelect(Number(button.dataset.answer)));
    });
    document.getElementById("next-button").addEventListener("click", onNext);
  }

  function updateTimer(seconds) {
    const timer = document.getElementById("timer");
    if (!timer) return;
    timer.textContent = formatTime(seconds);
    timer.classList.toggle("is-warning", seconds <= 600);
    timer.classList.toggle("is-critical", seconds <= 120);
  }

  function renderResult(result, onRestart) {
    const percentage = result.percentage.toFixed(1).replace(".", ",");
    const scoreClass = result.correctCount < 17
      ? "score-fail"
      : result.correctCount <= 26
        ? "score-pass"
        : "score-excellent";

    app.innerHTML = `
      <section class="screen screen-result">
        <div class="result-card">
          <div class="eyebrow">ERGEBNIS</div>
          <h1>Prüfung beendet</h1>
          <p class="result-lead">${result.errors.length ? "Hier ist deine Auswertung. Nutze die Fehleranalyse zum Wiederholen." : "Sehr stark — du hast alle Fragen richtig beantwortet."}</p>

          <div class="score-ring ${scoreClass}" style="--score:${result.percentage}%">
            <div><strong>${percentage}%</strong><span>${result.correctCount} / ${result.total}</span></div>
          </div>

          <div class="result-stats">
            <div><strong>${result.correctCount}</strong><span>Richtig</span></div>
            <div><strong>${result.incorrectCount}</strong><span>Falsch</span></div>
            <div><strong>${formatTime(result.elapsedSeconds)}</strong><span>Bearbeitungszeit</span></div>
          </div>

          <div class="review-section">
            <div>
              <h2>Fragen zum Wiederholen</h2>
              <p>${result.errors.length ? `${result.errors.length} ${result.errors.length === 1 ? "Frage braucht" : "Fragen brauchen"} noch Aufmerksamkeit.` : "Keine Fehler — perfekt."}</p>
            </div>
            <div class="review-list">
              ${result.errors.map((error, i) => `
                <button class="review-button" data-error="${i}" type="button">
                  <span>Frage ${escapeHtml(String(error.testNumber ?? "—"))}</span><span aria-hidden="true">→</span>
                </button>`).join("")}
            </div>
          </div>

          <button class="primary-button primary-button-large" id="restart-button">
            Test erneut starten <span aria-hidden="true">↻</span>
          </button>
        </div>
      </section>`;

    document.getElementById("restart-button").addEventListener("click", onRestart);
    document.querySelectorAll(".review-button").forEach((button, i) => {
      button.addEventListener("click", () => openErrorModal(result.errors[i]));
    });
  }

  function openErrorModal(error) {
    const selectedText = error.selected === null ? "Keine Antwort ausgewählt." : error.question.answers[error.selected].text;
    const correctText = error.question.answers[error.correct].text;

    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="error-modal" role="dialog" aria-modal="true" aria-labelledby="error-title">
        <button class="modal-close" type="button" aria-label="Schließen">×</button>
        <div class="eyebrow">FRAGE ${escapeHtml(String(error.testNumber ?? ""))}</div>
        <h2 id="error-title">${escapeHtml(error.question.question)}</h2>
        ${error.question.image ? `<div class="modal-question-image"><img src="${escapeHtml(error.question.image)}" alt=""></div>` : ""}
        <div class="error-answer-group">
          <span class="answer-label answer-label-wrong">Deine Antwort</span>
          <div class="review-answer review-answer-wrong">${escapeHtml(selectedText)}</div>
        </div>
        <div class="error-answer-group">
          <span class="answer-label answer-label-correct">Richtige Antwort</span>
          <div class="review-answer review-answer-correct">${escapeHtml(correctText)}</div>
        </div>
        <button class="secondary-button modal-close-button" type="button">Schließen</button>
      </div>`;

    document.body.appendChild(modal);
    document.body.classList.add("modal-open");
    const close = () => { modal.remove(); document.body.classList.remove("modal-open"); };
    modal.querySelectorAll(".modal-close, .modal-close-button").forEach(b => b.addEventListener("click", close));
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  return { renderIntro, renderQuestion, updateTimer, renderResult, formatTime };
})();
