const { TouchBarOtherItemsProxy } = require("electron");
const { Button } = require("./Button.js");

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
        this.arrowWingLen = this.arrowLineLen * .3;
        this.arrowWingXSpacing = 20;
        this.arrowWingYMax = 20;
        this.arrowYSpacing = this.h * 2;
        this.borderColor = [0, 0, 0];
        this.selectedBorderColor = [255, 0, 255];
        this.selected = false;
        this.buttons = [];
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

    flattenText() {
        let text = "";
        this.text.forEach(t => {
            if (text === "") {
                text = t.text;
            } else {
                text = text + " " + t.text;
            }
        });
        return text;
    }

    reflowText(p) {
        let text = this.flattenText();
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
        let strokeWeight = this.selected ? 10 : 1;
        p.stroke(strokeColor);
        p.strokeWeight(strokeWeight);
        p.rect(this.x, this.y, this.w, this.h);
        p.pop();
    }

    drawText(p) {
        p.push();
        p.textFont(this.font);
        p.textSize(this.fontSize);
        p.textAlign(p.CENTER, p.CENTER);
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
            let textTop = tyStart + (t * this.fontSize) + this.lineSpacing;
            p.text(textObj.text, this.cx, textTop);
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
                let startX = this.left - this.arrowWingLen;
                let topY = arrowYSpacing - this.arrowWingYMax;
                let bottomY = arrowYSpacing + this.arrowWingYMax;
                p.line(this.left, this.cy, arrowHalfEnd, this.cy);
                p.line(arrowHalfEnd, this.cy, arrowHalfEnd, arrowYSpacing);
                p.line(arrowHalfEnd, arrowYSpacing, this.left, arrowYSpacing);
                p.line(startX, topY, this.left, arrowYSpacing);
                p.line(startX, bottomY, this.left, arrowYSpacing);
            } else {
                let arrowEnd = this.left - this.arrowLineLen;
                let arrowStart = arrowEnd + this.arrowWingLen;
                p.line(this.left, this.cy, arrowEnd, this.cy);
                p.line(arrowStart, this.cy - this.arrowWingYMax, arrowEnd, this.cy);
                p.line(arrowStart, this.cy + this.arrowWingYMax, arrowEnd, this.cy);
            }
        } else {
            if (nextRow) {
                let arrowHalfEnd = this.right + this.arrowLineLen/2;
                let arrowYSpacing = this.cy + this.arrowYSpacing;
                p.line(this.right, this.cy, arrowHalfEnd, this.cy);
                p.line(arrowHalfEnd, this.cy, arrowHalfEnd, arrowYSpacing);
                p.line(arrowHalfEnd, arrowYSpacing, this.right, arrowYSpacing);
                p.line(this.right + this.arrowWingLen, arrowYSpacing - this.arrowWingYMax, this.right, arrowYSpacing);
                p.line(this.right + this.arrowWingLen, arrowYSpacing + this.arrowWingYMax, this.right, arrowYSpacing);
            } else {
                let arrowEnd = this.right + this.arrowLineLen;
                let arrowStart = arrowEnd - this.arrowWingLen;
                p.line(this.right, this.cy, arrowEnd, this.cy);
                p.line(arrowStart, this.cy - this.arrowWingXSpacing, arrowEnd, this.cy);
                p.line(arrowStart, this.cy + this.arrowWingXSpacing, arrowEnd, this.cy);
            }
        }
        p.pop();
    }

    drawArrow2(p, startPoint, endPoint) {
        p.push();
        
        p.fill(0, 255, 255);
        p.ellipse(startPoint.x, startPoint.y, 24, 24);
        p.fill(255, 255, 0);
        p.ellipse(endPoint.x, endPoint.y, 24, 24);

        p.stroke(0);
        p.strokeWeight(3);
        if (startPoint.x === endPoint.x) {
            // vertical line
            p.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            if (startPoint.y > endPoint.y) {
                // draw wings at startPoint
                p.line(endPoint.x, endPoint.y, endPoint.x + this.arrowWingYMax, endPoint.y + this.arrowWingLen);
                p.line(endPoint.x, endPoint.y, endPoint.x - this.arrowWingYMax, endPoint.y + this.arrowWingLen);
            } else {
                // draw wings at endPoint
                p.line(endPoint.x, endPoint.y, endPoint.x + this.arrowWingYMax, endPoint.y - this.arrowWingLen);
                p.line(endPoint.x, endPoint.y, endPoint.x - this.arrowWingYMax, endPoint.y - this.arrowWingLen);
            }
        } else {
            // horizontal line
            p.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            if (startPoint.x < endPoint.x) {
                // draw wings at endPoint
            } else {
                // draw wings at startPoint
            }
        }
        p.pop();
    }

    draw(p, dir, nextRow) {
        this.drawNode(p);
        if (this.text.length) this.drawText(p);
        if (this.type !== "error") this.drawArrow(p, dir, nextRow);
        if (this.selected) {
            // idk, mang
        }
        if (this.errorNode) {
            this.errorNode.setCoords(this.x, this.y + 250);
            this.errorNode.draw(p);
            this.drawArrow2(p, {x: this.cx, y: this.bottom}, {x: this.cx, y: this.errorNode.top});
        }
        // testing only
        this.drawLines(p);
    }
}

class UserActionNode extends Node {
    constructor(w, h) {
        super(w, h);
        this.type = "user";
        this.color = [227, 201, 84];
        this.alpha = 255;
        this.hoverColor = [245, 225, 135];
        this.errorNode = null;
    }
}

class SystemActionNode extends Node {
    constructor(w, h) {
        super(w, h);
        this.type = "system";
        this.color = [84, 196, 227];
        this.alpha = 255;
        this.hoverColor = [94, 220, 255];
        this.errorNode = null;
    }
}

class DecisionNode extends Node {
    constructor(w, h) {
        super(w, h);
        this.type = "decision";
        this.color = [84, 227, 105];
        this.alpha = 255;
        this.hoverColor = [97, 255, 120];
        this.tagSpacing = 5;
        this.yesTagColor = [255, 247, 92];
        this.noTagColor = [224, 92, 250];
        this.errorNode = null;
    }
}

class ErrorNode extends Node {
    constructor(w, h, parent) {
        super(w, h);
        this.type = "error";
        this.color = [227, 84, 84];
        this.alpha = 255;
        this.hoverColor = [255, 99, 99];
        this.parent = parent;
    }
}

module.exports = {
    UserActionNode,
    ErrorNode,
    SystemActionNode,
    DecisionNode
}