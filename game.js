const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const LOGICAL_WIDTH = 540;
const LOGICAL_HEIGHT = 960;

let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let lives = 3;
let bestScore = localStorage.getItem('tangkap_mangga_best') || 0;

let basket = {
    x: LOGICAL_WIDTH / 2 - 60,
    y: LOGICAL_HEIGHT - 130,
    width: 120,
    height: 70,
    speed: 12,
    dx: 0
};

let items = [];
let particles = [];
let floatingTexts = [];
let spawnTimer = 0;
let spawnInterval = 60; // frames
let gameSpeed = 3;

let keys = {
    left: false,
    right: false
};

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playPopSound() {
    try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // Audio not allowed or failed
    }
}

function playBombSound() {
    try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
}

// Input listeners
window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.code === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.code === 'KeyR' && gameState === 'GAMEOVER') restartGame();
    if (e.code === 'Space' && gameState === 'START') startGame();
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.code === 'ArrowRight' || e.key === 'd') keys.right = false;
});

let isDragging = false;
canvas.addEventListener('pointerdown', e => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (LOGICAL_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (LOGICAL_HEIGHT / rect.height);

    if (gameState === 'START') {
        if (x >= 140 && x <= 400 && y >= 550 && y <= 650) {
            startGame();
        }
    } else if (gameState === 'GAMEOVER') {
        if (x >= 140 && x <= 400 && y >= 600 && y <= 700) {
            restartGame();
        }
    } else if (gameState === 'PLAYING') {
        isDragging = true;
        basket.x = x - basket.width / 2;
    }
});

canvas.addEventListener('pointermove', e => {
    if (!isDragging || gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (LOGICAL_WIDTH / rect.width);
    basket.x = x - basket.width / 2;
});

window.addEventListener('pointerup', () => {
    isDragging = false;
});

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    lives = 3;
    items = [];
    spawnTimer = 0;
    gameSpeed = 4;
}

function restartGame() {
    startGame();
}

function spawnItem() {
    const isBomb = Math.random() < 0.25; // 25% chance of bomb
    const size = isBomb ? 35 : 30;
    items.push({
        x: Math.random() * (LOGICAL_WIDTH - 80) + 40,
        y: -50,
        radius: size,
        speed: gameSpeed + Math.random() * 2,
        isBomb: isBomb,
        rotation: Math.random() * Math.PI
    });
}

function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color: color,
            radius: 3 + Math.random() * 3
        });
    }
}

function spawnFloatingText(text, x, y, color) {
    floatingTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        alpha: 1,
        vy: -2.5
    });
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Move basket with keyboard
    if (keys.left) basket.x -= basket.speed;
    if (keys.right) basket.x += basket.speed;

    // Clamp basket to screen
    if (basket.x < 0) basket.x = 0;
    if (basket.x > LOGICAL_WIDTH - basket.width) basket.x = LOGICAL_WIDTH - basket.width;

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.025;
        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // Spawn items
    spawnTimer++;
    if (spawnTimer > spawnInterval) {
        spawnItem();
        spawnTimer = 0;
        // Increase difficulty slightly
        spawnInterval = Math.max(25, 60 - Math.floor(score / 3) * 3);
        gameSpeed = 4 + Math.floor(score / 5) * 0.5;
    }

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;
        item.rotation += 0.02;

        // Collision check with basket
        // Basket hit box
        const bx = basket.x + basket.width / 2;
        const by = basket.y + 20;
        const dist = Math.hypot(item.x - bx, item.y - by);

        if (dist < basket.width / 2 + item.radius - 10) {
            if (item.isBomb) {
                playBombSound();
                spawnParticles(item.x, item.y, '#111', 15);
                spawnFloatingText('BOMB!', item.x, item.y, '#ff3366');
                lives--;
                items.splice(i, 1);
                if (lives <= 0) {
                    gameOver();
                }
            } else {
                playPopSound();
                spawnParticles(item.x, item.y, '#ff9f1c', 12);
                spawnFloatingText('+1', item.x, item.y, '#ffd166');
                score++;
                items.splice(i, 1);
            }
            continue;
        }

        // Out of bounds (bottom)
        if (item.y > LOGICAL_HEIGHT + 50) {
            if (!item.isBomb) {
                // Missed mango!
                lives--;
                spawnParticles(item.x, LOGICAL_HEIGHT - 60, '#ff3366', 8);
                spawnFloatingText('MISS!', item.x, LOGICAL_HEIGHT - 80, '#ff3366');
                playBombSound();
                if (lives <= 0) {
                    gameOver();
                }
            }
            items.splice(i, 1);
        }
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('tangkap_mangga_best', bestScore);
    }
}

function drawBackground() {
    // Sky gradient
    let grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    grad.addColorStop(0, '#1a2a6c');
    grad.addColorStop(0.5, '#b21f1f');
    grad.addColorStop(1, '#fdbb2d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15);';
    ctx.beginPath();
    ctx.arc(100, 150, 40, 0, Math.PI * 2);
    ctx.arc(140, 140, 50, 0, Math.PI * 2);
    ctx.arc(180, 150, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(420, 300, 50, 0, Math.PI * 2);
    ctx.arc(470, 280, 60, 0, Math.PI * 2);
    ctx.arc(520, 300, 45, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#1e3f20';
    ctx.fillRect(0, LOGICAL_HEIGHT - 60, LOGICAL_WIDTH, 60);
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, LOGICAL_HEIGHT - 60, LOGICAL_WIDTH, 15);
}

function drawBasket() {
    ctx.save();
    ctx.translate(basket.x, basket.y);
    // Basket body (woven style with arcs or lines)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(basket.width - 10, 0);
    ctx.lineTo(basket.width, basket.height);
    ctx.lineTo(0, basket.height);
    ctx.closePath();
    ctx.fill();

    // Rim
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(-5, -8, basket.width + 10, 12);

    // Woven pattern lines
    ctx.strokeStyle = '#5c2c16';
    ctx.lineWidth = 2;
    for (let i = 15; i < basket.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - 5, basket.height);
        ctx.stroke();
    }
    ctx.restore();
}

function drawItem(item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.isBomb) {
        // Bomb: black circle with fuse and spark
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-item.radius / 3, -item.radius / 3, item.radius / 4, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -item.radius);
        ctx.quadraticCurveTo(15, -item.radius - 20, 25, -item.radius - 25);
        ctx.stroke();

        // Spark
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.arc(25, -item.radius - 25, 6 + Math.sin(Date.now() / 50) * 3, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Mango: orange-yellow ellipse with a green leaf
        ctx.rotate(item.rotation);
        ctx.fillStyle = '#ff9f1c';
        ctx.beginPath();
        ctx.ellipse(0, 0, item.radius, item.radius * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Leaf
        ctx.fillStyle = '#38b000';
        ctx.beginPath();
        ctx.ellipse(0, -item.radius * 1.1, 10, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawUI() {
    // Score top-right
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, LOGICAL_WIDTH - 30, 50);

    // Lives top-left (hearts)
    ctx.textAlign = 'left';
    let heartX = 30;
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < lives ? '#ff3366' : 'rgba(255, 255, 255, 0.2)';
        drawHeart(heartX, 35, 24);
        heartX += 35;
    }
}

function drawHeart(x, y, size) {
    ctx.save();
    ctx.beginPath();
    let d = size;
    ctx.moveTo(x, y + d / 4);
    ctx.bezierCurveTo(x, y, x - d / 2, y, x - d / 2, y + d / 4);
    ctx.bezierCurveTo(x - d / 2, y + d / 2, x, y + d * 0.75, x, y + d);
    ctx.bezierCurveTo(x, y + d * 0.75, x + d / 2, y + d / 2, x + d / 2, y + d / 4);
    ctx.bezierCurveTo(x + d / 2, y, x, y, x, y + d / 4);
    ctx.fill();
    ctx.restore();
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 54px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Tangkap Mangga', LOGICAL_WIDTH / 2, 320);

    ctx.font = '22px system-ui';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('Catch sweet mangoes, avoid dangerous bombs!', LOGICAL_WIDTH / 2, 380);

    // Start Button
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(LOGICAL_WIDTH / 2 - 130, 550, 260, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText('START GAME', LOGICAL_WIDTH / 2, 602);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 54px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', LOGICAL_WIDTH / 2, 300);

    ctx.fillStyle = '#fff';
    ctx.font = '32px system-ui';
    ctx.fillText(`Final Score: ${score}`, LOGICAL_WIDTH / 2, 400);

    ctx.fillStyle = '#ffd166';
    ctx.font = '24px system-ui';
    ctx.fillText(`Best Score: ${bestScore}`, LOGICAL_WIDTH / 2, 460);

    // Restart Button
    ctx.fillStyle = '#38b000';
    ctx.fillRect(LOGICAL_WIDTH / 2 - 130, 600, 260, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText('PLAY AGAIN', LOGICAL_WIDTH / 2, 652);

    ctx.font = '18px rgba(255,255,255,0.7)';
    ctx.fillText('Press R or Tap to Restart', LOGICAL_WIDTH / 2, 720);
}

function draw() {
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    drawBackground();

    for (let item of items) {
        drawItem(item);
    }

    for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (let ft of floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 26px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }

    drawBasket();
    drawUI();

    if (gameState === 'START') {
        drawStartScreen();
    } else if (gameState === 'GAMEOVER') {
        drawGameOverScreen();
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
