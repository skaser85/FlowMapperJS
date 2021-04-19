const { remote, ipcRenderer, ipcMain } = require("electron");
const dialog = remote.dialog;
const WIN = remote.getCurrentWindow();
const os = require("os");
const fs = require("fs");
const path = require("path");
const p5 = require("p5");
const { UserActionNode, ErrorNode, DecisionNode, SystemActionNode } = require("./node.js");
const { Button } = require("./Button.js");

const WINDOW_HEIGHT = 10000;
const ARROW_DIR = {
    LEFT: 0,
    RIGHT: 1
}
const NODE_W = 250;
const NODE_H = 150;
const NODE_X_GAP = 100;
const NODE_Y_GAP = 150;
const NODE_X_SPACING = NODE_W + NODE_X_GAP;
const NODE_Y_SPACING = NODE_H + NODE_Y_GAP;

let SELECTED_NODE = null;
let NODES = [];

const sketch = (p) => {
    let menuStartY = 0;
    let deltaOffset = 0;
    p.setup = () => {
        p.createCanvas(p.windowWidth, WINDOW_HEIGHT)
    }

    p.draw = () => {
        p.background(255);
        let x = 100;
        let y = 100;
        let arrow_dir = ARROW_DIR.RIGHT;
        let hasErrorNode = false;
        for (let i = 0; i < NODES.length; i++) {
            let n = NODES[i];
            if (n.errorNode) hasErrorNode = true;
            n.setCoords(x, y);
            arrow_dir === ARROW_DIR.RIGHT ? x += NODE_X_SPACING : x -= NODE_X_SPACING;
            if (x + NODE_X_GAP > p.windowWidth) {
                n.draw(p, arrow_dir, true, hasErrorNode);
                x -= NODE_X_SPACING;
                y += NODE_Y_SPACING + (hasErrorNode ? 200 : 0);
                arrow_dir = ARROW_DIR.LEFT;
                hasErrorNode = false;
            } else if (x - NODE_X_GAP < 0) {
                n.draw(p, arrow_dir, true, hasErrorNode);
                x += NODE_X_SPACING;
                y += NODE_Y_SPACING + (hasErrorNode ? 200 : 0);
                arrow_dir = ARROW_DIR.RIGHT;
                hasErrorNode = false;
            } else {
                n.draw(p, arrow_dir, false);
            }
        }
        // p.noLoop();
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, WINDOW_HEIGHT);
    }

    let timer = 0;
    let delay = 200;
    let prevent = false;
    p.mouseClicked = (e) => {
        timer = setTimeout(() => {
            if (!prevent) {
                let clickHandled = false;
                if (SELECTED_NODE) {
                    SELECTED_NODE.connectors.forEach(c => {
                        if (c.mouseInside(p)) {
                            c.select();
                            clickHandled = true;
                        }
                    });
                }
                if (!clickHandled) {
                    clickHandled = checkNodes();
                    if (!clickHandled && SELECTED_NODE) {
                        SELECTED_NODE.deselect();
                        SELECTED_NODE = null;
                    }
                }
            }
            prevent = false;
        }, delay);
    }

    p.doubleClicked = (e) => {
        clearTimeout(timer);
        prevent = true;
        if (SELECTED_NODE) {
            ipcRenderer.send("edit:node", SELECTED_NODE);
        } else {
            if (checkNodes()) {
                ipcRenderer.send("edit:node", SELECTED_NODE);
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
                setSelectedNode(n);
            } else {
                if (n.errorNode) {
                    if (n.errorNode.mouseInside(p)) {
                        clickHandled = true;
                        setSelectedNode(n.errorNode);
                    }
                }
            }
        }
        return clickHandled;
    }

    setSelectedNode = (n) => {
        if (SELECTED_NODE) {
            if (SELECTED_NODE === n) {
                SELECTED_NODE.deselect();
                SELECTED_NODE = null;
            } else {
                SELECTED_NODE.deselect();
                n.select();
                SELECTED_NODE = n;
            }
        } else {
            n.select();
            SELECTED_NODE = n;
        }
    }

}

const app = new p5(sketch);

// functions that do NOT require access to p5
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

// Electron connector functions
ipcRenderer.on("create:node", (e, data) => {
    let n = createNode(data.type);
    if (data.text) n.setText(data.text);
    n.id = NODES.length;
    NODES.push(n);
});

ipcRenderer.on("edit:node", (e, data) => {
    if (SELECTED_NODE) {
        ipcRenderer.send("edit:node", SELECTED_NODE);
    } else {
        console.log("ain't no node selected, broseph");
    }
});

ipcRenderer.on("update:node", (e, data) => {
    let node = NODES[data.id];
    if (data.parent) {
        node = NODES[data.parent.id].errorNode;
    }
    node.setText(data.text);
    if (data.type !== node.type) {
        let n = createNode(data.type);
        n.id = node.id;
        n.setCoords(node.x, node.y);
        n.setText(data.text);
        NODES[node.id] = n;
        SELECTED_NODE = n;
    }
});

ipcRenderer.on("save:project", (e, data) => {
    let allNodes = [];
    NODES.forEach(n => {
        allNodes.push({
            type: n.type,
            text: n.flattenText(),
            errorNode: n.errorNode ? { text: n.errorNode.flattenText() } : null
        });
    });
    ipcRenderer.send("save:project", allNodes);
});

ipcRenderer.on("open:project", (e, data) => {
    NODES = [];
    data.forEach(n => {
        let node = createNode(n.type);
        node.id = NODES.length;
        node.setText(n.text);
        if (n.errorNode) {
            node.errorNode.parent = node;
            node.errorNode.setText(n.errorNode.text);
        }
        NODES.push(node);
    });
});