(() => {
  "use strict";
  const levels = {
    easy: { min: 1, max: 50, attempts: 10, label: "EASY" },
    medium: { min: 1, max: 100, attempts: 7, label: "MEDIUM" },
    hard: { min: 1, max: 500, attempts: 8, label: "HARD" }
  };
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "numberHunt.personalRecords.v1";
  const NAME_KEY = "numberHunt.playerName.v1";
  let levelKey = "medium", secret = 0, attemptsUsed = 0, history = [], gameOver = false, won = false;
  let soundOn = true, audioContext = null;
  let records = loadRecords();

  function loadRecords() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return value && typeof value === "object" ? {
        bestScore: Number.isInteger(value.bestScore) ? value.bestScore : null,
        totalWins: Number(value.totalWins) || 0,
        currentStreak: Number(value.currentStreak) || 0,
        bestStreak: Number(value.bestStreak) || 0
      } : { bestScore: null, totalWins: 0, currentStreak: 0, bestStreak: 0 };
    } catch (_) { return { bestScore: null, totalWins: 0, currentStreak: 0, bestStreak: 0 }; }
  }
  function saveRecords() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (_) {}
    renderRecords();
  }
  function renderRecords() {
    $("bestScore").textContent = records.bestScore ?? "—";
    $("totalWins").textContent = records.totalWins;
    $("currentStreak").textContent = records.currentStreak;
    $("bestStreak").textContent = records.bestStreak;
  }
  function currentLevel() { return levels[levelKey]; }
  function playerName() { return $("playerName").value.trim() || "Hunter"; }
  function setMessage(text, type = "") {
    const el = $("message"); el.textContent = text; el.className = "message" + (type ? " " + type : "");
  }
  function setStatus(text, active = true) {
    $("gameStatus").innerHTML = `<span class="status-dot"></span> ${text}`;
    $("gameStatus").style.color = active ? "var(--green)" : "var(--muted)";
  }
  function updateAttempts() {
    const cfg = currentLevel(), left = cfg.attempts - attemptsUsed;
    $("attemptsLeft").textContent = left;
    $("attemptsTotal").textContent = " / " + cfg.attempts;
    $("attemptTrack").innerHTML = "";
    for (let i = 0; i < cfg.attempts; i++) {
      const block = document.createElement("span");
      block.className = "attempt-block " + (i >= attemptsUsed ? "active" : "used");
      $("attemptTrack").appendChild(block);
    }
  }
  function renderHistory() {
    const el = $("guessHistory");
    if (!history.length) { el.innerHTML = '<div class="empty-history">Your guesses will appear here.</div>'; return; }
    el.innerHTML = "";
    history.slice(0, 5).forEach(item => {
      const row = document.createElement("div");
      row.className = "history-item " + item.kind;
      const num = document.createElement("strong"); num.className = "history-number"; num.textContent = item.guess;
      const hint = document.createElement("span"); hint.className = "history-hint"; hint.textContent = item.hint;
      const badge = document.createElement("span"); badge.className = "history-badge"; badge.textContent = item.badge;
      row.append(num, hint, badge); el.appendChild(row);
    });
  }
  function thermal(distance) {
    const maxDistance = currentLevel().max - currentLevel().min;
    const closeness = Math.max(0, 100 - (distance / maxDistance) * 100);
    $("thermalFill").style.width = closeness + "%";
    let label;
    if (distance === 0) label = "TARGET ACQUIRED";
    else if (distance <= Math.max(2, Math.ceil(maxDistance * .02))) label = "🔥 BURNING HOT";
    else if (distance <= Math.max(5, Math.ceil(maxDistance * .08))) label = "🌡️ HOT: VERY CLOSE";
    else if (distance <= Math.ceil(maxDistance * .18)) label = "WARM: GETTING CLOSER";
    else if (distance <= Math.ceil(maxDistance * .35)) label = "COOL: KEEP SEARCHING";
    else label = "❄️ COLD: FAR FROM TARGET";
    $("thermalLabel").textContent = label;
  }
  function tone(freq, duration, type = "sine", volume = .045, delay = 0) {
    if (!soundOn) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const start = audioContext.currentTime + delay, oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(.001, start + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + duration);
    } catch (_) {}
  }
  function clickSound() { tone(480, .055, "square", .018); }
  function winSound() { [523,659,784,1047].forEach((f,i) => tone(f,.28,"triangle",.055,i*.12)); }
  function loseSound() { tone(330,.2,"sawtooth",.025); tone(220,.35,"sawtooth",.02,.18); }
  function startGame() {
    const cfg = currentLevel();
    secret = Math.floor(Math.random() * (cfg.max - cfg.min + 1)) + cfg.min;
    attemptsUsed = 0; history = []; gameOver = false; won = false;
    $("rangeDisplay").textContent = String(cfg.min).padStart(2,"0") + " — " + cfg.max;
    $("guessInput").min = cfg.min; $("guessInput").max = cfg.max; $("guessInput").value = "";
    $("guessInput").placeholder = "??"; $("guessInput").disabled = false; $("guessButton").disabled = false;
    $("guessInput").setAttribute("aria-label", `Guess a number from ${cfg.min} to ${cfg.max}`);
    $("lastGuess").textContent = "—"; $("lastResult").textContent = "WAITING";
    $("thermalFill").style.width = "0%"; $("thermalLabel").textContent = "WAITING FOR FIRST GUESS";
    $("targetQuestion")?.classList?.remove("target-hit");
    document.querySelector(".game-panel").classList.remove("target-hit");
    $("winOverlay").classList.remove("show"); $("winOverlay").setAttribute("aria-hidden","true");
    $("confetti").innerHTML = "";
    updateAttempts(); renderHistory(); setStatus("READY");
    setMessage(`${playerName()}, target range ${cfg.min}–${cfg.max}. Find the number in ${cfg.attempts} attempts.`);
  }
  function confettiBurst() {
    const holder = $("confetti"); holder.innerHTML = "";
    for (let i = 0; i < 85; i++) {
      const piece = document.createElement("span"); piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.animationDelay = Math.random() * .9 + "s";
      piece.style.animationDuration = (1.7 + Math.random() * 1.8) + "s";
      piece.style.transform = `rotate(${Math.random()*360}deg)`;
      holder.appendChild(piece);
    }
  }
  function showWin() {
    $("winTitle").textContent = `${playerName()}, TARGET ACQUIRED!`;
    $("winText").textContent = `You cracked ${secret} in ${attemptsUsed} ${attemptsUsed === 1 ? "guess" : "guesses"}. That's a successful hunt!`;
    confettiBurst(); $("winOverlay").classList.add("show"); $("winOverlay").setAttribute("aria-hidden","false");
    document.querySelector(".game-panel").classList.add("target-hit");
    winSound();
  }
  function finishWin() {
    gameOver = true; won = true; setStatus("VICTORY", false);
    $("guessInput").disabled = true; $("guessButton").disabled = true;
    records.totalWins += 1; records.currentStreak += 1; records.bestStreak = Math.max(records.bestStreak, records.currentStreak);
    if (records.bestScore === null || attemptsUsed < records.bestScore) records.bestScore = attemptsUsed;
    saveRecords(); setMessage(`${playerName()}, target acquired! You won in ${attemptsUsed} ${attemptsUsed === 1 ? "guess" : "guesses"}!`, "good");
    $("lastResult").textContent = "TARGET FOUND"; $("lastResult").style.color = "var(--green)";
    showWin();
  }
  function finishLoss() {
    gameOver = true; setStatus("ROUND OVER", false); $("guessInput").disabled = true; $("guessButton").disabled = true;
    records.currentStreak = 0; saveRecords(); setMessage(`Out of attempts! The secret number was ${secret}. Start another hunt, ${playerName()}.`, "bad");
    $("lastResult").textContent = "MISSED"; $("lastResult").style.color = "var(--red)"; loseSound();
  }
  function submitGuess(event) {
    event.preventDefault(); if (gameOver) return;
    const cfg = currentLevel(), raw = $("guessInput").value;
    if (raw.trim() === "") { setMessage("Enter a number before locking in.", "bad"); return; }
    const guess = Number(raw);
    if (!Number.isInteger(guess) || guess < cfg.min || guess > cfg.max) {
      setMessage(`Your guess must be a whole number from ${cfg.min} to ${cfg.max}.`, "bad");
      $("guessInput").classList.remove("shake"); void $("guessInput").offsetWidth; $("guessInput").classList.add("shake"); tone(180,.09,"square",.02); return;
    }
    if (history.some(item => item.guess === guess)) {
      setMessage("You've already tried that number. Make a new guess.", "warm"); return;
    }
    attemptsUsed++;
    const distance = Math.abs(secret - guess);
    let item;
    if (guess === secret) {
      item = { guess, hint: "Perfect hit!", badge: "WIN", kind: "win" };
    } else if (guess < secret) {
      const close = distance <= Math.max(5, Math.ceil((cfg.max-cfg.min)*.08));
      item = { guess, hint: close ? "Too low · very close" : "Too low · aim higher", badge: close ? "HOT" : "LOW", kind: close ? "close" : "far" };
    } else {
      const close = distance <= Math.max(5, Math.ceil((cfg.max-cfg.min)*.08));
      item = { guess, hint: close ? "Too high · very close" : "Too high · aim lower", badge: close ? "HOT" : "HIGH", kind: close ? "close" : "far" };
    }
    history.unshift(item); $("lastGuess").textContent = guess;
    $("lastResult").textContent = item.badge; $("lastResult").style.color = item.kind === "win" ? "var(--green)" : item.kind === "close" ? "var(--yellow)" : "var(--muted)";
    updateAttempts(); renderHistory(); thermal(distance);
    if (guess === secret) { finishWin(); return; }
    tone(guess < secret ? 290 : 390, .08, "sine", .025);
    if (attemptsUsed >= cfg.attempts) { finishLoss(); return; }
    const distanceHint = distance <= Math.max(2, Math.ceil((cfg.max-cfg.min)*.02)) ? " You're burning hot!" :
      distance <= Math.max(5, Math.ceil((cfg.max-cfg.min)*.08)) ? " You're very close!" :
      distance <= Math.ceil((cfg.max-cfg.min)*.18) ? " You're getting warmer." : " That's cold.";
    setMessage((guess < secret ? "Too low. Go higher." : "Too high. Go lower.") + distanceHint, item.kind === "close" ? "warm" : "");
    $("guessInput").value = ""; $("guessInput").focus();
  }
  document.querySelectorAll(".level-card").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.level === levelKey) return;
      levelKey = button.dataset.level;
      document.querySelectorAll(".level-card").forEach(b => b.classList.toggle("selected", b === button));
      clickSound(); startGame();
    });
  });
  $("guessForm").addEventListener("submit", submitGuess);
  $("restartButton").addEventListener("click", () => { clickSound(); startGame(); });
  $("newGameTop").addEventListener("click", () => { clickSound(); startGame(); });
  $("overlayNewGame").addEventListener("click", () => { clickSound(); startGame(); });
  $("playerName").addEventListener("input", () => {
    try { localStorage.setItem(NAME_KEY, $("playerName").value.trim()); } catch (_) {}
    $("welcomeText").textContent = `Welcome, ${playerName()}. Ready to hunt?`;
  });
  $("soundToggle").addEventListener("click", () => {
    soundOn = !soundOn; $("soundToggle").innerHTML = soundOn ? "🔊 <span>Sound on</span>" : "🔇 <span>Sound off</span>";
    $("soundToggle").classList.toggle("muted-sound", !soundOn); $("soundToggle").setAttribute("aria-pressed", String(soundOn));
    if (soundOn) clickSound();
  });
  $("resetRecords").addEventListener("click", () => {
    if (!confirm("Reset all Number Hunt records on this browser? This cannot be undone.")) return;
    records = { bestScore: null, totalWins: 0, currentStreak: 0, bestStreak: 0 };
    saveRecords(); setMessage("Records reset. A fresh legend begins now.", "good"); clickSound();
  });
  $("guessInput").addEventListener("keydown", event => { if (event.key === "Escape") $("guessInput").value = ""; });
  $("winOverlay").addEventListener("click", event => { if (event.target === $("winOverlay")) { $("winOverlay").classList.remove("show"); $("winOverlay").setAttribute("aria-hidden","true"); } });
  try { $("playerName").value = localStorage.getItem(NAME_KEY) || ""; } catch (_) {}
  $("welcomeText").textContent = `Welcome, ${playerName()}. Ready to hunt?`;
  renderRecords(); startGame();
})();
