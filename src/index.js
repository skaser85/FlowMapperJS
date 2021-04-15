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

let selectedNode = null;
let nodes = [];
let buttons = [];

const sketch = (p) => {
    let menuStartY = 0;
    let deltaOffset = 0;
    p.setup = () => {
        p.createCanvas(p.windowWidth, WINDOW_HEIGHT)
        for (let i = 0; i < 0; i++) {
            let n;
            if (i % 2 === 0 && i % 4 !== 0) {
                n = new UserActionNode(NODE_W, NODE_H);
                n.setText("This is the best test text that ever texted, like, ever, broski!");
            } else if (i % 3 === 0) {
                n = new ErrorNode(NODE_W, NODE_H);
                n.setText("Error Node");
            } else if (i % 4 === 0) {
                n = new SystemActionNode(NODE_W, NODE_H);
                n.setText("System test text.  How friggin' cool is that?!");
            } else {
                n = new DecisionNode(NODE_W, NODE_H);
                n.setText("decision");
            }
            nodes.push(n);
        }
        
        buttons.push(new Button("Edit Node"));
        buttons.push(new Button("Create User Action Node"));
        buttons.push(new Button("Create System Action Node"));
    }

    p.draw = () => {
        p.background(255);
        let x = 100;
        let y = 200;
        let arrow_dir = ARROW_DIR.RIGHT;
        for (let i = 0; i < nodes.length; i++) {
            let n = nodes[i];
            n.setCoords(x, y);
            arrow_dir === ARROW_DIR.RIGHT ? x += NODE_X_SPACING : x -= NODE_X_SPACING;
            if (x + NODE_X_GAP > p.windowWidth) {
                n.draw(p, arrow_dir, true);
                x -= NODE_X_SPACING;
                y += NODE_Y_SPACING;
                arrow_dir = ARROW_DIR.LEFT;
            } else if (x - NODE_X_GAP < 0) {
                n.draw(p, arrow_dir, true);
                x += NODE_X_SPACING;
                y += NODE_Y_SPACING;
                arrow_dir = ARROW_DIR.RIGHT;
            } else {
                n.draw(p, arrow_dir, false);
            }
        }
        p.push();
        p.noStroke();
        p.fill(225, 225);
        p.rect(0, menuStartY, p.windowWidth, 150);
        let buttonStartX = 100;
        for (let b of buttons) {
            b.draw(p, buttonStartX, menuStartY + 50);
            buttonStartX += b.w + 25;
        }
        p.pop();
        // p.noLoop();
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, WINDOW_HEIGHT);
    }

    p.mouseClicked = () => {
        let clickHandled = false;
        for (let b of buttons) {
            if (b.mouseInside(p)) {
                clickHandled = true;
                console.log(p.textWidth(b.text));
            }
        }
        if (!clickHandled) clickHandled = checkNodes();
        if (!clickHandled && selectedNode) {
            selectedNode.selected = false;
            selectedNode = null;
        } 
    }

    checkNodes = () => {
        let clickHandled = false;
        for (let n of nodes) {
            if (n.mouseInside(p)) {
                clickHandled = true;
                if (selectedNode) {
                    if (selectedNode === n) {
                        selectedNode.selected = false;
                        selectedNode = null;
                    } else {
                        selectedNode.selected = false;
                        n.selected = true;
                        selectedNode = n;
                    }
                } else {
                    n.selected = true;
                    selectedNode = n;
                }
            }
        }
        return clickHandled;
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

}

const app = new p5(sketch);

ipcRenderer.on("create:node", (e, data) => {
    let n;
    switch(data.type) {
        case "user":
            n = new UserActionNode(NODE_W, NODE_H);
            break;
        case "system":
            n = new SystemActionNode(NODE_W, NODE_H);
            break;
        case "decision":
            n = new DecisionNode(NODE_W, NODE_H);
            break;
        }
    if (data.text) n.setText(data.text);
    nodes.push(n);
});

ipcRenderer.on("edit:node", (e, data) => {
    if (selectedNode) {
        console.log(selectedNode);
    } else {
        console.log("ain't no node selected, broseph");
    }
});