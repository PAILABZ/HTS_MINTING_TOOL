const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');


require('./mintapp.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 1200,
    webPreferences: {
      nodeIntegration: true
    },
    icon: path.join(__dirname, 'PAIlogo.ico')
  });

  
  mainWindow.loadURL('http://localhost:3000');

  


  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
