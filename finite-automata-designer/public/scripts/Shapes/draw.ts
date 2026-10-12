/*
 Portions of this file are adapted from:

 Copyright (c) 2010 Evan Wallace
 Finite State Machine Designer (https://madebyevan.com/fsm/)
 Licensed under the MIT License

 Modifications:
 Copyright (c) 2025 Mohammed Mowla and Parth Patel
 Licensed under the MIT Licenses
*/

import { typeSVG } from "../exportUtils";
import { typeLaTeX } from "../exportUtils";
import { BaseDrawContext } from "../exportUtils";

export const greekLetterNames = [ 
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 
  'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 
  'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 
  'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega' 
];
export const greekLettersLower = [
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ',
  'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π',
  'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'
];
export const greekLettersUpper = [
  'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ',
  'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π',
  'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'
];
export const nodeRadius = 30;
export const snapToPadding = 10; // pixels
export const hitTargetPadding = 6; // pixels

// Takes LaTeX-like plain text and converts to Unicode symbols
// Handles Greek letters and subscripts
// --- Note --- greek letters cannot be subscripted current 'limitation'
function convertText(text: string) {
  let result = text;

  // Greek letter conversion
  for (let i = 0; i < greekLetterNames.length; i++) {
    const name = greekLetterNames[i];

    // Regex: '\\\\' matches a literal backslash "\" in text.
    // 'g' flag -> replace all not just first instance
    result = result.replace(new RegExp('\\\\' + name, 'g'),
      String.fromCharCode(913 + i + (i > 16 ? 1 : 0))); // uppercase
    result = result.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'),
      String.fromCharCode(945 + i + (i > 16 ? 1: 0))); // lowercase
  }

  // Subscript conversion
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp('_' + i, 'g'),
      String.fromCharCode(8320 + i));
  }

  return result;
}

export function drawText(
  ctx: CanvasRenderingContext2D | BaseDrawContext,
  originalText: string,
  x: number,
  y: number,
  angeOrNull: number | null,
) {
  ctx.font = '20px Times New Roman', 'serif';
  const text = convertText(originalText); // Convert all of the text in one go both subscript and greek
  const width = ctx.measureText(text).width;
  x -= width / 2;

  if (angeOrNull != null) {
    const cos = Math.cos(angeOrNull);
    const sin = Math.sin(angeOrNull);
    const cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
		const cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
		const slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
		x += cornerPointX - sin * slide;
		y += cornerPointY + cos * slide;
  }

  x = Math.round(x);
  y = Math.round(y);
  
  if (ctx instanceof CanvasRenderingContext2D || ctx.type == typeSVG) {
    ctx.fillText(text, x, y + 6);
  } else if (ctx.type == typeLaTeX) {
    ctx.fillText(text, originalText, x + 6, y + 3, angeOrNull);
  }
  
}

export function drawArrow(ctx: CanvasRenderingContext2D | BaseDrawContext, x: number, y: number, angle: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  ctx.lineTo(x - 10 * dx - 5 *dy, y - 8 * dy + 5 * dx);
  ctx.fill();
}