window.TranslationService = (() => {
  const cacheKey = "lid-ru-translations-v1";
  const memoryCache = new Map();
  let persistentCache = {};

  try {
    persistentCache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
  } catch (_) {
    persistentCache = {};
  }

  function get(questionId) {
    return memoryCache.get(questionId) || persistentCache[questionId] || null;
  }

  function save(questionId, value) {
    memoryCache.set(questionId, value);
    persistentCache[questionId] = value;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(persistentCache));
    } catch (_) {}
  }

  function cleanTranslation(text) {
    return String(text || "").trim();
  }

  async function translateCombined(question) {
    const cached = get(question.id);
    if (cached) return cached;

    const hasImageAnswers = Array.isArray(question.answerImages) && question.answerImages.length === 4;
    const parts = [question.question];
    if (!hasImageAnswers) parts.push(...question.answers.map(a => a.text));

    // Stable markers let us make one request per question and split the response again.
    const source = parts.map((text, i) => `[[LID_${i}]] ${text}`).join("\n");
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=ru&dt=t&dj=1&q=" + encodeURIComponent(source);

    const response = await fetch(url, { method: "GET", mode: "cors" });
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
    const data = await response.json();
    const translated = (data.sentences || []).map(s => s.trans).join("");

    const result = {};
    for (let i = 0; i < parts.length; i++) {
      const marker = `[[LID_${i}]]`;
      const next = `[[LID_${i + 1}]]`;
      const start = translated.indexOf(marker);
      if (start === -1) continue;
      const contentStart = start + marker.length;
      const end = i + 1 < parts.length ? translated.indexOf(next, contentStart) : translated.length;
      result[i] = cleanTranslation(translated.slice(contentStart, end === -1 ? translated.length : end));
    }

    if (!result[0]) throw new Error("Translation response could not be parsed.");

    const value = {
      questionRu: result[0],
      answersRu: hasImageAnswers ? [] : [1, 2, 3, 4].map((_, i) => result[i + 1] || question.answers[i].text)
    };
    save(question.id, value);
    return value;
  }

  async function translate(question) {
    const cached = get(question.id);
    if (cached) return cached;
    return translateCombined(question);
  }

  return { get, translate };
})();
