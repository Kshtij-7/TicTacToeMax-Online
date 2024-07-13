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
    window.addEventListener('beforeunload', handleLeaveGame);

    const urlParams = new URLSearchParams(window.location.search);
    const gameIDFromURL = urlParams.get('game-id');
     if (gameIDFromURL) {
        gameId = gameIDFromURL;
        attemptAutoJoinGame(gameIDFromURL);
    }

    document.getElementById('quitGame').addEventListener('click', quitGame);

    const shareGameLinkBtn = document.getElementById('shareGameLinkBtn');
    const twitterShare = document.getElementById('twitterShare');
    const facebookShare = document.getElementById('facebookShare');
    const socialShare = document.getElementById('socialShare');
    const whatsappShare=document.getElementById('whatsappShare');

    shareGameLinkBtn.addEventListener('click', () => {
        const gamelink = `https://kshtij-7.github.io/TicTacToeMax-Online/?game-id=${gameId}`;
        if (navigator.share) {
            navigator.share({
                title: 'Join my Super Tic Tac Toe Game!',
                text: 'You have been invited to join a Super Tic Tac Toe game! ',
                url: `${gamelink} You have been invited to join a Super Tic Tac Toe game!`
            }).then(() => {
                console.log('');
            }).catch((error) => {
                console.error('Error sharing:', error);
            });
        } else {
            alert('Your browser does not support the Web Share API. Use the buttons below to share manually.');
            socialShare.style.display = 'block';
        }
    });

    
    twitterShare.href = `https://twitter.com/intent/tweet?text=Join%20my%20Tic%20Tac%20Toe%20game!%20${encodeURIComponent(gameLink)}`;
    facebookShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameLink)}`;
    whatsappShare.href = `https://wa.me/?text=You%20have%20been%20invited%20to%20join%20a%20Super%20Tic%20Tac%20Toe%20game!%20%20${gameLink}`;

    
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
    listenForOpponentLeave();
    listenForPlayerJoin();
    sendhook();
}

function joinExistingGame() {
    const inputGameId = prompt("Enter Game ID:");
    if (inputGameId) {
        gameId = inputGameId;
        database.ref('games/' + gameId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const gameData = snapshot.val();
                if (gameData.players) {
                    if (gameData.players.X && gameData.players.O) {
                        alert("Game is already full!");
                    } else {
                        player = gameData.players.X ? 'O' : 'X';
                        database.ref('games/' + gameId + '/players').update({ [player]: true });
                        database.ref('games/' + gameId).update({ playerJoined: player });
                        localStorage.setItem('localPlayer', player);
                        switchToGameScreen();
                        listenForOpponentLeave();
                        listenForPlayerJoin();
                    }
                }
            } else {
                alert("Game not found!");
            }
        });
    }
}

function attemptAutoJoinGame(gameIDFromURL) {
    database.ref('games/' + gameIDFromURL).once('value', (snapshot) => {
        if (snapshot.exists()) {
            const gameData = snapshot.val();
            if (gameData.players) {
                if (gameData.players.X && gameData.players.O) {
                    alert("Game is already full!");
                } else {
                    player = gameData.players.X ? 'O' : 'X';
                    database.ref('games/' + gameIDFromURL + '/players').update({ [player]: true });
                    database.ref('games/' + gameIDFromURL).update({ playerJoined: player });
                    localStorage.setItem('localPlayer', player);
                    gameId = gameIDFromURL;
                    switchToGameScreen();
                    listenForOpponentLeave();
                    listenForPlayerJoin();
                }
            }
        } else {
            alert("Game not found!");
        }
    });
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
    const cellItself = document.getElementById(event.target.id);
    const cellId = event.target.id.split('-');
    const bigCellIndex = parseInt(cellId[0].replace('cell', ''), 10);
    const smallCellIndex = parseInt(cellId[1], 10);
   
    if (gameState[bigCellIndex][smallCellIndex] !== '' || currentPlayer !== player) {
        return;
    }

    if (allowedBoard !== -1 && allowedBoard !== bigCellIndex && bigBoardState[allowedBoard] === '') {
        return; // Invalid move
    }

    gameState[bigCellIndex][smallCellIndex] = player;
    cellItself.classList.remove('highlight');
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
                
                if (cellElement.textContent === 'X') {
                    cellElement.classList.add('X-cell')
                    cellElement.classList.remove('O-cell')
                } else if (cellElement.textContent === 'O') {
                    cellElement.classList.add('O-cell')
                    cellElement.classList.remove('X-cell')
                }
            }
        });
    });

    const winnerElement = document.getElementById('winner');
    const moveElement = document.getElementById('move');

    const bigWinner = checkWin(bigBoardState);
    if (bigWinner) {
        winnerElement.textContent = `${bigWinner} wins the game!`;
        moveElement.textContent = '';
        alert(`${bigWinner} wins the game!`);
        endgame(`${bigWinner} wins the game!`);

    } else if (bigBoardState.every(cell => cell !== '')) {
        winnerElement.textContent = `It's a draw!`;
        moveElement.textContent = '';
        alert("The game is a draw!");
        endgame("The game is a draw!");
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
function endgame(result){
    setTimeout(() => {
        database.ref('games/' + gameId).remove();
        alert(result);
        window.location.reload();
    }, 3000);
}
function copyGameID() {
    navigator.clipboard.writeText(gameId).then(() => {
        document.getElementById('copyGameIDBtn').classList.add('animate');
        setTimeout(() => {
            document.getElementById('copyGameIDBtn').classList.remove('animate');
        }, 1000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
function handleLeaveGame(event) {
    console.log("handleLeaveGame called");
    if (gameId && player) {
        database.ref('games/' + gameId + '/players/' + player).remove();
        database.ref('games/' + gameId).once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (!data.players.X && !data.players.O) {
                    database.ref('games/' + gameId).remove();
                } else {
                    const otherPlayer = player === 'X' ? 'O' : 'X';
                    if (data.players[otherPlayer]) {
                        
                        alert("The other player has left the game.");
                        console("alert command sent");
                    }
                }
            }
        });
    }
}
function listenForOpponentLeave() {
    if (gameId && player) {
        const opponent = player === 'X' ? 'O' : 'X';
        database.ref('games/' + gameId + '/players/' + opponent).on('value', (snapshot) => {
            if (!snapshot.exists()) {
                alert("The other player has left the game.");
                
            }
        });
    }
}
function listenForPlayerJoin() {
    if (gameId && player) {
        database.ref('games/' + gameId + '/playerJoined').on('value', (snapshot) => {
            const joinedPlayer = snapshot.val();
            if (joinedPlayer && joinedPlayer !== player) {
                alert(`Player ${joinedPlayer} has joined the game.`);
                
            }
        });
    }
}
function quitGame() {
    const conf = confirm("Are you sure you want to quit the game?");
    if(conf){
        window.location.assign('https://kshtij-7.github.io/TicTacToeMax-Online/');
        
    }
}
function sendhook(){
    const request = new XMLHttpRequest();
    request.open("POST", "https://discord.com/api/webhooks/1261343257435050136/ZlRl8YZUI3jkpazNjhbTMRDUZLyeJ1tzZh3-MSZ0ymZ4ajaGsC9Yulj51YzhyHZvMolJ");

    request.setRequestHeader('Content-type', 'application/json');

    const params = {
        username: "Tic Tac Toe Max notifier",
        avatar_url: "",
        content: `New game created: ${gameId}`
    }

    request.send(JSON.stringify(params));
}