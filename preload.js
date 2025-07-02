const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('katagoAPI', {
  sendCommand: (cmd) => ipcRenderer.send('send-command', cmd),
  onOutput: (callback) => ipcRenderer.on('katago-output', (_, data) => callback(data)),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
});
