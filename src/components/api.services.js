export const solveLatexExpression = (latexExpression, onMessage, onComplete, onError) => {
  const payload = JSON.stringify({ expression: latexExpression });
  
  fetch('https://math-solver-api-sow8.onrender.com/solve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    function readStream() {
      reader.read().then(({ done, value }) => {
        if (done) {
          if (onComplete) onComplete();
          return;
        }
        
        const chunk = decoder.decode(value);
        // Process each line of the SSE
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const message = line.replace('data: ', '').trim();
            if (onMessage) onMessage(message);
            
            if (message.startsWith('Final result:')) {
              const result = message.replace('Final result:', '').trim();
              if (onComplete) onComplete(result);
            }
          }
        });
        
        readStream();
      }).catch(error => {
        if (onError) onError(error);
      });
    }
    
    readStream();
  })
  .catch(error => {
    if (onError) onError(error);
  });
};

export const sendImageForPrediction = async (dataUrl) => {
  const blob = dataURLtoBlob(dataUrl);
  const formData = new FormData();
  formData.append("file", blob, "canvas_capture.png");

  try {
    const response = await fetch("https://math-solver-api-sow8.onrender.com/predict", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Prediction failed");

    const data = await response.json();
    return data.latex;
  } catch (error) {
    console.error("Prediction API error:", error);
    return null;
  }
};

// Converts a base64 dataURL to Blob
const dataURLtoBlob = (dataUrl) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};
