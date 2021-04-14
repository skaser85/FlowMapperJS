class Button {
    constructor(text) {
        this.text = text;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.fontSize = 18;
        this.font = "Consolas";
        this.fontColor = [0, 0, 0];
        this.fontHighlightColor = [255, 255, 255];
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
        p.textAlign(p.CENTER, p.CENTER);
        this.w = p.textWidth(this.text) + 35;
        this.h = this.fontSize * 2;
        this.setCoords(x, y);
        if (this.mouseInside(p)) {
            p.fill(this.createColor(p, [255, 0, 255], 128));
            p.stroke(0);
            p.strokeWeight(1);
            p.rect(this.x, this.y, this.w, this.h);
            p.fill(this.createColor(p, this.fontHighlightColor, 255));
            p.text(this.text, this.cx, this.cy);
            p.pop();
        } else {
            p.noFill();
            p.stroke(0);
            p.strokeWeight(1);
            p.rect(this.x, this.y, this.w, this.h);
            p.fill(this.createColor(p, this.fontColor, 255));
            p.text(this.text, this.cx, this.cy);
        }
    }

}

module.exports = {
    Button
}