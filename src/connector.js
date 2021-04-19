class Connector {
    constructor(parent, x, y, colorArr) {
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.w = 20;
        this.h = 20;
        this.color = colorArr;
        this._setCenters();
        this._setBounds();
        this.selected = false;
        this.selectedFlashTimerInitialAmt = 255;
        this.selectedFlashTimer = 255;
        this.selectedFlashTimerDir = 0;
        this.flashAmt = 10;
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

    mouseInside(p) {
        return p.dist(p.mouseX, p.mouseY, this.x, this.y) < this.w;
    }

    createColor(p, colorArr, alpha) {
        return p.color(colorArr[0], colorArr[1], colorArr[2], alpha);
    }

    select() {
        this.selected = true;
        this.selectedFlashTimer = this.selectedFlashTimerInitialAmt;
        if (this.parent.selectedConnector) {
            this.parent.selectedConnector.deselect();
        }
        this.parent.selectedConnector = this;
    }

    deselect() {
        this.selected = false;
        this.parent.selectedConnector = null;
    }

    draw(p) {
        p.push();
        p.fill(this.createColor(p, this.color, this.color[3]));
        p.stroke(0);
        p.strokeWeight(1);
        if (this.selected) {
            p.fill(this.createColor(p, this.color, this.selectedFlashTimer));
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
        }
        p.ellipse(this.x, this.y, this.w, this.h);
        p.pop();
    }
}

module.exports = {
    Connector
}