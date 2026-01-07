// ==========================
// MAINCONFIGURATION
// ==========================
const player = localStorage.getItem("player1Name") || "Player";
const boardSize = parseInt(localStorage.getItem("boardSize")) || 10;

// Ships
const ships = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 }
];

// ==========================
// CREATE GAMEBOARD
// ==========================
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

  return grid;
}


let boardArrayPlayer = Array.from({ length: boardSize }, () =>
  Array.from({ length: boardSize }, () => ({ status: "empty", ship: "none", aiDecision: "none" }))
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

function placeShips(board, length, ships) {
  const size = board.length;
  let placed = false;

  while(!placed) {
    const horizontal = Math.random() > 0.5;
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (canPlaceShip(board, row, col, length, horizontal)) {
      for (let i = 0; i < length; i++) {
        if (horizontal) {
          board[row][col + i].status = "ship";
          board[row][col + i].ship = ships;
        } else {
          board[row + i][col].status = "ship";
          board[row + i][col].ship = ships;
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
// CREATE HITTING MECHANIC
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

// AI //

lastAIHit = null;

// Tries to chase down the ship
function huntingMode() {
  let hit = false;
  const board = boardArrayPlayer;

  const { row, col } = lastAIHit;

  // Collect neighbour cells
  const nearCells = [
    { r: row + 1, c: col },
    { r: row - 1, c: col },
    { r: row, c: col + 1 },
    { r: row, c: col - 1 }
  ].filter(pos =>
    pos.r >= 0 &&
    pos.r < board.length &&
    pos.c >= 0 &&
    pos.c < board.length
  );

  // Only shootable cells
  const filteredCells = nearCells.filter(({r, c}) => {
    const status = boardArrayPlayer[r][c].status;
    return status === "ship" || status === "empty";
  });

  if (filteredCells.length === 0) return;

  while (!hit && filteredCells.length > 0) {
    const index = Math.floor(Math.random() * filteredCells.length);
    const { r, c } = filteredCells.splice(index, 1)[0];
    const cell = board[r][c];

    const gridCell = playerGrid.querySelector(
      `.grid-cell[data-row="${r}"][data-col="${c}"]`
    );

    if (cell.status === "ship") {
      cell.status = "hitted";
      if (gridCell) gridCell.classList.add("hit");
      hit = true;
    } else if (cell.status === "empty") {
      cell.status = "missed";
      if (gridCell) gridCell.classList.add("miss");
      hit = true;
    }
  }
}


// Tries to randomly hit a ship cell
function searchMode() {

  const size = boardArrayPlayer.length;
  let attempts = 0;
  const maxAttempts = size * size;

  while (attempts < maxAttempts) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    
    const cellStatus = boardArrayPlayer[row][col].status;
    
    // Skip already hitted or missed cells
    if (cellStatus === "hitted" || cellStatus === "missed") {
      attempts++;
      continue;
    }

    const gridCell = playerGrid.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    
    if (cellStatus === "ship") {
      boardArrayPlayer[row][col].status = "hitted";
      if (gridCell) gridCell.classList.add("hit");
      
      if (checkIfShipIsCompleted(boardArrayPlayer, boardArrayPlayer[row][col].ship)) {
        markShipAsSunk(boardArrayPlayer, boardArrayPlayer[row][col].ship, playerGrid);
      }

      lastAIHit = { row, col };
    } else if (cellStatus === "empty") {
      boardArrayPlayer[row][col].status = "missed";
      if (gridCell) gridCell.classList.add("miss");
    }
    return true; // Finish the function after a successful shot
  }
}

// Create turn mechanic 
function aiTurn() {
  if (lastAIHit) {
    huntingMode();
  } else {
    searchMode();
  }
}

// Player //
aiGrid.querySelectorAll(".grid-cell").forEach(cell => {
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  cell.addEventListener("click", () => {
    if (boardArrayAI[row][col].status === "ship") {
      cell.classList.add("hit");
      boardArrayAI[row][col].status = "hitted";

      if (checkIfShipIsCompleted(boardArrayAI, boardArrayAI[row][col].ship)) {
        markShipAsSunk(boardArrayAI, boardArrayAI[row][col].ship, aiGrid);
      }
    } else if (boardArrayAI[row][col].status === "empty") {
      cell.classList.add("miss");
      boardArrayAI[row][col].status = "hitted";
    }
    setTimeout(200);
    aiTurn();

    cell.style.pointerEvents = "none";
  });
});


// ==========================
// CHOOSE GAME WINNER
// ==========================





