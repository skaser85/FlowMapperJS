class Button {
    constructor(text) {
        this.text = text;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.fontSize = 24;
        this.font = "Consolas";
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
        return (p.mouseX >= this.left) && (p.mouseX <= this.right) &&
               (p.mouseY >= this.top) && (p.mouseY <= this.bottom);
    }

    createColor(p, colorArr, alpha) {
        return p.color(colorArr[0], colorArr[1], colorArr[2], alpha);
    }

    draw(p, x, y) {
        p.push();
        p.textFont(this.font);
        p.textSize(this.fontSize);
        let tW = p.textWidth(this.text);
        this.w = tW + 35;
        this.h = this.fontSize * 2;
        this.setCoords(x, y);
        let tX = this.cx - (tW/2);
        let tY = this.cy + ((this.h/4) - 5);
        this.mouseInside(p) ? p.fill(this.createColor(p, [255, 0, 255], 128)) : p.noFill();
        p.stroke(0);
        p.strokeWeight(1);
        p.rect(this.x, this.y, this.w, this.h);
        p.fill(0);
        p.text(this.text, tX, tY);
        p.pop();
    }

}

module.exports = {
    Button
}