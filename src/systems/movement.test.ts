import { describe, expect, it } from 'vitest';
import {
  advanceMovement,
  applyLandingSpeed,
  createMovementState,
  resolveSlamLanding,
  startSlam,
} from './movement';

describe('movement system', () => {
  it('accelerates through tier 1 into tier 2 while boosting on the ground', () => {
    let state = createMovementState(1);
    state = advanceMovement(state, { direction: 1, boostHeld: true, grounded: true, deltaSeconds: 0.5 });
    expect(state.tier).toBe(1);
    state = advanceMovement(state, { direction: 1, boostHeld: true, grounded: true, deltaSeconds: 0.5 });
    expect(state.tier).toBe(2);
    expect(state.velocityX).toBe(520);
  });

  it('preserves horizontal momentum in the air', () => {
    const boosted = { ...createMovementState(1), velocityX: 480, tier: 2 as const };
    const airborne = advanceMovement(boosted, {
      direction: 1, boostHeld: false, grounded: false, deltaSeconds: 1,
    });
    expect(airborne.velocityX).toBe(480);
    expect(airborne.tier).toBe(2);
  });

  it('brakes before reversing at tier 2', () => {
    const boosted = { ...createMovementState(1), velocityX: 500, tier: 2 as const };
    const braking = advanceMovement(boosted, {
      direction: -1, boostHeld: true, grounded: true, deltaSeconds: 0.25,
    });
    expect(braking.turning).toBe(true);
    expect(braking.velocityX).toBeGreaterThan(0);
    expect(braking.velocityX).toBeLessThan(500);
    expect(braking.facing).toBe(-1);
  });

  it('converts a sufficiently long slam into tier 2 landing speed', () => {
    const landing = resolveSlamLanding(180);
    const slamming = startSlam(createMovementState(1));
    const landed = applyLandingSpeed(1, landing);
    expect(slamming.velocityX).toBe(55);
    expect(landing.dropBoost).toBe(true);
    expect(landed.tier).toBe(2);
    expect(landed.velocityX).toBe(480);
  });

  it('treats a short slam as a normal landing', () => {
    expect(resolveSlamLanding(80)).toEqual({ dropBoost: false, speed: 220 });
  });
});
