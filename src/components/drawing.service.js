export class DrawingService {
  static drawStrokes(ctx, strokes, currentStroke) {
    // Draw all saved strokes
    strokes.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      stroke.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });

    // Draw current stroke in progress
    if (currentStroke) {
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width;
      ctx.beginPath();
      currentStroke.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  }

  static drawSelection(ctx, selection) {
    if (selection) {
      ctx.save(); // Save current canvas state
  
      // Draw translucent red background
      ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; // red with 20% opacity
      ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
  
      // Draw dashed red border
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.setLineDash([6]);
      ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
      ctx.restore();
    } 
  }
  
  static redrawCanvas(ctx, canvas, { strokes, currentStroke, selection }) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    
    this.drawStrokes(ctx, strokes, currentStroke);
    
    if (selection) {
      this.drawSelection(ctx, selection);
    }
  }
}