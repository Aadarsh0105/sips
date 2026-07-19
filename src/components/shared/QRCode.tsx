

import React, { useMemo } from 'react';

// Lightweight deterministic pseudo-QR renderer (visual placeholder for a real UPI QR).
// Produces a stable matrix from the payload so the same UPI string always looks identical.
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function QRCode({
  value,
  size = 200,
  className




}: {value: string;size?: number;className?: string;}) {
  const cells = 25;
  const matrix = useMemo(() => {
    const grid: boolean[][] = [];
    let seed = hashString(value);
    const rand = () => {
      seed = seed * 1103515245 + 12345 & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let r = 0; r < cells; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < cells; c++) row.push(rand() > 0.5);
      grid.push(row);
    }
    // finder patterns at 3 corners
    const stamp = (or: number, oc: number) => {
      for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[or + r][oc + c] = border || inner;
        if (!border && !inner) grid[or + r][oc + c] = false;
      }
    };
    stamp(0, 0);
    stamp(0, cells - 7);
    stamp(cells - 7, 0);
    return grid;
  }, [value]);

  const cell = size / cells;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Payment QR code">
      
      <rect width={size} height={size} fill="#ffffff" rx={8} />
      {matrix.map((row, r) =>
      row.map((on, c) =>
      on ?
      <rect
        key={`${r}-${c}`}
        x={c * cell}
        y={r * cell}
        width={cell}
        height={cell}
        fill="#0f172a" /> :

      null
      )
      )}
    </svg>);

}