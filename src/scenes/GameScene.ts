import Phaser from 'phaser';
import { COLORS, GAME } from '../constants/GameSettings';
import { SCENES } from '../constants/Scenes';
import { Player } from '../entities/Player';
import { PlayerInput } from '../input/PlayerInput';
import { findRecoveryAnchor, type GroundAnchor } from '../systems/checkpoint';

const RECOVERY_ANCHORS: readonly GroundAnchor[] = [
  { x: 140, y: 700 },
  { x: 1050, y: 540 },
  { x: 1850, y: 520 },
  { x: 2750, y: 460 },
  { x: 3480, y: 600 },
  { x: 4480, y: 700 },
  { x: 5200, y: 700 },
];

export class GameScene extends Phaser.Scene {
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Player;
  private controls!: PlayerInput;
  private stateText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private controlLayer!: Phaser.GameObjects.Container;
  private completed = false;

  public constructor() {
    super(SCENES.game);
  }

  public create(): void {
    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.drawBackdrop();
    this.platforms = this.physics.add.staticGroup();
    this.buildLevel();

    this.controls = new PlayerInput(this);
    this.player = new Player(this, RECOVERY_ANCHORS[0].x, RECOVERY_ANCHORS[0].y - 60);
    this.physics.add.collider(this.player.sprite, this.platforms);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08, -120, 80);
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);

    this.createHud();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutHud, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutHud, this);
    });
  }

  public update(_time: number, delta: number): void {
    if (this.completed) {
      return;
    }
    const actions = this.controls.read();
    this.player.update(actions, delta);
    this.assistStairSlopes(actions.direction);
    const status = this.player.getStatus();
    const actionLabel = status.slamming ? ' · SLAM' : status.turning ? ' · TURN' : '';
    this.stateText.setText(`${status.state.toUpperCase()} · T${status.tier} · ${status.speed}${actionLabel}`);

    const playerEvent = this.player.consumeEvent();
    if (playerEvent === 'drop-boost') {
      this.showTransientHint('DROP BOOST! · TIER 2');
    } else if (playerEvent === 'slam-land') {
      this.showTransientHint('SLAM · 높이가 부족해 boost 없음');
    }

    if (this.player.sprite.y > GAME.safetyFloorY - 60) {
      const anchor = findRecoveryAnchor(this.player.sprite.x, RECOVERY_ANCHORS);
      this.player.recover(anchor.x, anchor.y);
      this.showTransientHint('안전 지면으로 복귀!');
    }

    if (this.player.sprite.x >= GAME.finishX) {
      this.showComplete();
    }
  }

  private buildLevel(): void {
    this.addPlatform(0, 700, 820, 140, COLORS.ground, COLORS.groundTop);

    for (let index = 0; index < 12; index += 1) {
      this.addPlatform(820 + index * 48, 700 - (index + 1) * 14, 50, 180 + index * 14, COLORS.ground, COLORS.groundTop);
    }
    this.addPlatform(1396, 532, 520, 310, COLORS.ground, COLORS.groundTop);

    for (let index = 0; index < 8; index += 1) {
      const top = 532 + index * 18;
      this.addPlatform(1916 + index * 52, top, 54, 260, COLORS.ground, COLORS.groundTop);
    }
    for (let index = 0; index < 8; index += 1) {
      const top = 658 - index * 24;
      this.addPlatform(2332 + index * 52, top, 54, 320, COLORS.ground, COLORS.groundTop);
    }

    this.addPlatform(2748, 466, 620, 62, COLORS.platform, COLORS.platformTop);
    this.addPlatform(3368, 600, 500, 220, COLORS.ground, COLORS.groundTop);
    this.addPlatform(3868, 700, 650, 160, COLORS.ground, COLORS.groundTop);
    this.addPlatform(4040, 360, 95, 340, COLORS.platform, COLORS.platformTop);
    this.addPlatform(4260, 250, 720, 56, COLORS.platform, COLORS.platformTop);
    this.addPlatform(4518, 700, 1482, 160, COLORS.ground, COLORS.groundTop);

    const safety = this.add.rectangle(GAME.worldWidth / 2, GAME.safetyFloorY, GAME.worldWidth, 30, 0x000000, 0);
    this.physics.add.existing(safety, true);
    this.platforms.add(safety);

    this.addZoneLabel(210, 610, 'START  ·  SHIFT / BOOST');
    this.addZoneLabel(910, 590, 'TIER 1 → 2');
    this.addZoneLabel(1620, 440, 'UPPER DECK');
    this.addZoneLabel(2860, 370, 'JUMP · MOMENTUM KEEP');
    this.addZoneLabel(3430, 520, 'SLAM  ·  ↓ / S');
    this.addZoneLabel(3880, 590, 'FLY GATE  ·  길게 누르기');
    this.createFinishFlag();
  }

  private addPlatform(x: number, topY: number, width: number, height: number, fill: number, cap: number): void {
    const body = this.add.rectangle(x + width / 2, topY + height / 2, width, height, fill);
    body.setStrokeStyle(2, cap, 0.45);
    this.add.rectangle(x + width / 2, topY + 4, width, 8, cap);
    this.physics.add.existing(body, true);
    this.platforms.add(body);
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics().setScrollFactor(0).setDepth(-20);
    graphics.fillGradientStyle(COLORS.skyLight, COLORS.skyLight, COLORS.sky, COLORS.sky, 1);
    graphics.fillRect(0, 0, GAME.width, GAME.height);
    for (let index = 0; index < 8; index += 1) {
      const x = 100 + index * 170;
      graphics.fillStyle(0x8ba9cf, 0.08).fillCircle(x, 130 + (index % 3) * 55, 90);
    }
  }

  private addZoneLabel(x: number, y: number, label: string): void {
    this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '18px', color: COLORS.textMuted,
    }).setOrigin(0.5).setAlpha(0.8);
  }

  private createFinishFlag(): void {
    this.add.rectangle(GAME.finishX, 570, 8, 260, 0xe8eefc);
    this.add.triangle(GAME.finishX + 44, 462, 0, 0, 88, 28, 0, 56, COLORS.danger);
    this.add.text(GAME.finishX - 20, 665, 'GOAL', { fontSize: '20px', color: COLORS.text }).setOrigin(0.5);
  }

  private createHud(): void {
    this.stateText = this.add.text(22, 20, 'ROLL', {
      fontFamily: 'monospace', fontSize: '22px', fontStyle: 'bold', color: COLORS.text,
      backgroundColor: '#1c2944', padding: { x: 12, y: 7 },
    }).setScrollFactor(0).setDepth(100);
    this.hintText = this.add.text(0, 0, 'A/D 방향 · SPACE 점프/활공 · SHIFT boost · ↓/S slam', {
      fontFamily: 'system-ui', fontSize: '16px', color: COLORS.textMuted,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.controlLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const left = this.createControlButton('←', () => this.controls.setTouchDirection(-1));
    const right = this.createControlButton('→', () => this.controls.setTouchDirection(1));
    const jump = this.createControlButton(
      'FLY',
      () => this.controls.setTouchJump(true),
      () => this.controls.setTouchJump(false),
      15,
    );
    const boost = this.createControlButton(
      'BOOST',
      () => this.controls.setTouchBoost(true),
      () => this.controls.setTouchBoost(false),
      12,
    );
    const slam = this.createControlButton('SLAM', () => this.controls.pressTouchSlam(), undefined, 12);
    left.setName('left');
    right.setName('right');
    jump.setName('jump');
    boost.setName('boost');
    slam.setName('slam');
    this.controlLayer.add([left, right, jump, boost, slam]);
    this.layoutHud();
  }

  private createControlButton(
    label: string,
    onDown?: () => void,
    onUp?: () => void,
    fontSize = 28,
  ): Phaser.GameObjects.Container {
    const circle = this.add.circle(0, 0, 36, COLORS.control, 0.82).setStrokeStyle(2, 0xffffff, 0.25);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace', fontSize: `${fontSize}px`, fontStyle: 'bold', color: COLORS.text,
    }).setOrigin(0.5);
    const button = this.add.container(0, 0, [circle, text]);
    button.setSize(80, 80).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      circle.setFillStyle(COLORS.controlActive, 0.95);
      onDown?.();
    });
    const release = (): void => {
      circle.setFillStyle(COLORS.control, 0.82);
      onUp?.();
    };
    button.on('pointerup', release).on('pointerout', release);
    return button;
  }

  private layoutHud(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.hintText.setPosition(width / 2, 31);
    const leftButton = this.controlLayer.getByName('left');
    const rightButton = this.controlLayer.getByName('right');
    const jumpButton = this.controlLayer.getByName('jump');
    const boostButton = this.controlLayer.getByName('boost');
    const slamButton = this.controlLayer.getByName('slam');
    if (leftButton instanceof Phaser.GameObjects.Container) leftButton.setPosition(66, height - 65);
    if (rightButton instanceof Phaser.GameObjects.Container) rightButton.setPosition(150, height - 65);
    if (jumpButton instanceof Phaser.GameObjects.Container) jumpButton.setPosition(width - 72, height - 68);
    if (boostButton instanceof Phaser.GameObjects.Container) boostButton.setPosition(width - 156, height - 68);
    if (slamButton instanceof Phaser.GameObjects.Container) slamButton.setPosition(width - 72, height - 152);
    const compact = width < 720 || this.sys.game.device.input.touch;
    this.controlLayer.setVisible(compact);
    this.hintText.setVisible(!compact);
  }

  private showTransientHint(message: string): void {
    this.hintText.setText(message).setVisible(true).setAlpha(1);
    this.tweens.add({ targets: this.hintText, alpha: 0, delay: 900, duration: 400 });
  }

  private assistStairSlopes(direction: -1 | 1): void {
    const body = this.player.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }
    const insideStairSection = this.player.sprite.x >= 790 && this.player.sprite.x <= 2750;
    const blockedForward = direction > 0 ? body.blocked.right : body.blocked.left;
    if (insideStairSection && body.blocked.down && blockedForward) {
      this.player.sprite.setY(this.player.sprite.y - 28);
    }
  }

  private showComplete(): void {
    this.completed = true;
    this.player.sprite.setVelocity(0, 0);
    const width = this.scale.width;
    const height = this.scale.height;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x07101d, 0.8).setScrollFactor(0).setDepth(200);
    const title = this.add.text(width / 2, height / 2 - 55, 'TEST CLEAR!', {
      fontFamily: 'monospace', fontSize: '40px', fontStyle: 'bold', color: '#ffca5c',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const restart = this.add.text(width / 2, height / 2 + 25, '다시 달리기', {
      fontSize: '20px', color: COLORS.text, backgroundColor: '#4667a9', padding: { x: 24, y: 13 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
    restart.on('pointerup', () => this.scene.restart());
    shade.setInteractive();
    title.setScale(0.7);
    this.tweens.add({ targets: title, scale: 1, duration: 350, ease: 'Back.Out' });
  }
}
