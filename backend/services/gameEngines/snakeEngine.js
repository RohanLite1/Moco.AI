/**
 * Snake Game Engine for Moco.AI
 * Manages 20x20 grid, snake segment movement, food spawning, and collision checks.
 */

export class SnakeGame {
  constructor(gridSize = 20) {
    this.gridSize = gridSize;
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    this.direction = { x: 1, y: 0 }; // Moving right
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.gameOver = false;
  }

  spawnFood() {
    let newFood;
    while (!newFood || this.snake.some(seg => seg.x === newFood.x && seg.y === newFood.y)) {
      newFood = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };
    }
    return newFood;
  }

  setDirection(dir) {
    // Prevent 180-degree turns
    const opposites = {
      UP: { x: 0, y: -1, opp: 'DOWN' },
      DOWN: { x: 0, y: 1, opp: 'UP' },
      LEFT: { x: -1, y: 0, opp: 'RIGHT' },
      RIGHT: { x: 1, y: 0, opp: 'LEFT' }
    };
    const target = opposites[dir.toUpperCase()];
    if (!target) return;

    if (this.direction.x + target.x !== 0 || this.direction.y + target.y !== 0) {
      this.nextDirection = { x: target.x, y: target.y };
    }
  }

  tick() {
    if (this.gameOver) return { gameOver: true, score: this.score };

    this.direction = this.nextDirection;
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // 1. Check wall collision
    if (newHead.x < 0 || newHead.x >= this.gridSize || newHead.y < 0 || newHead.y >= this.gridSize) {
      this.gameOver = true;
      return { gameOver: true, score: this.score, reason: 'wall' };
    }

    // 2. Check self-collision
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.gameOver = true;
      return { gameOver: true, score: this.score, reason: 'self' };
    }

    // Move snake
    this.snake.unshift(newHead);

    // 3. Check food collision
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.food = this.spawnFood();
    } else {
      this.snake.pop(); // Remove tail if not eating
    }

    return {
      snake: this.snake,
      food: this.food,
      score: this.score,
      gameOver: false
    };
  }
}
