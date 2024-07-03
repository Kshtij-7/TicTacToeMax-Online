document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    let currentPlayer = 'X';
    let nextBoard = null;
    const boardWinners = Array(9).fill(null);
    let gameOver = false;
    document.getElementById('move').textContent = `Current player: X`;
    document.getElementById('reset').addEventListener('click', ()=>{
        window.location.reload();
    });

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (gameOver) return;

            const bigCellIndex = cell.parentElement.parentElement.id.replace('big-cell', '');
            const smallCellIndex = cell.id.split('-')[1];

            if (cell.textContent === '' && (nextBoard === null || nextBoard == bigCellIndex || boardWinners[nextBoard] !== null)) {
                cell.textContent = currentPlayer;
                cell.classList.add(`${currentPlayer}-cell`);
                
                if (checkWin(cell.parentElement)) {
                    boardWinners[bigCellIndex] = currentPlayer;
                    markBoardWinner(cell.parentElement, currentPlayer);
                    if (checkOverallWin()) {
                        gameOver = true;
                        alert(`${currentPlayer} wins the game!`);
                        document.getElementById('winner').innerText = `${currentPlayer} wins the game!`;
                    }
                } else if (checkDraw(cell.parentElement)) {
                    boardWinners[bigCellIndex] = 'D';
                    markBoardDraw(cell.parentElement);
                    if (checkOverallDraw()) {
                        gameOver = true;
                        alert("The game is a draw!");
                        document.getElementById('winner').innerText = "The game is a draw!";
                    }
                }

                nextBoard = boardWinners[smallCellIndex] !== null ? null : smallCellIndex;
                highlightPlayableCells();
                
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                document.getElementById('move').textContent = `Current player: ${currentPlayer}`;
                
            }
        });
    });

    function checkWin(board) {
        const winPatterns = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board.children[a].textContent &&
                board.children[a].textContent === board.children[b].textContent &&
                board.children[a].textContent === board.children[c].textContent) {
                return true;
            }
        }
        return false;
    }

    function checkDraw(board) {
        for (let cell of board.children) {
            if (cell.textContent === '') {
                return false;
            }
        }
        return !checkWin(board);
    }

    function markBoardWinner(board, winner) {
        for (let cell of board.children) {
            cell.textContent = winner;
            cell.style.color = 'gray';
            cell.style.cursor = 'default';
        }
    }

    function markBoardDraw(board) {
        for (let cell of board.children) {
            cell.textContent = 'D';
            cell.style.color = 'gray';
            cell.style.cursor = 'default';
        }
    }

    function checkOverallWin() {
        const winPatterns = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (boardWinners[a] &&
                boardWinners[a] === boardWinners[b] &&
                boardWinners[a] === boardWinners[c]) {
                return true;
            }
        }
        return false;
    }

    function checkOverallDraw() {
        for (let winner of boardWinners) {
            if (winner === null) {
                return false;
            }
        }
        return !checkOverallWin();
    }

    function highlightPlayableCells() {
        cells.forEach(cell => {
            const bigCellIndex = cell.parentElement.parentElement.id.replace('big-cell', '');
            if (cell.textContent === '' && (nextBoard === null || nextBoard == bigCellIndex || boardWinners[nextBoard] !== null)) {
                cell.classList.add('highlight');
            } else {
                cell.classList.remove('highlight');
            }
        });
    }

    // Initial highlight of all cells since the first move can be made anywhere
    highlightPlayableCells();
});
