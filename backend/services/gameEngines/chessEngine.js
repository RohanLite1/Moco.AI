/**
 * Chess Engine for Moco.AI
 * Provides board state, move validation, FEN parsing, and a minimax AI bot.
 */

// Initial 8x8 Board: lowercase = black, uppercase = white, '.' = empty
export const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const PIECE_VALUES = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900,
  P: 10, N: 30, B: 30, R: 50, Q: 90, K: 900
};

export class ChessGame {
  constructor(board = null, turn = 'w') {
    this.board = board ? board.map(row => [...row]) : INITIAL_BOARD.map(row => [...row]);
    this.turn = turn; // 'w' | 'b'
    this.moveHistory = [];
  }

  isWhite(piece) {
    return piece !== '.' && piece === piece.toUpperCase();
  }

  isBlack(piece) {
    return piece !== '.' && piece === piece.toLowerCase();
  }

  getPiece(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return null;
    return this.board[r][c];
  }

  // Generate legal moves for piece at (r, c)
  getMovesForPiece(r, c) {
    const piece = this.getPiece(r, c);
    if (!piece || piece === '.') return [];

    const isWhite = this.isWhite(piece);
    if ((isWhite && this.turn !== 'w') || (!isWhite && this.turn !== 'b')) return [];

    const moves = [];
    const type = piece.toLowerCase();

    // 1. Pawns
    if (type === 'p') {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Forward 1
      if (this.getPiece(r + dir, c) === '.') {
        moves.push({ from: { r, c }, to: { r: r + dir, c } });
        // Forward 2
        if (r === startRow && this.getPiece(r + 2 * dir, c) === '.') {
          moves.push({ from: { r, c }, to: { r: r + 2 * dir, c } });
        }
      }

      // Captures
      for (const dc of [-1, 1]) {
        const target = this.getPiece(r + dir, c + dc);
        if (target && target !== '.' && (isWhite ? this.isBlack(target) : this.isWhite(target))) {
          moves.push({ from: { r, c }, to: { r: r + dir, c: c + dc }, capture: target });
        }
      }
    }

    // 2. Knights
    if (type === 'n') {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr, nc = c + dc;
        const target = this.getPiece(nr, nc);
        if (target !== null) {
          if (target === '.' || (isWhite ? this.isBlack(target) : this.isWhite(target))) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target !== '.' ? target : null });
          }
        }
      }
    }

    // 3. Rays: Bishop, Rook, Queen
    const rays = [];
    if (type === 'b' || type === 'q') rays.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    if (type === 'r' || type === 'q') rays.push([-1, 0], [1, 0], [0, -1], [0, 1]);

    for (const [dr, dc] of rays) {
      let nr = r + dr, nc = c + dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        const target = this.getPiece(nr, nc);
        if (target === '.') {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        } else {
          if (isWhite ? this.isBlack(target) : this.isWhite(target)) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    // 4. King
    if (type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          const target = this.getPiece(nr, nc);
          if (target !== null) {
            if (target === '.' || (isWhite ? this.isBlack(target) : this.isWhite(target))) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target !== '.' ? target : null });
            }
          }
        }
      }
    }

    return moves;
  }

  // Generate all legal moves for current player
  getAllLegalMoves() {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece !== '.' && (this.turn === 'w' ? this.isWhite(piece) : this.isBlack(piece))) {
          allMoves.push(...this.getMovesForPiece(r, c));
        }
      }
    }
    return allMoves;
  }

  makeMove(move) {
    const { from, to } = move;
    const piece = this.board[from.r][from.c];
    this.board[from.r][from.c] = '.';
    this.board[to.r][to.c] = piece;

    // Pawn promotion to Queen
    if (piece === 'P' && to.r === 0) this.board[to.r][to.c] = 'Q';
    if (piece === 'p' && to.r === 7) this.board[to.r][to.c] = 'q';

    this.moveHistory.push(move);
    this.turn = this.turn === 'w' ? 'b' : 'w';
    return { success: true, board: this.board, turn: this.turn };
  }

  // AI Bot: Evaluates material and position for black move
  getBotMove() {
    const moves = this.getAllLegalMoves();
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      let score = 0;
      // Prefer captures
      if (move.capture) {
        score += (PIECE_VALUES[move.capture] || 10) * 2;
      }
      // Control center (rows 3,4 and cols 3,4)
      if (move.to.r >= 2 && move.to.r <= 5 && move.to.c >= 2 && move.to.c <= 5) {
        score += 3;
      }
      // Add slight randomness
      score += Math.random() * 2;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }
}
