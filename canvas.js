// =====================================
// Fabric.js Canvas Setup
// =====================================

const canvas = new fabric.Canvas("canvas", {
    isDrawingMode: true,
    selection: false,
    backgroundColor: "#ffffff"
});

window.canvas = canvas;

canvas.setDimensions({
    width: 800,
    height: 500
});

canvas.calcOffset();
window.addEventListener("resize", () => canvas.calcOffset());

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
let isRedoing = false;

function saveState() {
    if (isRedoing) return;
    stateStack.push(JSON.stringify(canvas.toJSON()));
    redoStack = []; // Clear redo stack on new action
}

// Track object additions and modifications
canvas.on("object:added", () => saveState());
canvas.on("object:modified", () => saveState());
canvas.on("object:removed", () => saveState());

document.getElementById("undoBtn").addEventListener("click", () => {
    if (stateStack.length > 1) {
        redoStack.push(stateStack.pop());
        const previousState = stateStack[stateStack.length - 1];
        isRedoing = true;
        canvas.loadFromJSON(previousState, () => {
            canvas.isDrawingMode = (currentTool === "pencil" || currentTool === "eraser");
            canvas.renderAll();
            isRedoing = false;
        });
    }
});

document.getElementById("redoBtn").addEventListener("click", () => {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        stateStack.push(nextState);
        isRedoing = true;
        canvas.loadFromJSON(nextState, () => {
            canvas.isDrawingMode = (currentTool === "pencil" || currentTool === "eraser");
            canvas.renderAll();
            isRedoing = false;
        });
    }
});

// Save initial state
saveState();

// =====================================
// TOOL MODES & SWITCHING
// =====================================

const eraserBtn = document.getElementById("eraserBtn");
const pencilBtn = document.getElementById("pencilBtn");
const lineBtn = document.getElementById("lineBtn");
const rectBtn = document.getElementById("rectBtn");
const circleBtn = document.getElementById("circleBtn");

let currentTool = "pencil";

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
    if (shape) canvas.add(shape);
});

canvas.on("mouse:move", (o) => {
    if (!isMouseDown || canvas.isDrawingMode || !shape) return;
    const pointer = canvas.getPointer(o.e);

    if (currentTool === "line") {
        shape.set({ x2: pointer.x, y2: pointer.y });
    } else if (currentTool === "rect") {
        if (origX > pointer.x) shape.set({ left: Math.abs(pointer.x) });
        if (origY > pointer.y) shape.set({ top: Math.abs(pointer.y) });
        shape.set({ width: Math.abs(origX - pointer.x), height: Math.abs(origY - pointer.y) });
    } else if (currentTool === "circle") {
        const radius = Math.sqrt(Math.pow(origX - pointer.x, 2) + Math.pow(origY - pointer.y, 2)) / 2;
        shape.set({ radius: radius });
    }
    canvas.renderAll();
});

canvas.on("mouse:up", () => {
    if (shape && !canvas.isDrawingMode) {
        shape.setCoords();
    }
    isMouseDown = false;
    shape = null;
});

// =====================================
// CLEAR & DOWNLOAD
// =====================================

document.getElementById("clearBtn").addEventListener("click", () => {
    if (!confirm("Clear the canvas?")) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.isDrawingMode = (currentTool === "pencil" || currentTool === "eraser");
    
    if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
    canvas.freeDrawingBrush.color = (currentTool === "eraser") ? "#ffffff" : colorPicker.value;
    canvas.freeDrawingBrush.width = parseInt(brushSize.value, 10);

    canvas.renderAll();
    saveState();
});

document.getElementById("downloadBtn").addEventListener("click", () => {
    const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
    const link = document.createElement("a");
    link.download = "doodle-" + Date.now() + ".png";
    link.href = dataURL;
    link.click();
});

console.log("🎨 Canvas initialized with working PencilBrush");