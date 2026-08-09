export interface GroundAnchor {
  x: number;
  y: number;
}

/** 낙하 지점보다 앞서 지나온 가장 가까운 안전 지면을 반환합니다. */
export function findRecoveryAnchor(currentX: number, anchors: readonly GroundAnchor[]): GroundAnchor {
  let selected = anchors[0];
  if (!selected) {
    return { x: 120, y: 640 };
  }

  for (const anchor of anchors) {
    if (anchor.x <= currentX && anchor.x >= selected.x) {
      selected = anchor;
    }
  }
  return selected;
}
