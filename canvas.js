// =========================
// Fabric.js Canvas
// =========================

const canvas = new fabric.Canvas("canvas", {

    isDrawingMode: true,

    backgroundColor: "white",

    selection: false

});

// Make available globally
window.canvas = canvas;

// Brush Settings
canvas.freeDrawingBrush.color = "#000000";
canvas.freeDrawingBrush.width = 4;

// Resize to HTML canvas size
canvas.setDimensions({
    width: 700,
    height: 450
});

// =========================
// Controls
// =========================

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const eraserBtn = document.getElementById("eraserBtn");
const clearBtn = document.getElementById("clearBtn");

let erasing = false;

// =========================
// Color Picker
// =========================

colorPicker.addEventListener("input", () => {

    if (!erasing) {

        canvas.freeDrawingBrush.color = colorPicker.value;

    }

});

// =========================
// Brush Size
// =========================

brushSize.addEventListener("input", () => {

    canvas.freeDrawingBrush.width = parseInt(brushSize.value);

});

// =========================
// Eraser
// =========================

eraserBtn.addEventListener("click", () => {

    erasing = !erasing;

    if (erasing) {

        canvas.freeDrawingBrush.color = "#ffffff";

        eraserBtn.innerHTML = "🖊️ Pen";

    } else {

        canvas.freeDrawingBrush.color = colorPicker.value;

        eraserBtn.innerHTML = "🧽 Eraser";

    }

});

// =========================
// Clear Canvas
// =========================

clearBtn.addEventListener("click", () => {

    canvas.clear();

    canvas.backgroundColor = "white";

    canvas.renderAll();

});

// =========================
// Better Mobile Drawing
// =========================

canvas.upperCanvasEl.style.touchAction = "none";

canvas.upperCanvasEl.style.userSelect = "none";

canvas.upperCanvasEl.style.webkitUserSelect = "none";

canvas.upperCanvasEl.style.webkitTouchCallout = "none";

canvas.upperCanvasEl.style.webkitTapHighlightColor = "transparent";

// Prevent page scrolling while drawing

canvas.upperCanvasEl.addEventListener(

    "touchmove",

    function(e){

        e.preventDefault();

    },

    { passive:false }

);

canvas.upperCanvasEl.addEventListener(

    "touchstart",

    function(e){

        e.preventDefault();

    },

    { passive:false }

);