import { describe, expect, it } from 'vitest';
import { findRecoveryAnchor } from './checkpoint';

describe('findRecoveryAnchor', () => {
  const anchors = [{ x: 100, y: 600 }, { x: 900, y: 500 }, { x: 1800, y: 420 }];

  it('selects the nearest passed ground anchor', () => {
    expect(findRecoveryAnchor(1200, anchors)).toEqual({ x: 900, y: 500 });
  });

  it('falls back to the first anchor before the level start', () => {
    expect(findRecoveryAnchor(10, anchors)).toEqual({ x: 100, y: 600 });
  });
});
