// Create Fabric Canvas
const canvas = new fabric.Canvas("canvas", {
    isDrawingMode: true,
    backgroundColor: "white"
});

// Initial brush
canvas.freeDrawingBrush.color = "#000000";
canvas.freeDrawingBrush.width = 4;

// Canvas size
canvas.setWidth(700);
canvas.setHeight(450);

// Color Picker
const colorPicker = document.getElementById("colorPicker");

colorPicker.addEventListener("input", () => {
    canvas.freeDrawingBrush.color = colorPicker.value;
});

// Brush Size
const brushSize = document.getElementById("brushSize");

brushSize.addEventListener("input", () => {
    canvas.freeDrawingBrush.width = parseInt(brushSize.value);
});

// Eraser
const eraserBtn = document.getElementById("eraserBtn");

let erasing = false;

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

// Clear
document.getElementById("clearBtn").addEventListener("click", () => {

    canvas.clear();

    canvas.backgroundColor = "white";

    canvas.renderAll();

});

// Make canvas available globally
window.canvas = canvas;