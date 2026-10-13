/**
 * Checkers Engine for Moco.AI
 * Supports regular moves, jumping captures, kings, and AI bot moves.
 */

export const INITIAL_CHECKERS_BOARD = [
  ['.', 'b', '.', 'b', '.', 'b', '.', 'b'],
  ['b', '.', 'b', '.', 'b', '.', 'b', '.'],
  ['.', 'b', '.', 'b', '.', 'b', '.', 'b'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['r', '.', 'r', '.', 'r', '.', 'r', '.'],
  ['.', 'r', '.', 'r', '.', 'r', '.', 'r'],
  ['r', '.', 'r', '.', 'r', '.', 'r', '.']
];

export class CheckersGame {
  constructor(board = null, turn = 'r') {
    this.board = board ? board.map(r => [...r]) : INITIAL_CHECKERS_BOARD.map(r => [...r]);
    this.turn = turn; // 'r' (Player/Red) | 'b' (AI/Black)
  }

  isPiece(r, c, side) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    const p = this.board[r][c];
    return side === 'r' ? (p === 'r' || p === 'R') : (p === 'b' || p === 'B');
  }

  getLegalMoves() {
    const jumps = [];
    const regular = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!this.isPiece(r, c, this.turn)) continue;

        const isKing = piece === 'R' || piece === 'B';
        const dirs = [];
        if (piece === 'r' || isKing) dirs.push([-1, -1], [-1, 1]); // Red moves up
        if (piece === 'b' || isKing) dirs.push([1, -1], [1, 1]);   // Black moves down

        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
            if (this.board[nr][nc] === '.') {
              regular.push({ from: { r, c }, to: { r: nr, c: nc }, isJump: false });
            } else if (this.isPiece(nr, nc, this.turn === 'r' ? 'b' : 'r')) {
              // Check jump
              const jnr = nr + dr, jnc = nc + dc;
              if (jnr >= 0 && jnr <= 7 && jnc >= 0 && jnc <= 7 && this.board[jnr][jnc] === '.') {
                jumps.push({ from: { r, c }, to: { r: jnr, c: jnc }, jumped: { r: nr, c: nc }, isJump: true });
              }
            }
          }
        }
      }
    }

    // Must jump if jump is available
    return jumps.length > 0 ? jumps : regular;
  }

  makeMove(move) {
    const { from, to, isJump, jumped } = move;
    const piece = this.board[from.r][from.c];
    this.board[from.r][from.c] = '.';
    this.board[to.r][to.c] = piece;

    if (isJump && jumped) {
      this.board[jumped.r][jumped.c] = '.';
    }

    // King promotion
    if (piece === 'r' && to.r === 0) this.board[to.r][to.c] = 'R';
    if (piece === 'b' && to.r === 7) this.board[to.r][to.c] = 'B';

    this.turn = this.turn === 'r' ? 'b' : 'r';
    return { board: this.board, turn: this.turn, moves: this.getLegalMoves() };
  }

  getBotMove() {
    const moves = this.getLegalMoves();
    if (moves.length === 0) return null;
    // Prefer jumps
    const jumpMoves = moves.filter(m => m.isJump);
    if (jumpMoves.length > 0) {
      return jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }
}
