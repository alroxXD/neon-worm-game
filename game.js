const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const livesElement = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const canvasWrapper = document.querySelector('.canvas-wrapper');

const MAX_LIVES = 3;

// Game constants
const TILE_SIZE = 20;
const CANVAS_SIZE = 400;
const GRID_SIZE = CANVAS_SIZE / TILE_SIZE;
const GAME_SPEED = 100; // ms per frame (lower is faster)

// Colors
const COLOR_BG = '#1a1a24';
const COLOR_SNAKE_HEAD = '#ffffff';
const COLOR_SNAKE_BODY = '#39ff14';
const COLOR_FOOD = '#ff073a';

// Game state
let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let lives = MAX_LIVES;
let highScore = localStorage.getItem('neonWormHighScore') || 0;
let lastRenderTime = 0;
let isGameOver = true;
let hasStarted = false;

highScoreElement.textContent = highScore;

// Reset the snake to starting position
function resetSnake() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    direction = { x: 0, y: -1 };
    nextDirection = { x: 0, y: -1 };
}

// Update the lives display with hearts
function updateLivesDisplay() {
    const full = '❤️ '.repeat(lives).trim();
    const empty = '🖤 '.repeat(MAX_LIVES - lives).trim();
    livesElement.textContent = (full + ' ' + empty).trim();
}

// Initialize game
function initGame() {
    resetSnake();
    score = 0;
    lives = MAX_LIVES;
    scoreElement.textContent = score;
    updateLivesDisplay();
    placeFood();
    isGameOver = false;
    hasStarted = true;
    overlay.classList.add('hidden');
    requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop(currentTime) {
    if (isGameOver) return;

    requestAnimationFrame(gameLoop);

    const secondsSinceLastRender = (currentTime - lastRenderTime);
    if (secondsSinceLastRender < GAME_SPEED) return;

    lastRenderTime = currentTime;

    update();
    draw();
}

// Update game state
function update() {
    direction = nextDirection;

    // Calculate new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check collisions
    if (isCollision(head)) {
        loseLife();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('neonWormHighScore', highScore);
        }
        placeFood();
    } else {
        // Remove tail
        snake.pop();
    }
}

// Check for collisions with walls or self
function isCollision(pos) {
    // Wall collision
    if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) {
        return true;
    }
    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === pos.x && snake[i].y === pos.y) {
            return true;
        }
    }
    return false;
}

// Place food at random empty location
function placeFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        // Ensure food doesn't spawn on the snake
        const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        if (!onSnake) break;
    }
    food = newFood;
}

// Draw game state
function draw() {
    // Clear canvas
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid (optional, can be disabled for cleaner look)
    /*
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i <= CANVAS_SIZE; i += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }
    */

    // Draw food with glow
    ctx.fillStyle = COLOR_FOOD;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLOR_FOOD;
    ctx.fillRect(food.x * TILE_SIZE + 2, food.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = COLOR_SNAKE_HEAD;
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLOR_SNAKE_HEAD;
        } else {
            // Body
            ctx.fillStyle = COLOR_SNAKE_BODY;
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLOR_SNAKE_BODY;
        }
        
        // Draw slightly smaller than tile to create segment effect
        ctx.fillRect(segment.x * TILE_SIZE + 1, segment.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    });

    // Reset shadow for next frame
    ctx.shadowBlur = 0;
}

// Called when the worm collides with a wall or itself
function loseLife() {
    lives--;
    updateLivesDisplay();

    // Shake the canvas
    canvasWrapper.classList.add('shake');
    setTimeout(() => canvasWrapper.classList.remove('shake'), 400);

    if (lives <= 0) {
        gameOver();
    } else {
        // Reset the snake but keep the score and food
        resetSnake();
    }
}

function gameOver() {
    isGameOver = true;
    overlayTitle.textContent = "GAME OVER";
    overlayTitle.style.color = COLOR_FOOD;
    overlayTitle.style.textShadow = `0 0 15px ${COLOR_FOOD}`;
    overlayText.textContent = `Score: ${score} — Press Space to Restart`;
    overlay.classList.remove('hidden');
}

// Input handling
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
        case ' ':
            // Spacebar to start/restart
            if (isGameOver) {
                initGame();
            }
            break;
    }
});

// Initial draw just to show the empty board
draw();
