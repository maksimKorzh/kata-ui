const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// CHANGE THESE VALUES TO FIT YOUR KATAGO PATH!!!
const KATAGO_PATH = '/home/cmk/katago/katago';
const KATAGO_NET = '/home/cmk/katago/kata1-b10c128.txt.gz';
const KATAGO_CONFIG = '/home/cmk/katago/gtp.cfg';

let katago;

function createWindow() {
  const win = new BrowserWindow({
    width: 1720,
    minWidth:1720,
    height: 1000,
    webPreferences: {
      preload: __dirname + '/preload.js'
    }
  });
  const template = [
    {
      label: 'View',
      submenu: [
        { label: 'Reload', role: 'reload' },
        { label: 'Toggle Developer Tools', role: 'toggleDevTools' },
        { label: 'Fullscreen', role: 'togglefullscreen' },
        { label: 'Exit', role: 'quit' },
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  win.loadFile('index.html');

  // Start KataGo GTP process
  katago = spawn(KATAGO_PATH, ['gtp', '-model', KATAGO_NET, '-config', KATAGO_CONFIG]);

  katago.stdout.on('data', (data) => {
    if (data.toString() != '\n' && data.toString() != '= \n\n' && !data.toString().includes('= \n\n= \n\n'))
      win.webContents.send('katago-output', data.toString());
  });

  katago.stderr.on('data', (data) => {
    win.webContents.send('katago-output', data.toString());
  });

  ipcMain.on('send-command', (event, command) => {
    if (katago && katago.stdin.writable) {
      katago.stdin.write(command + '\n');
    }
  });

  win.on('closed', () => {
    if (katago) katago.kill();
  });
}

app.whenReady().then(createWindow);
