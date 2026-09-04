// Polyfill for CanvasRenderingContext2D.prototype.roundRect
// Ensures compatibility across older browsers and embedded webviews

if (typeof window !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined') {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
      this: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      radii?: number | number[]
    ) {
      let r = 0;
      if (typeof radii === 'number') {
        r = radii;
      } else if (Array.isArray(radii) && radii.length > 0) {
        r = radii[0];
      }
      r = Math.min(Math.abs(w) / 2, Math.abs(h) / 2, Math.max(0, r));

      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }
}

export {};
