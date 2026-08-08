const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearBtn = document.getElementById("clearBtn");
const eraserBtn = document.getElementById("eraserBtn");

let drawing = false;
let erasing = false;

// White background
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.lineJoin = "round";
ctx.lineCap = "round";

function startDrawing(e) {
    drawing = true;

    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {

    if (!drawing) return;

    ctx.lineWidth = brushSize.value;
    ctx.lineCap = "round";

    if (erasing) {
        ctx.strokeStyle = "white";
    } else {
        ctx.strokeStyle = colorPicker.value;
    }

    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

function stopDrawing() {

    drawing = false;
    ctx.beginPath();
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

clearBtn.addEventListener("click", () => {

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

});

eraserBtn.addEventListener("click", () => {

    erasing = !erasing;

    if (erasing) {
        eraserBtn.innerText = "🖊 Pen";
    } else {
        eraserBtn.innerText = "🧽 Eraser";
    }

});