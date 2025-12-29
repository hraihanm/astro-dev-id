/**
 * Math Input Component Utilities
 * Wrapper for MathLive integration with mode switching support
 */

import type { MathfieldElement } from 'mathlive';

export interface MathInputOptions {
  mode: 'math' | 'text';
  value?: string;
  placeholder?: string;
  onInput?: (value: string, latex: string) => void;
  onBlur?: (value: string, latex: string) => void;
}

/**
 * Initialize a MathLive math field
 */
export function createMathField(
  element: HTMLElement,
  options: MathInputOptions
): MathfieldElement | null {
  if (options.mode !== 'math') {
    return null;
  }

  // Check if MathLive is available
  if (typeof window === 'undefined' || !(window as any).MathLive) {
    console.warn('MathLive not loaded');
    return null;
  }

  const MathLive = (window as any).MathLive;

  // Create math field
  const mathField = MathLive.makeMathField(element, {
    defaultMode: 'math',
    smartFence: true,
    smartSuperscript: true,
    removeExtraneousParentheses: true,
    virtualKeyboardMode: 'manual',
    virtualKeyboards: 'all',
    value: options.value || '',
    placeholder: options.placeholder || '',
  });

  // Set up event listeners
  if (options.onInput) {
    mathField.addEventListener('input', () => {
      const value = mathField.getValue('text');
      const latex = mathField.getValue('latex');
      options.onInput?.(value, latex);
    });
  }

  if (options.onBlur) {
    mathField.addEventListener('blur', () => {
      const value = mathField.getValue('text');
      const latex = mathField.getValue('latex');
      options.onBlur?.(value, latex);
    });
  }

  return mathField;
}

/**
 * Get value from math field (text or latex)
 */
export function getMathFieldValue(
  mathField: MathfieldElement | null,
  format: 'text' | 'latex' = 'text'
): string {
  if (!mathField) return '';
  return mathField.getValue(format);
}

/**
 * Set value in math field
 */
export function setMathFieldValue(
  mathField: MathfieldElement | null,
  value: string
): void {
  if (!mathField) return;
  mathField.setValue(value);
}

/**
 * Destroy math field instance
 */
export function destroyMathField(mathField: MathfieldElement | null): void {
  if (!mathField) return;
  // MathLive doesn't have explicit destroy, but we can remove the element
  if (mathField.parentNode) {
    mathField.parentNode.removeChild(mathField);
  }
}

