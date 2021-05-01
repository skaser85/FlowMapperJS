const { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, ipcRenderer, screen, Cookies } = require('electron');
// require("electron-reload")(__dirname);
const path = require('path');
const os = require("os");
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
let projectDir = "";
let projectFileName = "";
let projectLastSavedDate = "";

let menuTemplate = [
  {
    label: "File",
    submenu: [
      { 
        label: "Open Project",
        click: openProject,
        id: "open-project",
        enabled: true,
        accelerator: "Ctrl+o"
      },
      { 
        label: "New Project",
        click: newProject,
        id: "new-project",
        enabled: true,
        accelerator: "Ctrl+n"
      },
      { type: "separator" },      
      { 
        label: "Save Project",
        click: () => mainWindow.webContents.send("save:project"),
        id: "save-project",
        enabled: true,
        accelerator: "Ctrl+s"
      },
      { 
        label: "Save Project As",
        click: () => mainWindow.webContents.send("save:project:as"),
        id: "save-project-as",
        enabled: true,
        accelerator: "Ctrl+Shift+s"
      },
      { type: "separator" },
      { role: "quit" }
    ]
  },
  {
    label: "Node",
    submenu: [      
      { 
        label: "Create User Action Node",
        click: () => mainWindow.webContents.send("create:node", {type: "user", text: ""}),
        id: "create-use-node",
        enabled: true,
        accelerator: "F1"
      },
      { 
        label: "Create System Action Node",
        click: () => mainWindow.webContents.send("create:node", {type: "system", text: ""}),
        id: "create-system-node",
        enabled: true,
        accelerator: "F2"
      },
      { 
        label: "Create Decision Node",
        click: () => mainWindow.webContents.send("create:node", {type: "decision", text: ""}),
        id: "create-decision-node",
        enabled: true,
        accelerator: "F3"
      },
      { type: "separator" },
      { 
        label: "Edit Selected Node",
        click: () => mainWindow.webContents.send("edit:node"),
        id: "edit-selected-node",
        enabled: true,
        accelerator: "Ctrl+e"
      },
      { 
        label: "Delete Selected Node",
        click: () => mainWindow.webContents.send("delete:node"),
        id: "delete-selected-node",
        enabled: true,
        accelerator: "delete"
      },
      { type: "separator" },
      { 
        label: "Undo Action",
        click: () => mainWindow.webContents.send("undo:action"),
        id: "undo-action",
        enabled: true,
        accelerator: "Ctrl+z"
      },
      { 
        label: "Redo Action",
        click: () => mainWindow.webContents.send("redo:action"),
        id: "redo-action",
        enabled: true,
        accelerator: "Ctrl+y"
      },
      { type: "separator" },
      { 
        label: "Cut Node(s)",
        click: () => mainWindow.webContents.send("cut:node"),
        id: "cut-node",
        enabled: true,
        accelerator: "Ctrl+x"
      },
      { 
        label: "Copy Node(s)",
        click: () => mainWindow.webContents.send("copy:node"),
        id: "copy-node",
        enabled: true,
        accelerator: "Ctrl+c"
      },
      { 
        label: "Paste Node(s)",
        click: () => mainWindow.webContents.send("paste:node"),
        id: "paste-node",
        enabled: true,
        accelerator: "Ctrl+v"
      },
      { type: "separator" },
      { 
        label: "Select All Nodes",
        click: () => mainWindow.webContents.send("select:all"),
        id: "select-all-action",
        enabled: true,
        accelerator: "Ctrl+a"
      },
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
      if (d.bounds.x === 1920) display = d;
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
    let bestX = Infinity;
    screen.getAllDisplays().forEach(d => {
      let xDiff = Math.abs(d.bounds.x - bounds.x);
      if (xDiff < bestX) {
        bestX = xDiff;
        display = d;
      }
    });
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

ipcMain.on("update:node", (e, data) => {
  mainWindow.webContents.send("update:node", data);
});

ipcMain.on("save:project", async (e, data) => {
  let projectData = JSON.stringify(data);
  if (projectDir === "" || projectFileName === "") {
    let fileSelected = await setProjectDirectoryAndFileName();
    if (fileSelected) {
      writeProjectFile(projectData);
      mainWindow.webContents.send("project:saved", { path: projectDir, fileName: projectFileName, lastSaved: projectLastSavedDate });
    }
  } else {
    writeProjectFile(projectData);
    mainWindow.webContents.send("project:saved", { path: projectDir, fileName: projectFileName, lastSaved: projectLastSavedDate });
  }
});

ipcMain.on("save:project:as", async (e, data) => {
  let projectData = JSON.stringify(data);
  let fileSelected = await setProjectDirectoryAndFileName();
  if (fileSelected) {
    writeProjectFile(projectData);
    mainWindow.webContents.send("project:saved:as", { path: projectDir, fileName: projectFileName, lastSaved: projectLastSavedDate });
  }
});

ipcMain.on("open:project", (e, data) => {
  openProject();
});

ipcMain.on("new:project", (e, data) => {
  newProject();
});

function setProjectDirectoryAndFileName() {
  return new Promise((resolve, reject) => {
    dialog.showSaveDialog(mainWindow, {
      title: "Save Project File",
      defaultPath: `${os.homedir()}`,
      buttonLabel: "Select File",
      properties: ["openFile"],
      filters: [{name: 'JSON', extensions: ["json"]}]
    }).then(result => {
      if (!result.canceled) {
        projectFileName = path.basename(result.filePath);
        projectDir = path.dirname(result.filePath);
        fs.stat(result.filePath, (err, stats) => {
          if (err) {
            console.log("Error getting the file's stats: ", err);
            reject();
          }
          projectLastSavedDate = stats.mtime;
          resolve(true);
        });
      } else {
        resolve(false);
      }
    })
    .catch(err => {
      console.log("Error selecting project directory: ", err);
      reject();
    });
  });
}

function writeProjectFile(data) {
  let fp = `${projectDir}\\${projectFileName}`;
  fs.writeFile(fp, data, (err) => {
    if (err) {
      console.log("Error writing project file: ", err);
    } else {
      console.log("Successfully wrote project file!");
      console.log(fp);
      fs.stat(fp, (err, stats) => {
        if (err) {
          console.log("Error getting the file's stats: ", err);
        }
        projectLastSavedDate = stats.mtime;
      });
    }
  });
}

function getProjectFile() {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog(mainWindow, {
      title: "Select Project File",
      defaultPath: `${os.homedir()}`,
      buttonLabel: "Select File",
      properties: ["openFile"],
      filters: [{name: 'JSON', extensions: ["json"]}],
      multiSelections: false
    }).then(result => {
      if (!result.canceled) {
        let fp = result.filePaths[0];
        projectFileName = path.basename(fp);
        projectDir = path.dirname(fp);
        fs.stat(fp, (err, stats) => {
          if (err) {
            console.log("Error getting the file's stats: ", err);
            reject();
          }
          projectLastSavedDate = stats.mtime;
          resolve(fp);
        });
      } else {
        resolve("");
      }
    })
    .catch(err => {
      console.log("Error opening project file: ", err);
      reject();
    });
  });
}

async function openProject() {
  let fp = await getProjectFile();
  if (fp) {
    fs.readFile(fp, (err, data) => {
      if (err) {
        console.log("Error reading project file: ", err);
      } else {
        let projectData = JSON.parse(data);
        mainWindow.webContents.send("open:project", { data: projectData, path: projectDir, fileName: projectFileName, lastSaved: projectLastSavedDate });
        console.log("Successfully opened project file!");
        console.log(fp);
      }
    });
  }
}

function openNewWindow(data) {
  // https://jasonsturges.medium.com/multiple-window-electron-app-9dbffde8ce95
  if (editWindow !== null) {
    editWindow.close();
  }

  let width = 640;
  let height = 760;
  editWindow = new BrowserWindow({
    show: false,
    width,
    height,
    x: display.bounds.x + (display.bounds.width/2) - (width/2),
    y: display.bounds.y + (display.bounds.height/2) - (height/2),
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
  
  // editWindow.webContents.openDevTools();

  editWindow.on("closed", () => {
    editWindow = null;
  });

  editWindow.on("focus", () => {
    // idk - menu stuff?
  });
}

function newProject() {
  mainWindow.webContents.send("new:project")
}