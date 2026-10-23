/* Nutty Adventure — deterministic, renderer-independent gameplay. No dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NuttyCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const GOAL = 15;
  const LEVELS = Object.freeze([
    { name: 'Almond Meadow', nut: 'almond', subtitle: 'Every adventure starts with a little nut.', interval: 1.48, flight: 2.75, pattern: 'gentle', color: '#d9bc65', reward: 'Golden Acorn' },
    { name: 'Acorn Alley', nut: 'acorn', subtitle: 'A little left. A little right. A little magic.', interval: 1.25, flight: 2.5, pattern: 'roaming', color: '#76bdab', reward: 'Moonlit Mushroom' },
    { name: 'Chestnut Chaos', nut: 'chestnut', subtitle: 'Keep an eye on those cheeky curves.', interval: 1.13, flight: 2.25, pattern: 'zigzag', color: '#edab77', reward: 'Starlight Diamond' },
    { name: 'Hazelnut Havoc', nut: 'hazelnut', subtitle: 'Double the nuts. Double the fun.', interval: 1.12, flight: 2.05, pattern: 'double', color: '#cab1df', reward: 'Glowflower' },
    { name: 'Walnut Wonderland', nut: 'walnut', subtitle: 'One last leap into a little wonder.', interval: 1.02, flight: 1.85, pattern: 'wonder', color: '#f3bc60', reward: 'Friendship Star' }
  ]);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  class Game {
    constructor({ width = 1200, height = 660, random = Math.random, emit = () => {} } = {}) {
      this.random = random; this.emit = emit; this.width = width; this.height = height;
      this.state = 'menu'; this.level = 0; this.score = 0; this.lives = 5;
      this.time = 0; this.nuts = []; this.player = { x: width / 2, vx: 0 };
      this.rabbit = { x: width * .65, windup: 0, throwFlash: 0, jump: 0 };
      this.sequence = 0; this.streak = 0; this.spawnTimer = 1;
      this.pending = null; this.extraThrows = []; this.lastTarget = width / 2;
    }
    get catchY() { return this.height - (this.width < 800 ? 132 : 111); }
    get basketHalf() { return this.width < 800 ? 62 : 63; }
    get playerSpeed() { return this.width < 800 ? 650 : 900; }
    get platformY() { return this.width < 800 ? 315 : 230; }
    get throwY() { return this.platformY - (this.rabbit?.jump || 0); }
    get margin() { return this.width < 800 ? 76 : 85; }
    start(level = 0) {
      this.level = clamp(Math.floor(level), 0, 4); this.state = 'playing';
      this.score = 0; this.lives = 5; this.time = 0; this.nuts = [];
      this.player.x = this.width / 2; this.player.vx = 0;
      this.rabbit.x = this.width / 2; this.rabbit.windup = 0; this.rabbit.throwFlash = 0; this.rabbit.jump = 0;
      this.pending = null; this.extraThrows = []; this.spawnTimer = 1.15;
      this.sequence = 0; this.streak = 0; this.lastTarget = this.width / 2;
      this.emit('start', { level: this.level });
    }
    resize(width, height) {
      const ratio = width / this.width;
      this.player.x *= ratio; this.rabbit.x *= ratio; this.lastTarget *= ratio;
      this.width = width; this.height = height;
      // An orientation change is handled while paused. Existing trajectories are
      // reprojected so they retain their age and remaining flight time.
      for (const n of this.nuts) {
        n.startX *= ratio; n.target *= ratio; n.x *= ratio;
        n.startY = this.throwY; n.gravity = 2 * (this.catchY - n.startY - n.vy * n.flight) / n.flight ** 2;
        n.vx = (n.target - n.startX) / n.flight;
        n.y = n.startY + n.vy * n.age + .5 * n.gravity * n.age ** 2;
      }
      if (this.pending) this.pending.target *= ratio;
      for (const extra of this.extraThrows) extra.target *= ratio;
    }
    pause() { if (this.state === 'playing') { this.state = 'paused'; this.emit('pause'); } }
    resume() { if (this.state === 'paused') { this.state = 'playing'; this.emit('resume'); } }
    chooseTarget() {
      const w = this.width, cfg = LEVELS[this.level];
      let target;
      if (cfg.pattern === 'gentle') target = w * .5 + Math.sin(this.sequence * .61) * w * .15;
      else if (cfg.pattern === 'roaming') target = this.rabbit.x + 42;
      else if (cfg.pattern === 'zigzag') target = this.rabbit.x + (this.sequence % 2 ? -1 : 1) * w * .22;
      else target = w * .18 + this.random() * w * .64;
      const maxStep = Math.min(w * .37, this.playerSpeed * cfg.interval * .52);
      return clamp(clamp(target, this.lastTarget - maxStep, this.lastTarget + maxStep), this.margin, w - this.margin);
    }
    launch(target, volley = 0) {
      const cfg = LEVELS[this.level];
      const startX = this.rabbit.x + 47, startY = this.throwY;
      const flight = cfg.flight + volley * .035, vy = -36 - this.level * 9;
      const nut = { id: this.sequence++, type: cfg.nut, startX, startY, x: startX, y: startY,
        target: clamp(target, this.margin, this.width - this.margin), age: 0, flight, vy,
        angle: this.random() * Math.PI, spin: (this.random() - .5) * 2.6,
        zigzag: cfg.pattern === 'zigzag' ? 20 : cfg.pattern === 'wonder' ? 9 : 0 };
      nut.vx = (nut.target - startX) / flight;
      nut.gravity = 2 * (this.catchY - startY - vy * flight) / flight ** 2;
      this.nuts.push(nut); this.rabbit.throwFlash = .32;
      this.emit('throw', nut);
    }
    update(dt, input = {}) {
      if (this.state !== 'playing') return;
      dt = clamp(dt, 0, .05); this.time += dt;
      const cfg = LEVELS[this.level], p = this.player;
      const before = p.x;
      if (Number.isFinite(input.targetX)) p.x += clamp(input.targetX - p.x, -this.playerSpeed * dt, this.playerSpeed * dt);
      else p.x += clamp(input.axis || 0, -1, 1) * this.playerSpeed * dt;
      p.x = clamp(p.x, this.margin, this.width - this.margin); p.vx = (p.x - before) / Math.max(dt, .001);
      const amplitude = this.level === 0 ? .15 : this.level === 4 ? .31 : .29;
      this.rabbit.x = this.width * (.5 + Math.sin(this.time * (this.level === 4 ? 1.1 : this.level === 0 ? .33 : .73)) * amplitude);
      this.rabbit.jump = this.level === 4 ? Math.max(0, Math.sin(this.time * 3.2)) * 22 : 0;
      this.rabbit.throwFlash = Math.max(0, this.rabbit.throwFlash - dt);
      this.spawnTimer -= dt;
      if (!this.pending && this.spawnTimer <= 0) {
        const target = this.chooseTarget(); this.lastTarget = target;
        this.pending = { target, wait: .32 };
        this.spawnTimer = cfg.interval * (cfg.pattern === 'double' || cfg.pattern === 'wonder' ? .8 + this.random() * .4 : 1);
      }
      if (this.pending) {
        this.pending.wait -= dt; this.rabbit.windup = clamp(1 - this.pending.wait / .32, 0, 1);
        if (this.pending.wait <= 0) {
          const target = this.pending.target; this.launch(target); this.pending = null;
          if (cfg.pattern === 'double' && this.sequence % 3 === 1) this.extraThrows.push({ delay: .16, target: target + (this.sequence % 2 ? 34 : -34), volley: 1 });
          if (cfg.pattern === 'wonder' && this.sequence % 4 === 1) {
            this.extraThrows.push({ delay: .12, target: target - 35, volley: 1 }, { delay: .24, target: target + 35, volley: 2 });
          }
        }
      } else this.rabbit.windup = 0;
      for (let i = this.extraThrows.length - 1; i >= 0; i--) {
        this.extraThrows[i].delay -= dt;
        if (this.extraThrows[i].delay <= 0) { const e = this.extraThrows.splice(i, 1)[0]; this.launch(e.target, e.volley); }
      }
      for (let i = this.nuts.length - 1; i >= 0; i--) {
        const n = this.nuts[i], oldY = n.y; n.age += dt;
        n.x = n.startX + n.vx * n.age + n.zigzag * Math.sin(n.age * 8) * Math.sin(Math.PI * clamp(n.age / n.flight, 0, 1));
        n.y = n.startY + n.vy * n.age + .5 * n.gravity * n.age ** 2;
        n.angle += n.spin * dt;
        if (oldY <= this.catchY + 18 && n.y >= this.catchY - 10 && Math.abs(n.x - p.x) <= this.basketHalf + 9) {
          this.nuts.splice(i, 1); this.score++; this.streak++;
          this.emit('catch', { x: n.x, y: this.catchY, streak: this.streak, score: this.score });
          if (this.score === GOAL) {
            this.state = 'level-complete'; this.nuts = []; this.pending = null; this.extraThrows = [];
            this.emit('complete', { level: this.level }); break;
          }
        } else if (n.y > this.height - 35) {
          this.nuts.splice(i, 1); this.lives--; this.streak = 0;
          this.emit('miss', { x: n.x, y: this.height - 37, lives: this.lives });
          if (this.lives <= 0) {
            this.state = 'game-over'; this.nuts = []; this.pending = null; this.extraThrows = [];
            this.emit('gameover', { level: this.level }); break;
          }
        }
      }
    }
  }
  const SAVE_KEY = 'nutty-adventure.v1';
  function cleanSave(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    const completed = clamp(Number.isInteger(data.completed) ? data.completed : 0, 0, 5);
    const rewards = [...new Set(Array.isArray(data.rewards) ? data.rewards.filter(n => Number.isInteger(n) && n >= 0 && n < completed) : [])];
    const pending = Number.isInteger(data.pending) && data.pending >= 0 && data.pending < completed && !rewards.includes(data.pending) ? data.pending : null;
    return { completed, rewards, pending, sound: data.sound !== false, reduced: typeof data.reduced === 'boolean' ? data.reduced : null, victory: data.victory === true && completed === 5 && rewards.length === 5 };
  }
  class Progress {
    constructor(storage) { this.storage = storage; this.available = true; try { this.data = cleanSave(JSON.parse(storage.getItem(SAVE_KEY))); } catch { this.data = cleanSave(); this.available = false; } }
    save() { try { this.storage.setItem(SAVE_KEY, JSON.stringify(this.data)); return true; } catch { this.available = false; return false; } }
    complete(level) { this.data.completed = Math.max(this.data.completed, level + 1); this.data.pending = this.data.rewards.includes(level) ? null : level; this.save(); }
    reward(level) { if (!this.data.rewards.includes(level)) this.data.rewards.push(level); this.data.pending = null; if (level === 4 && this.data.rewards.length === 5) this.data.victory = true; this.save(); }
    get unlocked() { return Math.min(5, this.data.completed + 1); }
  }
  return { Game, Progress, LEVELS, GOAL, SAVE_KEY, cleanSave, clamp };
});
