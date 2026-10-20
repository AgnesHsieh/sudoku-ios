/**
 * Sudoku Engine - Complete Sudoku Generator, Solver, and Validator
 * Supports difficulties: easy, medium, hard, expert
 * Guaranteed valid boards and unique solutions.
 */

class SudokuEngine {
  constructor() {
    this.BLANK = 0;
  }

  // Create an empty 9x9 grid
  createEmptyGrid() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  // Clone a 9x9 grid
  cloneGrid(grid) {
    return grid.map(row => [...row]);
  }

  // Check if placing num at (row, col) is valid
  isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num && i !== col) return false;
      if (grid[i][col] === num && i !== row) return false;
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const curR = startRow + r;
        const curC = startCol + c;
        if (grid[curR][curC] === num && (curR !== row || curC !== col)) {
          return false;
        }
      }
    }
    return true;
  }

  // Find all possible candidates for a cell
  getCandidates(grid, row, col) {
    if (grid[row][col] !== 0) return [];
    const candidates = [];
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(grid, row, col, num)) {
        candidates.push(num);
      }
    }
    return candidates;
  }

  // Shuffle array using Fisher-Yates
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Solve grid with backtracking (finds first solution)
  solve(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of numbers) {
            if (this.isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (this.solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Count solutions (up to limit to avoid long runtimes)
  countSolutions(grid, limit = 2) {
    let count = 0;

    const backtrack = (g) => {
      if (count >= limit) return;

      let minCandidates = 10;
      let targetRow = -1;
      let targetCol = -1;
      let targetCandidates = [];

      // MRV (Minimum Remaining Values) heuristic for speed
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (g[r][c] === 0) {
            const cand = [];
            for (let num = 1; num <= 9; num++) {
              if (this.isValid(g, r, c, num)) cand.push(num);
            }
            if (cand.length === 0) return; // Dead end
            if (cand.length < minCandidates) {
              minCandidates = cand.length;
              targetRow = r;
              targetCol = c;
              targetCandidates = cand;
              if (minCandidates === 1) break;
            }
          }
        }
        if (minCandidates === 1) break;
      }

      if (targetRow === -1) {
        count++;
        return;
      }

      for (const num of targetCandidates) {
        g[targetRow][targetCol] = num;
        backtrack(g);
        g[targetRow][targetCol] = 0;
        if (count >= limit) return;
      }
    };

    const copy = this.cloneGrid(grid);
    backtrack(copy);
    return count;
  }

  // Generate a full valid 9x9 board
  generateSolvedBoard() {
    const grid = this.createEmptyGrid();
    this.solve(grid);
    return grid;
  }

  // Difficulty configs: target clues and hole counts
  getDifficultyClues(difficulty) {
    switch (difficulty) {
      case 'easy':
        return { clues: 40, maxHoles: 41 };
      case 'medium':
        return { clues: 32, maxHoles: 49 };
      case 'hard':
        return { clues: 27, maxHoles: 54 };
      case 'expert':
        return { clues: 23, maxHoles: 58 };
      default:
        return { clues: 36, maxHoles: 45 };
    }
  }

  /**
   * Generate a puzzle of given difficulty
   * Returns: { puzzle: 2D array, solution: 2D array, difficulty: string, clues: number }
   */
  generatePuzzle(difficulty = 'easy') {
    const solution = this.generateSolvedBoard();
    const puzzle = this.cloneGrid(solution);
    const { maxHoles } = this.getDifficultyClues(difficulty);

    // Create list of all 81 coordinates
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push({ r, c });
      }
    }
    const shuffledPositions = this.shuffle(positions);

    let holesCreated = 0;

    for (const pos of shuffledPositions) {
      if (holesCreated >= maxHoles) break;

      const { r, c } = pos;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      // Ensure puzzle still has exactly 1 unique solution
      const solutions = this.countSolutions(puzzle, 2);
      if (solutions === 1) {
        holesCreated++;
      } else {
        // Revert if removal creates multiple solutions
        puzzle[r][c] = backup;
      }
    }

    let cluesCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) cluesCount++;
      }
    }

    return {
      puzzle,
      solution,
      difficulty,
      clues: cluesCount,
      holes: holesCreated
    };
  }

  // Check all board errors (duplicates in row, col, 3x3 box)
  findConflicts(grid) {
    const conflicts = new Set(); // Stores "r,c" strings

    // Check rows
    for (let r = 0; r < 9; r++) {
      const seen = new Map();
      for (let c = 0; c < 9; c++) {
        const val = grid[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${r},${seen.get(val)}`);
          } else {
            seen.set(val, c);
          }
        }
      }
    }

    // Check columns
    for (let c = 0; c < 9; c++) {
      const seen = new Map();
      for (let r = 0; r < 9; r++) {
        const val = grid[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${seen.get(val)},${c}`);
          } else {
            seen.set(val, r);
          }
        }
      }
    }

    // Check 3x3 blocks
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const seen = new Map();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const actualR = br * 3 + r;
            const actualC = bc * 3 + c;
            const val = grid[actualR][actualC];
            if (val !== 0) {
              if (seen.has(val)) {
                conflicts.add(`${actualR},${actualC}`);
                const prev = seen.get(val);
                conflicts.add(`${prev.r},${prev.c}`);
              } else {
                seen.set(val, { r: actualR, c: actualC });
              }
            }
          }
        }
      }
    }

    return conflicts;
  }

  // Find best cell to hint: either naked single, or lowest candidate cell
  findHint(currentGrid, solution) {
    let bestCell = null;
    let minCandidates = 10;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c] === 0) {
          const candidates = this.getCandidates(currentGrid, r, c);
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length;
            bestCell = {
              r,
              c,
              candidates,
              correctValue: solution[r][c],
              isSingle: candidates.length === 1
            };
            if (minCandidates === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    return bestCell;
  }
}

// Export for browser or node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SudokuEngine;
} else {
  window.SudokuEngine = SudokuEngine;
}
