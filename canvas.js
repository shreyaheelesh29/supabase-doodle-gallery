// =====================================
// Fabric.js Canvas Setup
// =====================================

const canvas = new fabric.Canvas("canvas", {
    isDrawingMode: true,
    selection: false,
    backgroundColor: "#ffffff"
});

window.canvas = canvas;

// Base dimensions (design-time) – the logical drawing surface size.
// CSS handles responsive scaling; the canvas keeps a fixed coordinate space.
const baseWidth = 800;
const baseHeight = 500;

canvas.setDimensions({ width: baseWidth, height: baseHeight });

// Recalculate Fabric's internal offset cache whenever the page layout
// changes (e.g. window resize).  We do NOT touch the canvas pixel
// dimensions or zoom — CSS `max-width: 100%` on the wrapper already
// scales the canvas visually, and Fabric's pointer math works correctly
// as long as calcOffset() is refreshed.
function resizeCanvas() {
    canvas.calcOffset();
    canvas.renderAll();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// =====================================
// INITIALIZE BRUSH (Crucial for Fabric v6)
// =====================================

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");

// Explicitly instantiate PencilBrush for Fabric v6
canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
canvas.freeDrawingBrush.color = colorPicker.value || "#000000";
canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10) || 5;

// =====================================
// UNDO / REDO SYSTEM
// =====================================

let stateStack = [];
let redoStack = [];
let isProcessing = false; // lock to prevent concurrent undo/redo

function captureState() {
    return JSON.stringify(canvas.toJSON());
}

function saveState() {
    if (isProcessing) return;
    stateStack.push(captureState());
    redoStack = []; // new action invalidates redo history
}

// Tool tracking
let currentTool = "pencil";

// Restore brush settings after loadFromJSON or clear (Fabric v6 destroys the brush)
function restoreBrush() {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = (currentTool === "eraser") ? "#ffffff" : colorPicker.value;
    canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10) || 5;
    canvas.isDrawingMode = (currentTool === "pencil" || currentTool === "eraser");
}
window.restoreBrush = restoreBrush;

async function loadCanvasState(json) {
    isProcessing = true;
    try {
        await canvas.loadFromJSON(json);
        restoreBrush();
        canvas.renderAll();
    } finally {
        isProcessing = false;
    }
}

// Save state when a freehand path finishes (pencil / eraser)
canvas.on("path:created", () => {
    if (!isProcessing) saveState();
});

// Undo
document.getElementById("undoBtn").addEventListener("click", async () => {
    if (isProcessing || stateStack.length <= 1) return;
    redoStack.push(stateStack.pop());
    await loadCanvasState(stateStack[stateStack.length - 1]);
});

// Redo
document.getElementById("redoBtn").addEventListener("click", async () => {
    if (isProcessing || redoStack.length === 0) return;
    const nextState = redoStack.pop();
    stateStack.push(nextState);
    await loadCanvasState(nextState);
});

// Save the initial blank canvas state
saveState();

// =====================================
// TOOL MODES & SWITCHING
// =====================================

const eraserBtn = document.getElementById("eraserBtn");
const pencilBtn = document.getElementById("pencilBtn");
const lineBtn = document.getElementById("lineBtn");
const rectBtn = document.getElementById("rectBtn");
const circleBtn = document.getElementById("circleBtn");

function setActiveTool(toolName, btn) {
    currentTool = toolName;
    document.querySelectorAll(".tool-section button").forEach(b => b.classList.remove("active-tool"));
    if (btn) btn.classList.add("active-tool");

    if (toolName === "pencil" || toolName === "eraser") {
        canvas.isDrawingMode = true;
        
        // Re-ensure brush exists
        if (!canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        }

        canvas.freeDrawingBrush.color = (toolName === "eraser") ? "#ffffff" : colorPicker.value;
        canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10);
    } else {
        canvas.isDrawingMode = false;
    }
}

pencilBtn.addEventListener("click", (e) => setActiveTool("pencil", e.currentTarget));
eraserBtn.addEventListener("click", (e) => setActiveTool("eraser", e.currentTarget));
lineBtn.addEventListener("click", (e) => setActiveTool("line", e.currentTarget));
rectBtn.addEventListener("click", (e) => setActiveTool("rect", e.currentTarget));
circleBtn.addEventListener("click", (e) => setActiveTool("circle", e.currentTarget));

// Color Swatches
document.querySelectorAll(".swatch").forEach(swatch => {
    swatch.addEventListener("click", () => {
        const selectedColor = swatch.getAttribute("data-color");
        colorPicker.value = selectedColor;
        if (currentTool !== "eraser" && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = selectedColor;
        }
    });
});

colorPicker.addEventListener("input", () => {
    if (currentTool !== "eraser" && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = colorPicker.value;
    }
});

brushSize.addEventListener("input", () => {
    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10);
    }
});

// =====================================
// SHAPE DRAWING EVENTS
// =====================================

let isMouseDown = false;
let shape, origX, origY;

canvas.on("mouse:down", (o) => {
    if (canvas.isDrawingMode) return;
    isMouseDown = true;
    const pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;

    const color = colorPicker.value;
    const strokeWidth = parseInt(brushSize.value, 10);

    if (currentTool === "line") {
        shape = new fabric.Line([origX, origY, origX, origY], {
            stroke: color, strokeWidth: strokeWidth, selectable: false
        });
    } else if (currentTool === "rect") {
        shape = new fabric.Rect({
            left: origX, top: origY, width: 0, height: 0,
            fill: "transparent", stroke: color, strokeWidth: strokeWidth, selectable: false
        });
    } else if (currentTool === "circle") {
        shape = new fabric.Circle({
            left: origX, top: origY, radius: 0,
            fill: "transparent", stroke: color, strokeWidth: strokeWidth, selectable: false
        });
    }
    if (shape) {
        canvas.add(shape);
    }
});

canvas.on("mouse:move", (o) => {
    if (!isMouseDown || canvas.isDrawingMode || !shape) return;
    const pointer = canvas.getPointer(o.e);

    if (currentTool === "line") {
        shape.set({ x2: pointer.x, y2: pointer.y });
    } else if (currentTool === "rect") {
        shape.set({
            left: Math.min(origX, pointer.x),
            top: Math.min(origY, pointer.y),
            width: Math.abs(origX - pointer.x),
            height: Math.abs(origY - pointer.y)
        });
    } else if (currentTool === "circle") {
        const radius = Math.sqrt(Math.pow(origX - pointer.x, 2) + Math.pow(origY - pointer.y, 2)) / 2;
        shape.set({ radius: radius });
    }
    canvas.renderAll();
});

canvas.on("mouse:up", () => {
    if (shape && !canvas.isDrawingMode) {
        shape.setCoords();
        saveState();
    }
    isMouseDown = false;
    shape = null;
});

// =====================================
// CLEAR & DOWNLOAD
// =====================================

document.getElementById("clearBtn").addEventListener("click", () => {
    // Use accessible confirmation modal flow
    showConfirm('Clear the canvas? This cannot be undone.').then(ok => {
        if (!ok) return;
        isProcessing = true;
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        restoreBrush();
        canvas.renderAll();
        isProcessing = false;
        // Reset history to just the blank canvas
        stateStack = [captureState()];
        redoStack = [];
        showToast('Canvas cleared', 'success');
    });
});

document.getElementById("downloadBtn").addEventListener("click", () => {
    const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
    const link = document.createElement("a");
    link.download = "doodle-" + Date.now() + ".png";
    link.href = dataURL;
    link.click();
});

console.log("🎨 Canvas initialized with working PencilBrush");

// ==========================
// Small UI helpers (toasts & confirm)
// ==========================

function showToast(message, type = 'info', ms = 3000) {
    const toasts = document.getElementById('toasts');
    if (!toasts) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    toasts.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, ms);
}

function showConfirm(message) {
    // Use a single shared resolver to avoid attaching listeners repeatedly
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    if (!modal || !msg) return Promise.resolve(window.confirm(message));
    msg.textContent = message;
    modal.hidden = false;
    return new Promise(resolve => {
        window.__pendingConfirmResolve = (val) => {
            modal.hidden = true;
            resolve(val);
            delete window.__pendingConfirmResolve;
        };
    });
}

// expose helpers globally so other scripts can use them
window.showToast = showToast;
window.showConfirm = showConfirm;

// Attach global handlers once for confirm modal buttons to reliably resolve promises
window.addEventListener('DOMContentLoaded', () => {
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    if (ok) ok.addEventListener('click', () => {
        if (typeof window.__pendingConfirmResolve === 'function') window.__pendingConfirmResolve(true);
    });
    if (cancel) cancel.addEventListener('click', () => {
        if (typeof window.__pendingConfirmResolve === 'function') window.__pendingConfirmResolve(false);
    });
});