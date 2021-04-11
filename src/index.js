const { remote, ipcRenderer, ipcMain } = require("electron");
const dialog = remote.dialog;
const WIN = remote.getCurrentWindow();
const os = require("os");
const fs = require("fs");
const path = require("path");
const p5 = require("p5");
const { UserActionNode, ErrorNode, DecisionNode, SystemActionNode } = require("./node.js");

const WINDOW_HEIGHT = 10000;
const ARROW_DIR = {
    LEFT: 0,
    RIGHT: 1
}
const NODE_W = 250;
const NODE_H = 150;
const NODE_X_GAP = 100;
const NODE_Y_GAP = 100;
const NODE_X_SPACING = NODE_W + NODE_X_GAP;
const NODE_Y_SPACING = NODE_H + NODE_Y_GAP;

const sketch = (p) => {
    let nodes = [];
    p.setup = () => {
        p.createCanvas(p.windowWidth, WINDOW_HEIGHT)
        for (let i = 0; i < 20; i++) {
            let n;
            if (i % 2 === 0) {
                n = new UserActionNode(NODE_W, NODE_H);
                n.setText("This is the best test text that ever texted, like, ever, broski!");
            } else {
                n = new SystemActionNode(NODE_W, NODE_H);
                n.setText("System test text.  How friggin' cool is that?!");
            }
            nodes.push(n);
        }
    }

    p.draw = () => {
        p.background(225);
        let x = 100;
        let y = 100;
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
        // p.noLoop();
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, WINDOW_HEIGHT);
    }

    p.mouseClicked = () => {
        for (let n of nodes) {
            if (n.mouseInside(p)) {
                let text = "";
                n.text.forEach(t => text += t.text + " ");
                console.log(text);
                n.selected = !n.selected;
            }
        }
    }

}

const app = new p5(sketch);