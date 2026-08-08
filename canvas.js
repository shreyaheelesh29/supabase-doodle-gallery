// =====================
// Canvas Setup
// =====================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearBtn = document.getElementById("clearBtn");
const eraserBtn = document.getElementById("eraserBtn");

let drawing = false;
let erasing = false;

// White Background
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.lineJoin = "round";
ctx.lineCap = "round";

// Prevent scrolling while drawing
canvas.style.touchAction = "none";

// =====================
// Get Canvas Position
// =====================

function getPos(e) {

    const rect = canvas.getBoundingClientRect();

    let clientX;
    let clientY;

    if (e.touches && e.touches.length > 0) {

        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;

    } else {

        clientX = e.clientX;
        clientY = e.clientY;

    }

    return {

        x: (clientX - rect.left) * (canvas.width / rect.width),

        y: (clientY - rect.top) * (canvas.height / rect.height)

    };

}

// =====================
// Drawing Functions
// =====================

function startDrawing(e) {

    e.preventDefault();

    drawing = true;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

}

function draw(e) {

    if (!drawing) return;

    e.preventDefault();

    const pos = getPos(e);

    ctx.lineWidth = brushSize.value;

    ctx.strokeStyle = erasing ? "#ffffff" : colorPicker.value;

    ctx.lineTo(pos.x, pos.y);

    ctx.stroke();

}

function stopDrawing(e) {

    if (e) e.preventDefault();

    drawing = false;

    ctx.beginPath();

}

// =====================
// Desktop Mouse Events
// =====================

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

// =====================
// Mobile Touch Events
// =====================

canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stopDrawing, { passive: false });
canvas.addEventListener("touchcancel", stopDrawing, { passive: false });

// =====================
// Pointer Events
// =====================

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

// =====================
// Clear Canvas
// =====================

clearBtn.addEventListener("click", () => {

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

});

// =====================
// Eraser
// =====================

eraserBtn.addEventListener("click", () => {

    erasing = !erasing;

    eraserBtn.textContent = erasing ? "🖊️ Pen" : "🧽 Eraser";

});