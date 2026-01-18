// ==========================
// MAINCONFIGURATION
// ==========================
const playerName = localStorage.getItem("playerName") || "Player";
const boardSize = parseInt(localStorage.getItem("boardSize")) || 10;
const difficulty = localStorage.getItem("difficulty") || "medium";

document.getElementById("label-player-board").textContent = playerName;

// Ships
const ships = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 }
];

switch (boardSize) {
  case 8:
    ships.splice(0, 2); // Delete Carrier and Battleship
    break;
  case 12:
    ships.push({ name: "Dreadnought", size: 6 });
    break;
}

// ==========================
// CREATE GAMEBOARD
// ==========================
function updateGridCellSizes(boardSize) {
  let width, height;

  if (window.matchMedia("(max-width: 600px)").matches) {
    switch (boardSize) {
      case 8:
        width = height = "33px";
        break;
      case 12:
        width = height = "21px";
        break;
      default:
        width = height = "26px";
    }
  } else if (window.matchMedia("(min-width: 601px) and (max-width: 1024px)").matches) {
    switch (boardSize) {
      case 8:
        width = height = "40px";
        break;
      case 12:
        width = height = "23px";
        break;
      default:
        width = height = "30px";
    }
  } else {
    // Desktop oder größer - Default Größen
    switch (boardSize) {
      case 8:
        width = height = "45px";
        break;
      case 12:
        width = height = "30px";
        break;
      default:
        width = height = "40px";
    }
  }

  document.querySelectorAll(".grid-cell").forEach(cell => {
    cell.style.width = width;
    cell.style.height = height;
  });
}

function createBoard(grid) {
  grid.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;

  grid.innerHTML = "";

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");

      cell.dataset.row = row;
      cell.dataset.col = col;

      grid.appendChild(cell);
    }
  }

  updateGridCellSizes(boardSize);

  window.matchMedia("(max-width: 600px)").addEventListener('change', () => updateGridCellSizes(boardSize));
  window.matchMedia("(min-width: 601px) and (max-width: 1024px)").addEventListener('change', () => updateGridCellSizes(boardSize));
  window.matchMedia("(min-width: 1025px)").addEventListener('change', () => updateGridCellSizes(boardSize));

  return grid;
}


let boardArrayPlayer = Array.from({ length: boardSize }, () =>
  Array.from({ length: boardSize }, () => ({ status: "empty", ship: "none" }))
);
let boardArrayAI = Array.from({ length: boardSize }, () =>
  Array.from({ length: boardSize }, () => ({ status: "empty", ship: "none" }))
);


// ==========================
// PLACING SHIPS
// ==========================

function canPlaceShip(board, row, col, length, horizontal) {
  const size = board.length;

  if (horizontal) {
    if (col + length > size) return false;
    for (let i = 0; i < length; i++) {
      if (board[row][col + i].status !== "empty") return false;
    }
  } else {
    if (row + length > size) return false;
    for (let i = 0; i < length; i++) {
      if (board[row + i][col].status !== "empty") return false;
    }
  }

  return true;
}

function placeShips(board, length, shipName) {
  const size = board.length;
  let placed = false;

  while (!placed) {
    const horizontal = Math.random() > 0.5;
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (canPlaceShip(board, row, col, length, horizontal)) {
      for (let i = 0; i < length; i++) {
        if (horizontal) {
          board[row][col + i].status = "ship";
          board[row][col + i].ship = shipName;
        } else {
          board[row + i][col].status = "ship";
          board[row + i][col].ship = shipName;
        }
      }
      placed = true;
    }
  }
}

function allShipsPlaced(board) {
  for (let i = 0; i < ships.length; i++) {
    placeShips(board, ships[i].size, ships[i].name);
  }
}

// ==========================
// INITIALIZE GAMEBOARD
// ==========================
const playerGrid = document.getElementById("player-board");
const aiGrid = document.getElementById("ai-board");

// Player
let grid = playerGrid;
const playerBoard = createBoard(grid);
allShipsPlaced(boardArrayPlayer);

// AI
grid = aiGrid;
const aiBoard = createBoard(grid);
allShipsPlaced(boardArrayAI);

// Update ships in grid
playerGrid.querySelectorAll(".grid-cell").forEach(cell => {
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  if (boardArrayPlayer[row][col].status === "ship") {
    cell.classList.add("ship");
  }

});

playerGrid.style.pointerEvents = "none";

// ==========================
// CREATE LOGIC
// ==========================

function checkIfShipIsCompleted(board, shipName) {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell.ship === shipName && cell.status !== "hitted") {
        return false; // At least one part is still not hit
      }
    }
  }

  return true; // All parts are hit
}

function markShipAsSunk(board, shipName, grid) {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell.ship === shipName) {
        const gridCell = grid.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        if (gridCell) {
          gridCell.classList.add("sunk");
        }
      }
    }
  }
}

function countRemainingShips(board) {
  const shipsSet = new Set();
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell.status === "ship" && cell.ship !== "none") {
        shipsSet.add(cell.ship);
      }
    }
  }
  return shipsSet.size;
}

function updateShipsDisplay() {
  const playerShipsRemaining = countRemainingShips(boardArrayPlayer);
  const aiShipsRemaining = countRemainingShips(boardArrayAI);
  
  const playerShipsCountElement = document.getElementById("player-ships-count");
  const aiShipsCountElement = document.getElementById("ai-ships-count");
  
  if (playerShipsCountElement) {
    playerShipsCountElement.textContent = `Ships: ${playerShipsRemaining}`;
  }
  if (aiShipsCountElement) {
    aiShipsCountElement.textContent = `Ships: ${aiShipsRemaining}`;
  }
}

// ==========================
// AI LOGIC (STATE MACHINE)
// ==========================

const AI_STATE = {
  SEARCH: "search",
  HUNT: "hunt",
  TRACK: "track"
};

let aiState = AI_STATE.SEARCH;

let lastAIHit = null;     // erster Treffer eines Schiffs
let nextAiHit = null;     // Tracking-Daten
let currentShip = null;  // aktuell verfolgtes Schiff
let pendingHits = [];    // gespeicherte Treffer anderer Schiffe


// ==========================
// HELPERS
// ==========================

function rememberHit(ship, row, col) {
  if (!pendingHits.some(h => h.ship === ship)) {
    pendingHits.push({ ship, row, col });
  }
}

function onShipSunk() {
  currentShip = null;
  lastAIHit = null;
  nextAiHit = null;

  if (pendingHits.length > 0) {
    const next = difficulty === "hard"
      ? pendingHits.pop() // LIFO
      : pendingHits.shift(); // FIFO
    currentShip = next.ship;
    lastAIHit = { row: next.row, col: next.col };
    aiState = AI_STATE.HUNT;
  } else {
    aiState = AI_STATE.SEARCH;
  }
}


// ==========================
// SEARCH MODE
// ==========================

function searchMode() {
  const size = boardArrayPlayer.length;

  while (true) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (difficulty === "medium" && (row + col) % 2 !== 0) continue;

    const cell = boardArrayPlayer[row][col];
    if (cell.status === "hitted" || cell.status === "missed") continue;

    const gridCell = playerGrid.querySelector(
      `.grid-cell[data-row="${row}"][data-col="${col}"]`
    );

    if (cell.status === "ship") {
      cell.status = "hitted";
      gridCell?.classList.add("hit");

      if (checkIfShipIsCompleted(boardArrayPlayer, cell.ship)) {
        markShipAsSunk(boardArrayPlayer, cell.ship, playerGrid);
        updateShipsDisplay();
        onShipSunk();
        return;
      }

      currentShip = cell.ship;
      lastAIHit = { row, col };
      aiState = AI_STATE.HUNT;
      return;
    }

    cell.status = "missed";
    gridCell?.classList.add("miss");
    return;
  }
}


// ==========================
// HUNT MODE
// ==========================

function huntingMode() {
  const { row, col } = lastAIHit;
  const board = boardArrayPlayer;

  const neighbours = [
    { r: row + 1, c: col, dir: "down" },
    { r: row - 1, c: col, dir: "up" },
    { r: row, c: col + 1, dir: "right" },
    { r: row, c: col - 1, dir: "left" }
  ].filter(p =>
    p.r >= 0 && p.c >= 0 &&
    p.r < board.length && p.c < board.length
  );

  while (neighbours.length > 0) {
    const { r, c, dir } = neighbours.splice(
      Math.floor(Math.random() * neighbours.length), 1
    )[0];

    const cell = board[r][c];
    if (cell.status === "hitted" || cell.status === "missed") continue;

    const gridCell = playerGrid.querySelector(
      `.grid-cell[data-row="${r}"][data-col="${c}"]`
    );

    if (cell.status === "ship") {
      cell.status = "hitted";
      gridCell?.classList.add("hit");

      if (cell.ship !== currentShip) {
        rememberHit(cell.ship, r, c);
        return;
      }

      if (checkIfShipIsCompleted(board, cell.ship)) {
        markShipAsSunk(board, cell.ship, playerGrid);
        updateShipsDisplay();
        onShipSunk();
        return;
      }

      nextAiHit = {
        r,
        c,
        direction: dir,
        startR: row,
        startC: col,
        reversed: false
      };

      advanceToNextTrackingCell();
      aiState = AI_STATE.TRACK;
      return;
    }

    cell.status = "missed";
    gridCell?.classList.add("miss");
    return;
  }
}


// ==========================
// TRACK MODE
// ==========================

function reverseDirectionOrAbort() {
  const reverse = { up: "down", down: "up", left: "right", right: "left" };

  if (nextAiHit.reversed) {
    nextAiHit = null;
    aiState = AI_STATE.HUNT;
    return;
  }

  nextAiHit.reversed = true;
  nextAiHit.direction = reverse[nextAiHit.direction];
  nextAiHit.r = nextAiHit.startR;
  nextAiHit.c = nextAiHit.startC;
  advanceToNextTrackingCell();
}

function advanceToNextTrackingCell() {
  switch (nextAiHit.direction) {
    case "up":    nextAiHit.r--; break;
    case "down":  nextAiHit.r++; break;
    case "left":  nextAiHit.c--; break;
    case "right": nextAiHit.c++; break;
  }
}

function trackMode() {
  const { r, c } = nextAiHit;

  if (
    r < 0 || c < 0 ||
    r >= boardArrayPlayer.length ||
    c >= boardArrayPlayer.length
  ) {
    reverseDirectionOrAbort();
    return;
  }

  const cell = boardArrayPlayer[r][c];
  const gridCell = playerGrid.querySelector(
    `.grid-cell[data-row="${r}"][data-col="${c}"]`
  );

  if (cell.status === "ship") {
    cell.status = "hitted";
    gridCell?.classList.add("hit");

    if (cell.ship !== currentShip) {
      rememberHit(cell.ship, r, c);
      advanceToNextTrackingCell();
      return;
    }

    if (checkIfShipIsCompleted(boardArrayPlayer, cell.ship)) {
      markShipAsSunk(boardArrayPlayer, cell.ship, playerGrid);
      updateShipsDisplay();
      onShipSunk();
      return;
    }

    advanceToNextTrackingCell();
    return;
  }

  if (cell.status === "empty") {
    cell.status = "missed";
    gridCell?.classList.add("miss");
    reverseDirectionOrAbort();
    return;
  }
  
  advanceToNextTrackingCell();
}


// ==========================
// AI TURN
// ==========================

function aiTurn() {
  switch (aiState) {
    case AI_STATE.SEARCH:
      searchMode();
      break;
    case AI_STATE.HUNT:
      huntingMode();
      break;
    case AI_STATE.TRACK:
      trackMode();
      break;
  }
}


// ==========================
// PLAYER TURN
// ==========================
aiGrid.querySelectorAll(".grid-cell").forEach(cell => {
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  cell.addEventListener("click", () => {
    if (
      boardArrayAI[row][col].status === "hitted" ||
      boardArrayAI[row][col].status === "missed"
    ) return;
    if (boardArrayAI[row][col].status === "ship") {
      cell.classList.add("hit");
      boardArrayAI[row][col].status = "hitted";

      if (checkIfShipIsCompleted(boardArrayAI, boardArrayAI[row][col].ship)) {
        markShipAsSunk(boardArrayAI, boardArrayAI[row][col].ship, aiGrid);
        updateShipsDisplay();
      }
    } else if (boardArrayAI[row][col].status === "empty") {
      cell.classList.add("miss");
      boardArrayAI[row][col].status = "missed";
    }

    aiGrid.style.pointerEvents = "none";

    setTimeout(function () {
      aiTurn();
      aiGrid.style.pointerEvents = "auto";
      cell.style.pointerEvents = "none";
    }, 500);

  });
});


// ==========================
// CHOOSE GAME WINNER
// ==========================

function checkForWinner() {
  const playerShipsLeft = countRemainingShips(boardArrayPlayer);
  const aiShipsLeft = countRemainingShips(boardArrayAI);
  const winnerTitle = document.getElementById("winner-title");
  const winnerMessage = document.getElementById("winner-message");
  const winnerModal = document.getElementById("winner-modal");

  

  if (playerShipsLeft === 0) {
    winnerModal.classList.remove("hidden");
    winnerTitle.textContent = "Enemy Wins!";
    winnerMessage.textContent = "All your ships have been sunk.";
    aiGrid.style.pointerEvents = "none";
    return "AI";
  } else if (aiShipsLeft === 0) {
    winnerModal.classList.remove("hidden");
    winnerTitle.textContent = `${playerName} Wins!`;
    winnerMessage.textContent = "You have sunk all enemy ships.";
    aiGrid.style.pointerEvents = "none";
    return playerName;
  }
}

setInterval(checkForWinner, 400);

