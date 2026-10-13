/**
 * Scientific and Graphing Math Engine for Moco.AI
 * Supports arithmetic, trigonometry, calculus approximations, and Desmos-style coordinate generation.
 */

// Safe evaluation of mathematical expressions
export function evaluateExpression(expression) {
  if (!expression || typeof expression !== 'string') {
    throw new Error('Expression must be a non-empty string');
  }

  // Sanitize expression
  let sanitized = expression
    .trim()
    .replace(/\s+/g, '')
    .replace(/\^/g, '**')
    .replace(/π|pi/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/sin\(/gi, 'Math.sin(')
    .replace(/cos\(/gi, 'Math.cos(')
    .replace(/tan\(/gi, 'Math.tan(')
    .replace(/asin\(/gi, 'Math.asin(')
    .replace(/acos\(/gi, 'Math.acos(')
    .replace(/atan\(/gi, 'Math.atan(')
    .replace(/sqrt\(/gi, 'Math.sqrt(')
    .replace(/log\(/gi, 'Math.log10(')
    .replace(/ln\(/gi, 'Math.log(')
    .replace(/abs\(/gi, 'Math.abs(')
    .replace(/exp\(/gi, 'Math.exp(');

  // Only allow valid mathematical identifiers and operators
  const validPattern = /^[0-9a-zA-Z_+\-*/().,%^ \t]+$/;
  // Disallow forbidden keywords
  const forbidden = /\b(import|export|eval|window|document|process|require|global|Function|class|var|let|const|delete|void)\b/i;
  if (!validPattern.test(sanitized) || forbidden.test(sanitized)) {
    throw new Error('Expression contains invalid characters or unsafe tokens');
  }

  try {
    const fn = new Function(`return (${sanitized});`);
    const result = fn();
    if (typeof result !== 'number' || isNaN(result)) {
      return { result: null, formatted: 'Undefined', error: 'Calculation resulted in NaN' };
    }
    return {
      result,
      formatted: Number.isInteger(result) ? result.toString() : Number(result.toFixed(8)).toString()
    };
  } catch (err) {
    return { result: null, formatted: 'Error', error: err.message };
  }
}

/**
 * Generates (x, y) plot points and metadata for a function f(x), similar to Desmos
 * @param {string} fnExpression - e.g. "sin(x)", "x^2 - 4", "2*x + 1"
 * @param {number} xMin - starting x
 * @param {number} xMax - ending x
 * @param {number} sampleCount - number of points (default 200)
 */
export function generateGraphData(fnExpression, xMin = -10, xMax = 10, sampleCount = 200) {
  if (!fnExpression || typeof fnExpression !== 'string') {
    throw new Error('Function expression is required');
  }

  // Prepare expression for x
  let prepared = fnExpression
    .replace(/\^/g, '**')
    .replace(/π|pi/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/sin\(/gi, 'Math.sin(')
    .replace(/cos\(/gi, 'Math.cos(')
    .replace(/tan\(/gi, 'Math.tan(')
    .replace(/sqrt\(/gi, 'Math.sqrt(')
    .replace(/log\(/gi, 'Math.log10(')
    .replace(/ln\(/gi, 'Math.log(')
    .replace(/abs\(/gi, 'Math.abs(');

  // Implicit multiplication like 2x -> 2*x
  prepared = prepared.replace(/([0-9])([a-zA-Z(])/g, '$1*$2');
  prepared = prepared.replace(/\bx\b/g, '(x)');

  let evaluator;
  try {
    evaluator = new Function('x', `return (${prepared});`);
  } catch (err) {
    throw new Error(`Invalid function syntax: ${err.message}`);
  }

  const step = (xMax - xMin) / (sampleCount - 1);
  const points = [];
  const roots = [];
  let prevY = null;
  let prevX = null;

  for (let i = 0; i < sampleCount; i++) {
    const x = Number((xMin + i * step).toFixed(4));
    let y = null;

    try {
      const val = evaluator(x);
      if (typeof val === 'number' && !isNaN(val) && isFinite(val) && Math.abs(val) < 1e6) {
        y = Number(val.toFixed(4));

        // Detect sign change for roots: f(x) = 0
        if (prevY !== null && ((prevY < 0 && y > 0) || (prevY > 0 && y < 0))) {
          const rootX = Number((prevX + (x - prevX) * (-prevY / (y - prevY))).toFixed(3));
          roots.push(rootX);
        } else if (Math.abs(y) < 1e-4) {
          roots.push(x);
        }
      }
    } catch (e) {
      y = null;
    }

    points.push({ x, y });
    prevX = x;
    prevY = y;
  }

  return {
    expression: fnExpression,
    domain: { min: xMin, max: xMax },
    points,
    roots: [...new Set(roots)],
    pointCount: points.length
  };
}
