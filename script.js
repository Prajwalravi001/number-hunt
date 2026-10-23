// Number Hunt: game logic translated from the original C program.

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

let secretNumber;
let attemptsUsed;
let gameOver;

function startGame() {
  // Math.random() returns a value from 0 (inclusive) to 1 (exclusive).
  // This formula gives a whole number from 1 through 100.
  secretNumber = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
  attemptsUsed = 0;
  gameOver = false;

  guessInput.disabled = false;
  guessButton.disabled = false;
  guessInput.value = "";
  guessInput.min = MIN_NUMBER;
  guessInput.max = MAX_NUMBER;
  restartButton.hidden = true;

  setFeedback("System ready. Make your first guess.", "ready");
  updateAttempts();
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
  updateAttempts();

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
