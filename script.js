// =========================================
// Virtual Doodle Museum - script.js
// =========================================

const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

let galleryData = [];

uploadBtn.addEventListener("click", uploadDrawing);

async function uploadDrawing() {
    const title = document.getElementById("title").value.trim();
    const artist = document.getElementById("artist").value.trim() || "Anonymous";

    if (title === "") {
        alert("Please enter a title for your doodle.");
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.innerText = "⏳ Saving...";

    try {
        const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
        const blob = await (await fetch(dataURL)).blob();
        const fileName = Date.now() + ".png";

        // Upload image to Supabase Storage
        const { error: uploadError } = await db.storage
            .from("doodles")
            .upload(fileName, blob, { contentType: "image/png" });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicData } = db.storage
            .from("doodles")
            .getPublicUrl(fileName);

        // Insert row with title, artist name, and initial likes
        const { error: insertError } = await db
            .from("doodles")
            .insert([{
                title: title,
                artist: artist,
                image_url: publicData.publicUrl,
                likes: 0
            }]);

        if (insertError) throw insertError;

        alert("🎉 Doodle added to the museum!");
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();
        document.getElementById("title").value = "";
        document.getElementById("artist").value = "";

        loadGallery();

    } catch (err) {
        console.error(err);
        alert("Error saving: " + err.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerText = "💾 Save Drawing";
    }
}

// ===============================
// Load & Render Gallery
// ===============================

async function loadGallery() {
    gallery.innerHTML = "<p>Loading museum exhibits...</p>";

    const { data, error } = await db
        .from("doodles")
        .select("*");

    if (error) {
        console.error(error);
        gallery.innerHTML = "<p>Failed to load gallery.</p>";
        return;
    }

    galleryData = data || [];
    renderGallery();
}

function renderGallery() {
    gallery.innerHTML = "";

    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;

    // Filter
    let filtered = galleryData.filter(item => {
        const titleMatch = item.title && item.title.toLowerCase().includes(searchTerm);
        const artistMatch = item.artist && item.artist.toLowerCase().includes(searchTerm);
        return titleMatch || artistMatch;
    });

    // Sort
    filtered.sort((a, b) => {
        if (sortBy === "likes") {
            return (b.likes || 0) - (a.likes || 0);
        } else {
            return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    if (filtered.length === 0) {
        gallery.innerHTML = "<p>No doodles found matching your search.</p>";
        return;
    }

    filtered.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });

        const card = document.createElement("div");
        card.className = "museum-card";
        card.innerHTML = `
            <div class="frame">
                <img src="${item.image_url}" alt="${item.title}">
            </div>
            <div class="card-info">
                <h3>${item.title}</h3>
                <p class="author">👤 Painted by: <strong>${item.artist || 'Anonymous'}</strong></p>
                <div class="card-footer">
                    <span class="date">📅 ${date}</span>
                    <button class="like-btn" onclick="likeDoodle('${item.id}', this)">
                        ❤️ <span class="like-count">${item.likes || 0}</span>
                    </button>
                </div>
            </div>
        `;
        gallery.appendChild(card);
    });
}

// Like functionality
window.likeDoodle = async function(id, btn) {
    const countSpan = btn.querySelector(".like-count");
    let currentLikes = parseInt(countSpan.innerText, 10);
    currentLikes += 1;
    countSpan.innerText = currentLikes;

    // Update state locally
    const item = galleryData.find(d => d.id == id);
    if (item) item.likes = currentLikes;

    // Update in Supabase
    await db.from("doodles").update({ likes: currentLikes }).eq("id", id);
};

// Event listeners for search & sort
searchInput.addEventListener("input", renderGallery);
sortSelect.addEventListener("change", renderGallery);

// Initial Load
loadGallery();