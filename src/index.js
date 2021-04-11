const { remote, ipcRenderer, ipcMain } = require("electron");
const dialog = remote.dialog;
const WIN = remote.getCurrentWindow();
const os = require("os");
const fs = require("fs");
const path = require("path");
const p5 = require("p5");
const { UserActionNode, ErrorNode, DecisionNode, SystemActionNode } = require("./node.js");

const sketch = (p) => {
    let test;
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        test = new UserActionNode(100, 100);
        test.setText("This is test text that is a bit longer to test how line breaking will work, don't you know.");
    }

    p.draw = () => {
        p.background(225);
        test.draw(p);
        // p.noLoop();
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }

    p.mouseClicked = () => {
        // console.log("clicked");
        // p.draw();
    }

}

const app = new p5(sketch);