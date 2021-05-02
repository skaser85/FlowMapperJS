const { remote, ipcRenderer, ipcMain } = require("electron");
const dialog = remote.dialog;
const WIN = remote.getCurrentWindow();
const os = require("os");
const fs = require("fs");
const path = require("path");
const p5 = require("p5");
const { UserActionNode, ErrorNode, DecisionNode, SystemActionNode } = require("./node.js");
const { Button } = require("./Button.js");

const addUserNodeBtn = document.querySelector("#add-user-action-node");
const addSystemNodeBtn = document.querySelector("#add-system-action-node");
const addDecisionBtn = document.querySelector("#add-decision-node");
const editNodeBtn = document.querySelector("#edit-node");
const deleteNodeBtn = document.querySelector("#delete-node");
const openProjectBtn = document.querySelector("#open-project");
const newProjectBtn = document.querySelector("#new-project");
const saveProjectBtn = document.querySelector("#save-project");
const saveProjectAsBtn = document.querySelector("#save-project-as");
const projectDirectoryP = document.querySelector("#project-directory");
const projectFileNameP = document.querySelector("#project-file-name");
const projectLastSavedP = document.querySelector("#project-last-saved");

let flowCanvas;
let canvas_width = 0;
const MENU_WIDTH = 200;
const WINDOW_HEIGHT = 10000;
const ARROW_DIR = {
    LEFT: 0,
    RIGHT: 1
}
const NODE_W = 200;
const NODE_H = 100;
const NODE_X_GAP = 50;
const NODE_Y_GAP = 75;
const NODE_X_SPACING = NODE_W + NODE_X_GAP;
const NODE_Y_SPACING = NODE_H + NODE_Y_GAP;

let SELECTED_NODES = [];
let NODES = [];

let NEEDS_SAVED = false;
let ACTIONS = [];
let REDOS = [];
let UNDOS_AVAILABLE = 0;

let COPY_BUFFER = [];
let CUT_FLAG = false;

const sketch = (p) => {
    let menuStartY = 0;
    let deltaOffset = 0;
    p.setup = () => {
        canvas_width = p.windowWidth - MENU_WIDTH - 25;
        flowCanvas = p.createCanvas(canvas_width, WINDOW_HEIGHT)
        flowCanvas.position(MENU_WIDTH, 0);
        flowCanvas.elt.id = "flow-canvas";
    }

    p.draw = () => {
        p.background(255);
        let x = 100;
        let y = 50;
        let arrow_dir = ARROW_DIR.RIGHT;
        let hasErrorNode = false;
        for (let i = 0; i < NODES.length; i++) {
            let n = NODES[i];
            if (n.errorNode) hasErrorNode = true;
            n.setCoords(x, y);
            arrow_dir === ARROW_DIR.RIGHT ? x += NODE_X_SPACING : x -= NODE_X_SPACING;
            if ((x + NODE_X_SPACING) > canvas_width) {
                n.draw(p, arrow_dir, true, hasErrorNode);
                x -= NODE_X_SPACING;
                y += NODE_Y_SPACING + (hasErrorNode ? (NODE_Y_GAP * 1.5) : 0);
                arrow_dir = ARROW_DIR.LEFT;
                hasErrorNode = false;
            } else if (x - NODE_X_GAP < 0) {
                n.draw(p, arrow_dir, true, hasErrorNode);
                x += NODE_X_SPACING;
                y += NODE_Y_SPACING + (hasErrorNode ? (NODE_Y_GAP  * 1.5) : 0);
                arrow_dir = ARROW_DIR.RIGHT;
                hasErrorNode = false;
            } else {
                n.draw(p, arrow_dir, false);
            }
        }
        p.push();
        p.textFont("Source Sans Pro");
        p.textSize(16);
        p.text("Undos Available: " + UNDOS_AVAILABLE, 10, 20);
        p.pop();
        // p.noLoop();
    }

    p.windowResized = () => {
        canvas_width = p.windowWidth - MENU_WIDTH - 25;
        p.resizeCanvas(canvas_width, WINDOW_HEIGHT);
    }

    p.mouseClicked = (e) => {
        // only handle clicks that occur when
        // the mouse is over the canvas
        if (p.mouseX >= 0 && p.mouseY >= 0) {
            let clickHandled = false;
            if (SELECTED_NODES.length) {
                SELECTED_NODES.forEach(n => {
                    n.connectors.forEach(c => {
                        if (c.mouseInside(p)) {
                            c.select();
                            clickHandled = true;
                        }
                    });
                });
            }
            if (!clickHandled) {
                clickHandled = checkNodes();
                if (!clickHandled && SELECTED_NODES.length) {
                    SELECTED_NODES.forEach(n => {
                        n.deselect();
                    });
                    SELECTED_NODES = [];
                }
            }
        }
    }

    p.mouseWheel = (e) => {
        if (deltaOffset === 0) {
            if (e.delta > 0) {
                menuStartY += e.delta;
                deltaOffset += e.delta;
            }
        } else {
            menuStartY += e.delta;
            deltaOffset += e.delta;            
        }
    }

    // for functions that require access to p5
    checkNodes = () => {
        let clickHandled = false;
        for (let n of NODES) {
            if (n.mouseInside(p)) {
                clickHandled = true;
                addSelectedNode(n);
            } else {
                if (n.errorNode) {
                    if (n.errorNode.mouseInside(p)) {
                        clickHandled = true;
                        addSelectedNode(n.errorNode);
                    }
                }
            }
        }
        return clickHandled;
    }
}

const app = new p5(sketch);

// functions that do NOT require access to p5
function addSelectedNode(n) {
    if (SELECTED_NODES.length) {
        let ni = SELECTED_NODES.findIndex(s => s.id === n.id);
        if (ni > -1) {
            n.deselect();
            SELECTED_NODES.splice(ni, 1);
        } else {
            n.select();
            SELECTED_NODES.push(n);
        }
    } else {
        n.select();
        SELECTED_NODES.push(n);
    }
}

function createNode(type) {
    let n;
    switch(type) {
        case "user":
            n = new UserActionNode(NODE_W, NODE_H);
            break;
        case "system":
            n = new SystemActionNode(NODE_W, NODE_H);
            break;
        case "decision":
            n = new DecisionNode(NODE_W, NODE_H);
            n.errorNode = new ErrorNode(NODE_W, NODE_H, n);
            break;
        }
    return n;
}

function deleteNode(n) {
    let delIdx = NODES.findIndex(node => node.id === n.id);
    NODES.splice(delIdx, 1);
}

function deleteFromCopyBuffer(n) {
    let copyIdx = COPY_BUFFER.findIndex(node => node.id === n.id);
    if (copyIdx > -1) COPY_BUFFER.splice(copyIdx, 1);
}

function deleteSelectedNodes() {
    if (SELECTED_NODES.length) {
        pushUndoState();
        SELECTED_NODES.forEach(n => {
            deleteFromCopyBuffer(n);
            deleteNode(n);
        });
        if (NODES.length) {
            NODES.forEach((n, i) => {
                n.id = i
                n.deselect();
            });
        }
        SELECTED_NODES = [];
        NEEDS_SAVED = true;
    } else {
        console.log("ain't no node selected, broseph");
    }
}

function editNode() {
    if (SELECTED_NODES.length) {
        ipcRenderer.send("edit:node", SELECTED_NODES[SELECTED_NODES.length - 1]);
    } else {
        console.log("ain't no node selected, broseph");
    }
}

function getSaveNodes() {
    let allNodes = [];
    NODES.forEach(n => {
        allNodes.push({
            type: n.type,
            text: n.flattenText(),
            errorNode: n.errorNode ? { text: n.errorNode.flattenText() } : null
        });
    });
    return allNodes;
}

function saveProject() {
    ipcRenderer.send("save:project", getSaveNodes());
}

function saveProjectAs() {
    ipcRenderer.send("save:project:as", getSaveNodes());
}

function updateNodesList(n) {
    pushUndoState();
    NODES.push(n);
    NEEDS_SAVED = true;
}

function pushUndoState() {
    ACTIONS.push([...NODES]);
    UNDOS_AVAILABLE = ACTIONS.length;
}

function popUndoState() {
    let state = ACTIONS.pop();
    if (state) {
        REDOS.push([...NODES]);
        UNDOS_AVAILABLE = ACTIONS.length;
        return state;
    } else {
        return [];
    }
}

function undoAction() {
    NODES = popUndoState();
    NODES.forEach(n => {
        if (n.selected) addSelectedNode(n);
    });
}

function redoAction() {
    let state = REDOS.pop();
    if (state) {
        pushUndoState();
        NODES = state;
        NODES.forEach(n => {
            if (n.selected) addSelectedNode(n);
        });
    }
}

// Electron connector functions
ipcRenderer.on("create:node", (e, data) => {
    let n = createNode(data.type);
    if (data.text) n.setText(data.text);
    n.id = NODES.length;
    updateNodesList(n);
});

ipcRenderer.on("edit:node", (e, data) => {
    editNode();
});

ipcRenderer.on("delete:node", (e, data) => {
    deleteSelectedNodes();
});

ipcRenderer.on("update:node", (e, data) => {
    pushUndoState();
    let node = NODES[data.id];
    if (data.parent) {
        node = NODES[data.parent.id].errorNode;
    }
    node.setText(data.text);
    if (data.type !== node.type) {
        let n = createNode(data.type);
        n.id = node.id;
        n.selected = node.selected;
        n.setCoords(node.x, node.y);
        n.setText(data.text);
        NODES[node.id] = n;
        SELECTED_NODE = n;
    }
});

ipcRenderer.on("save:project", (e, data) => {
    saveProject();
});

ipcRenderer.on("save:project:as", (e, data) => {
    saveProjectAs();
});

ipcRenderer.on("open:project", (e, data) => {
    if (NEEDS_SAVED) {
        console.log("need some kind of confirmation about whether they want to save the changes to this file");
    }
    NODES = [];
    data.data.forEach(n => {
        let node = createNode(n.type);
        node.id = NODES.length;
        node.setText(n.text);
        if (n.errorNode) {
            node.errorNode.parent = node;
            node.errorNode.setText(n.errorNode.text);
        }
        updateNodesList(node);
    });
    projectDirectoryP.innerHTML = data.path;
    projectFileNameP.innerHTML = data.fileName;
    projectLastSavedP.innerHTML = data.lastSaved;
    NEEDS_SAVED = false;
    ACTIONS = [];
    UNDOS_AVAILABLE = 0;
    REDOS = [];
});

ipcRenderer.on("project:saved", (e, data) => {
    projectDirectoryP.innerHTML = data.path;
    projectFileNameP.innerHTML = data.fileName;
    projectLastSavedP.innerHTML = data.lastSaved;
    NEEDS_SAVED = false;
});

ipcRenderer.on("project:saved:as", (e, data) => {
    projectDirectoryP.innerHTML = data.path;
    projectFileNameP.innerHTML = data.fileName;
    projectLastSavedP.innerHTML = data.lastSaved;
    NEEDS_SAVED = false;
});

ipcRenderer.on("new:project", (e, data) => {
    if (NEEDS_SAVED) {
        console.log("need some kind of confirmation about whether they want to save the changes to this file");
    }
    NODES = [];
    projectDirectoryP.innerHTML = "new project - unsaved";
    projectFileNameP.innerHTML = "new project - unsaved";
    projectLastSavedP.innerHTML = "";
    NEEDS_SAVED = false;
    ACTIONS = [];
    UNDOS_AVAILABLE = 0;
    REDOS = [];
});

ipcRenderer.on("undo:action", (e, data) => {
    undoAction();
});

ipcRenderer.on("redo:action", (e, data) => {
    redoAction();
});

ipcRenderer.on("select:all", (e, data) => {
    NODES.forEach(n => addSelectedNode(n));
});

ipcRenderer.on("copy:node", (e, data) => {
    if (SELECTED_NODES.length) {
        SELECTED_NODES.forEach(n => {
            n.inCopyBuffer = true;
            n.cutFlag = false;
        });
        COPY_BUFFER = [...SELECTED_NODES];
        CUT_FLAG = false;
    } else {
        console.log("ain't nothin' selected, broseph");
    }
});

ipcRenderer.on("cut:node", (e, data) => {
    if (SELECTED_NODES.length) {
        SELECTED_NODES.forEach(n => {
            n.inCopyBuffer = true;
            n.cutFlag = true;
        });
        COPY_BUFFER = [...SELECTED_NODES];
        CUT_FLAG = true;
    } else {
        console.log("ain't nothin' selected, broseph");
    }
});

ipcRenderer.on("paste:node", (e, data) => {
    if (COPY_BUFFER.length) {
        pushUndoState();
        COPY_BUFFER.forEach(n => {
            let node = createNode(n.type);
            node.setText(n.flattenText());
            if (n.errorNode) {
                node.errorNode.setText(n.errorNode.flattenText());
            }
            updateNodesList(node);
        });
        if (CUT_FLAG) {
            COPY_BUFFER.forEach(n => deleteNode(n));
        }
        COPY_BUFFER.forEach(n => n.inCopyBuffer = false);
        COPY_BUFFER = [];
    } else {
        console.log("copy buffer be empty, brojango unchained");
    }
});

// Webpage Event Listeners
addUserNodeBtn.addEventListener("click", (e) => {
    let n = createNode("user");
    n.id = NODES.length;
    updateNodesList(n);
});

addSystemNodeBtn.addEventListener("click", (e) => {
    let n = createNode("system");
    n.id = NODES.length;
    updateNodesList(n);
});

addDecisionBtn.addEventListener("click", (e) => {
    let n = createNode("decision");
    n.id = NODES.length;
    updateNodesList(n);
});

editNodeBtn.addEventListener("click", (e) => {
    editNode();
});

deleteNodeBtn.addEventListener("click", (e) => {
    deleteSelectedNodes();
});

openProjectBtn.addEventListener("click", (e) => {
    ipcRenderer.send("open:project");
});

newProjectBtn.addEventListener("click", (e) => {
    ipcRenderer.send("new:project");
});

saveProjectBtn.addEventListener("click", (e) => {
    saveProject();
});

saveProjectAsBtn.addEventListener("click", (e) => {
    saveProjectAs();
});