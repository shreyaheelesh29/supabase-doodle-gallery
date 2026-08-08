// ======================================
// Elements
// ======================================

const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");

// ======================================
// Save Drawing
// ======================================

uploadBtn.addEventListener("click", uploadImage);

async function uploadImage() {

    const title = document.getElementById("title").value.trim();

    if (!title) {
        alert("Please enter a title.");
        return;
    }

    // Export Fabric canvas to PNG
    const imageData = canvas.toDataURL({
        format: "png",
        quality: 1
    });

    // Convert Base64 → Blob
    const response = await fetch(imageData);
    const blob = await response.blob();

    const fileName = Date.now() + ".png";

    // Upload image to Supabase Storage
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

    // Save URL in database
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

// ======================================
// Load Gallery
// ======================================

async function loadGallery() {

    gallery.innerHTML = "";

    const { data, error } = await db
        .from("doodles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(item => {

        const date = new Date(item.created_at)
            .toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

        gallery.innerHTML += `

        <div class="museum-card">

            <div class="frame">

                <img src="${item.image_url}" alt="${item.title}">

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