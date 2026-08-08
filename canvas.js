// Canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Controls
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearBtn = document.getElementById("clearBtn");
const eraserBtn = document.getElementById("eraserBtn");

// Drawing state
let drawing = false;
let erasing = false;

// White canvas background
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.lineJoin = "round";
ctx.lineCap = "round";

// Prevent page scrolling while drawing on phones
canvas.style.touchAction = "none";

// Convert pointer position to canvas coordinates
function getPosition(e) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

// Start drawing
function startDrawing(e) {

    drawing = true;

    const pos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

// Draw
function draw(e) {

    if (!drawing) return;

    const pos = getPosition(e);

    ctx.lineWidth = brushSize.value;

    if (erasing) {
        ctx.strokeStyle = "white";
    } else {
        ctx.strokeStyle = colorPicker.value;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

// Stop drawing
function stopDrawing() {

    drawing = false;
    ctx.beginPath();
}

// Pointer Events (works on Desktop + Mobile)
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

// Clear canvas
clearBtn.addEventListener("click", () => {

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

});

// Toggle eraser
eraserBtn.addEventListener("click", () => {

    erasing = !erasing;

    if (erasing) {
        eraserBtn.innerHTML = "🖊️ Pen";
    } else {
        eraserBtn.innerHTML = "🧽 Eraser";
    }

});