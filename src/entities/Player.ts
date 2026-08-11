import Phaser from 'phaser';
import { COLORS, GAME } from '../constants/GameSettings';
import type { PlayerActions } from '../input/PlayerInput';
import {
  advanceMovement,
  applyLandingSpeed,
  createMovementState,
  resolveSlamLanding,
  startSlam,
  type MovementState,
  type SpeedTier,
} from '../systems/movement';

export type PlayerState = 'roll' | 'fly';
export type PlayerEvent = 'drop-boost' | 'slam-land' | null;

export interface PlayerStatus {
  state: PlayerState;
  tier: SpeedTier;
  speed: number;
  turning: boolean;
  slamming: boolean;
}

export class Player {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly leftWing: Phaser.GameObjects.Ellipse;
  private readonly rightWing: Phaser.GameObjects.Ellipse;
  private state: PlayerState = 'fly';
  private movement: MovementState = createMovementState();
  private wasGrounded = false;
  private slamming = false;
  private slamStartY = 0;
  private pendingEvent: PlayerEvent = null;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    this.createTexture(scene);
    this.sprite = scene.physics.add.sprite(x, y, 'player-ball');
    this.sprite.setCircle(GAME.playerRadius);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);
    this.sprite.setMaxVelocity(GAME.tier2Speed, GAME.maxFallSpeed);

    this.leftWing = scene.add.ellipse(x, y, 34, 16, COLORS.wing, 0.8).setDepth(9);
    this.rightWing = scene.add.ellipse(x, y, 34, 16, COLORS.wing, 0.8).setDepth(9);
    this.setWingVisibility(false);
  }

  public update(actions: PlayerActions, deltaMs: number): void {
    const body = this.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    const grounded = body.blocked.down || body.touching.down;
    const justLanded = grounded && !this.wasGrounded;

    if (justLanded && this.slamming) {
      const landing = resolveSlamLanding(this.sprite.y - this.slamStartY);
      this.movement = applyLandingSpeed(actions.direction, landing);
      this.pendingEvent = landing.dropBoost ? 'drop-boost' : 'slam-land';
      this.slamming = false;
    }

    this.sprite.setMaxVelocity(
      GAME.tier2Speed,
      this.slamming ? GAME.slamSpeed : GAME.maxFallSpeed,
    );

    this.state = grounded ? 'roll' : 'fly';
    this.movement = advanceMovement(this.movement, {
      direction: actions.direction,
      boostHeld: actions.boostHeld,
      grounded,
      deltaSeconds: Math.min(deltaMs, 50) / 1000,
    });
    this.sprite.setVelocityX(this.movement.velocityX);
    this.sprite.setFlipX(actions.direction < 0);

    if (grounded && actions.jumpDown) {
      this.sprite.setVelocityY(-GAME.jumpSpeed);
      this.state = 'fly';
    }

    if (!grounded && actions.slamDown && !this.slamming) {
      this.slamming = true;
      this.slamStartY = this.sprite.y;
      this.movement = startSlam(this.movement);
      this.sprite.setMaxVelocity(GAME.tier2Speed, GAME.slamSpeed);
      this.sprite.setVelocityX(this.movement.velocityX);
      this.sprite.setVelocityY(GAME.slamSpeed);
    }

    if (this.state === 'fly' && actions.jumpHeld && !this.slamming) {
      body.setGravityY(GAME.glideGravity - GAME.gravity);
      if (body.velocity.y > -110) {
        this.sprite.setVelocityY(body.velocity.y - GAME.glideLift);
      }
    } else {
      body.setGravityY(0);
    }

    if (this.state === 'roll') {
      this.sprite.rotation += (this.movement.velocityX / GAME.moveSpeed) * 0.12;
    }

    this.updateWings(actions.direction);
    this.wasGrounded = grounded;
  }

  public getState(): PlayerState {
    return this.state;
  }

  public getStatus(): PlayerStatus {
    return {
      state: this.state,
      tier: this.movement.tier,
      speed: Math.round(Math.abs(this.movement.velocityX)),
      turning: this.movement.turning,
      slamming: this.slamming,
    };
  }

  public consumeEvent(): PlayerEvent {
    const event = this.pendingEvent;
    this.pendingEvent = null;
    return event;
  }

  public recover(x: number, y: number): void {
    this.sprite.setPosition(x, y - 50);
    this.sprite.setVelocity(0, 0);
    this.movement = createMovementState(this.movement.facing);
    this.slamming = false;
    this.wasGrounded = false;
  }

  private updateWings(direction: -1 | 1): void {
    const flying = this.state === 'fly' && !this.slamming;
    this.setWingVisibility(flying);
    const flap = Math.sin(this.sprite.scene.time.now * 0.018) * 5;
    this.leftWing.setPosition(this.sprite.x - 27, this.sprite.y + flap).setRotation(-0.35);
    this.rightWing.setPosition(this.sprite.x + 27, this.sprite.y - flap).setRotation(0.35);
    this.leftWing.setScale(direction, 1);
  }

  private setWingVisibility(visible: boolean): void {
    this.leftWing.setVisible(visible);
    this.rightWing.setVisible(visible);
  }

  private createTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('player-ball')) {
      return;
    }
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(COLORS.player).fillCircle(28, 28, GAME.playerRadius);
    graphics.lineStyle(5, COLORS.playerDark).strokeCircle(28, 28, GAME.playerRadius - 2);
    graphics.lineStyle(4, COLORS.playerDark).beginPath().moveTo(12, 18).lineTo(42, 38).strokePath();
    graphics.generateTexture('player-ball', 56, 56);
    graphics.destroy();
  }
}
