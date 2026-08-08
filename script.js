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

async function uploadImage(){

    const title=document.getElementById("title").value;

    if(title===""){

        alert("Enter a title");

        return;

    }

    canvas.toBlob(async(blob)=>{

        const fileName=Date.now()+".png";

        const {error:uploadError}=await db.storage

            .from("doodles")

            .upload(fileName,blob,{

                contentType:"image/png"

            });

        if(uploadError){

            console.log(uploadError);

            alert(uploadError.message);

            return;

        }

        const {data}=db.storage

            .from("doodles")

            .getPublicUrl(fileName);

        const imageUrl=data.publicUrl;

        const {error:dbError}=await db

            .from("doodles")

            .insert([

                {

                    title:title,

                    image_url:imageUrl

                }

            ]);

        if(dbError){

            console.log(dbError);

            alert(dbError.message);

            return;

        }

        alert("Drawing Saved!");

        document.getElementById("title").value="";

        ctx.fillStyle="white";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        loadGallery();

    },"image/png");

}

// Gallery

async function loadGallery(){

    gallery.innerHTML="";

    const {data,error}=await db

        .from("doodles")

        .select("*")

        .order("created_at",{ascending:false});

    if(error){

        console.log(error);

        return;

    }

    data.forEach(item=>{

        const date=new Date(item.created_at)

        .toLocaleDateString("en-US",{

            day:"numeric",

            month:"long",

            year:"numeric"

        });

        gallery.innerHTML+=`

        <div class="museum-card">

            <div class="frame">

                <img src="${item.image_url}">

            </div>

            <div class="card-info">

                <h3>${item.title}</h3>

                <p class="author">

                    👤 Anonymous

                </p>

                <p class="date">

                    📅 ${date}

                </p>

            </div>

        </div>

        `;

    });

}

loadGallery();