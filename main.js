const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let helper = null;
let mainWindow = null;

function startHelper() {
  const bin = path.join(__dirname, 'native', 'midiout');
  helper = spawn(bin, [], { stdio: ['pipe', 'inherit', 'inherit'] });
  helper.on('exit', (code) => {
    console.log(`[midiout] exited with code ${code}`);
    helper = null;
  });
  helper.on('error', (err) => {
    console.error('[midiout] failed to start:', err.message);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 580,
    minWidth: 680,
    minHeight: 520,
    backgroundColor: '#0a0b0e',
    titleBarStyle: 'hiddenInset',
    title: 'EQ Controller',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  startHelper();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Renderer asks us to emit a MIDI Control Change on the virtual port.
ipcMain.on('send-cc', (_event, channel, cc, value) => {
  if (helper && helper.stdin.writable) {
    helper.stdin.write(`${channel | 0} ${cc | 0} ${value | 0}\n`);
  }
});

app.on('window-all-closed', () => {
  if (helper) helper.kill();
  app.quit();
});
