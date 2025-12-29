/**
 * Symbolic Math Comparison Utilities
 * Uses Nerdamer for advanced symbolic math operations
 */

// Nerdamer instance for server-side use
let nerdamerInstance: any = null;
let nerdamerLoaded = false;
let loadNerdamerPromise: Promise<any> | null = null;

async function loadNerdamer(): Promise<any> {
  // Return cached instance if already loaded
  if (nerdamerLoaded) {
    return nerdamerInstance;
  }
  
  // On client side, nerdamer should be loaded via CDN
  if (typeof window !== 'undefined') {
    nerdamerLoaded = true;
    nerdamerInstance = (window as any).nerdamer || null;
    return nerdamerInstance;
  }
  
  // Avoid multiple concurrent loads
  if (loadNerdamerPromise) {
    return loadNerdamerPromise;
  }
  
  loadNerdamerPromise = (async () => {
    try {
      console.log('[loadNerdamer] Loading nerdamer for server-side use...');
      
      // Try method 1: createRequire
      try {
        const { createRequire } = await import('module');
        const requireFn = createRequire(import.meta.url);
        
        nerdamerInstance = requireFn('nerdamer');
        requireFn('nerdamer/Algebra');
        requireFn('nerdamer/Calculus');
        requireFn('nerdamer/Solve');
        
        nerdamerLoaded = true;
        return nerdamerInstance;
      } catch (e1) {
        // Try next method
      }
      
      // Try method 2: dynamic import (may not work for all CJS modules)
      try {
        const nerdamerModule = await import('nerdamer');
        nerdamerInstance = nerdamerModule.default || nerdamerModule;
        await import('nerdamer/Algebra');
        await import('nerdamer/Calculus');
        await import('nerdamer/Solve');
        
        nerdamerLoaded = true;
        return nerdamerInstance;
      } catch (e2) {
        // Try next method
      }
      
      // Try method 3: globalThis.require (Bun/Node compatibility)
      try {
        const globalRequire = (globalThis as any).require;
        if (globalRequire) {
          nerdamerInstance = globalRequire('nerdamer');
          globalRequire('nerdamer/Algebra');
          globalRequire('nerdamer/Calculus');
          globalRequire('nerdamer/Solve');
          
          nerdamerLoaded = true;
          return nerdamerInstance;
        }
      } catch (e3) {
        // All methods failed
      }
      nerdamerInstance = null;
      nerdamerLoaded = true;
      return null;
    } catch (e) {
      nerdamerInstance = null;
      nerdamerLoaded = true;
      return null;
    }
  })();
  
  return loadNerdamerPromise;
}

// For synchronous access, try to get nerdamer
function getNerdamer() {
  if (typeof window !== 'undefined') {
    return (window as any).nerdamer;
  }
  // On server, return the loaded instance (may be null if not loaded yet)
  return nerdamerInstance;
}

/**
 * Normalize a math expression for comparison
 * This is now async to ensure nerdamer is loaded before use
 */
/**
 * Try to parse an expression with nerdamer, applying minimal fixes if needed
 * Returns the parsed expression string, or null if parsing fails
 */
async function tryParseWithNerdamer(expr: string, nerdamerFunc: any): Promise<string | null> {
  if (!expr || !nerdamerFunc) return null;
  
  // Try parsing as-is first
  try {
    const parsed = nerdamerFunc(expr.trim());
    return parsed.toString();
  } catch (e) {
    // Parsing failed, try with minimal normalization
  }
  
  // Apply minimal normalization only if initial parse fails
  let normalized = expr.trim();
  
  // Fix common syntax errors that nerdamer can't parse
  normalized = normalized.replace(/\+\+/g, '+');  // Double plus
  normalized = normalized.replace(/--/g, '-');      // Double minus
  normalized = normalized.replace(/\*\*/g, '*');     // Double multiply
  normalized = normalized.replace(/\/\//g, '/');    // Double divide
  normalized = normalized.replace(/\+-/g, '-');      // Plus minus
  normalized = normalized.replace(/-\+/g, '-');      // Minus plus
  
  // Try parsing again with minimal fixes
  try {
    const parsed = nerdamerFunc(normalized);
    return parsed.toString();
  } catch (e) {
    // Still failed, return null
    return null;
  }
}

export async function normalizeExpression(expr: string): Promise<string> {
  if (!expr || typeof expr !== 'string') return '';
  
  try {
    let normalized = expr.trim();
    
    // Normalize superscripts (Unicode to caret notation)
    const superscriptMap: { [key: string]: string } = {
      '²': '^2', '³': '^3', '¹': '^1', '⁰': '^0', '⁴': '^4', '⁵': '^5',
      '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9'
    };
    for (const [sup, replacement] of Object.entries(superscriptMap)) {
      normalized = normalized.replace(new RegExp(sup, 'g'), replacement);
    }
    
    // Normalize implicit multiplication (needed for nerdamer parsing)
    normalized = normalized.replace(/(\d+)\s*([a-zA-Z])/g, '$1*$2');
    normalized = normalized.replace(/([a-zA-Z])\s*(\d+)/g, '$1*$2');
    normalized = normalized.replace(/([a-zA-Z])\s*([a-zA-Z])/g, '$1*$2');
    normalized = normalized.replace(/(\d+)([a-zA-Z])/g, '$1*$2');
    normalized = normalized.replace(/([a-zA-Z])(\d+)/g, '$1*$2');
    normalized = normalized.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
    
    // Remove whitespace
    normalized = normalized.replace(/\s+/g, '');
    
    // Try to parse and simplify with nerdamer (ensure it's loaded)
    const nerdamerFunc = await loadNerdamer();
    
    if (nerdamerFunc) {
      // Try parsing with minimal fixes if needed
      const parsedStr = await tryParseWithNerdamer(normalized, nerdamerFunc);
      if (parsedStr) {
        try {
          const parsed = nerdamerFunc(parsedStr);
          // Try to expand and collect like terms for better normalization
          let simplified = parsed;
          try {
            simplified = parsed.expand().collect();
          } catch (e) {
            try {
              simplified = parsed.collect();
            } catch (e2) {
              simplified = parsed.simplify();
            }
          }
          return simplified.toString();
        } catch (e) {
          // If simplification fails, return the parsed string
          return parsedStr;
        }
      }
    }
    
    return normalized;
  } catch (e) {
    return expr.trim();
  }
}

/**
 * Try to evaluate an expression as a number
 */
export function evaluateExpression(expr: string): number | null {
  if (!expr || typeof expr !== 'string') return null;
  
  // Try simple numeric parsing first
  const num = parseFloat(expr.trim());
  if (!isNaN(num)) {
    return num;
  }
  
  // Try to evaluate as a number
  const nerdamerFunc = getNerdamer();
  
  if (nerdamerFunc) {
    try {
      const parsed = nerdamerFunc(expr.trim());
      const evaluated = parsed.evaluate();
      const result = parseFloat(evaluated.toString());
      if (!isNaN(result)) {
        return result;
      }
    } catch (e) {
      // Evaluation failed
    }
  }
  
  return null;
}

/**
 * Check if two numeric values are equal within tolerance
 */
function areNumericEqual(
  a: number,
  b: number,
  tolerance: number = 0.0001
): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * Convert LaTeX to natural math expression
 * e.g., "2\cdot10^{5}" -> "2*10^5"
 */
function latexToNatural(latex: string): string {
  if (!latex) return '';
  
  let result = latex
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    // Handle {base}^{exp} -> (base)^(exp)
    .replace(/\{([^}]+)\}\^\{([^}]+)\}/g, '($1)^($2)')
    // Handle ^{exp} -> ^exp (without parentheses for simple exponents)
    .replace(/\^\{(\d+)\}/g, '^$1')  // ^{2} -> ^2 (simple numeric exponent)
    .replace(/\^\{([^}]+)\}/g, '^($1)')  // ^{x+1} -> ^(x+1) (complex exponent)
    // Remove remaining braces
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    // Remove backslashes from variable names like \alpha, \beta (keep as alpha, beta)
    .replace(/\\([a-zA-Z]+)/g, '$1');
  
  // Handle Unicode superscripts (², ³, etc.) that might come from MathLive display
  const superscriptMap: { [key: string]: string } = {
    '²': '^2', '³': '^3', '¹': '^1', '⁰': '^0', '⁴': '^4', '⁵': '^5',
    '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9'
  };
  for (const [sup, replacement] of Object.entries(superscriptMap)) {
    result = result.replace(new RegExp(sup, 'g'), replacement);
  }
  
  return result;
}

/**
 * Compare two math expressions symbolically
 * Works in both server and client contexts
 * Handles both LaTeX and natural math expressions
 */
export async function compareMathExpressions(
  userAnswer: string,
  correctAnswer: string,
  tolerance: number = 0.0001
): Promise<boolean> {
  if (!userAnswer || !correctAnswer) {
    return false;
  }
  
  // Trim and normalize
  let user = userAnswer.trim();
  let correct = correctAnswer.trim();
  
  // Convert LaTeX to natural form if needed
  // Check if user answer looks like LaTeX (contains backslashes or curly braces)
  if (user.includes('\\') || (user.includes('{') && user.includes('}'))) {
    user = latexToNatural(user);
  }
  if (correct.includes('\\') || (correct.includes('{') && correct.includes('}'))) {
    correct = latexToNatural(correct);
  }
  
  // Normalize superscript notation: x² -> x^2, x³ -> x^3, etc.
  // This handles Unicode superscripts that might come from MathLive
  const superscriptMap: { [key: string]: string } = {
    '²': '^2', '³': '^3', '¹': '^1', '⁰': '^0', '⁴': '^4', '⁵': '^5',
    '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9'
  };
  for (const [sup, replacement] of Object.entries(superscriptMap)) {
    user = user.replace(new RegExp(sup, 'g'), replacement);
    correct = correct.replace(new RegExp(sup, 'g'), replacement);
  }
  
  // Try numeric comparison first (before normalization, as it's faster)
  const userNum = evaluateExpression(user);
  const correctNum = evaluateExpression(correct);
  
  if (userNum !== null && correctNum !== null) {
      if (areNumericEqual(userNum, correctNum, tolerance)) {
        return true;
      }
    }
  
  // Exact string match (case-insensitive for text mode) - after superscript normalization
  if (user.toLowerCase() === correct.toLowerCase()) {
    return true;
  }
  
  // Try symbolic comparison using nerdamer (works on both client and server)
  // Let nerdamer be the source of truth - if it can parse and compare, trust it
  const nerdamerFunc = await loadNerdamer();
  
  if (nerdamerFunc) {
    try {
      // Try parsing both expressions directly first (with minimal normalization)
      // This allows nerdamer to handle syntax variations naturally
      let userParsed: any = null;
      let correctParsed: any = null;
      
      // Try to parse user expression
      try {
        userParsed = nerdamerFunc(user);
      } catch (e) {
        // If direct parse fails, try with normalization
        const userNorm = await normalizeExpression(user);
        try {
          userParsed = nerdamerFunc(userNorm);
        } catch (e2) {
          // Still failed, can't parse user expression
          return false;
        }
      }
      
      // Try to parse correct expression
      try {
        correctParsed = nerdamerFunc(correct);
      } catch (e) {
        // If direct parse fails, try with normalization
        const correctNorm = await normalizeExpression(correct);
        try {
          correctParsed = nerdamerFunc(correctNorm);
        } catch (e2) {
          // Still failed, can't parse correct expression
          return false;
        }
      }
      
      // If we got here, both expressions parsed successfully
      // Now check if they're equivalent using nerdamer's comparison methods
      
      // Method 1: Check if difference simplifies to zero
      try {
        const diff = userParsed.subtract(correctParsed);
        const diffSimplified = diff.simplify();
        const diffStr = diffSimplified.toString();
        
        if (diffStr === '0' || diffStr === '-0' || diffStr === '+0') {
          return true;
        }
        
        // Try expanding the difference
        try {
          const diffExpanded = diffSimplified.expand().toString();
          if (diffExpanded === '0' || diffExpanded === '-0') {
            return true;
          }
        } catch (e) {}
        
        // Try evaluating the difference numerically
        try {
          const diffValue = diffSimplified.evaluate();
          const diffNum = parseFloat(diffValue.toString());
          if (!isNaN(diffNum) && Math.abs(diffNum) < tolerance) {
            return true;
          }
        } catch (e) {}
      } catch (e) {
        // Subtraction method failed, try other methods
      }
      
      // Method 2: Expand and compare
      try {
        const userExpanded = userParsed.expand().toString();
        const correctExpanded = correctParsed.expand().toString();
        if (userExpanded === correctExpanded) {
          return true;
        }
      } catch (e) {
        // Expansion failed
      }
      
      // Method 3: Collect and compare
      try {
        const userCollected = userParsed.collect().toString();
        const correctCollected = correctParsed.collect().toString();
        if (userCollected === correctCollected) {
          return true;
        }
      } catch (e) {
        // Collection failed
      }
      
      // Method 4: Expand and collect both, then compare
      try {
        const userExpandedCollected = userParsed.expand().collect().toString();
        const correctExpandedCollected = correctParsed.expand().collect().toString();
        if (userExpandedCollected === correctExpandedCollected) {
          return true;
        }
      } catch (e) {
        // Expand+collect failed
      }
      
      // If all methods failed, they're not equivalent
      return false;
    } catch (e) {
      // Parsing or comparison failed entirely
      return false;
    }
  }
  
  // Fallback: if nerdamer not available, use normalized string comparison
  try {
    const userNorm = await normalizeExpression(user);
    const correctNorm = await normalizeExpression(correct);
    return userNorm === correctNorm;
  } catch (e) {
    return false;
  }
}

/**
 * Format expression for display
 */
export function formatExpression(expr: string): string {
  if (!expr) return '';
  
  // Try to get LaTeX representation if nerdamer is available
  const nerdamerFunc = getNerdamer();
  
  if (nerdamerFunc) {
    try {
      const parsed = nerdamerFunc(expr.trim());
      const latex = parsed.toTeX();
      return latex || expr;
    } catch (e) {
      return expr;
    }
  }
  
  return expr;
}
