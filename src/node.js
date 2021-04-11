const { TouchBarOtherItemsProxy } = require("electron");
const p5 = require("p5");

class Node {
    constructor(w, h) {
        this.x = 0;
        this.y = 0;
        this.w = w;
        this.h = h;
        this.text = [];
        this.cx = 0;
        this.cy = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
        this.right = 0;
        this.font = "Consolas";
        this.fontSize = 16;
        this.lineSpacing = 3;
        this.arrowLineLen = 100;
        this.arrowSlashLen = this.arrowLineLen * .3;
        this.arrowSpacing = 20;
        this.arrowYSpacing = this.h * 2;
        this.borderColor = [0, 0, 0];
        this.selectedBorderColor = [0, 255, 0];
        this.selected = false;
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

    setCoords(x, y) {
        this.x = x;
        this.y = y;
        this._setCenters();
        this._setBounds();
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

    drawNode(p) {
        p.push();
        // draw node
        let nodeColor = this.mouseInside(p) ? this.createColor(p, this.hoverColor, this.alpha) : this.createColor(p, this.color, this.alpha);
        p.noStroke();
        p.fill(nodeColor);
        p.rect(this.x, this.y, this.w, this.h);
        // draw border
        p.noFill();
        let strokeColor = this.selected ? this.createColor(p, this.selectedBorderColor, this.alpha) : this.createColor(p, this.borderColor, this.alpha);
        let strokeWeight = this.selected ? 5 : 1;
        p.stroke(strokeColor);
        p.strokeWeight(strokeWeight);
        p.rect(this.x, this.y, this.w, this.h);
        p.pop();
    }

    drawText(p) {
        p.push();
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
        p.pop();
    }

    drawLines(p) {
        p.push();
        p.stroke(255, 0, 255);
        p.line(this.left, this.cy, this.right, this.cy);
        p.line(this.cx, this.top, this.cx, this.bottom);
        p.pop();
    }

    drawArrow(p, dir, nextRow) {
        p.push();
        p.stroke(0);
        p.strokeWeight(3);
        if (dir === 0) {
            if (nextRow) {
                let arrowHalfEnd = this.left - this.arrowLineLen/2;
                let arrowYSpacing = this.cy + this.arrowYSpacing;
                p.line(this.left, this.cy, arrowHalfEnd, this.cy);
                p.line(arrowHalfEnd, this.cy, arrowHalfEnd, arrowYSpacing);
                p.line(arrowHalfEnd, arrowYSpacing, this.left, arrowYSpacing);
                p.line(this.left, arrowYSpacing, this.left - this.arrowSpacing, arrowYSpacing + this.arrowSlashLen);
                p.line(this.left, arrowYSpacing, this.left - this.arrowSpacing, arrowYSpacing - this.arrowSlashLen);
            } else {
                let arrowEnd = this.left - this.arrowLineLen;
                let arrowStart = arrowEnd + this.arrowSlashLen;
                p.line(this.left, this.cy, arrowEnd, this.cy);
                p.line(arrowStart, this.cy - this.arrowSpacing, arrowEnd, this.cy);
                p.line(arrowStart, this.cy + this.arrowSpacing, arrowEnd, this.cy);
            }
        } else {
            if (nextRow) {
                let arrowHalfEnd = this.right + this.arrowLineLen/2;
                let arrowYSpacing = this.cy + this.arrowYSpacing;
                p.line(this.right, this.cy, arrowHalfEnd, this.cy);
                p.line(arrowHalfEnd, this.cy, arrowHalfEnd, arrowYSpacing);
                p.line(arrowHalfEnd, arrowYSpacing, this.right, arrowYSpacing);
                p.line(this.right, arrowYSpacing, this.right + this.arrowSpacing, arrowYSpacing + this.arrowSlashLen);
                p.line(this.right, arrowYSpacing, this.right + this.arrowSpacing, arrowYSpacing - this.arrowSlashLen);
            } else {
                let arrowEnd = this.right + this.arrowLineLen;
                let arrowStart = arrowEnd - this.arrowSlashLen;
                p.line(this.right, this.cy, arrowEnd, this.cy);
                p.line(arrowStart, this.cy - this.arrowSpacing, arrowEnd, this.cy);
                p.line(arrowStart, this.cy + this.arrowSpacing, arrowEnd, this.cy);
            }
        }
        p.pop();
    }

    draw(p, dir, nextRow) {
        this.drawNode(p);
        if (this.text.length) this.drawText(p);
        this.drawArrow(p, dir, nextRow);
        // testing only
        this.drawLines(p);
    }
}

class UserActionNode extends Node {
    constructor(w, h) {
        super(w, h);
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
    constructor(w, h) {
        super(w, h);
        this.color = [84, 196, 227];
        this.alpha = 255;
        this.hoverColor = [94, 220, 255];
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