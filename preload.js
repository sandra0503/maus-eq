const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('synth', {
  sendCC: (channel, cc, value) => ipcRenderer.send('send-cc', channel, cc, value),
});
