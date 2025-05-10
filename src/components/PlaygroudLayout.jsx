import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LassoSelect, Menu, Pen, Eraser, Download, Highlighter } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toggle } from "@/components/ui/toggle"
import { useCanvas } from "./useCanvas"
import { DrawingService } from "./drawing.service"
import { ScreenshotService } from "./screenshot.service"
import Panel from "./Panel"

export function PlaygroundLayout() {
    const {
      canvasRef,
      strokes,
      currentStroke,
      selection,
      startDrawing,
      draw,
      endDrawing,
      highlightSelectedStrokes,
      eraseSelectedStrokes,
      setTool,
      activeTool,
      previewImage,
      isMobile,
      latex,
      result,
      parsedExp,
      solving
    } = useCanvas();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    DrawingService.redrawCanvas(ctx, canvas, {
      strokes,
      currentStroke,
      selection: activeTool === "selector" ? selection : null
    });
  }, [strokes, currentStroke, selection, activeTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width-20;
      canvas.height = height-20;
    };

    resizeCanvas(); // Initial resize
    window.addEventListener('resize', resizeCanvas); // Resize on window resize

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const handleDownload = () => {
    if (previewImage) {
      ScreenshotService.downloadImage(previewImage);
    }
  };

  return (
    <div className="h-screen w-full bg-black text-gray-100 flex">
      <div className={`h-full ${isMobile ? "w-full" : "w-3/4"} bg-neutral-900 p-4 relative`}>
        
        <div className="absolute bottom-6 left-6 flex gap-2 bg-neutral-900/90 backdrop-blur-sm p-2 rounded-lg border border-neutral-800 shadow-xl">
          <Toggle
            pressed={activeTool === "pen"}
            onPressedChange={() => setTool("pen")}
            className="data-[state=on]:bg-cyan-500 data-[state=on]:text-black text-gray-300 hover:bg-neutral-800 transition-all"
            aria-label="Toggle pen"
          >
            <Pen className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={activeTool === "eraser"}
            onPressedChange={() => setTool("eraser")}
            className="data-[state=on]:bg-cyan-500 data-[state=on]:text-black text-gray-300 hover:bg-neutral-800 transition-all"
            aria-label="Toggle eraser"
          >
            <Eraser className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={activeTool === "selector"}
            onPressedChange={() => setTool("selector")}
            className="data-[state=on]:bg-cyan-500 data-[state=on]:text-black text-gray-300 hover:bg-neutral-800 transition-all"
            aria-label="Toggle selector"
          >
            <LassoSelect className="h-4 w-4" />
          </Toggle>
        </div>
        
        <div className="absolute top-6 right-6 flex gap-2 bg-neutral-900/90 backdrop-blur-sm p-2 rounded-lg border border-neutral-800 shadow-xl">
          <Button
            onClick={handleDownload}
            disabled={!previewImage}
            size="sm"
            className={`gap-2 ${previewImage ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
          >
            <Download className="h-4 w-4" />
          </Button>

          {activeTool === "selector" && (
            <>
              <Button
                onClick={highlightSelectedStrokes}
                size="sm"
                className="gap-2 bg-yellow-400 hover:bg-yellow-300 text-black"
              >
                <Highlighter className="h-4 w-4" />
              </Button>

              <Button
                onClick={eraseSelectedStrokes}
                size="sm"
                className="gap-2 bg-red-500 hover:bg-red-400 text-white"
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        
        <div
          className={`h-full w-full bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center ${
            activeTool === "pen"
              ? "cursor-pointer"
              : activeTool === "eraser"
              ? "cursor-grab"
              : "cursor-crosshair"
          }`}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        </div>
      </div>

      {!isMobile && (
        <div className="w-1/4 h-full bg-neutral-900 border-l border-neutral-800 p-4">
          <div className="h-full w-full bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-center">
          <Panel 
            previewImage={previewImage} 
            latex={latex}
            results={ (result) ? JSON.parse(result.replace(/'/g, '"')) : null }
            expression={parsedExp}
            solving={solving}
          />
          </div>
        </div>
      )}

      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              className="w-12 h-12 fixed bottom-8 right-8 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full shadow-xl"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-neutral-900 border-l border-neutral-800 p-0 w-3/4">
            <div className="h-full w-full bg-neutral-950 p-4 flex items-center justify-center">
              <Panel 
                previewImage={previewImage} 
                latex={latex}
                results={ (result) ? JSON.parse(result.replace(/'/g, '"')) : null }
                expression={parsedExp} 
                solving={solving}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
