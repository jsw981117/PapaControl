import { GAME } from '../constants/GameSettings';

export type Direction = -1 | 1;
export type SpeedTier = 0 | 1 | 2;

export interface MovementState {
  facing: Direction;
  velocityX: number;
  tier: SpeedTier;
  turning: boolean;
}

export interface MovementStep {
  direction: Direction;
  boostHeld: boolean;
  grounded: boolean;
  deltaSeconds: number;
}

export interface SlamLanding {
  dropBoost: boolean;
  speed: number;
}

export function createMovementState(direction: Direction = 1): MovementState {
  return {
    facing: direction,
    velocityX: direction * GAME.moveSpeed,
    tier: 0,
    turning: false,
  };
}

export function advanceMovement(state: MovementState, step: MovementStep): MovementState {
  const facing = step.direction;
  const movingDirection = getMovingDirection(state.velocityX, state.facing);
  const shouldBrakeForTurn = state.turning
    || (facing !== movingDirection && state.tier === 2);

  if (shouldBrakeForTurn) {
    const brakedVelocity = moveTowards(state.velocityX, 0, GAME.turnDeceleration * step.deltaSeconds);
    if (Math.abs(brakedVelocity) > 1) {
      return { facing, velocityX: brakedVelocity, tier: 2, turning: true };
    }
    return createMovementState(facing);
  }

  let speed = Math.abs(state.velocityX);
  if (facing !== movingDirection) {
    return {
      facing,
      velocityX: facing * speed,
      tier: tierForSpeed(speed),
      turning: false,
    };
  }

  if (step.grounded) {
    const targetSpeed = step.boostHeld ? GAME.tier2Speed : GAME.moveSpeed;
    const rate = step.boostHeld ? GAME.boostAcceleration : GAME.groundDeceleration;
    speed = moveTowards(speed, targetSpeed, rate * step.deltaSeconds);
  }

  return {
    facing,
    velocityX: facing * speed,
    tier: tierForSpeed(speed),
    turning: false,
  };
}

export function startSlam(state: MovementState): MovementState {
  return {
    ...state,
    velocityX: state.velocityX * GAME.slamHorizontalFactor,
  };
}

export function resolveSlamLanding(distance: number): SlamLanding {
  const dropBoost = distance >= GAME.dropBoostMinDistance;
  return {
    dropBoost,
    speed: dropBoost ? GAME.dropBoostSpeed : GAME.moveSpeed,
  };
}

export function applyLandingSpeed(
  direction: Direction,
  landing: SlamLanding,
): MovementState {
  return {
    facing: direction,
    velocityX: direction * landing.speed,
    tier: tierForSpeed(landing.speed),
    turning: false,
  };
}

export function tierForSpeed(speed: number): SpeedTier {
  if (speed >= GAME.tier2MinSpeed) return 2;
  if (speed >= GAME.tier1MinSpeed) return 1;
  return 0;
}

function getMovingDirection(velocityX: number, fallback: Direction): Direction {
  if (velocityX < 0) return -1;
  if (velocityX > 0) return 1;
  return fallback;
}

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}
