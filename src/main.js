const { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, ipcRenderer, screen } = require('electron');
// require("electron-reload")(__dirname);
const path = require('path');
const fs = require("fs");
const fsp = require("fs/promises");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const process = require("process");
const spawn = require('child_process').spawnSync;
const main = require('electron-reload');

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let display;
let mainWindow = null;
let editWindow = null;

let menuTemplate = [
  {
    label: "File",
    submenu: [
      { 
        label: "Create User Action Node...",
        click: () => {
          mainWindow.webContents.send("create:node", {type: "user", text: ""});
        },
        id: "create-use-node",
        enabled: true,
        accelerator: "Ctrl+u"
      },
      { 
        label: "Create System Action Node...",
        click: () => {
          mainWindow.webContents.send("create:node", {type: "system", text: ""});
        },
        id: "create-system-node",
        enabled: true,
        accelerator: "Ctrl+s"
      },
      { 
        label: "Create Decision Node...",
        click: () => {
          mainWindow.webContents.send("create:node", {type: "decision", text: ""});
        },
        id: "create-decision-node",
        enabled: true,
        accelerator: "Ctrl+d"
      },
      { type: "separator" },
      { 
        label: "Edit Selected Node...",
        click: () => {
          mainWindow.webContents.send("edit:node");
        },
        id: "edit-selected-node",
        enabled: true,
        accelerator: "Ctrl+e"
      },
      { role: "quit" }
    ]
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "delete" },
      { type: "separator" },
      { role: "selectAll" }
    ]
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forcereload" },
      { role: "toggledevtools" },
      { type: "separator" },
      { role: "resetzoom" },
      { role: "zoomin" },
      { role: "zoomout" },
      { type: "separator" },
      { role: "togglefullscreen" }
    ]
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { role: "resetZoom" },
      { role: "close" }
    ]
  }
];
let menu = Menu.buildFromTemplate(menuTemplate);

function createSubmenu(data, tableType) {
  let submenu = [];
  data.forEach(d => {
    submenu.push(
      {
        label: d.toUpperCase(),
        id: `${tableType}-${d.toUpperCase()}`,
        type: "checkbox",
        checked: false,
        click: () => {
          mainWindow.webContents.send("show:table", {table: d, type: tableType});
        }
      }
    );
  });
  return submenu;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
    screen.getAllDisplays().forEach(d => {
      if (d.displayFrequency === 144) display = d;
    });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    // width: 1200,
    // height: 960,
    width: display.workAreaSize.width,
    height: display.workAreaSize.height,
    x: display.bounds.x,
    y: display.bounds.y,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // add the menu
  mainWindow.setMenu(menu);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.maximize();

  mainWindow.on("moved", (e) => {
    let bounds = mainWindow.getBounds();
    display = screen.getDisplayNearestPoint({x: bounds.x, y: bounds.y});
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("edit:node", (e, data) => {
  openNewWindow(data);
});

function openNewWindow(data) {
  // https://jasonsturges.medium.com/multiple-window-electron-app-9dbffde8ce95
  if (editWindow !== null) {
    editWindow.close();
  }

  editWindow = new BrowserWindow({
    show: false,
    width: 640,
    height: 360,
    x: display.bounds.x + data.x,
    y: display.bounds.y + data.y,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  });

  editWindow.loadURL(path.join(__dirname, 'editNode.html'));

  editWindow.removeMenu();

  editWindow.webContents.on("did-finish-load", () => {
    editWindow.show();
    editWindow.focus();
    editWindow.webContents.send("node:data", data);
  });

  editWindow.on("closed", () => {
    mainWindow.webContents.send("update:node", data);
    editWindow = null;
  });

  editWindow.on("focus", () => {
    // idk - menu stuff?
  });
}