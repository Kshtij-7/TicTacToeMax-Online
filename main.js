// Firebase configuration
var apiKeyVar = null;

fetch('https://backendtest-zneg.onrender.com/api/secret').then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => apiKeyVar=data.apiKey)
  .catch(error => console.error('Error:', error));

const firebaseConfig = {
    apiKey: apiKeyVar,
    authDomain: "tictactoemax-f32bd.firebaseapp.com",
    databaseURL: "https://tictactoemax-f32bd-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "tictactoemax-f32bd",
    storageBucket: "tictactoemax-f32bd.appspot.com",
    messagingSenderId: "44476827202",
    appId: "1:44476827202:web:560affa77fdf4af6a08fdb",
    measurementId: "G-1JW2HFS7SH"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let gameId = null;
let player = null;
let currentPlayer = 'X';
let gameState = Array(9).fill(null).map(() => Array(9).fill(''));
let bigBoardState = Array(9).fill('');
let allowedBoard = -1; // Initially, player can play anywhere

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createGameBtn').addEventListener('click', createNewGame);
    document.getElementById('joinGameBtn').addEventListener('click', joinExistingGame);
    document.getElementById('copyGameIDBtn').addEventListener('click', copyGameID);
    
});

function createNewGame() {
    gameId = database.ref('games').push().key;
    player = 'X';
    const gameData = {
        currentPlayer: 'X',
        gameState: Array(9).fill(null).map(() => Array(9).fill('')),
        bigBoardState: Array(9).fill(''),
        allowedBoard: -1,
        players: {
            X: true,
            O: false
        }
    };
    localStorage.setItem('localPlayer', "X");
    database.ref('games/' + gameId).set(gameData);
    switchToGameScreen();
}

function joinExistingGame() {
    const inputGameId = prompt("Enter Game ID:");
    if (inputGameId) {
        gameId = inputGameId;
        database.ref('games/' + gameId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const gameData = snapshot.val();
                if (gameData.players && gameData.players.X && gameData.players.O) {
                    alert("Game is already full!");
                } else {
                    player = 'O';
                    database.ref('games/' + gameId + '/players').update({ O: true });
                    localStorage.setItem('localPlayer', "O");
                    switchToGameScreen();
                }
            } else {
                alert("Game not found!");
            }
        });
    }
}

function switchToGameScreen() {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('gameIDLabel').textContent = 'Game ID: ' + gameId;
    document.getElementById('playerDisplay').textContent = `You are : ${localStorage.getItem('localPlayer')}`;
    initializeGame();
}

function initializeGame() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    
    database.ref('games/' + gameId).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState = data.gameState || gameState;
            bigBoardState = data.bigBoardState || bigBoardState;
            currentPlayer = data.currentPlayer || currentPlayer;
            allowedBoard = data.allowedBoard !== undefined ? data.allowedBoard : allowedBoard;
            updateBoard();
        }
    });
}

function handleCellClick(event) {
    const cellId = event.target.id.split('-');
    const bigCellIndex = parseInt(cellId[0].replace('cell', ''), 10);
    const smallCellIndex = parseInt(cellId[1], 10);
    document.getElementById(event.target.id).classList.remove('highlight');
    if (gameState[bigCellIndex][smallCellIndex] !== '' || currentPlayer !== player) {
        return;
    }

    if (allowedBoard !== -1 && allowedBoard !== bigCellIndex && bigBoardState[allowedBoard] === '') {
        return; // Invalid move
    }

    gameState[bigCellIndex][smallCellIndex] = player;
    if (checkWin(gameState[bigCellIndex])) {
        bigBoardState[bigCellIndex] = player;
        for(cello in gameState[bigCellIndex]){
            gameState[bigCellIndex][cello] = player;
        }
    } else if (gameState[bigCellIndex].every(cell => cell !== '')) {
        bigBoardState[bigCellIndex] = 'D'; // Draw
    }

    allowedBoard = smallCellIndex;
    if (bigBoardState[allowedBoard] !== '') {
        allowedBoard = -1; // Allow any board if the target board is already won
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    database.ref('games/' + gameId).update({
        gameState: gameState,
        bigBoardState: bigBoardState,
        currentPlayer: currentPlayer,
        allowedBoard: allowedBoard
    });

    updateBoard();
}

function updateBoard() {
    gameState.forEach((bigCell, bigIndex) => {
        bigCell.forEach((cell, smallIndex) => {
            const cellElement = document.getElementById(`cell${bigIndex}-${smallIndex}`);
            cellElement.textContent = cell;
            if (allowedBoard === -1 || allowedBoard === bigIndex || bigBoardState[allowedBoard] !== '') {
                if(cell===''){
                    cellElement.classList.add('highlight');
                }
            } 
            else {
                cellElement.classList.remove('highlight');
            }
        });
    });

    const winnerElement = document.getElementById('winner');
    const moveElement = document.getElementById('move');

    const bigWinner = checkWin(bigBoardState);
    if (bigWinner) {
        winnerElement.textContent = `${bigWinner} wins the game!`;
        moveElement.textContent = '';
    } else if (bigBoardState.every(cell => cell !== '')) {
        winnerElement.textContent = `It's a draw!`;
        moveElement.textContent = '';
    } else {
        winnerElement.textContent = '';
        moveElement.textContent = `Current turn: ${currentPlayer}`;
    }
}

function checkWin(cells) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
            return cells[a];
        }
    }

    return null;
}
function copyGameID() {
    navigator.clipboard.writeText(gameId);
}