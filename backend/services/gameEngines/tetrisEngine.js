/**
 * Tetris Engine for Moco.AI
 * Manages 10x20 matrix grid, 7 tetrominoes, collision, rotation, and line clears.
 */

export const TETROMINOES = {
  I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#06b6d4' },
  O: { shape: [[1,1], [1,1]], color: '#eab308' },
  T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: '#a855f7' },
  S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: '#22c55e' },
  Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: '#ef4444' },
  J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: '#3b82f6' },
  L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: '#f97316' }
};

export class TetrisGame {
  constructor(rows = 20, cols = 10) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.currentPiece = this.spawnPiece();
  }

  spawnPiece() {
    const keys = Object.keys(TETROMINOES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const piece = TETROMINOES[type];
    return {
      type,
      matrix: piece.shape.map(r => [...r]),
      color: piece.color,
      x: Math.floor((this.cols - piece.shape[0].length) / 2),
      y: 0
    };
  }

  checkCollision(piece, offsetX = 0, offsetY = 0, matrix = null) {
    const mat = matrix || piece.matrix;
    for (let r = 0; r < mat.length; r++) {
      for (let c = 0; c < mat[r].length; c++) {
        if (mat[r][c] !== 0) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;
          if (newX < 0 || newX >= this.cols || newY >= this.rows) return true;
          if (newY >= 0 && this.grid[newY][newX] !== 0) return true;
        }
      }
    }
    return false;
  }

  rotatePiece() {
    if (this.gameOver) return false;
    const mat = this.currentPiece.matrix;
    // Transpose and reverse rows
    const rotated = mat[0].map((_, index) => mat.map(row => row[index]).reverse());
    if (!this.checkCollision(this.currentPiece, 0, 0, rotated)) {
      this.currentPiece.matrix = rotated;
      return true;
    }
    return false;
  }

  moveLeft() {
    if (!this.checkCollision(this.currentPiece, -1, 0)) {
      this.currentPiece.x -= 1;
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this.checkCollision(this.currentPiece, 1, 0)) {
      this.currentPiece.x += 1;
      return true;
    }
    return false;
  }

  // Drop piece by 1 tick
  tick() {
    if (this.gameOver) return { gameOver: true };

    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y += 1;
      return { locked: false, score: this.score, grid: this.grid };
    }

    // Lock piece
    this.lockPiece();
    const cleared = this.clearLines();
    this.currentPiece = this.spawnPiece();

    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.gameOver = true;
    }

    return { locked: true, clearedLines: cleared, score: this.score, gameOver: this.gameOver };
  }

  hardDrop() {
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y += 1;
      this.score += 2;
    }
    return this.tick();
  }

  lockPiece() {
    const mat = this.currentPiece.matrix;
    for (let r = 0; r < mat.length; r++) {
      for (let c = 0; c < mat[r].length; c++) {
        if (mat[r][c] !== 0) {
          const gy = this.currentPiece.y + r;
          const gx = this.currentPiece.x + c;
          if (gy >= 0 && gy < this.rows && gx >= 0 && gx < this.cols) {
            this.grid[gy][gx] = this.currentPiece.color;
          }
        }
      }
    }
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.cols).fill(0));
        cleared++;
        r++; // Recheck same row
      }
    }
    if (cleared > 0) {
      const pointTable = [0, 100, 300, 500, 800];
      this.score += (pointTable[cleared] || 1000) * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    }
    return cleared;
  }
}
