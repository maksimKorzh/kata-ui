const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// CHANGE THESE VALUES TO FIT YOUR KATAGO PATH!!!
const KATAGO_PATH = '/home/cmk/katago/katago';
const KATAGO_NET = '/home/cmk/katago/kata1-b10c128.txt.gz';
const KATAGO_CONFIG = '/home/cmk/katago/gtp.cfg';

let katago;

function createWindow() {
  const win = new BrowserWindow({
    autoHideMenuBar: true,
    width: 900,
    height: 950,
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
  //win.setMenu(null);
  win.loadFile('index.html');

  // Start KataGo GTP process
  katago = spawn(KATAGO_PATH, ['gtp', '-model', KATAGO_NET, '-config', KATAGO_CONFIG]);

  var infoLines = 0;
  katago.stdout.on('data', (data) => {
    let response = data.toString();
    if (response.includes('info move')) {
      infoLines++;
      if (infoLines <= 100) {
        if (infoLines == 100) {
          infoLines = 0;
          response = response.replaceAll(' info move', '\ninfo move') + '\n';
          if (!response.includes('info move')) return;
        } else return;
      }
    }
    win.webContents.send('katago-output', response);
  });

  katago.stderr.on('data', (data) => {
    win.webContents.send('katago-output', data.toString());
  });

  ipcMain.on('send-command', (event, command) => {
    if (katago && katago.stdin.writable) {
      katago.stdin.write(command + '\n');
    }
  });

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Go Games', extensions: ['sgf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  });

  win.on('closed', () => {
    if (katago) katago.kill();
  });
}

app.whenReady().then(createWindow);
