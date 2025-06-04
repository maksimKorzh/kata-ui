const EMPTY = 0
const BLACK = 1
const WHITE = 2
const bgImage = new Image();
const blackStoneImage = new Image();
const whiteStoneImage = new Image();
const moveSound = new Audio('./assets/112-2052.wav');

var canvas, ctx, cell;
var board = [];
var sgf = '/home/cmk/go-rank-estimator/game.sgf';
var size = 19;
var side = 'B';
var userMove = -1;
var curmove = 1;
var ponder = 0;

bgImage.src = './assets/board_fox.png';
blackStoneImage.src = './assets/stone_b_fox.png';
whiteStoneImage.src = './assets/stone_w_fox.png';
let imagesLoaded = false;
bgImage.onload = blackStoneImage.onload = whiteStoneImage.onload = () => {
  if (bgImage.complete && blackStoneImage.complete && whiteStoneImage.complete) {
    imagesLoaded = true;
    drawBoard();
  }
};

function clearBoard() {
  side = 'B';
  board = [];
  userMove = -1;
  for (let sq = 0; sq < size ** 2; sq++)
    board[sq] = EMPTY;
}

function drawBoard() {
  cell = canvas.width / size;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  for (let i = 0; i < size; i++) {
    const x = i * cell + cell / 2;
    const y = i * cell + cell / 2;
    let offset = cell * 2 - cell / 2 - cell;
    ctx.moveTo(offset, y);
    ctx.lineTo(canvas.width - offset, y);
    ctx.moveTo(x, offset);
    ctx.lineTo(x, canvas.height - offset);
  };
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let sq = row * size + col;
      let starPoints = [60, 66, 72, 174, 180, 186, 288, 294, 300];
      if (starPoints.includes(sq)) {
        ctx.beginPath();
        ctx.arc(col * cell+(cell/4)*2, row * cell +(cell/4)*2, cell / 6 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      const stoneImage = board[sq] == BLACK ? blackStoneImage : whiteStoneImage;
      if (board[sq]) {
        ctx.drawImage(
          stoneImage,
          col * cell + cell / 2 - cell / 2,
          row * cell + cell / 2 - cell / 2,
          cell,
          cell
        );
      }
      
      if (sq == userMove) {
        let color = board[sq] == 1 ? 'white' : 'black';
        ctx.beginPath();
        ctx.arc(col * cell+(cell/4)*2, row * cell+(cell/4)*2, cell / 5 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function userInput(event) {
  let rect = canvas.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let col = Math.floor(mouseX / cell);
  let row = Math.floor(mouseY / cell);
  let sq = 'ABCDEFGHJKLMNOPQRST'[col] + (19-row);
  window.katagoAPI.sendCommand('play ' + side + ' ' + sq);
  window.katagoAPI.sendCommand('showboard');
  curmove++;
}

function resizeCanvas() {
  canvas.width = window.innerHeight-34;
  canvas.height = canvas.width;
  drawBoard();
  try {
    document.getElementById('output').style.width = (window.innerWidth - canvas.width-34)  + 'px';
    document.getElementById('output').style.height = canvas.width-44 + 'px';
    document.getElementById('input').style.width = (window.innerWidth - canvas.width-34)  + 'px';
  } catch (e) {}
}

(function initGUI() {
  let container = document.getElementById('goban');
  canvas = document.createElement('canvas');
  canvas.style = 'border: 2px solid black; margin: 4px; margin-top: 16px;';
  container.appendChild(canvas);
  canvas.addEventListener('click', userInput);
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  window.addEventListener('resize', resizeCanvas);
  clearBoard();
  resizeCanvas();
  document.getElementById('terminal').innerHTML = `
    <pre id="output" style="width: ` + (window.innerWidth - canvas.width-34) + `px; height: ` + (canvas.width-44) + `px; color: white; font-family: monospace; font-size: calc(100vw/113); overflow: auto;"></pre>
    <input id="input" spellcheck="false" placeholder="Type a command..." style="width: ` + (window.innerWidth - canvas.width-34) + `px; font-size: 18px;" autofocus>
  `;
})();

window.katagoAPI.onOutput((data) => {
  const output = document.getElementById('output');
  output.textContent += data;
  output.scrollTop = output.scrollHeight;
  
  // Sync board
  if (data.includes('A B C D E F G')) {
    clearBoard();
    if (data.includes('X3') || data.includes('O3')) {
      data = data.replaceAll('1', ' ');
      data = data.replaceAll('2', ' ');
      data = data.replaceAll('3', '<');
    } else if (data.includes('X2') || data.includes('O2')) {
      data = data.replaceAll('1', ' ');
      data = data.replaceAll('2', '<');
    } else if (data.includes('X1') || data.includes('O1')) {
      data = data.replaceAll('1', '<');
    }
    let boardStr = data.split('   A B C D E F G H J K L M N O P Q R S T')[1];
    boardStr = boardStr.split('\n').slice(1,-6);
    let rank = 0;
    for (let row in boardStr) {
      let file = 0;
      let line = boardStr[row].slice(2).replaceAll(' ', '');
      for (let col of line) {
        let sq = rank * size + file;
        if (col == '<') {
          if (col == '<') {
            userMove = sq-1;
            side = board[userMove] == 1 ? 'W': 'B';
            moveSound.play();
          } continue;
        }
        if (col == 'X') board[sq] = BLACK;
        if (col == 'O') board[sq] = WHITE;
        file++;
      } rank++;
    } drawBoard();
    if (ponder) window.katagoAPI.sendCommand('kata-analyze 1');
  }
   
  // Kata Analyze
  if (data.includes('move')) {
    drawBoard();
    let oldVisits = 0;
    let oldWinrate = 0;
    let blueMove = 0;
    data.split('info').forEach((i) => {
      try {
        if (blueMove) {
          blueMove = 0;
          return;
        }
        let move = i.split('move ')[1].split(' ')[0];
        let col = 'ABCDEFGHJKLMNOPQRST'.indexOf(move[0]);
        let row = 19-parseInt(move.slice(1));
        winrate = Math.floor(parseFloat(i.split('winrate ')[1].split(' ')[0]) * 100);
        visits = i.split('visits ')[1].split(' ')[0];
        if (visits < 10) return;
        ctx.beginPath();
        ctx.arc(col * cell + cell / 2, row * cell + cell / 2, cell / 2 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'lightgreen';
        if (winrate > oldWinrate) {
          blueMove = 1;
          oldWinrate = winrate;
          ctx.fillStyle = 'cyan';
        }
        else if (visits > oldVisits) oldVisits = visits;
        else if (oldVisits > visits && oldWinrate > winrate) ctx.fillStyle = 'orange';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = 'black';
        ctx.font = cell / 3 + 'px Monospace';
        ctx.fillText(winrate + '%', col * cell + cell / 5, row * cell + cell / 2);
        ctx.font = cell / 4 + 'px Monospace';
        let pos = 0;
        if (visits < 100) pos = 3;
        else if (visits >= 100 && visits < 1000) pos = 4;
        else pos = 5;
        ctx.fillText(visits, col * cell + cell / pos, row * cell + cell / 1.3);
      } catch {}
    });
  }

  // Final Score
  if (data.includes('= W+') || data.includes('= B+')) alert(data.replace('=', 'Final Score:'));
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const input = document.getElementById('input');
    window.katagoAPI.sendCommand(input.value);
    if (input.value.includes('loadsgf')) {
      try {
        sgf = input.value.split(' ')[1];
        curmove = parseInt(input.value.split(' ')[2]);
      } catch {}
    }
    if (input.value != 'final_score' && input.value != 'list_commands' && !input.value.includes('kata-analyze'))
      window.katagoAPI.sendCommand('showboard');
    if (input.value.includes('kata-analyze')) ponder = 1;
    if (input.value == 'stop') ponder = 0;
    input.value = '';
    let terminal = document.getElementById('output');
    terminal.scrollTop = terminal.scrollHeight;
  }
});

// Arrow keys controls
document.addEventListener('keydown', (e) => {
  if (e.key == 'ArrowRight') {
    curmove++;
    window.katagoAPI.sendCommand('loadsgf ' + sgf + ' ' + curmove);
    window.katagoAPI.sendCommand('showboard');
  } else if (e.key == 'ArrowLeft') {
    if (curmove > 0) curmove--;
    window.katagoAPI.sendCommand('undo');
    window.katagoAPI.sendCommand('showboard');
  } else if (e.key == 'ArrowUp') {
    curmove += 10;
    window.katagoAPI.sendCommand('loadsgf ' + sgf + ' ' + curmove);
    window.katagoAPI.sendCommand('showboard');
  } else if (e.key == 'ArrowDown') {
    if ((curmove-5) > 0) curmove -= 10;
    window.katagoAPI.sendCommand('loadsgf ' + sgf + ' ' + curmove);
    window.katagoAPI.sendCommand('showboard');
  } else if (e.key == ' ') {
    ponder ^= 1;
    if (ponder) window.katagoAPI.sendCommand('kata-analyze 1');
    else {
      window.katagoAPI.sendCommand('stop');
      drawBoard();
    }
  } else if (e.key == 'Ctrl') {
    window.katagoAPI.sendCommand('genmove ' + side);
    window.katagoAPI.sendCommand('showboard');
  }
});

// Listen for mouse wheel (scroll)
window.addEventListener('wheel', (event) => {
  if (event.deltaY < 0) {
    if (curmove > 0) curmove--;
    window.katagoAPI.sendCommand('undo');
    window.katagoAPI.sendCommand('showboard');
  } else {
    curmove++;
    window.katagoAPI.sendCommand('loadsgf ' + sgf + ' ' + curmove);
    window.katagoAPI.sendCommand('showboard');
  }
});

// Listen for right-click
window.addEventListener('contextmenu', (event) => {
  event.preventDefault(); // optional: prevent default right-click menu
  window.katagoAPI.sendCommand('genmove ' + side);
  window.katagoAPI.sendCommand('showboard');
});

window.addEventListener('mousedown', (event) => {
  if (event.button === 1) {
    ponder ^= 1;
    if (ponder) window.katagoAPI.sendCommand('kata-analyze 1');
    else {
      window.katagoAPI.sendCommand('stop');
      drawBoard();
    }
  }
});
