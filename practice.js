// Pure logic for the practice games. `rng` is injectable (default Math.random) so tests are deterministic.
export const shuffle = (list, rng = Math.random) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const usable = (words) => words.filter((w) => w.data.word && w.data.translation);
export const pick = (words, n, rng) => shuffle(usable(words), rng).slice(0, n);

// Word Match: n words, English on the left and Kazakh on the right, both shuffled. Words with the same translation are skipped.
export function matchSet(words, n = 5, rng) {
  const seen = new Set(), own = usable(words).filter((w) => !seen.has(w.data.translation) && seen.add(w.data.translation));
  const chosen = shuffle(own, rng).slice(0, n);
  return { ids: chosen.map((w) => w.id), left: shuffle(chosen, rng), right: shuffle(chosen, rng) };
}

// Speed Quiz: the word and 4 translations, one of them right. Needs 4 different translations; otherwise null.
export function quizQuestion(words, rng) {
  const own = usable(words), tr = [...new Set(own.map((w) => w.data.translation))];
  if (tr.length < 4) return null;
  const target = own[Math.floor((rng ?? Math.random)() * own.length)];
  const wrong = shuffle(tr.filter((t) => t !== target.data.translation), rng).slice(0, 3);
  return { word: target.data.word, answer: target.data.translation, options: shuffle([target.data.translation, ...wrong], rng) };
}

// Sentence Builder: example sentences of 3 to 12 words. Returns the tokens in a different order than the sentence whenever one exists.
export const sentenceTokens = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean);
export function sentenceRound(words, rng) {
  const own = words.filter((w) => { const n = sentenceTokens(w.data.example).length; return n >= 3 && n <= 12; });
  if (!own.length) return null;
  const w = own[Math.floor((rng ?? Math.random)() * own.length)], tokens = sentenceTokens(w.data.example);
  let mixed = shuffle(tokens, rng);
  for (let i = 0; i < 5 && mixed.join(" ") === tokens.join(" ") && new Set(tokens).size > 1; i++) mixed = shuffle(tokens, rng);
  return { word: w.data.word, translation: w.data.translation, sentence: tokens.join(" "), tokens: mixed };
}
export const sentenceOk = (built, sentence) => built.join(" ") === sentence;

// Audio Spelling: letters and case do not have to match exactly in spacing, only in the letters.
export const spellingOk = (typed, word) => typed.trim().replace(/\s+/g, " ").toLowerCase() === word.trim().replace(/\s+/g, " ").toLowerCase();
