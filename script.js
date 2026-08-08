// Canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");

const clearBtn = document.getElementById("clearBtn");
const eraserBtn = document.getElementById("eraserBtn");

const uploadBtn = document.getElementById("uploadBtn");

const gallery = document.getElementById("gallery");

let drawing = false;

ctx.fillStyle = "white";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.lineJoin="round";
ctx.lineCap="round";

ctx.strokeStyle=colorPicker.value;
ctx.lineWidth=brushSize.value;

colorPicker.oninput=()=>{

    ctx.strokeStyle=colorPicker.value;

}

brushSize.oninput=()=>{

    ctx.lineWidth=brushSize.value;

}

eraserBtn.onclick=()=>{

    ctx.strokeStyle="white";

}

clearBtn.onclick=()=>{

    ctx.fillStyle="white";
    ctx.fillRect(0,0,canvas.width,canvas.height);

}

canvas.addEventListener("mousedown",startDraw);
canvas.addEventListener("mousemove",draw);
canvas.addEventListener("mouseup",stopDraw);
canvas.addEventListener("mouseleave",stopDraw);

function startDraw(e){

    drawing=true;

    ctx.beginPath();

    ctx.moveTo(e.offsetX,e.offsetY);

}

function draw(e){

    if(!drawing) return;

    ctx.lineTo(e.offsetX,e.offsetY);

    ctx.stroke();

}

function stopDraw(){

    drawing=false;

}

// Save Drawing

uploadBtn.addEventListener("click",uploadImage);

async function uploadImage() {

    const title = document.getElementById("title").value.trim();

    if (!title) {
        alert("Please enter a title.");
        return;
    }

    // Export Fabric canvas as PNG
    const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1
    });

    // Convert Base64 to Blob
    const blob = await (await fetch(dataURL)).blob();

    const fileName = Date.now() + ".png";

    // Upload to Supabase Storage
    const { error: uploadError } = await db.storage
        .from("doodles")
        .upload(fileName, blob, {
            contentType: "image/png"
        });

    if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
    }

    // Get Public URL
    const { data } = db.storage
        .from("doodles")
        .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    // Save URL to database
    const { error: dbError } = await db
        .from("doodles")
        .insert([
            {
                title: title,
                image_url: imageUrl
            }
        ]);

    if (dbError) {
        console.error(dbError);
        alert(dbError.message);
        return;
    }

    alert("Drawing Saved!");

    // Clear Fabric canvas
    canvas.clear();
    canvas.backgroundColor = "white";
    canvas.renderAll();

    document.getElementById("title").value = "";

    loadGallery();
}