/**
 * Sudoku Game State Controller
 * Handles moves, notes, undo/redo, timer, hints, stats and persistence
 */

class SudokuGame {
  constructor() {
    this.engine = new window.SudokuEngine();
    this.sound = window.soundFx;

    this.difficulty = 'easy';
    this.initialBoard = null;
    this.solution = null;
    this.currentBoard = null;
    this.notes = null; // 9x9 array of Sets
    this.selectedCell = null;
    this.history = [];
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.isNotesMode = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isComplete = false;

    this.settings = this.loadSettings();
    this.stats = this.loadStats();
    this.leaderboard = this.loadLeaderboard();

    // Apply sound settings
    this.sound.soundEnabled = this.settings.soundEnabled;
    this.sound.hapticsEnabled = this.settings.hapticsEnabled;
  }

  // Load user settings from localStorage
  loadSettings() {
    const defaults = {
      soundEnabled: true,
      hapticsEnabled: true,
      highlightSameNumbers: true,
      highlightRowColBox: true,
      autoCheckMistakes: true,
      autoRemoveNotes: true,
      mistakeLimitEnabled: false, // Default friendly free play, toggleable
      theme: 'system' // 'system' | 'light' | 'dark'
    };
    try {
      const saved = localStorage.getItem('sudoku_settings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
      return defaults;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('sudoku_settings', JSON.stringify(this.settings));
      this.sound.soundEnabled = this.settings.soundEnabled;
      this.sound.hapticsEnabled = this.settings.hapticsEnabled;
    } catch (e) {}
  }

  // Load statistics from localStorage
  loadStats() {
    const defaultStats = {
      easy: { played: 0, won: 0, bestTime: null, totalTime: 0 },
      medium: { played: 0, won: 0, bestTime: null, totalTime: 0 },
      hard: { played: 0, won: 0, bestTime: null, totalTime: 0 },
      expert: { played: 0, won: 0, bestTime: null, totalTime: 0 }
    };
    try {
      const saved = localStorage.getItem('sudoku_stats');
      return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    } catch (e) {
      return defaultStats;
    }
  }

  saveStats() {
    try {
      localStorage.setItem('sudoku_stats', JSON.stringify(this.stats));
    } catch (e) {}
  }

  // Load leaderboard from localStorage
  loadLeaderboard() {
    const defaultLb = {
      easy: [],
      medium: [],
      hard: [],
      expert: []
    };
    try {
      const saved = localStorage.getItem('sudoku_leaderboard');
      return saved ? { ...defaultLb, ...JSON.parse(saved) } : defaultLb;
    } catch (e) {
      return defaultLb;
    }
  }

  saveLeaderboard() {
    try {
      localStorage.setItem('sudoku_leaderboard', JSON.stringify(this.leaderboard));
    } catch (e) {}
  }

  // Clear leaderboard records
  clearLeaderboard(difficulty = null) {
    if (difficulty && this.leaderboard[difficulty]) {
      this.leaderboard[difficulty] = [];
    } else {
      this.leaderboard = { easy: [], medium: [], hard: [], expert: [] };
    }
    this.saveLeaderboard();
  }

  // Restart the current puzzle from scratch (Reset)
  restartCurrentGame() {
    if (!this.initialBoard) return;
    this.stopTimer();

    this.currentBoard = this.engine.cloneGrid(this.initialBoard);
    this.notes = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set())
    );

    this.selectedCell = null;
    this.history = [];
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.timerSeconds = 0;
    this.isNotesMode = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isComplete = false;

    this.sound.playErase();
    this.startTimer();
    this.saveCurrentGame();
    if (this.onStateChange) this.onStateChange();
    if (this.onTimerTick) this.onTimerTick(0);
  }

  // Initialize a new game
  initNewGame(difficulty = this.difficulty) {
    this.stopTimer();
    this.difficulty = difficulty;
    const generated = this.engine.generatePuzzle(difficulty);

    this.initialBoard = generated.puzzle;
    this.solution = generated.solution;
    this.currentBoard = this.engine.cloneGrid(this.initialBoard);
    
    // 9x9 Sets for pencil notes
    this.notes = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set())
    );

    this.selectedCell = null;
    this.history = [];
    this.mistakes = 0;
    this.hintsUsed = 0;
    this.timerSeconds = 0;
    this.isNotesMode = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isComplete = false;

    // Record game played in stats
    if (this.stats[this.difficulty]) {
      this.stats[this.difficulty].played++;
      this.saveStats();
    }

    this.startTimer();
    this.saveCurrentGame();
    if (this.onStateChange) this.onStateChange();
  }

  // Save in-progress game to localStorage
  saveCurrentGame() {
    if (this.isComplete || this.isGameOver || !this.currentBoard) return;
    try {
      // Serialize notes Sets to arrays
      const serializableNotes = this.notes.map(row =>
        row.map(set => Array.from(set))
      );

      const state = {
        difficulty: this.difficulty,
        initialBoard: this.initialBoard,
        solution: this.solution,
        currentBoard: this.currentBoard,
        notes: serializableNotes,
        mistakes: this.mistakes,
        hintsUsed: this.hintsUsed,
        timerSeconds: this.timerSeconds,
        history: this.history
      };
      localStorage.setItem('sudoku_active_game', JSON.stringify(state));
    } catch (e) {}
  }

  // Resume saved game if exists
  resumeSavedGame() {
    try {
      const saved = localStorage.getItem('sudoku_active_game');
      if (!saved) return false;

      const state = JSON.parse(saved);
      if (!state.currentBoard || !state.solution) return false;

      this.difficulty = state.difficulty || 'easy';
      this.initialBoard = state.initialBoard;
      this.solution = state.solution;
      this.currentBoard = state.currentBoard;
      this.notes = state.notes.map(row =>
        row.map(arr => new Set(arr))
      );
      this.mistakes = state.mistakes || 0;
      this.hintsUsed = state.hintsUsed || 0;
      this.timerSeconds = state.timerSeconds || 0;
      this.history = state.history || [];
      this.selectedCell = null;
      this.isNotesMode = false;
      this.isPaused = false;
      this.isGameOver = false;
      this.isComplete = false;

      this.startTimer();
      return true;
    } catch (e) {
      return false;
    }
  }

  clearSavedGame() {
    try {
      localStorage.removeItem('sudoku_active_game');
    } catch (e) {}
  }

  // Timer controls
  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.isPaused && !this.isComplete && !this.isGameOver) {
        this.timerSeconds++;
        if (this.onTimerTick) this.onTimerTick(this.timerSeconds);
        // Save periodically every 10 seconds
        if (this.timerSeconds % 10 === 0) {
          this.saveCurrentGame();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  pauseGame() {
    this.isPaused = true;
    if (this.onStateChange) this.onStateChange();
  }

  resumeGame() {
    this.isPaused = false;
    if (this.onStateChange) this.onStateChange();
  }

  togglePause() {
    if (this.isPaused) this.resumeGame();
    else this.pauseGame();
  }

  // Cell selection
  selectCell(r, c) {
    if (this.isPaused || this.isGameOver || this.isComplete) return;
    this.selectedCell = { r, c };
    this.sound.playTap();
    if (this.onStateChange) this.onStateChange();
  }

  // User input action
  handleNumberInput(num) {
    if (!this.selectedCell || this.isPaused || this.isGameOver || this.isComplete) return;

    const { r, c } = this.selectedCell;

    // Cannot modify original clue cells
    if (this.initialBoard[r][c] !== 0) return;

    if (this.isNotesMode) {
      // Toggle note candidate
      this.saveHistorySnapshot();
      if (this.notes[r][c].has(num)) {
        this.notes[r][c].delete(num);
      } else {
        this.notes[r][c].add(num);
      }
      this.sound.playNote();
    } else {
      // Normal placement
      const currentVal = this.currentBoard[r][c];

      // If already has this value, clear it
      if (currentVal === num) {
        this.saveHistorySnapshot();
        this.currentBoard[r][c] = 0;
        this.sound.playErase();
      } else {
        this.saveHistorySnapshot();
        this.currentBoard[r][c] = num;
        this.notes[r][c].clear();

        // Check if correct against solution
        const isCorrect = this.solution[r][c] === num;

        if (this.settings.autoCheckMistakes && !isCorrect) {
          this.mistakes++;
          this.sound.playError();

          if (this.settings.mistakeLimitEnabled && this.mistakes >= 3) {
            this.handleGameOver();
            return;
          }
        } else {
          this.sound.playPlace();
        }

        // Auto remove notes from row, column, box
        if (this.settings.autoRemoveNotes && isCorrect) {
          this.autoClearRelatedNotes(r, c, num);
        }

        // Check completion
        this.checkWinCondition();
      }
    }

    this.saveCurrentGame();
    if (this.onStateChange) this.onStateChange();
  }

  // Direct number placement (always fills the number into cell, ignoring notes mode)
  fillNumber(num) {
    if (!this.selectedCell || this.isPaused || this.isGameOver || this.isComplete) return;

    const { r, c } = this.selectedCell;

    // Cannot modify original clue cells
    if (this.initialBoard[r][c] !== 0) return;

    const currentVal = this.currentBoard[r][c];

    // If already has this value, clear it
    if (currentVal === num) {
      this.saveHistorySnapshot();
      this.currentBoard[r][c] = 0;
      this.sound.playErase();
    } else {
      this.saveHistorySnapshot();
      this.currentBoard[r][c] = num;
      this.notes[r][c].clear();

      // Check if correct against solution
      const isCorrect = this.solution[r][c] === num;

      if (this.settings.autoCheckMistakes && !isCorrect) {
        this.mistakes++;
        this.sound.playError();

        if (this.settings.mistakeLimitEnabled && this.mistakes >= 3) {
          this.handleGameOver();
          return;
        }
      } else {
        this.sound.playPlace();
      }

      // Auto remove notes from row, column, box
      if (this.settings.autoRemoveNotes && isCorrect) {
        this.autoClearRelatedNotes(r, c, num);
      }

      // Check completion
      this.checkWinCondition();
    }

    this.saveCurrentGame();
    if (this.onStateChange) this.onStateChange();
  }

  // Clear notes for same number in same row, column, 3x3 block
  autoClearRelatedNotes(row, col, num) {
    for (let i = 0; i < 9; i++) {
      this.notes[row][i].delete(num);
      this.notes[i][col].delete(num);
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        this.notes[br + r][bc + c].delete(num);
      }
    }
  }

  // Erase button
  eraseSelected() {
    if (!this.selectedCell || this.isPaused || this.isGameOver || this.isComplete) return;
    const { r, c } = this.selectedCell;

    if (this.initialBoard[r][c] !== 0) return;

    if (this.currentBoard[r][c] !== 0 || this.notes[r][c].size > 0) {
      this.saveHistorySnapshot();
      this.currentBoard[r][c] = 0;
      this.notes[r][c].clear();
      this.sound.playErase();
      this.saveCurrentGame();
      if (this.onStateChange) this.onStateChange();
    }
  }

  // Toggle notes mode
  toggleNotesMode(forcedState) {
    if (typeof forcedState === 'boolean') {
      this.isNotesMode = forcedState;
    } else {
      this.isNotesMode = !this.isNotesMode;
    }
    this.sound.playTap();
    if (this.onStateChange) this.onStateChange();
  }

  // Toggle specific note for currently selected cell
  toggleNoteForSelected(num) {
    if (!this.selectedCell || this.isPaused || this.isGameOver || this.isComplete) return;
    const { r, c } = this.selectedCell;
    if (this.initialBoard[r][c] !== 0) return;

    this.saveHistorySnapshot();
    // If cell already has a placed number, clear it to start taking notes
    if (this.currentBoard[r][c] !== 0) {
      this.currentBoard[r][c] = 0;
    }

    if (this.notes[r][c].has(num)) {
      this.notes[r][c].delete(num);
    } else {
      this.notes[r][c].add(num);
    }

    this.sound.playNote();
    this.saveCurrentGame();
    if (this.onStateChange) this.onStateChange();
  }

  // Clear all notes in current cell
  clearNotesForSelected() {
    if (!this.selectedCell || this.isPaused || this.isGameOver || this.isComplete) return;
    const { r, c } = this.selectedCell;
    if (this.notes[r][c].size > 0) {
      this.saveHistorySnapshot();
      this.notes[r][c].clear();
      this.sound.playErase();
      this.saveCurrentGame();
      if (this.onStateChange) this.onStateChange();
    }
  }

  // Auto-fill valid candidates for selected cell
  autoFillCandidatesForSelected() {
    if (!this.selectedCell || this.isPaused || this.isGameOver || this.isComplete) return;
    const { r, c } = this.selectedCell;
    if (this.initialBoard[r][c] !== 0 || this.currentBoard[r][c] !== 0) return;

    const candidates = this.engine.getCandidates(this.currentBoard, r, c);
    if (candidates.length > 0) {
      this.saveHistorySnapshot();
      this.notes[r][c] = new Set(candidates);
      this.sound.playNote();
      this.saveCurrentGame();
      if (this.onStateChange) this.onStateChange();
    }
  }

  // Snapshot for undo
  saveHistorySnapshot() {
    // Keep max 30 moves
    if (this.history.length > 30) this.history.shift();

    const snapshot = {
      board: this.engine.cloneGrid(this.currentBoard),
      notes: this.notes.map(r => r.map(set => new Set(set))),
      selected: this.selectedCell ? { ...this.selectedCell } : null,
      mistakes: this.mistakes
    };
    this.history.push(snapshot);
  }

  // Undo button
  undo() {
    if (this.history.length === 0 || this.isPaused || this.isGameOver || this.isComplete) return;

    const previous = this.history.pop();
    this.currentBoard = previous.board;
    this.notes = previous.notes;
    this.selectedCell = previous.selected;
    this.mistakes = previous.mistakes;

    this.sound.playTap();
    this.saveCurrentGame();
    if (this.onStateChange) this.onStateChange();
  }

  // Hint button: fill the selected cell or a smart cell
  giveHint() {
    if (this.isPaused || this.isGameOver || this.isComplete) return;

    let targetR, targetC;

    if (this.selectedCell && this.initialBoard[this.selectedCell.r][this.selectedCell.c] === 0 && this.currentBoard[this.selectedCell.r][this.selectedCell.c] !== this.solution[this.selectedCell.r][this.selectedCell.c]) {
      targetR = this.selectedCell.r;
      targetC = this.selectedCell.c;
    } else {
      // Find optimal cell to hint
      const hint = this.engine.findHint(this.currentBoard, this.solution);
      if (!hint) return;
      targetR = hint.r;
      targetC = hint.c;
    }

    this.saveHistorySnapshot();
    const correctVal = this.solution[targetR][targetC];
    this.currentBoard[targetR][targetC] = correctVal;
    this.notes[targetR][targetC].clear();
    this.selectedCell = { r: targetR, c: targetC };
    this.hintsUsed++;

    if (this.settings.autoRemoveNotes) {
      this.autoClearRelatedNotes(targetR, targetC, correctVal);
    }

    this.sound.playPlace();
    this.checkWinCondition();
    this.saveCurrentGame();
    if (this.onStateChange) this.onStateChange();
  }

  // Check if puzzle is solved
  checkWinCondition() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentBoard[r][c] !== this.solution[r][c]) {
          return false;
        }
      }
    }

    // Solved!
    this.isComplete = true;
    this.stopTimer();
    this.clearSavedGame();
    this.sound.playVictory();

    // Update stats
    let isNewBest = false;
    const diffStats = this.stats[this.difficulty];
    if (diffStats) {
      diffStats.won++;
      diffStats.totalTime += this.timerSeconds;
      if (!diffStats.bestTime || this.timerSeconds < diffStats.bestTime) {
        diffStats.bestTime = this.timerSeconds;
        isNewBest = true;
      }
      this.saveStats();
    }

    // Record into Leaderboard (Top 10)
    const now = new Date();
    const dateFormatted = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry = {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      time: this.timerSeconds,
      date: dateFormatted,
      timestamp: Date.now(),
      mistakes: this.mistakes,
      hintsUsed: this.hintsUsed
    };

    if (!this.leaderboard[this.difficulty]) {
      this.leaderboard[this.difficulty] = [];
    }
    const list = this.leaderboard[this.difficulty];
    list.push(newEntry);
    list.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes;
      return a.hintsUsed - b.hintsUsed;
    });

    const rank = list.findIndex(item => item.id === newEntry.id) + 1;
    if (list.length > 10) {
      this.leaderboard[this.difficulty] = list.slice(0, 10);
    }
    this.saveLeaderboard();

    if (this.onGameWon) {
      this.onGameWon({
        difficulty: this.difficulty,
        time: this.timerSeconds,
        bestTime: this.stats[this.difficulty] ? this.stats[this.difficulty].bestTime : this.timerSeconds,
        mistakes: this.mistakes,
        hintsUsed: this.hintsUsed,
        rank: rank <= 10 ? rank : null,
        isNewBest: isNewBest || rank === 1
      });
    }

    return true;
  }

  handleGameOver() {
    this.isGameOver = true;
    this.stopTimer();
    this.clearSavedGame();
    if (this.onGameOver) this.onGameOver();
  }

  // Number counts (how many 1s, 2s ... 9s are placed correctly/total)
  getNumberCounts() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    if (!this.currentBoard) return counts;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = this.currentBoard[r][c];
        if (val >= 1 && val <= 9) {
          counts[val]++;
        }
      }
    }
    return counts;
  }
}

window.SudokuGame = SudokuGame;
