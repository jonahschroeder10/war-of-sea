// ==========================
// GRUNDKONFIGURATION
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
  const cells = boardSize * boardSize;

  grid.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;

  grid.innerHTML = "";

  for (let i = 0; i < cells; i++) {
    const cell = document.createElement("div");
    cell.classList.add("grid-cell");

    cell.dataset.index = i;

    grid.appendChild(cell);
  }

}

let boardArrayPlayer = Array.from({ length: boardSize }, () => Array(boardSize).fill("empty"));
let boardArrayAI = Array.from({ length: boardSize }, () => Array(boardSize).fill("empty"));

// ==========================
// PLACING SHIPS
// ==========================

function canPlaceShip(board, row, col, length, horizontal) {
  const size = board.length;

  if (horizontal) {
    if (col + length > size) return false;
    for (let i = 0; i < length; i++) {
      if (board[row][col + i] !== "empty") return false;
    }
  } else {
    if (row + length > size) return false;
    for (let i = 0; i < length; i++) {
      if (board[row + i][col] !== "empty") return false;
    }
  }

  return true;
}

function placeShips(board, length) {
  const size = board.length;
  let placed = false;



  while(!placed) {
    const horizontal = Math.random() > 0.5;
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (canPlaceShip(board, row, col, length, horizontal)) {
      for (let i = 0; i < length; i++) {
        if (horizontal) {
          board[row][col + i] = "ship";
        } else {
          board[row + i][col] = "ship";
        }
      }
      placed = true;
    }
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
placeShips(boardArrayPlayer, ships[2].size);
console.log(boardArrayPlayer);

// AI
grid = aiGrid;
const aiBoard = createBoard(grid);
placeShips(boardArrayAI, ships[2].size);
console.log(boardArrayAI);


