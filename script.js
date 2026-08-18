const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK = 24;

const COLORS = {
  I: "#38bdf8",
  J: "#60a5fa",
  L: "#fb923c",
  O: "#facc15",
  S: "#4ade80",
  T: "#c084fc",
  Z: "#f87171",
};

const SHAPES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
};

const scoreTable = [0, 100, 300, 500, 800];

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas ? nextCanvas.getContext("2d") : null;

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const actionButtons = document.querySelectorAll("[data-action]");

let board = createBoard();
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let lastTime = 0;
let animationId = 0;
let isRunning = false;
let isPaused = false;
let gameOver = false;
let holdIntervalId = 0;
let lastPointerActionAt = 0;
let pieceBag = [];

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function shuffleBag(types) {
  const bag = [...types];

  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }

  return bag;
}

function createPiece(type) {
  const shape = SHAPES[type];
  const rotation = 0;
  const matrix = shape[rotation];

  return {
    type,
    rotation,
    matrix,
    color: COLORS[type],
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: matrix.length === 4 ? -1 : 0,
  };
}

function randomPiece() {
  const types = Object.keys(SHAPES);

  if (pieceBag.length === 0) {
    pieceBag = shuffleBag(types);
  }

  return createPiece(pieceBag.pop());
}

function getDropInterval() {
  return Math.max(120, 900 - (level - 1) * 70);
}

function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function updateStats() {
  if (scoreEl) {
    scoreEl.textContent = String(score);
  }
  if (linesEl) {
    linesEl.textContent = String(lines);
  }
  if (levelEl) {
    levelEl.textContent = String(level);
  }
}

function drawCell(targetCtx, x, y, size, color) {
  targetCtx.fillStyle = color;
  targetCtx.fillRect(x * size, y * size, size, size);
  targetCtx.strokeStyle = "rgba(15, 23, 42, 0.75)";
  targetCtx.lineWidth = 2;
  targetCtx.strokeRect(x * size, y * size, size, size);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = board[y][x];
      if (cell) {
        drawCell(ctx, x, y, BLOCK_SIZE, cell);
      } else {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  if (!currentPiece) {
    return;
  }

  currentPiece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) {
        return;
      }

      const drawY = currentPiece.y + y;
      if (drawY >= 0) {
        drawCell(ctx, currentPiece.x + x, drawY, BLOCK_SIZE, currentPiece.color);
      }
    });
  });
}

function drawNext() {
  if (!nextCanvas || !nextCtx) {
    return;
  }

  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextPiece) {
    return;
  }

  const matrix = nextPiece.matrix;
  const offsetX = (nextCanvas.width - matrix[0].length * PREVIEW_BLOCK) / 2 / PREVIEW_BLOCK;
  const offsetY = (nextCanvas.height - matrix.length * PREVIEW_BLOCK) / 2 / PREVIEW_BLOCK;

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawCell(nextCtx, offsetX + x, offsetY + y, PREVIEW_BLOCK, nextPiece.color);
      }
    });
  });
}

function collides(piece, moveX = 0, moveY = 0, rotationMatrix = piece.matrix) {
  return rotationMatrix.some((row, y) =>
    row.some((value, x) => {
      if (!value) {
        return false;
      }

      const boardX = piece.x + x + moveX;
      const boardY = piece.y + y + moveY;

      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
        return true;
      }

      if (boardY < 0) {
        return false;
      }

      return Boolean(board[boardY][boardX]);
    })
  );
}

function rotatePiece() {
  if (!currentPiece || isPaused || gameOver) {
    return;
  }

  const rotations = SHAPES[currentPiece.type];
  const nextRotation = (currentPiece.rotation + 1) % rotations.length;
  const rotated = rotations[nextRotation];
  const kicks = [0, -1, 1, -2, 2];

  for (const shiftX of kicks) {
    if (!collides(currentPiece, shiftX, 0, rotated)) {
      currentPiece.rotation = nextRotation;
      currentPiece.matrix = rotated;
      currentPiece.x += shiftX;
      draw();
      return;
    }
  }
}

function mergePiece() {
  currentPiece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) {
        return;
      }

      const boardY = currentPiece.y + y;
      if (boardY >= 0) {
        board[boardY][currentPiece.x + x] = currentPiece.color;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }

  if (cleared > 0) {
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    score += scoreTable[cleared] * level;
    updateStats();
  }
}

function spawnPiece() {
  currentPiece = nextPiece || randomPiece();
  nextPiece = randomPiece();
  drawNext();

  if (collides(currentPiece)) {
    finishGame();
  }
}

function finishGame() {
  isRunning = false;
  gameOver = true;
  cancelAnimationFrame(animationId);
  setStatus(`游戏结束，本局得分 ${score}。点击“开始 / 重新开始”再来一局。`);
  draw();
}

function lockPiece() {
  mergePiece();
  clearLines();
  spawnPiece();
}

function movePiece(direction) {
  if (!currentPiece || isPaused || gameOver) {
    return;
  }

  if (!collides(currentPiece, direction, 0)) {
    currentPiece.x += direction;
    draw();
  }
}

function dropPiece() {
  if (!currentPiece || isPaused || gameOver) {
    return;
  }

  if (!collides(currentPiece, 0, 1)) {
    currentPiece.y += 1;
  } else {
    lockPiece();
  }

  dropCounter = 0;
  draw();
}

function hardDrop() {
  if (!currentPiece || isPaused || gameOver) {
    return;
  }

  while (!collides(currentPiece, 0, 1)) {
    currentPiece.y += 1;
    score += 2;
  }

  updateStats();
  lockPiece();
  dropCounter = 0;
  draw();
}

function softDrop() {
  if (!currentPiece || isPaused || gameOver) {
    return;
  }

  score += 1;
  updateStats();
  dropPiece();
}

function performAction(action) {
  if (action !== "togglePause" && (!isRunning || isPaused || gameOver)) {
    return;
  }

  switch (action) {
    case "left":
      movePiece(-1);
      break;
    case "right":
      movePiece(1);
      break;
    case "rotate":
      rotatePiece();
      break;
    case "down":
      softDrop();
      break;
    case "drop":
      hardDrop();
      break;
    case "togglePause":
      togglePause();
      break;
    default:
      break;
  }
}

function clearHoldAction() {
  if (holdIntervalId) {
    window.clearInterval(holdIntervalId);
    holdIntervalId = 0;
  }
}

function startHoldAction(action) {
  clearHoldAction();
  lastPointerActionAt = Date.now();
  performAction(action);

  if (action === "left" || action === "right" || action === "down") {
    holdIntervalId = window.setInterval(() => {
      performAction(action);
    }, 120);
  }
}

function draw() {
  drawBoard();
  drawNext();
}

function update(time = 0) {
  if (!isRunning) {
    return;
  }

  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  if (!isPaused && dropCounter >= getDropInterval()) {
    dropPiece();
  }

  draw();
  animationId = requestAnimationFrame(update);
}

function startGame() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropCounter = 0;
  lastTime = 0;
  isRunning = true;
  isPaused = false;
  gameOver = false;
  pieceBag = [];
  nextPiece = randomPiece();
  updateStats();
  setStatus("游戏进行中，祝你打出 Tetris。");
  spawnPiece();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(update);
}

function togglePause() {
  if (!isRunning || gameOver) {
    return;
  }

  isPaused = !isPaused;
  setStatus(isPaused ? "游戏已暂停。" : "游戏继续。");
  if (!isPaused) {
    lastTime = performance.now();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  if (event.key === "p" || event.key === "P") {
    togglePause();
    return;
  }

  if (!isRunning || isPaused || gameOver) {
    return;
  }

  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault();
      performAction("left");
      break;
    case "ArrowRight":
      event.preventDefault();
      performAction("right");
      break;
    case "ArrowDown":
      event.preventDefault();
      performAction("down");
      break;
    case "ArrowUp":
      event.preventDefault();
      performAction("rotate");
      break;
    case " ":
      event.preventDefault();
      performAction("drop");
      break;
    default:
      break;
  }
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
actionButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startHoldAction(button.dataset.action);
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    if (Date.now() - lastPointerActionAt < 400) {
      return;
    }
    performAction(button.dataset.action);
  });

  button.addEventListener("pointerup", clearHoldAction);
  button.addEventListener("pointerleave", clearHoldAction);
  button.addEventListener("pointercancel", clearHoldAction);
});
window.addEventListener("pointerup", clearHoldAction);

updateStats();
draw();
