const { TouchBarOtherItemsProxy } = require("electron");
const p5 = require("p5");

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.h = 150;
        this.w = 250;
        this.text = [];
        this.cx = 0;
        this.cy = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
        this.right = 0;
        this._setCenters();
        this._setBounds();
        this.font = "Consolas";
        this.fontSize = 16;
        this.lineSpacing = 3;
    }

    _setCenters() {
        this.cx = this.x + (this.w / 2);
        this.cy = this.y + (this.h / 2);
    }

    _setBounds() {
        this.top = this.y;
        this.bottom = this.y + this.h;
        this.left = this.x;
        this.right = this.x + this.w;
    }

    setText(text) {
        this.text = [{text, x: this.x, y: this.y}];
    }

    reflowText(p) {
        let text = "";
        this.text.forEach(t => {
            if (text === "") {
                text = t.text;
            } else {
                text = text + " " + t.text;
            }
        });
        this.text = [];
        let temp = [];
        for (let word of text.split(" ")) {
            temp.push(word);
            let t = p.textWidth(temp.join(" "));
            if (t > this.w) {
                let line = temp.slice(0, -1).join(" ");
                this.text.push({text: line, x: 0, y: 0});
                temp = [temp[temp.length - 1]];
            }
        }
        if (temp.length) {
            this.text.push({text: temp.join(" "), x: 0, y: 0});
        }
    }

    mouseInside(p) {
        return (p.mouseX >= this.left) && (p.mouseX <= this.right) &&
               (p.mouseY >= this.top) && (p.mouseY <= this.bottom);
    }

    createColor(p, colorArr, alpha) {
        return p.color(colorArr[0], colorArr[1], colorArr[2], alpha);
    }

    drawNode(p, color) {
        p.noStroke();
        p.fill(color);
        p.rect(this.x, this.y, this.w, this.h);
        p.noFill();
        p.stroke(0);
        p.rect(this.x, this.y, this.w, this.h);
    }

    drawText(p) {
        p.textFont(this.font);
        p.textSize(this.fontSize);
        p.fill(0);
        p.noStroke();
        this.reflowText(p);
        let lines = this.text.length;
        let lineSpacing = (lines - 1) * this.lineSpacing;
        let linesHeight = lines * (this.fontSize * .6);
        let linesTotalHeight = linesHeight + lineSpacing;
        let tyStart = this.cy - (linesTotalHeight/2);
        for (let t = 0; t < lines; t++) {
            let textObj = this.text[t];
            let textW = p.textWidth(textObj.text);
            let textLeft = this.cx - (textW/2);
            let textTop = tyStart + (t * this.fontSize) + this.lineSpacing;
            p.text(textObj.text, textLeft, textTop);
        }
    }

    drawLines(p) {
        p.stroke(255, 0, 255);
        p.line(this.left, this.cy, this.right, this.cy);
        p.line(this.cx, this.top, this.cx, this.bottom);
    }

    draw(p) {
        let color = this.mouseInside(p) ? this.createColor(p, this.hoverColor, this.alpha) : this.createColor(p, this.color, this.alpha);
        this.drawNode(p, color);
        if (this.text.length) this.drawText(p);
        this.drawLines(p);
    }
}

class UserActionNode extends Node {
    constructor(x, y) {
        super(x, y);
        this.color = [227, 201, 84];
        this.alpha = 255;
        this.hoverColor = [245, 225, 135];
    }
}

class ErrorNode extends Node {
    constructor() {

    }
}

class SystemActionNode extends Node {
    constructor() {

    }
}

class DecisionNode extends Node {
    constructor() {

    }
}

module.exports = {
    UserActionNode,
    ErrorNode,
    SystemActionNode,
    DecisionNode
}