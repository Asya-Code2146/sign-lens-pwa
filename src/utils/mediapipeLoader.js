import * as mpHandsNamespace from '@mediapipe/hands';
import * as mpCameraNamespace from '@mediapipe/camera_utils';
import * as mpDrawingNamespace from '@mediapipe/drawing_utils';

function resolveExport(moduleObj, property) {
  if (moduleObj && moduleObj[property]) return moduleObj[property];
  if (moduleObj && moduleObj.default && moduleObj.default[property]) return moduleObj.default[property];
  if (typeof window !== 'undefined' && window[property]) return window[property];
  return null;
}

export const Hands = 
  resolveExport(mpHandsNamespace, 'Hands') || 
  mpHandsNamespace.Hands || 
  (mpHandsNamespace.default && mpHandsNamespace.default.Hands);

export const HAND_CONNECTIONS = 
  resolveExport(mpHandsNamespace, 'HAND_CONNECTIONS') || 
  mpHandsNamespace.HAND_CONNECTIONS || 
  (mpHandsNamespace.default && mpHandsNamespace.default.HAND_CONNECTIONS) ||
  [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ];

export const Camera = 
  resolveExport(mpCameraNamespace, 'Camera') || 
  mpCameraNamespace.Camera || 
  (mpCameraNamespace.default && mpCameraNamespace.default.Camera);

export const drawConnectors = 
  resolveExport(mpDrawingNamespace, 'drawConnectors') || 
  mpDrawingNamespace.drawConnectors || 
  (mpDrawingNamespace.default && mpDrawingNamespace.default.drawConnectors) ||
  function (ctx, landmarks, connections, style) {
    if (!landmarks || !connections) return;
    ctx.save();
    ctx.strokeStyle = (style && style.color) || '#06b6d4';
    ctx.lineWidth = (style && style.lineWidth) || 3;
    for (const [i, j] of connections) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
        ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

export const drawLandmarks = 
  resolveExport(mpDrawingNamespace, 'drawLandmarks') || 
  mpDrawingNamespace.drawLandmarks || 
  (mpDrawingNamespace.default && mpDrawingNamespace.default.drawLandmarks) ||
  function (ctx, landmarks, style) {
    if (!landmarks) return;
    ctx.save();
    const radius = (style && style.radius) || 4;
    const color = (style && style.color) || '#10b981';
    for (const p of landmarks) {
      if (p) {
        ctx.beginPath();
        ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  };
