import { useRef, useState, useEffect } from "react";
import { ScreenshotService } from "./screenshot.service";
import { DrawingService } from "./drawing.service";
import { sendImageForPrediction, solveLatexExpression } from "./api.services";
import { toast } from "sonner";

export function useCanvas() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [selection, setSelection] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTool, setActiveTool] = useState("pen");
  const [latex, setLatex] = useState('');
  const [result, setResult] = useState(null);
  const [parsedExp, setParsedExp] = useState('~');
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSolveLatex = (latexExpr) => {
    toast.info("Sending expression for solving...");
    solveLatexExpression(
      latexExpr,
      (msg) => {
        toast.info(msg);
        if (msg.startsWith("Parsed expression:")) {
          setParsedExp(msg.slice("parsed expression:".length).trim());
        }
      },
      (finalResult) => {
        console.log("Final result:", finalResult);
        if (finalResult) {
          setResult(finalResult);
          toast.success(`Final result: ${finalResult}`);
        }
      },
      (err) => {
        toast.error("❌ Something went wrong while solving.");
        console.error(err);
      }
    );
  };
  
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (e.type.startsWith("touch")) {
      const touch = e.touches[0] || e.changedTouches[0];
      console.log("Touch event detected");
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      };
    }

    return {
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY,
    };
  };


  const startDrawing = (e) => {
    const { offsetX, offsetY } = getEventPos(e);
    
    if (activeTool === "selector") {
      setStartPos({ x: offsetX, y: offsetY });
      setSelection({ x: offsetX, y: offsetY, width: 0, height: 0 });
      return;
    }
    
    if (activeTool === "eraser") {
      // Erase strokes under the cursor
      const newStrokes = strokes.filter(stroke => 
        !stroke.points.some(point => 
          Math.sqrt(Math.pow(point.x - offsetX, 2) + Math.pow(point.y - offsetY, 2)) < 10
        )
      );
      setStrokes(newStrokes);
    
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        DrawingService.redrawCanvas(ctx, canvas, {
          strokes: newStrokes,
          currentStroke: null,
          selection: null,
        });
      }
      return;
    }
    
    // Default to pen tool
    setCurrentStroke({
      color: "white",
      width: 2,
      points: [{ x: offsetX, y: offsetY }]
    });
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing && activeTool !== "selector" && activeTool !== "eraser") return;
    
    const { offsetX, offsetY } = getEventPos(e);
    
    if (activeTool === "selector") {
      if (!startPos) return;
      setSelection({
        x: startPos.x,
        y: startPos.y,
        width: offsetX - startPos.x,
        height: offsetY - startPos.y
      });
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        DrawingService.redrawCanvas(ctx, canvas, {
          strokes: strokes,
          currentStroke: null,
          selection: {
            x: startPos.x,
            y: startPos.y,
            width: offsetX - startPos.x,
            height: offsetY - startPos.y
          },
        });
      }
      return;
    }
    
    if (activeTool === "eraser") {
      // Erase strokes under the cursor while moving
      const newStrokes = strokes.filter(stroke => 
        !stroke.points.some(point => 
          Math.sqrt(Math.pow(point.x - offsetX, 2) + Math.pow(point.y - offsetY, 2)) < 10
        )
      );
      setStrokes(newStrokes);
    
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        DrawingService.redrawCanvas(ctx, canvas, {
          strokes: newStrokes,
          currentStroke: null,
          selection: null,
        });
      }
      return;
    }
    
    // Default to pen tool
    setCurrentStroke((prev) => ({
      ...prev,
      points: [...prev.points, { x: offsetX, y: offsetY }]
    }));
  };

  const endDrawing = async () => {
    if (activeTool === "selector") {
      const imageUrl = ScreenshotService.captureSelection(
        canvasRef.current,
        selection,
        strokes,
        currentStroke
      );
      
      if (canvasRef.current && selection && Math.abs(selection.width) > 5 && Math.abs(selection.height) > 5) setPreviewImage(imageUrl);
      
      setStartPos(null);
      setSelection(null);

      if (!imageUrl) return;
      toast.info("Sending image for prediction...");
      setSolving(true);
      const latex = await sendImageForPrediction(imageUrl);
      if (latex) {
        console.log("Predicted LaTeX:", latex);
        setLatex(latex);
        handleSolveLatex(latex);
      }
      setSolving(false);
      return;
    }
    
    if (activeTool === "eraser") {
      return; // Nothing to do on mouse up for eraser
    }
    
    // Default to pen tool
    if (currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
    setIsDrawing(false);
  };

  const highlightSelectedStrokes = () => {
    if (!selection) return;

    setStrokes((prev) =>
      prev.map((stroke) => {
        if (isStrokeInsideSelection(stroke, selection)) {
          return { ...stroke, color: "#FFD700" };
        }
        return stroke;
      })
    );
  };

  const eraseSelectedStrokes = () => {
    if (!selection) return;

    setStrokes((prev) =>
      prev.filter((stroke) => !isStrokeInsideSelection(stroke, selection))
    );
  };

  const setTool = (tool) => {
    setActiveTool(tool);
    setSelection(null);
    setStartPos(null);
  };

  const isStrokeInsideSelection = (stroke, selection) => {
    const { x, y, width, height } = selection;
    const x1 = width < 0 ? x + width : x;
    const y1 = height < 0 ? y + height : y;
    const absWidth = Math.abs(width);
    const absHeight = Math.abs(height);

    return stroke.points.some((point) =>
      point.x >= x1 &&
      point.x <= x1 + absWidth &&
      point.y >= y1 &&
      point.y <= y1 + absHeight
    );
  };

  return {
    canvasRef,
    isDrawing,
    strokes,
    currentStroke,
    selection,
    previewImage,
    startDrawing,
    draw,
    endDrawing,
    highlightSelectedStrokes,
    eraseSelectedStrokes,
    setTool,
    activeTool,
    isMobile,
    latex,
    result,
    parsedExp,
    solving,
  };
}