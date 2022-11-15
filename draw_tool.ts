class d {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  cline(a: number, b: number, x: number, y: number) {
    this.ctx.fillStyle = "#000000";
    this.ctx.beginPath();
    this.ctx.moveTo(a, b);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  drawBoard(width: number, height: number) {
    (this.ctx).clearRect(0, 0, width, height);
    this.ctx.font = '14px serif';
    this.ctx.fillStyle = "#000000";
    this.cline(0, 5, height, 5);
    this.cline(5, 0, 5, width);
    for (let i = 0; i <= height; i += 40) {
      // X Axis
      this.cline(i, 5, i, 10);
      this.ctx.fillText(String(i), i - 10, 23);
      // Y Axis
      this.cline(5, i, 10, i);
      this.ctx.fillText(String(i), 13, i + 5);
    }
  }

  drawMouse(mouseX: number, mouseY: number) {
    this.ctx.fillText(mouseX + " " + mouseY, mouseX, mouseY);
  }
}

export {
  d
}