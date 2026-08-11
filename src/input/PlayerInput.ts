import Phaser from 'phaser';

export interface PlayerActions {
  direction: -1 | 1;
  jumpDown: boolean;
  jumpHeld: boolean;
  boostHeld: boolean;
  slamDown: boolean;
}

export class PlayerInput {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly leftKey: Phaser.Input.Keyboard.Key;
  private readonly rightKey: Phaser.Input.Keyboard.Key;
  private readonly jumpKey: Phaser.Input.Keyboard.Key;
  private readonly boostKey: Phaser.Input.Keyboard.Key;
  private readonly slamKey: Phaser.Input.Keyboard.Key;
  private direction: -1 | 1 = 1;
  private touchJumpHeld = false;
  private touchJumpDown = false;
  private touchBoostHeld = false;
  private touchSlamDown = false;

  public constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable.');
    }
    this.cursors = keyboard.createCursorKeys();
    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.boostKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.slamKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    scene.input.addPointer(3);
  }

  public setTouchDirection(direction: -1 | 1): void {
    this.direction = direction;
  }

  public setTouchJump(held: boolean): void {
    if (held && !this.touchJumpHeld) {
      this.touchJumpDown = true;
    }
    this.touchJumpHeld = held;
  }

  public setTouchBoost(held: boolean): void {
    this.touchBoostHeld = held;
  }

  public pressTouchSlam(): void {
    this.touchSlamDown = true;
  }

  public read(): PlayerActions {
    if (this.cursors.left.isDown || this.leftKey.isDown) {
      this.direction = -1;
    } else if (this.cursors.right.isDown || this.rightKey.isDown) {
      this.direction = 1;
    }

    const jumpDown = Phaser.Input.Keyboard.JustDown(this.jumpKey)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || this.touchJumpDown;
    const jumpHeld = this.jumpKey.isDown || this.cursors.space.isDown || this.touchJumpHeld;
    const boostHeld = this.boostKey.isDown || this.touchBoostHeld;
    const slamDown = Phaser.Input.Keyboard.JustDown(this.slamKey)
      || Phaser.Input.Keyboard.JustDown(this.cursors.down)
      || this.touchSlamDown;
    this.touchJumpDown = false;
    this.touchSlamDown = false;

    return { direction: this.direction, jumpDown, jumpHeld, boostHeld, slamDown };
  }
}
