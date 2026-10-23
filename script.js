// Number Hunt by Prajwal
// Browser version of the original C number guessing game.

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;
const MAX_ATTEMPTS = 7;

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

let secretNumber;
let attemptsUsed;
let gameOver;
let guessHistory = [];

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
    recentGuesses.innerHTML = '<span class="empty-history">Your guesses will appear here.</span>';
    return;
  }

  const latest = guessHistory[guessHistory.length - 1];
  lastGuess.textContent = latest.number;
  lastResult.textContent = latest.resultLabel;
  lastResult.style.color = latest.result === "correct" ? "var(--cyan)" :
    latest.result === "low" ? "#ffdc91" : "#d5c5ff";

  const lastFive = guessHistory.slice(-5).reverse();
  recentGuesses.innerHTML = "";
  lastFive.forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = `guess-chip ${entry.result}`;
    chip.textContent = entry.number;
    chip.title = entry.resultLabel;
    recentGuesses.appendChild(chip);
  });
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

  // Count each valid guess, including the winning guess.
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
    finishGame(`Target acquired! The secret number was ${secretNumber}.`, "win");
    return;
  }

  if (attemptsUsed === MAX_ATTEMPTS) {
    finishGame(`Mission over. The secret number was ${secretNumber}.`, "loss");
    return;
  }

  if (guess < secretNumber) {
    setFeedback("Too low. Try a higher number.", "low");
  } else {
    setFeedback("Too high. Try a lower number.", "high");
  }

  guessInput.value = "";
  guessInput.focus();
});

restartButton.addEventListener("click", startGame);

startGame();

