/**
 * Main Application Controller
 * Connects UI, Event Listeners, Modals, Keypad, Confetti, and Sudoku Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const game = new window.SudokuGame();
  window.appGame = game;

  // DOM Elements
  const boardEl = document.getElementById('sudoku-board');
  const timerDisplay = document.getElementById('timer-display');
  const pauseBtn = document.getElementById('pause-btn');
  const mistakesDisplay = document.getElementById('mistakes-display');
  const difficultyDisplay = document.getElementById('difficulty-display');
  const segmentedButtons = document.querySelectorAll('.ios-segment-btn');

  // Action Buttons
  const btnUndo = document.getElementById('btn-undo');
  const btnErase = document.getElementById('btn-erase');
  const btnNotes = document.getElementById('btn-notes');
  const btnHint = document.getElementById('btn-hint');
  const keypadButtons = document.querySelectorAll('.keypad-btn');

  // Notes Keypad Extra Row
  const notesKeypadContainer = document.getElementById('notes-keypad-container');
  const notesKeypadButtons = document.querySelectorAll('.notes-key-btn');
  const notesBadge = document.getElementById('notes-badge');
  const btnClearNotes = document.getElementById('btn-clear-notes');
  const btnAutoNotes = document.getElementById('btn-auto-notes');

  // Header Buttons & Modals
  const btnSettings = document.getElementById('btn-settings');
  const btnStats = document.getElementById('btn-stats');
  const btnRestart = document.getElementById('btn-restart');
  const btnNewGame = document.getElementById('btn-new-game');

  const modalSettings = document.getElementById('modal-settings');
  const modalStats = document.getElementById('modal-stats');
  const modalNewGame = document.getElementById('modal-new-game');
  const modalWin = document.getElementById('modal-win');
  const modalPause = document.getElementById('modal-pause');
  const modalConfirmRestart = document.getElementById('modal-confirm-restart');

  const btnConfirmRestart = document.getElementById('btn-confirm-restart');
  const btnCancelRestart = document.getElementById('btn-cancel-restart');
  const btnPauseRestart = document.getElementById('btn-pause-restart');
  const btnNewGameRestart = document.getElementById('btn-newgame-restart');
  const btnWinViewLb = document.getElementById('btn-win-view-lb');

  // Leaderboard & Stats Tab Switcher
  const tabViewLeaderboard = document.getElementById('tab-view-leaderboard');
  const tabViewOverview = document.getElementById('tab-view-overview');
  const viewLeaderboard = document.getElementById('view-leaderboard');
  const viewOverview = document.getElementById('view-overview');
  const btnClearLb = document.getElementById('btn-clear-lb');

  let activeLbDiff = 'easy';
  let activeOverviewDiff = 'easy';

  const closeButtons = document.querySelectorAll('.modal-close-btn');

  // Settings Toggles
  const toggleSound = document.getElementById('toggle-sound');
  const toggleHaptics = document.getElementById('toggle-haptics');
  const toggleAutoCheck = document.getElementById('toggle-autocheck');
  const toggleHighlightSame = document.getElementById('toggle-highlight-same');
  const toggleMistakeLimit = document.getElementById('toggle-mistake-limit');
  const themeSelect = document.getElementById('theme-select');

  // Initialize UI & Settings
  applyTheme(game.settings.theme);
  syncSettingsUI();

  // Try resuming saved game or generate a new one
  if (!game.resumeSavedGame()) {
    game.initNewGame('easy');
  }

  // Update initial segmented control active state
  updateSegmentedControlUI(game.difficulty);

  // Hook game callbacks
  game.onStateChange = () => renderBoard();
  game.onTimerTick = (sec) => updateTimerDisplay(sec);
  game.onGameWon = (data) => showWinModal(data);
  game.onGameOver = () => showGameOverModal();

  // Render initial board
  renderBoard();
  updateTimerDisplay(game.timerSeconds);

  /* -------------------------------------------------------------
     RENDER FUNCTIONS
  ------------------------------------------------------------- */
  function renderBoard() {
    boardEl.innerHTML = '';

    const selected = game.selectedCell;
    const selectedVal = selected ? game.currentBoard[selected.r][selected.c] : 0;
    const conflicts = game.settings.autoCheckMistakes
      ? game.engine.findConflicts(game.currentBoard)
      : new Set();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.id = `cell-${r}-${c}`;

        const isClue = game.initialBoard[r][c] !== 0;
        const currentVal = game.currentBoard[r][c];

        if (isClue) {
          cell.classList.add('clue');
        } else if (currentVal !== 0) {
          cell.classList.add('user-value');
        }

        // Check selected cell
        const isSelected = selected && selected.r === r && selected.c === c;
        if (isSelected) {
          cell.classList.add('selected');
        }

        // Check related row/column/box highlight
        if (selected && game.settings.highlightRowColBox && !isSelected) {
          const inSameRow = selected.r === r;
          const inSameCol = selected.c === c;
          const inSameBlock =
            Math.floor(selected.r / 3) === Math.floor(r / 3) &&
            Math.floor(selected.c / 3) === Math.floor(c / 3);

          if (inSameRow || inSameCol || inSameBlock) {
            cell.classList.add('highlighted');
          }
        }

        // Check same number highlight
        if (
          game.settings.highlightSameNumbers &&
          selectedVal > 0 &&
          currentVal === selectedVal &&
          !isSelected
        ) {
          cell.classList.add('same-number');
        }

        // Check mistake / error:
        // 1. Value does not match solution (incorrect user input)
        // 2. Duplicate conflict in row, column, or 3x3 block
        const isWrongValue = !isClue && currentVal !== 0 && currentVal !== game.solution[r][c];
        const isConflict = conflicts.has(`${r},${c}`);

        if (game.settings.autoCheckMistakes && (isWrongValue || isConflict)) {
          cell.classList.add('error');
        }

        // Populate Cell Content: Number or Notes Grid
        if (currentVal !== 0) {
          cell.textContent = currentVal;
        } else {
          // Render pencil notes
          const cellNotes = game.notes[r][c];
          if (cellNotes && cellNotes.size > 0) {
            const notesGrid = document.createElement('div');
            notesGrid.className = 'notes-grid';
            for (let num = 1; num <= 9; num++) {
              const noteSpan = document.createElement('span');
              noteSpan.className = 'note-digit';
              noteSpan.textContent = cellNotes.has(num) ? num : '';
              notesGrid.appendChild(noteSpan);
            }
            cell.appendChild(notesGrid);
          }
        }

        // Click cell handler
        cell.addEventListener('click', () => {
          game.selectCell(r, c);
        });

        boardEl.appendChild(cell);
      }
    }

    // Update Notes Button & Extra Notes Keypad Row
    if (game.isNotesMode) {
      btnNotes.classList.add('active');
      if (notesBadge) notesBadge.style.display = 'block';
      if (notesKeypadContainer) notesKeypadContainer.classList.add('active');
    } else {
      btnNotes.classList.remove('active');
      if (notesBadge) notesBadge.style.display = 'none';
      if (notesKeypadContainer) notesKeypadContainer.classList.remove('active');
    }

    // Update candidate state in Extra Notes Keypad
    if (notesKeypadButtons && notesKeypadButtons.length > 0) {
      const selected = game.selectedCell;
      const isClue = selected ? game.initialBoard[selected.r][selected.c] !== 0 : true;
      const isFilled = selected ? game.currentBoard[selected.r][selected.c] !== 0 : false;
      const currentNotes = (selected && !isClue) ? game.notes[selected.r][selected.c] : null;

      notesKeypadButtons.forEach(btn => {
        const noteNum = parseInt(btn.dataset.note, 10);
        if (currentNotes && currentNotes.has(noteNum)) {
          btn.classList.add('has-candidate');
        } else {
          btn.classList.remove('has-candidate');
        }

        if (!selected || isClue) {
          btn.classList.add('disabled');
        } else {
          btn.classList.remove('disabled');
        }
      });
    }

    // Update Mistakes Display
    if (game.settings.mistakeLimitEnabled) {
      mistakesDisplay.innerHTML = `<span class="mistake-badge">${game.mistakes}</span> / 3`;
    } else {
      mistakesDisplay.innerHTML = `<span class="mistake-badge">${game.mistakes}</span> 錯誤`;
    }

    // Update Keypad remaining count and completion states
    updateKeypadUI();
  }

  function updateKeypadUI() {
    const counts = game.getNumberCounts();
    keypadButtons.forEach(btn => {
      const num = parseInt(btn.dataset.num, 10);
      const placed = counts[num] || 0;
      const remaining = 9 - placed;
      const countEl = btn.querySelector('.keypad-count');

      if (remaining <= 0) {
        btn.classList.add('completed');
        if (countEl) countEl.innerHTML = '✓';
      } else {
        btn.classList.remove('completed');
        if (countEl) countEl.textContent = remaining;
      }
    });
  }

  function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerDisplay.textContent = formatted;
  }

  function updateSegmentedControlUI(diff) {
    segmentedButtons.forEach(btn => {
      if (btn.dataset.difficulty === diff) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    const labelMap = { easy: '簡單', medium: '中等', hard: '困難', expert: '大師' };
    difficultyDisplay.textContent = labelMap[diff] || '簡單';
  }

  /* -------------------------------------------------------------
     EVENT HANDLERS
  ------------------------------------------------------------- */
  // Segmented Difficulty Buttons (點擊立即切換難度並生成全新題目)
  segmentedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = btn.dataset.difficulty;
      if (diff === game.difficulty && !game.isComplete) return;

      // 立即以該難度生成全新題目並切換
      game.initNewGame(diff);
      updateSegmentedControlUI(diff);
      renderBoard();
      updateTimerDisplay(0);
    });
  });

  let currentSelectedDiff = 'easy';

  // Toolbar Actions
  btnUndo.addEventListener('click', () => game.undo());
  btnErase.addEventListener('click', () => game.eraseSelected());
  btnNotes.addEventListener('click', () => game.toggleNotesMode());
  btnHint.addEventListener('click', () => game.giveHint());

  // Extra Notes Keypad Numbers & Actions
  if (notesKeypadButtons) {
    notesKeypadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const noteNum = parseInt(btn.dataset.note, 10);
        game.toggleNoteForSelected(noteNum);
      });
    });
  }

  btnClearNotes?.addEventListener('click', () => {
    game.clearNotesForSelected();
  });

  btnAutoNotes?.addEventListener('click', () => {
    game.autoFillCandidatesForSelected();
  });

  // Main Keypad Numbers (非筆記的數字 - 點擊直接填入)
  keypadButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.num, 10);
      game.fillNumber(num);
    });
  });

  // Pause Button
  pauseBtn.addEventListener('click', () => {
    game.togglePause();
    if (game.isPaused) {
      openModal(modalPause);
    } else {
      closeModal(modalPause);
    }
  });

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    game.resumeGame();
    closeModal(modalPause);
  });

  // Keyboard Shortcuts Support
  window.addEventListener('keydown', (e) => {
    if (modalSettings.classList.contains('active') || modalStats.classList.contains('active')) {
      return;
    }

    // Number keys (1-9)
    if (e.key >= '1' && e.key <= '9') {
      const num = parseInt(e.key, 10);
      if (game.isNotesMode || e.shiftKey) {
        game.toggleNoteForSelected(num);
      } else {
        game.fillNumber(num);
      }
    }
    // Delete / Backspace
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      game.eraseSelected();
    }
    // Notes mode toggle 'n'
    else if (e.key === 'n' || e.key === 'N') {
      game.toggleNotesMode();
    }
    // Hint 'h'
    else if (e.key === 'h' || e.key === 'H') {
      game.giveHint();
    }
    // Undo 'u' or Ctrl+Z
    else if (e.key === 'u' || e.key === 'U' || (e.ctrlKey && e.key === 'z') || (e.metaKey && e.key === 'z')) {
      e.preventDefault();
      game.undo();
    }
    // Pause 'p' or Space
    else if (e.key === 'p' || e.key === 'P') {
      game.togglePause();
      if (game.isPaused) openModal(modalPause);
      else closeModal(modalPause);
    }
    // Restart 'r' or 'R'
    else if (e.key === 'r' || e.key === 'R') {
      askRestartCurrentGame();
    }
    // Arrow Navigation
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const current = game.selectedCell || { r: 0, c: 0 };
      let newR = current.r;
      let newC = current.c;

      if (e.key === 'ArrowUp') newR = Math.max(0, current.r - 1);
      if (e.key === 'ArrowDown') newR = Math.min(8, current.r + 1);
      if (e.key === 'ArrowLeft') newC = Math.max(0, current.c - 1);
      if (e.key === 'ArrowRight') newC = Math.min(8, current.c + 1);

      game.selectCell(newR, newC);
    }
  });

  /* -------------------------------------------------------------
     MODALS & SHEETS
  ------------------------------------------------------------- */
  function openModal(modal) {
    modal.classList.add('active');
  }

  function closeModal(modal) {
    modal.classList.remove('active');
  }

  // Close buttons
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.ios-modal-overlay');
      if (modal) {
        closeModal(modal);
        if (modal === modalPause && game.isPaused) {
          game.resumeGame();
        }
      }
    });
  });

  // Close on backdrop tap
  document.querySelectorAll('.ios-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
        if (overlay === modalPause && game.isPaused) {
          game.resumeGame();
        }
      }
    });
  });

  // Settings Modal
  btnSettings.addEventListener('click', () => {
    openModal(modalSettings);
  });

  // Stats & Leaderboard Modal
  btnStats.addEventListener('click', () => {
    populateStatsModal();
    openModal(modalStats);
  });

  // Restart Handlers
  function askRestartCurrentGame() {
    if (game.isPaused) {
      closeModal(modalPause);
    }
    if (modalNewGame.classList.contains('active')) {
      closeModal(modalNewGame);
    }
    openModal(modalConfirmRestart);
  }

  btnRestart?.addEventListener('click', askRestartCurrentGame);
  btnPauseRestart?.addEventListener('click', askRestartCurrentGame);
  btnNewGameRestart?.addEventListener('click', askRestartCurrentGame);

  btnCancelRestart?.addEventListener('click', () => {
    closeModal(modalConfirmRestart);
  });

  btnConfirmRestart?.addEventListener('click', () => {
    closeModal(modalConfirmRestart);
    clearConfetti();
    game.restartCurrentGame();
    renderBoard();
    updateTimerDisplay(0);
  });

  // New Game Modal
  btnNewGame.addEventListener('click', () => {
    currentSelectedDiff = game.difficulty;
    openModal(modalNewGame);
  });

  // Confirm New Game Button
  document.getElementById('confirm-new-game')?.addEventListener('click', () => {
    const selectedDiffRadio = document.querySelector('input[name="modal-diff"]:checked');
    const diff = selectedDiffRadio ? selectedDiffRadio.value : currentSelectedDiff;
    closeModal(modalNewGame);
    clearConfetti();
    game.initNewGame(diff);
    updateSegmentedControlUI(diff);
    renderBoard();
    updateTimerDisplay(0);
  });

  // Difficulty selection options in New Game modal
  document.querySelectorAll('.diff-choice-btn').forEach(choice => {
    choice.addEventListener('click', () => {
      const diff = choice.dataset.diff;
      closeModal(modalNewGame);
      clearConfetti();
      game.initNewGame(diff);
      updateSegmentedControlUI(diff);
      renderBoard();
      updateTimerDisplay(0);
    });
  });

  /* -------------------------------------------------------------
     SETTINGS SYNC
  ------------------------------------------------------------- */
  function syncSettingsUI() {
    toggleSound.checked = game.settings.soundEnabled;
    toggleHaptics.checked = game.settings.hapticsEnabled;
    toggleAutoCheck.checked = game.settings.autoCheckMistakes;
    toggleHighlightSame.checked = game.settings.highlightSameNumbers;
    toggleMistakeLimit.checked = game.settings.mistakeLimitEnabled;
    themeSelect.value = game.settings.theme;
  }

  toggleSound.addEventListener('change', () => {
    game.settings.soundEnabled = toggleSound.checked;
    game.saveSettings();
  });

  toggleHaptics.addEventListener('change', () => {
    game.settings.hapticsEnabled = toggleHaptics.checked;
    game.saveSettings();
  });

  toggleAutoCheck.addEventListener('change', () => {
    game.settings.autoCheckMistakes = toggleAutoCheck.checked;
    game.saveSettings();
    renderBoard();
  });

  toggleHighlightSame.addEventListener('change', () => {
    game.settings.highlightSameNumbers = toggleHighlightSame.checked;
    game.saveSettings();
    renderBoard();
  });

  toggleMistakeLimit.addEventListener('change', () => {
    game.settings.mistakeLimitEnabled = toggleMistakeLimit.checked;
    game.saveSettings();
    renderBoard();
  });

  themeSelect.addEventListener('change', () => {
    game.settings.theme = themeSelect.value;
    game.saveSettings();
    applyTheme(themeSelect.value);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /* -------------------------------------------------------------
     STATISTICS & LEADERBOARD MODAL
  ------------------------------------------------------------- */
  // Tab Switcher (Leaderboard vs Overview)
  tabViewLeaderboard?.addEventListener('click', () => {
    tabViewLeaderboard.classList.add('active');
    tabViewOverview.classList.remove('active');
    viewLeaderboard.style.display = 'flex';
    viewOverview.style.display = 'none';
    renderLeaderboard(activeLbDiff);
  });

  tabViewOverview?.addEventListener('click', () => {
    tabViewOverview.classList.add('active');
    tabViewLeaderboard.classList.remove('active');
    viewLeaderboard.style.display = 'none';
    viewOverview.style.display = 'flex';
    populateOverviewStats(activeOverviewDiff);
  });

  // Difficulty Buttons in Leaderboard Tab
  document.querySelectorAll('.lb-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lb-diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLbDiff = btn.dataset.diff;
      renderLeaderboard(activeLbDiff);
    });
  });

  // Difficulty Buttons in Overview Tab
  document.querySelectorAll('.overview-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.overview-diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeOverviewDiff = btn.dataset.diff;
      populateOverviewStats(activeOverviewDiff);
    });
  });

  // Clear Leaderboard
  btnClearLb?.addEventListener('click', () => {
    const diffNames = { easy: '簡單', medium: '中等', hard: '困難', expert: '大師' };
    if (confirm(`確定要清空「${diffNames[activeLbDiff]}」難度的所有排行紀錄嗎？`)) {
      game.clearLeaderboard(activeLbDiff);
      renderLeaderboard(activeLbDiff);
    }
  });

  function renderLeaderboard(diff = activeLbDiff) {
    activeLbDiff = diff;
    document.querySelectorAll('.lb-diff-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === diff);
    });

    const container = document.getElementById('leaderboard-items-container');
    if (!container) return;

    const records = (game.leaderboard && game.leaderboard[diff]) ? game.leaderboard[diff] : [];
    if (records.length === 0) {
      container.innerHTML = `
        <div class="leaderboard-empty">
          <div class="leaderboard-empty-icon">🏆</div>
          <div class="leaderboard-empty-title">尚無排行紀錄</div>
          <div class="leaderboard-empty-desc">完成一局數獨挑戰，即可榮登本難度 Top 10 最佳排行榜！</div>
        </div>
      `;
      return;
    }

    container.innerHTML = records.map((entry, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
      const medalIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const mistakesText = entry.mistakes === 0 ? '0 失誤' : `${entry.mistakes} 失誤`;
      const hintsText = entry.hintsUsed === 0 ? '0 提示' : `${entry.hintsUsed} 提示`;
      const isFlawless = entry.mistakes === 0 && entry.hintsUsed === 0;

      return `
        <div class="leaderboard-item ${rankClass}">
          <div class="lb-left">
            <div class="lb-rank-badge">${medalIcon}</div>
            <div class="lb-info">
              <div class="lb-time">${formatDuration(entry.time)}</div>
              <div class="lb-meta">
                <span>${entry.date || '剛剛'}</span>
              </div>
            </div>
          </div>
          <div class="lb-tags">
            ${isFlawless ? '<span class="lb-tag flawless">完美通關</span>' : ''}
            <span class="lb-tag">${mistakesText}</span>
            <span class="lb-tag">${hintsText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function populateOverviewStats(diff = activeOverviewDiff) {
    activeOverviewDiff = diff;
    document.querySelectorAll('.overview-diff-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === diff);
    });

    const stats = game.stats[diff] || { played: 0, won: 0, bestTime: null, totalTime: 0 };
    document.getElementById('stat-played').textContent = stats.played;
    const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
    document.getElementById('stat-winrate').textContent = `${winRate}%`;

    const bestTimeStr = stats.bestTime ? formatDuration(stats.bestTime) : '--:--';
    document.getElementById('stat-besttime').textContent = bestTimeStr;

    const avgTimeSec = stats.won > 0 ? Math.round(stats.totalTime / stats.won) : 0;
    document.getElementById('stat-avgtime').textContent = avgTimeSec > 0 ? formatDuration(avgTimeSec) : '--:--';
  }

  function populateStatsModal() {
    activeLbDiff = game.difficulty;
    activeOverviewDiff = game.difficulty;
    renderLeaderboard(activeLbDiff);
    populateOverviewStats(activeOverviewDiff);
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /* -------------------------------------------------------------
     WIN MODAL & CONFETTI CELEBRATION
  ------------------------------------------------------------- */
  function showWinModal(data) {
    const diffNames = { easy: '簡單', medium: '中等', hard: '困難', expert: '大師' };
    document.getElementById('win-diff-label').textContent = `${diffNames[data.difficulty]}難度`;
    document.getElementById('win-time-val').textContent = formatDuration(data.time);
    document.getElementById('win-best-val').textContent = formatDuration(data.bestTime);
    document.getElementById('win-mistakes-val').textContent = data.mistakes;

    const rankBadge = document.getElementById('win-rank-badge');
    const rankNum = document.getElementById('win-rank-num');
    if (data.rank && data.rank <= 10) {
      rankNum.textContent = data.rank;
      rankBadge.style.display = 'inline-block';
    } else {
      rankBadge.style.display = 'none';
    }

    openModal(modalWin);
    launchConfetti();
  }

  document.getElementById('btn-win-view-lb')?.addEventListener('click', () => {
    closeModal(modalWin);
    clearConfetti();
    tabViewLeaderboard.click();
    activeLbDiff = game.difficulty;
    renderLeaderboard(activeLbDiff);
    openModal(modalStats);
  });

  function clearConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  document.getElementById('btn-win-next')?.addEventListener('click', () => {
    closeModal(modalWin);
    clearConfetti();
    game.initNewGame(game.difficulty);
    updateSegmentedControlUI(game.difficulty);
    renderBoard();
    updateTimerDisplay(0);
  });

  function showGameOverModal() {
    alert('遊戲結束！您已達到 3 次錯誤上限。點擊確認開始新遊戲。');
    game.initNewGame(game.difficulty);
    renderBoard();
    updateTimerDisplay(0);
  }

  /* -------------------------------------------------------------
     CANVAS CONFETTI
  ------------------------------------------------------------- */
  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6', '#FFCC00'];

    for (let i = 0; i < 90; i++) {
      pieces.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // Gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.009;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      frame++;
      if (alive && frame < 180) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(animate);
  }
});
