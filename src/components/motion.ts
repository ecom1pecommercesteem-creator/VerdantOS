import type { CSSProperties } from 'react';

// Position in a staggered entrance. The `.enter` class in index.css turns this into a delay.
export function stagger(index: number): CSSProperties {
  return { '--i': index } as CSSProperties;
}
