import { DrawingService } from "./drawing.service";

export class ScreenshotService {
  static captureSelection(canvas, selection, strokes, currentStroke) {
    if (!selection || !canvas) return null;
    if (selection.width === 0 || selection.height === 0) return null;
  
    const x = selection.width < 0 ? selection.x + selection.width : selection.x;
    const y = selection.height < 0 ? selection.y + selection.height : selection.y;
    const width = Math.abs(selection.width);
    const height = Math.abs(selection.height);
  
    if (width < 5 || height < 5) return null;
  
    // Create a temp canvas for capturing the content
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
  
    // Redraw everything (no selection box here)
    tempCtx.lineCap = "round";
    DrawingService.drawStrokes(tempCtx, strokes, currentStroke);
  
    // Capture the selected area from the tempCanvas
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = width;
    cropCanvas.height = height;
    const cropCtx = cropCanvas.getContext("2d");
    cropCtx.drawImage(
      tempCanvas,
      x, y, width, height,
      0, 0, width, height
    );
  
    return cropCanvas.toDataURL("image/png");
  }
  
  static downloadImage(base64Url) {
    const link = document.createElement("a");
    link.href = base64Url;
    link.download = `selection-${Date.now()}.png`;
    link.click();
  }
}
