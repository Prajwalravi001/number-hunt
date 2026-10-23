// Number Hunt by Prajwal
// Personal records are stored in this browser using localStorage.
// No backend or account is required. Records are device/browser-specific.

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;
const MAX_ATTEMPTS = 7;
const SCORE_STORAGE_KEY = "numberHunt.personalRecords.v1";

const guessForm = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess-input");
const guessButton = document.querySelector("#guess-button");
const attemptCount = document.querySelector("#attempt-count");
const attemptDots = document.querySelector("#attempt-dots");
const feedback = document.querySelector("#feedback");
const feedbackText = document.querySelector("#feedback-text");
const restartButton = document.querySelector("#restart-button");
const lastGuess = document.querySelector("#last-guess");
const lastResult = document.querySelector("#last-result");
const recentGuesses = document.querySelector("#recent-guesses");
const historyCount = document.querySelector("#history-count");
const bestScore = document.querySelector("#best-score");
const totalWins = document.querySelector("#total-wins");
const winStreak = document.querySelector("#win-streak");
const scoreMessage = document.querySelector("#score-message");
const resetScoresButton = document.querySelector("#reset-scores");

let secretNumber;
let attemptsUsed;
let gameOver;
let guessHistory = [];

function emptyRecords() {
  return { bestGuesses: null, totalWins: 0, currentStreak: 0, bestStreak: 0 };
}

function loadRecords() {
  try {
    const saved = localStorage.getItem(SCORE_STORAGE_KEY);
    if (!saved) return emptyRecords();
    const parsed = JSON.parse(saved);
    return {
      bestGuesses: Number.isInteger(parsed.bestGuesses) && parsed.bestGuesses >= 1 && parsed.bestGuesses <= MAX_ATTEMPTS
        ? parsed.bestGuesses : null,
      totalWins: Number.isInteger(parsed.totalWins) && parsed.totalWins >= 0 ? parsed.totalWins : 0,
      currentStreak: Number.isInteger(parsed.currentStreak) && parsed.currentStreak >= 0 ? parsed.currentStreak : 0,
      bestStreak: Number.isInteger(parsed.bestStreak) && parsed.bestStreak >= 0 ? parsed.bestStreak : 0
    };
  } catch {
    return emptyRecords();
  }
}

let records = loadRecords();

function saveRecords() {
  try {
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(records));
  } catch {
    scoreMessage.textContent = "Records cannot be saved in this browser session.";
  }
}

function updateScoreboard() {
  bestScore.textContent = records.bestGuesses === null ? "—" : records.bestGuesses;
  totalWins.textContent = records.totalWins;
  winStreak.textContent = records.currentStreak;
  if (records.totalWins === 0) {
    scoreMessage.textContent = "Win a round to set your first record.";
  } else {
    scoreMessage.textContent = `Best: ${records.bestGuesses} ${records.bestGuesses === 1 ? "guess" : "guesses"} · Best streak: ${records.bestStreak}. Records stay in this browser.`;
  }
}

function startGame() {
  secretNumber = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
  attemptsUsed = 0;
  gameOver = false;
  guessHistory = [];

  guessInput.disabled = false;
  guessButton.disabled = false;
  guessInput.value = "";
  guessInput.min = MIN_NUMBER;
  guessInput.max = MAX_NUMBER;
  restartButton.hidden = true;

  setFeedback("System ready. Make your first guess.", "ready");
  updateAttempts();
  updateHistory();
  updateScoreboard();
  guessInput.focus();
}

function setFeedback(message, type) {
  feedbackText.textContent = message;
  feedback.className = `feedback ${type}`;
}

function updateAttempts() {
  const remaining = MAX_ATTEMPTS - attemptsUsed;
  attemptCount.innerHTML = `${remaining} <small>/ ${MAX_ATTEMPTS}</small>`;
  [...attemptDots.children].forEach((dot, index) => {
    dot.classList.toggle("used", index >= remaining);
  });
  attemptDots.setAttribute("aria-label", `${remaining} attempts remaining`);
}

function updateHistory() {
  historyCount.textContent = `${guessHistory.length} ${guessHistory.length === 1 ? "GUESS" : "GUESSES"}`;
  if (guessHistory.length === 0) {
    lastGuess.textContent = "—";
    lastResult.textContent = "No guesses yet";
    lastResult.style.color = "";
    recentGuesses.innerHTML = '<span class="empty-history">Your guesses will appear here.</span>';
    return;
  }

  const latest = guessHistory[guessHistory.length - 1];
  lastGuess.textContent = latest.number;
  lastResult.textContent = latest.resultLabel;
  lastResult.style.color = latest.result === "correct" ? "var(--cyan)" :
    latest.result === "low" ? "#ffdc91" : "#d5c5ff";

  recentGuesses.innerHTML = "";
  guessHistory.slice(-5).reverse().forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = `guess-chip ${entry.result}`;
    chip.textContent = entry.number;
    chip.title = entry.resultLabel;
    recentGuesses.appendChild(chip);
  });
}

function recordWin() {
  records.totalWins += 1;
  records.currentStreak += 1;
  records.bestStreak = Math.max(records.bestStreak, records.currentStreak);
  if (records.bestGuesses === null || attemptsUsed < records.bestGuesses) {
    records.bestGuesses = attemptsUsed;
    scoreMessage.textContent = `New personal best! You won in ${attemptsUsed} ${attemptsUsed === 1 ? "guess" : "guesses"}.`;
  }
  saveRecords();
  updateScoreboard();
}

function recordLoss() {
  records.currentStreak = 0;
  saveRecords();
  updateScoreboard();
}

function finishGame(message, type) {
  gameOver = true;
  guessInput.disabled = true;
  guessButton.disabled = true;
  restartButton.hidden = false;
  setFeedback(message, type);
}

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (gameOver) return;

  const guess = Number(guessInput.value);
  if (!Number.isInteger(guess) || guess < MIN_NUMBER || guess > MAX_NUMBER) {
    setFeedback("Enter a whole number between 1 and 100.", "ready");
    guessInput.focus();
    return;
  }

  attemptsUsed++;
  let result;
  let resultLabel;
  if (guess === secretNumber) {
    result = "correct";
    resultLabel = "Correct!";
  } else if (guess < secretNumber) {
    result = "low";
    resultLabel = "Too low";
  } else {
    result = "high";
    resultLabel = "Too high";
  }

  guessHistory.push({ number: guess, result, resultLabel });
  updateAttempts();
  updateHistory();

  if (guess === secretNumber) {
    recordWin();
    finishGame(`Target acquired! The secret number was ${secretNumber}.`, "win");
    return;
  }

  if (attemptsUsed === MAX_ATTEMPTS) {
    recordLoss();
    finishGame(`Mission over. The secret number was ${secretNumber}.`, "loss");
    return;
  }

  setFeedback(guess < secretNumber ? "Too low. Try a higher number." : "Too high. Try a lower number.", guess < secretNumber ? "low" : "high");
  guessInput.value = "";
  guessInput.focus();
});

restartButton.addEventListener("click", startGame);

resetScoresButton.addEventListener("click", () => {
  const confirmed = window.confirm("Reset all Number Hunt personal records in this browser?");
  if (!confirmed) return;
  records = emptyRecords();
  saveRecords();
  updateScoreboard();
});

updateScoreboard();
startGame();

