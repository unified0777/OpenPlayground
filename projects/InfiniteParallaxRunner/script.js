const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
const GAME_SPEED_START = 500;
let gameSpeed = GAME_SPEED_START;
let score = 0;
let isGameOver = false;
let frames = 0;
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
const assets = {};
function createAsset(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    drawFn(cx, w, h);
    return c;
}
function initAssets() {
    assets.playerRun1 = createAsset(40, 60, (c, w, h) => {
        c.fillStyle = '#0ff';
        c.fillRect(10, 20, 20, 30);
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(20, 15, 8, 0, Math.PI*2); c.fill();
        c.strokeStyle = '#0ff';
        c.lineWidth = 4;
        c.beginPath(); c.moveTo(20, 50); c.lineTo(10, 60); c.stroke();
        c.beginPath(); c.moveTo(20, 50); c.lineTo(30, 55); c.stroke();
    });
    assets.playerRun2 = createAsset(40, 60, (c, w, h) => {
        c.fillStyle = '#0ff';
        c.fillRect(10, 20, 20, 30);
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(20, 15, 8, 0, Math.PI*2); c.fill();
        c.strokeStyle = '#0ff';
        c.lineWidth = 4;
        c.beginPath(); c.moveTo(20, 50); c.lineTo(30, 60); c.stroke();
        c.beginPath(); c.moveTo(20, 50); c.lineTo(10, 55); c.stroke();
    });
    assets.playerJump = createAsset(40, 60, (c, w, h) => {
        c.fillStyle = '#0ff';
        c.fillRect(10, 20, 20, 30);
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(20, 15, 8, 0, Math.PI*2); c.fill();
        c.strokeStyle = '#0ff';
        c.lineWidth = 4;
        c.beginPath(); c.moveTo(20, 50); c.lineTo(5, 55); c.stroke();
        c.beginPath(); c.moveTo(20, 50); c.lineTo(35, 55); c.stroke();
    });
    assets.enemyGround = createAsset(40, 40, (c, w, h) => {
        c.fillStyle = '#f0f';
        c.beginPath();
        c.moveTo(20, 0); c.lineTo(40, 40); c.lineTo(0, 40);
        c.fill();
        c.fillStyle = '#505';
        c.fillRect(10, 10, 20, 20);
    });
    assets.enemyAir = createAsset(40, 30, (c, w, h) => {
        c.fillStyle = '#ff0';
        c.beginPath(); c.arc(20, 15, 10, 0, Math.PI*2); c.fill();
        c.strokeStyle = '#ff0';
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(5, 15); c.lineTo(35, 15); c.stroke();
    });
    assets.bgFar = createAsset(800, 600, (c, w, h) => {
        c.fillStyle = '#112';
        c.fillRect(0,0,w,h);
        c.fillStyle = '#223';
        for(let i=0; i<20; i++) {
            c.beginPath();
            c.moveTo(Math.random()*w, h);
            c.lineTo(Math.random()*w, h - 100 - Math.random()*200);
            c.lineTo(Math.random()*w, h);
            c.fill();
        }
    });
    assets.bgNear = createAsset(800, 600, (c, w, h) => {
        c.clearRect(0,0,w,h);
        c.fillStyle = '#334';
        for(let i=0; i<10; i++) {
            const H = 50 + Math.random() * 100;
            c.fillRect(i * 80, h - H, 60, H);
            c.fillStyle = '#556'; 
            for(let j=0; j<4; j++) c.fillRect(i*80 + 10, h - H + 10 + j*20, 10, 10);
            c.fillStyle = '#334';
        }
    });
}
initAssets();
class Layer {
    constructor(image, speedMod) {
        this.image = image;
        this.speedMod = speedMod;
        this.x = 0;
    }
    update(dt) {
        this.x -= gameSpeed * this.speedMod * dt;
        if (this.x <= -this.image.width) this.x = 0;
    }
    draw(ctx) {
        let x = this.x;
        while (x < width) {
            ctx.drawImage(this.image, x, 0, width, height);
            x += width; 
        }
    }
}
const layers = [
    new Layer(assets.bgFar, 0.2),
    new Layer(assets.bgNear, 0.5)
];
class Player {
    constructor() {
        this.w = 40;
        this.h = 60;
        this.x = 100;
        this.y = 0;
        this.dy = 0;
        this.jumpForce = 1200;
        this.gravity = 3500;
        this.isGrounded = false;
        this.state = 'run';
        this.frameTimer = 0;
        this.frameInterval = 0.1; 
    }
    update(dt, groundY) {
        if ((keys['Space'] || keys['ArrowUp']) && this.isGrounded) {
            this.dy = -this.jumpForce;
            this.isGrounded = false;
            this.state = 'jump';
        }
        this.dy += this.gravity * dt;
        this.y += this.dy * dt;
        if (this.y + this.h > groundY) {
            this.y = groundY - this.h;
            this.dy = 0;
            this.isGrounded = true;
            this.state = 'run';
        }
        if (this.state === 'run') {
            this.frameTimer += dt;
        }
    }
    draw(ctx) {
        let sprite = assets.playerJump;
        if (this.isGrounded) {
             sprite = (Math.floor(this.frameTimer / this.frameInterval) % 2 === 0) ? assets.playerRun1 : assets.playerRun2;
        }
        ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
    }
}
const player = new Player();
class Enemy {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.w = 40;
        this.h = 40;
        this.type = 0; 
    }
    spawn(x, groundY) {
        this.active = true;
        this.x = x;
        this.type = Math.random() > 0.5 ? 1 : 0;
        if (this.type === 0) { 
            this.w = 40; this.h = 40;
            this.y = groundY - this.h;
        } else {
            this.w = 40; this.h = 30;
            this.y = groundY - 100 - Math.random() * 50;
        }
    }
    update(dt) {
        if (!this.active) return;
        this.x -= gameSpeed * dt;
        if (this.x + this.w < 0) this.active = false;
    }
    draw(ctx) {
        if (!this.active) return;
        const img = this.type === 0 ? assets.enemyGround : assets.enemyAir;
        ctx.drawImage(img, this.x, this.y, this.w, this.h);
    }
}
const POOL_SIZE = 10;
const enemyPool = [];
for(let i=0; i<POOL_SIZE; i++) enemyPool.push(new Enemy());
let spawnTimer = 0;
let spawnInterval = 1.5; 
function getEnemy() {
    return enemyPool.find(e => !e.active);
}
function update(dt) {
    if (isGameOver) {
        if (keys['Enter']) resetGame();
        return;
    }
    const groundY = height - 100;
    gameSpeed += 5 * dt;
    score += gameSpeed * dt * 0.01;
    layers.forEach(l => l.update(dt));
    player.update(dt, groundY);
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        const e = getEnemy();
        if (e) e.spawn(width, groundY);
        spawnTimer = spawnInterval - Math.min(1.0, gameSpeed / 5000) + Math.random() * 0.5;
    }
    enemyPool.forEach(e => {
        e.update(dt);
        if (e.active) {
            if (
                player.x < e.x + e.w &&
                player.x + player.w > e.x &&
                player.y < e.y + e.h &&
                player.y + player.h > e.y
            ) {
                isGameOver = true;
            }
        }
    });
}
function draw() {
    const groundY = height - 100;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    layers.forEach(l => l.draw(ctx));
    ctx.fillStyle = '#222';
    ctx.fillRect(0, groundY, width, 100);
    player.draw(ctx);
    enemyPool.forEach(e => e.draw(ctx));
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
    if (isGameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,width,height);
        ctx.fillStyle = '#f00';
        ctx.font = '40px monospace';
        ctx.fillText('GAME OVER', width/2 - 100, height/2);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('Press Enter to Restart', width/2 - 120, height/2 + 40);
    }
}
let lastTime = 0;
function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}
function resetGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = GAME_SPEED_START;
    enemyPool.forEach(e => e.active = false);
    player.y = height - 100 - player.h;
    player.dy = 0;
    spawnTimer = 0;
}
requestAnimationFrame(loop);
