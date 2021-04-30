const { Button } = require("./Button.js");
const { Connector } = require("./Connector.js");

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
        this.arrowLineLen = 50;
        this.arrowWingLen = this.arrowLineLen * .3;
        this.arrowWingXSpacing = 10;
        this.arrowWingYMax = 10;
        this.arrowYSpacing = this.h * 2;
        this.borderColor = [0, 0, 0];
        this.selectedBorderColor = [0, 0, 0];
        this.selected = false;
        this.selectedFlashTimerInitialAmt = 255;
        this.selectedFlashTimer = 255;
        this.selectedFlashTimerDir = 0;
        this.flashAmt = 5;
        this.buttons = [];
        this.connectors = [];
        this.connectors = [
            new Connector(this, this.cx, this.top, [0, 0, 0, 128]),
            new Connector(this, this.cx, this.bottom, [255, 0, 0, 128]),
            new Connector(this, this.left, this.cy, [0, 255, 0, 128]),
            new Connector(this, this.right, this.cy, [0, 0, 255, 128])
        ];
        this.selectedConnector = null;
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
        this.connectors[0].setCoords(this.cx, this.top);
        this.connectors[1].setCoords(this.cx, this.bottom);
        this.connectors[2].setCoords(this.left, this.cy);
        this.connectors[3].setCoords(this.right, this.cy);
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

    select() {
        this.selected = true;
        this.selectedFlashTimer = this.selectedFlashTimerInitialAmt;
    }

    deselect() {
        this.selected = false;
        if (this.selectedConnector) this.selectedConnector.deselect();
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
        let strokeColor;
        let strokeWeight;
        if (this.selected) {
            strokeColor = this.createColor(p, this.selectedBorderColor, this.selectedFlashTimer);
            strokeWeight = 3;
            if (this.selectedFlashTimerDir === 0) {
                this.selectedFlashTimer -= this.flashAmt;
                if (this.selectedFlashTimer < 0) {
                    this.selectedFlashTimerDir = 1;
                }
            } else {
                this.selectedFlashTimer += this.flashAmt;
                if (this.selectedFlashTimer > this.selectedFlashTimerInitialAmt) {
                    this.selectedFlashTimerDir = 0;
                }
            }
        } else {
            strokeColor = this.createColor(p, this.borderColor, this.alpha);
            strokeWeight = 1;
        }
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
        p.fill(this.createColor(p, this.textColor, 255));
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

    drawArrow(p, startPoint, endPoint) {
        p.push();
        
        // p.fill(0, 255, 255);
        // p.ellipse(startPoint.x, startPoint.y, 24, 24);
        // p.fill(255, 255, 0);
        // p.ellipse(endPoint.x, endPoint.y, 24, 24);

        p.stroke(0);
        p.strokeWeight(3);
        if (startPoint.x === endPoint.x) {
            // vertical line
            p.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            if (startPoint.y > endPoint.y) {
                // draw wings at pointing down
                p.line(endPoint.x, endPoint.y, endPoint.x + this.arrowWingYMax, endPoint.y + this.arrowWingLen);
                p.line(endPoint.x, endPoint.y, endPoint.x - this.arrowWingYMax, endPoint.y + this.arrowWingLen);
            } else {
                // draw wings at pointing up
                p.line(endPoint.x, endPoint.y, endPoint.x + this.arrowWingYMax, endPoint.y - this.arrowWingLen);
                p.line(endPoint.x, endPoint.y, endPoint.x - this.arrowWingYMax, endPoint.y - this.arrowWingLen);
            }
        } else {
            // horizontal line
            p.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            if (startPoint.x < endPoint.x) {
                // draw wings pointing right
                p.line(endPoint.x, endPoint.y, endPoint.x - this.arrowWingLen, endPoint.y - this.arrowWingYMax);
                p.line(endPoint.x, endPoint.y, endPoint.x - this.arrowWingLen, endPoint.y + this.arrowWingYMax);
            } else {
                // draw wings pointing left
                p.line(endPoint.x, endPoint.y, endPoint.x + this.arrowWingLen, endPoint.y - this.arrowWingYMax);
                p.line(endPoint.x, endPoint.y, endPoint.x + this.arrowWingLen, endPoint.y + this.arrowWingYMax);
            }
        }
        p.pop();
    }

    draw(p, dir, nextRow, prevRowHadError) {
        this.drawNode(p);
        if (this.text.length) this.drawText(p);
        if (this.type !== "error") {
            if (nextRow) {
                p.push();
                p.stroke(0);
                p.strokeWeight(3);
                let bigYSpacing = this.cy + this.arrowYSpacing + (prevRowHadError ? 85 : 0);
                let outerX;
                if (dir === 0) { //left
                    outerX = this.left - this.arrowLineLen/2;
                    p.line(this.left, this.cy, outerX, this.cy);
                    p.line(outerX, this.cy, outerX, bigYSpacing);
                    this.drawArrow(p, {x: outerX, y: bigYSpacing}, {x: this.left, y: bigYSpacing});
                } else { // right
                    outerX = this.right + this.arrowLineLen/2;
                    p.line(this.right, this.cy, outerX, this.cy);
                    p.line(outerX, this.cy, outerX, bigYSpacing);
                    this.drawArrow(p, {x: outerX, y: bigYSpacing}, {x: this.right, y: bigYSpacing});
                }
                p.pop();
            } else {
                if (dir === 0) { // left
                    this.drawArrow(p, {x: this.left, y: this.cy}, {x: this.left - this.arrowLineLen, y: this.cy});
                } else { // right
                    this.drawArrow(p, {x: this.right, y: this.cy}, {x: this.right + this.arrowLineLen, y: this.cy});
                }
            }
        }
        if (this.selected) {
            this.connectors.forEach(c => c.draw(p));
        }
        if (this.errorNode) {
            this.errorNode.setCoords(this.x, this.bottom + 37.5);
            this.errorNode.draw(p);
            this.drawArrow(p, {x: this.cx, y: this.bottom}, {x: this.cx, y: this.errorNode.top});
        }
        if (this.type === "decision") {
            p.push();
            let boxW = 30;
            let boxH = 15;
            p.textFont(this.font);
            p.textSize(this.fontSize * .8);
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(this.createColor(p, this.yesTagColor, 255));
            p.stroke(0);
            p.strokeWeight(1);
            let d = 3;
            if (dir === 0) { // left
                p.rect(this.left - d - boxW, this.cy - boxH/2, boxW, boxH);
                p.fill(0);
                p.text("YES", this.left - d - boxW/2, this.cy);
            } else { // right
                p.rect(this.right + d, this.cy - boxH/2, boxW, boxH);
                p.fill(0);
                p.text("YES", this.right + d + boxW/2, this.cy);
            }
            p.fill(this.createColor(p, this.noTagColor, 255));
            p.rect(this.cx - boxW/2, this.bottom + d, boxW, boxH);
            p.textSize(this.fontSize);
            p.fill(255);
            p.text("NO", this.cx, this.bottom + d + boxH/2 + 1);
            p.pop();
        }
        // testing only
        // this.drawLines(p);
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
        this.textColor = [0, 0, 0];
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
        this.textColor = [0, 0, 0];
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
        this.textColor = [0, 0, 0];
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
        this.textColor = [255, 255, 255];
    }
}

module.exports = {
    UserActionNode,
    ErrorNode,
    SystemActionNode,
    DecisionNode
}