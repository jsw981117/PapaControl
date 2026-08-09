import Phaser from 'phaser';

export interface PlayerActions {
  direction: -1 | 1;
  jumpDown: boolean;
  jumpHeld: boolean;
}

export class PlayerInput {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly leftKey: Phaser.Input.Keyboard.Key;
  private readonly rightKey: Phaser.Input.Keyboard.Key;
  private readonly jumpKey: Phaser.Input.Keyboard.Key;
  private direction: -1 | 1 = 1;
  private touchJumpHeld = false;
  private touchJumpDown = false;

  public constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable.');
    }
    this.cursors = keyboard.createCursorKeys();
    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
    this.touchJumpDown = false;

    return { direction: this.direction, jumpDown, jumpHeld };
  }
}
