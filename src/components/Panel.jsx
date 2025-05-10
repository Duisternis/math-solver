import React, { useState, useEffect } from "react";
import { BlockMath } from "react-katex";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as math from 'mathjs';

export default function Panel({ previewImage, latex, results, solving }) {
  const [graphData, setGraphData] = useState([]);
  const [graphError, setGraphError] = useState(false);
  const [graphTitle, setGraphTitle] = useState("Graph");

  useEffect(() => {
    try {
      if (latex) {
        setGraphTitle(`Graph of ${latex}`);
        let expression = latex.trim();
      
        expression = expression.replace(/\s/g, '');
        
        if (/^x=[^xy]+$/.test(expression)) {
          const xValue = parseFloat(expression.split('=')[1]);
          const data = Array.from({ length: 201 }, (_, i) => {
            const y = (i - 100) / 10;
            return { x: xValue, y };
          });
          setGraphData(data);
          setGraphError(false);
          return;
        }
      
        if (/^y=[^xy]+$/.test(expression)) {
          const yValue = parseFloat(expression.split('=')[1]);
          const data = Array.from({ length: 201 }, (_, i) => {
            const x = (i - 100) / 10;
            return { x, y: yValue };
          });
          setGraphData(data);
          setGraphError(false);
          return;
        }
        
        if (expression.includes('=')) {
          const [left, right] = expression.split('=');
          expression = `(${left})-(${right})`;
        }
        
        expression = expression
          .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
          .replace(/\^{([^}]+)}/g, '^($1)')
          .replace(/\\sqrt{([^}]+)}/g, 'sqrt($1)')
          .replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');

        const node = math.compile(expression);
        
        const data = Array.from({ length: 201 }, (_, i) => {
          const x = (i - 100) / 10;
          try {
            const y = node.evaluate({ x });
            return { x, y };
          } catch {
            throw new Error("Cannot evaluate at x=" + x);
          }
        });
        
        setGraphData(data);
        setGraphError(false);
      } else {
        setGraphTitle("Graph");
        setGraphData([]);
        setGraphError(false);
      }
    } catch (error) {
      console.error("Graph error:", error);
      setGraphError(true);
      const randomData = Array.from({ length: 201 }, (_, i) => {
        const x = (i - 100) / 10;
        const y = Math.random() * 20 - 10;
        return { x, y };
      });
      setGraphData(randomData);
    }
  }, [latex]);

  const dummyResults = {
    "input": "LaTeX",
    "parsed_latex": "~",
    "solution_text": "~",
    "solution_latex": "LaTeX",
  };

  return (
    <div className={`w-full h-full p-4 text-gray-200 overflow-y-auto ${solving ? 'neon-border' : ''}`}>
      <div className="mb-4 border-b border-gray-800 pb-10">
        <h1 className="text-2xl font-bold text-sky-400">Math Solver</h1>
        <p className="text-xs text-gray-400 mt-1">
          Analyze and visualize mathematical expressions
        </p>
      </div>


      <div className="grid grid-cols-2 gap-3 mb-16">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 mb-1">Image</span>
          {previewImage ? (
            <img 
              src={previewImage} 
              className="w-full h-20 object-contain bg-gray-800 rounded"
              alt="Equation preview"
            />
          ) : (
            <div className="h-20 bg-gray-800 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-400 mb-1">LaTeX</span>
          <div className="h-20 bg-gray-800 rounded p-2 overflow-hidden flex items-center justify-center">
            {latex ? (
              <BlockMath math={latex} className="text-sm text-gray-200" />
            ) : (
              <span className="text-xs text-gray-500">No expression</span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-16">
        <span className="text-xs text-gray-400 mb-2 block">Results</span>
        <div className="bg-gray-800 rounded p-3 space-y-2 text-xs">
          {results ? (
            Object.entries(results).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                <span className="text-sky-400 font-medium max-w-[60%] truncate">
                  {(key === "solution_latex" || key === "input" && value !== "null") ? (
                    <BlockMath math={value} className="text-sky-400 text-xs" />
                  ) : (
                    <span>{typeof value === "object" ? JSON.stringify(value) : value}</span>
                  )}
                </span>
              </div>
            ))
          ) : (
            Object.entries(dummyResults).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                <span className="text-gray-500 italic">{value}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Graph</span>
          {graphTitle && (
            <span className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
              {graphTitle.length > 30 ? `${graphTitle.substring(0, 30)}...` : graphTitle}
            </span>
          )}
        </div>
        
        <div className="h-60 bg-gray-800 rounded relative">
          {graphError && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10 rounded">
              <span className="text-xs text-red-400">Graph error</span>
            </div>
          )}
          {!graphData.length && !graphError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-gray-500">No graph data</span>
            </div>
          )}
          
          <ResponsiveContainer className="pr-7 py-4">
            <LineChart 
              data={graphData.length ? graphData : []}
              margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis 
                dataKey="x" 
                tick={{ fill: '#6b7280', fontSize: 8 }}
                label={{ value: 'x', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 8 }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 8 }}
                label={{ value: 'y', angle: -90, position: 'insideLeft', offset: 5, fill: '#6b7280', fontSize: 8 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111827',
                  borderColor: '#1f2937',
                  fontSize: '10px'
                }}
                formatter={(value) => [Number(value).toFixed(2), 'y']}
                labelFormatter={(label) => `x: ${Number(label).toFixed(2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke={graphError ? "#6b7280" : "#0ea5e9"}
                strokeWidth={1.2}
                dot={false}
                activeDot={{ r: 2 }}
                opacity={graphError ? 0.5 : 1}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}