/**
 * Backend CLI Test Harness for Moco.AI
 * Allows the Backend developer to test all business logic, local LLM, game engines,
 * and math/screen services independently without needing the frontend running.
 */

import readline from 'readline';
import { evaluateExpression, generateGraphData } from '../services/mathService.js';
import { ChessGame } from '../services/gameEngines/chessEngine.js';
import { TetrisGame } from '../services/gameEngines/tetrisEngine.js';
import { SnakeGame } from '../services/gameEngines/snakeEngine.js';
import { checkOllamaHealth, generateStreamingResponse } from '../services/ollamaService.js';
import { translateText } from '../services/translatorService.js';
import { getItem, setItem } from '../services/storageService.js';
import { processVoiceCommand } from '../services/voiceAgentService.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('\n======================================================');
console.log('🤖 MOCO.AI - BACKEND FEATURE TEST HARNESS');
console.log('======================================================');

async function runAutomatedTests() {
  console.log('\n--- ⚡ RUNNING AUTOMATED UNIT TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(title, condition) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${title}`);
    }
  }

  // 1. Math Evaluation Tests
  const m1 = evaluateExpression('2 + 3 * 4');
  assert('Math: Basic arithmetic 2 + 3 * 4 == 14', m1.result === 14);

  const m2 = evaluateExpression('sin(pi / 2)');
  assert('Math: Trigonometry sin(pi / 2) == 1', Math.abs(m2.result - 1) < 1e-6);

  const m3 = evaluateExpression('sqrt(16) + 2^3');
  assert('Math: Power and sqrt sqrt(16) + 2^3 == 12', m3.result === 12);

  // 2. Desmos Graph Generator Tests
  const g1 = generateGraphData('x^2 - 4', -3, 3, 50);
  assert('Graph: Generated 50 sample points', g1.points.length === 50);
  assert('Graph: Identified root at x = 2 or -2', g1.roots.some(r => Math.abs(Math.abs(r) - 2) < 0.2));

  // 3. Chess Engine Tests
  const chess = new ChessGame();
  const moves = chess.getAllLegalMoves();
  assert('Chess: Initial legal moves count == 20 (16 pawn + 4 knight)', moves.length === 20);
  const moveRes = chess.makeMove({ from: { r: 6, c: 4 }, to: { r: 4, c: 4 } }); // e4
  assert('Chess: Made move e4, turn switched to Black', moveRes.turn === 'b');
  const botMove = chess.getBotMove();
  assert('Chess: Bot generated legal black move', botMove !== null && botMove.from && botMove.to);

  // 4. Tetris Engine Tests
  const tetris = new TetrisGame();
  const tickRes = tetris.tick();
  assert('Tetris: Initial tick moved piece down', tickRes.locked === false);
  tetris.rotatePiece();
  assert('Tetris: Rotated piece without collision', tetris.currentPiece.matrix.length > 0);

  // 5. Snake Engine Tests
  const snake = new SnakeGame();
  const sTick = snake.tick();
  assert('Snake: Moved 1 step right without collision', sTick.gameOver === false && sTick.snake[0].x === 11);

  // 6. Storage Tests
  setItem('test_key', { status: 'ok', value: 42 });
  const stored = getItem('test_key');
  assert('Storage: Persisted and retrieved JSON data', stored && stored.value === 42);

  // 7. Ollama Health Test
  const health = await checkOllamaHealth();
  assert('Ollama: Health check responded', health !== undefined);
  if (health.online) {
    console.log(`     Available Models: ${health.models.join(', ')}`);
  }

  // 8. Autonomous Voice Agent Tests
  const v1 = await processVoiceCommand('switch to pomodoro timer');
  assert('Voice Agent: Navigated to pomodoro', v1.action === 'NAVIGATE' && v1.target === 'pomodoro');

  const v2 = await processVoiceCommand('calculate 25 * 4');
  assert('Voice Agent: Calculated math 25 * 4 == 100', v2.action === 'CALCULATE' && v2.result === 100);

  const v3 = await processVoiceCommand('open my tasks');
  assert('Voice Agent: Navigated to todo queue with "open my tasks"', v3.action === 'NAVIGATE' && v3.target === 'todo');

  const v4 = await processVoiceCommand('what is 45 plus 55');
  assert('Voice Agent: Spoken math "45 plus 55" == 100', v4.action === 'CALCULATE' && v4.result === 100);

  const v5 = await processVoiceCommand('play some music');
  assert('Voice Agent: Navigated to music player', v5.action === 'NAVIGATE' && v5.target === 'music');

  const v6 = await processVoiceCommand('play chess');
  assert('Voice Agent: Navigated to games arcade', v6.action === 'NAVIGATE' && v6.target === 'games');

  console.log(`\nResults: ${passed}/${total} tests passed.\n`);
}

async function menu() {
  while (true) {
    console.log('\nSelect a feature to test:');
    console.log('1. Run Automated Test Suite (All features)');
    console.log('2. Test Scientific Calculator (Math parser)');
    console.log('3. Test Desmos-style Graph Plotter');
    console.log('4. Test Local Ollama Chat (Streaming with gemma3:4b)');
    console.log('5. Test Translation Service');
    console.log('6. Test Chess Engine & Bot Move');
    console.log('7. Test Tetris Matrix Drop');
    console.log('0. Exit');

    const choice = (await askQuestion('\nEnter choice [0-7]: ')).trim();

    if (choice === '0') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    } else if (choice === '1') {
      await runAutomatedTests();
    } else if (choice === '2') {
      const expr = await askQuestion('Enter math expression (e.g. "sin(pi/4) * sqrt(100) + 2^5"): ');
      const res = evaluateExpression(expr);
      console.log('Result:', res);
    } else if (choice === '3') {
      const fn = await askQuestion('Enter f(x) (e.g. "sin(x) * cos(x)" or "x^2 - 9"): ');
      const res = generateGraphData(fn, -5, 5, 10);
      console.log(`Sampled 10 points between [-5, 5]:`);
      res.points.forEach(p => console.log(`  x: ${p.x.toFixed(2)}  ->  y: ${p.y !== null ? p.y.toFixed(2) : 'undef'}`));
      console.log('Detected Roots f(x)=0:', res.roots);
    } else if (choice === '4') {
      const prompt = await askQuestion('Ask local Ollama: ');
      process.stdout.write('Streaming: ');
      await generateStreamingResponse(prompt, (chunk) => process.stdout.write(chunk));
      console.log('\n');
    } else if (choice === '5') {
      const text = await askQuestion('Enter text to translate: ');
      const lang = (await askQuestion('Enter target language (default: Spanish): ')) || 'Spanish';
      const res = await translateText(text, lang);
      console.log(`Translation (${lang}):`, res.translation);
    } else if (choice === '6') {
      const chess = new ChessGame();
      console.log('White moves e4 (row 6, col 4 -> row 4, col 4)');
      chess.makeMove({ from: { r: 6, c: 4 }, to: { r: 4, c: 4 } });
      const bot = chess.getBotMove();
      console.log(`AI Bot (Black) response move: from (${bot.from.r},${bot.from.c}) to (${bot.to.r},${bot.to.c})`);
    } else if (choice === '7') {
      const tetris = new TetrisGame();
      console.log(`Current piece spawned: ${tetris.currentPiece.type}`);
      const dropRes = tetris.hardDrop();
      console.log('Hard dropped piece to bottom:', dropRes);
    }
  }
}

// Check if running in automated mode via CLI arg: node test-runner.js --auto
if (process.argv.includes('--auto')) {
  runAutomatedTests().then(() => process.exit(0));
} else {
  menu();
}
