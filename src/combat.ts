import { clamp, segmentHits, type Body } from './model.ts';
export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  kind: 'enforcer' | 'drone';
  fire: number;
  flash: number;
}
export interface Bullet {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  hostile: boolean;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}
export class Combat {
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  hp = 100;
  kills = 0;
  wave = 1;
  cooldown = 0;
  invulnerable = 0;
  shake = 0;
  hitstop = 0;
  elapsed = 0;
  complete = false;
  down = false;
  onShot = () => {};
  onHit = () => {};
  constructor(
    public width: number,
    playerX: number,
  ) {
    this.spawn(playerX);
  }
  private spawn(x: number) {
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1;
      this.enemies.push({
        id: this.wave * 10 + i,
        x: clamp(x + side * (300 + i * 50), 45, this.width - 45),
        y: i >= 2 ? 300 : 411,
        hp: i >= 2 ? 36 : 60,
        kind: i >= 2 ? 'drone' : 'enforcer',
        fire: 1 + i * 0.45,
        flash: 0,
      });
    }
  }
  shoot(p: Body, aim: { x: number; y: number }) {
    if (this.cooldown > 0 || this.down || this.complete) return;
    this.cooldown = 0.12;
    const y = p.y - 43,
      angle = Math.atan2(aim.y - y, aim.x - p.x) + (Math.random() - 0.5) * 0.035;
    this.bullets.push({
      x: p.x + Math.cos(angle) * 20,
      y: y + Math.sin(angle) * 20,
      px: p.x,
      py: y,
      vx: Math.cos(angle) * 880,
      vy: Math.sin(angle) * 880,
      life: 1.3,
      hostile: false,
    });
    p.facing = aim.x > p.x ? 1 : -1;
    this.onShot();
    this.burst(p.x + Math.cos(angle) * 23, y + Math.sin(angle) * 23, 4, '#ffdd92');
  }
  burst(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n && this.particles.length < 180; i++) {
      const a = Math.random() * Math.PI * 2,
        s = 40 + Math.random() * 170,
        l = 0.15 + Math.random() * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: l,
        max: l,
        color,
      });
    }
  }
  update(dt: number, p: Body) {
    this.elapsed += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.shake *= Math.exp(-dt * 12);
    this.hitstop = Math.max(0, this.hitstop - dt);
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt);
      const direction = Math.sign(p.x - e.x);
      if (e.kind === 'enforcer' && Math.abs(p.x - e.x) > 150) e.x += direction * 48 * dt;
      if (e.kind === 'drone') {
        e.y = 285 + Math.sin(this.elapsed * 2 + e.id) * 30;
        e.x += direction * 23 * dt;
      }
      e.fire -= dt;
      if (e.fire <= 0 && !this.down) {
        e.fire = e.kind === 'drone' ? 2.3 : 1.7;
        const a = Math.atan2(p.y - 35 - e.y, p.x - e.x);
        this.bullets.push({
          x: e.x,
          y: e.y,
          px: e.x,
          py: e.y,
          vx: Math.cos(a) * 220,
          vy: Math.sin(a) * 220,
          life: 5,
          hostile: true,
        });
      }
    }
    for (const b of this.bullets) {
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.hostile) {
        if (
          !this.down &&
          this.invulnerable <= 0 &&
          segmentHits(b.px, b.py, b.x, b.y, p.x, p.y - 33, 21)
        ) {
          b.life = 0;
          this.hp = Math.max(0, this.hp - 12);
          this.invulnerable = 0.65;
          this.shake = 5;
          this.onHit();
          if (this.hp === 0) this.down = true;
        }
      } else {
        const e = this.enemies.find(
          (e) =>
            e.hp > 0 && segmentHits(b.px, b.py, b.x, b.y, e.x, e.y, e.kind === 'drone' ? 20 : 26),
        );
        if (e) {
          b.life = 0;
          e.hp -= 20;
          e.flash = 0.09;
          e.x = clamp(e.x + Math.sign(b.vx) * 4, 30, this.width - 30);
          this.burst(b.x, b.y, 7, '#efb972');
          this.onHit();
          this.shake = 2;
          if (e.hp <= 0) {
            this.kills++;
            this.burst(e.x, e.y, 23, '#f06449');
            this.hitstop = 0.045;
            this.shake = 4;
          }
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.bullets = this.bullets.filter((b) => b.life > 0 && b.x > -100 && b.x < this.width + 100);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (!this.enemies.length && !this.down) {
      if (this.wave === 1) {
        this.wave++;
        this.spawn(p.x);
      } else this.complete = true;
    }
  }
}
