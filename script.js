// =========================================
// Virtual Doodle Museum - script.js
// =========================================

const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

let galleryData = [];

// ===============================
// Session-based like tracking
// ===============================
function getLikedIds() {
    try {
        return new Set(JSON.parse(sessionStorage.getItem('likedDoodles') || '[]'));
    } catch { return new Set(); }
}
function markAsLiked(id) {
    const liked = getLikedIds();
    liked.add(String(id));
    sessionStorage.setItem('likedDoodles', JSON.stringify([...liked]));
}
function hasLiked(id) {
    return getLikedIds().has(String(id));
}

uploadBtn.addEventListener("click", uploadDrawing);

async function uploadDrawing() {
    const title = document.getElementById("title").value.trim();
    const artist = document.getElementById("artist").value.trim() || "Anonymous";

    if (title === "") {
        window.showToast("Please enter a title for your doodle.", 'error');
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

        window.showToast('🎉 Doodle added to the museum!', 'success');
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        if (typeof window.restoreBrush === 'function') {
            window.restoreBrush();
        }
        canvas.renderAll();
        document.getElementById("title").value = "";
        document.getElementById("artist").value = "";

        loadGallery();

    } catch (err) {
        console.error(err);
        window.showToast("Error saving: " + (err.message || err), 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerText = "💾 Save Drawing";
    }
}

// ===============================
// Load & Render Gallery
// ===============================

async function loadGallery() {
    // show skeleton
    gallery.innerHTML = "";
    const placeholder = document.createElement('p');
    placeholder.textContent = 'Loading museum exhibits...';
    gallery.appendChild(placeholder);

    const { data, error } = await db
        .from("doodles")
        .select("*");

    if (error) {
        console.error(error);
        gallery.innerHTML = "";
        const p = document.createElement('p');
        p.textContent = 'Failed to load gallery.';
        gallery.appendChild(p);
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
        const p = document.createElement('p');
        p.textContent = 'No doodles found matching your search.';
        gallery.appendChild(p);
        return;
    }
    filtered.forEach((item, index) => {
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        }) : '';

        const card = document.createElement('div');
        card.className = 'museum-card';
        card.setAttribute('role','listitem');
        // Staggered entrance animation
        card.style.animationDelay = (index * 0.08) + 's';

        const frame = document.createElement('div');
        frame.className = 'frame';
        const img = document.createElement('img');
        img.alt = item.title || 'Doodle';
        img.loading = 'lazy';
        img.dataset.id = item.id;
        // Use placeholder if image URL missing
        if (item.image_url) {
            img.src = item.image_url;
        } else {
            // tiny svg placeholder
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%23efe6d3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b4a33" font-family="Poppins, sans-serif" font-size="20">No image</text></svg>';
            img.classList.add('broken');
        }
        // fallback on error to prevent browser broken-image tooltip
        img.onerror = () => {
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%23efe6d3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b4a33" font-family="Poppins, sans-serif" font-size="20">Image unavailable</text></svg>';
            img.classList.add('broken');
        };
        frame.appendChild(img);

        const info = document.createElement('div');
        info.className = 'card-info';
        const h3 = document.createElement('h3');
        h3.textContent = item.title || 'Untitled';
        const p = document.createElement('p');
        p.className = 'author';
        p.innerHTML = '👤 Painted by: <strong>' + (item.artist || 'Anonymous') + '</strong>';

        const footer = document.createElement('div');
        footer.className = 'card-footer';
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = date ? ('📅 ' + date) : '';

        const likeBtn = document.createElement('button');
        likeBtn.className = 'like-btn';
        likeBtn.dataset.id = item.id;

        const alreadyLiked = hasLiked(item.id);
        likeBtn.innerHTML = (alreadyLiked ? '✅ ' : '❤️ ') + '<span class="like-count">' + (item.likes || 0) + '</span>';
        if (alreadyLiked) {
            likeBtn.disabled = true;
            likeBtn.classList.add('liked');
            likeBtn.title = 'You already liked this doodle';
        }

        footer.appendChild(dateSpan);
        footer.appendChild(likeBtn);

        info.appendChild(h3);
        info.appendChild(p);
        info.appendChild(footer);

        card.appendChild(frame);
        card.appendChild(info);
        gallery.appendChild(card);
    });
}

// Like functionality (one like per doodle per session)
window.likeDoodle = async function(id, btn) {
    if (hasLiked(id)) {
        window.showToast('You already liked this doodle!', 'error');
        return;
    }

    try {
        const btnEl = btn;
        const countSpan = btnEl.querySelector('.like-count');
        let currentLikes = parseInt(countSpan.innerText, 10) || 0;
        currentLikes += 1;
        countSpan.innerText = currentLikes;

        // Mark liked in session
        markAsLiked(id);
        btnEl.disabled = true;
        btnEl.classList.add('liked');
        btnEl.innerHTML = '✅ <span class="like-count">' + currentLikes + '</span>';
        btnEl.title = 'You already liked this doodle';

        // Update local state
        const item = galleryData.find(d => d.id == id);
        if (item) item.likes = currentLikes;

        // Persist
        const { error } = await db.from('doodles').update({ likes: currentLikes }).eq('id', id);
        if (error) throw error;

        window.showToast('Thanks for the ❤️!', 'success');
    } catch (err) {
        console.error(err);
        window.showToast('Failed to like. Try again.', 'error');
        loadGallery();
    }
};

// Event delegation for gallery clicks (likes, open lightbox)
gallery.addEventListener('click', (e) => {
    const like = e.target.closest('.like-btn');
    if (like && !like.disabled) {
        const id = like.dataset.id;
        window.likeDoodle(id, like);
        return;
    }

    const img = e.target.closest('.frame img');
    if (img) {
        const id = img.dataset.id;
        const item = galleryData.find(d => d.id == id);
        if (item) {
            const lb = document.getElementById('lightbox');
            const lbImg = document.getElementById('lightboxImage');
            const lbTitle = document.getElementById('lightboxTitle');
            const lbArtist = document.getElementById('lightboxArtist');
            // hide confirm modal if open
            const confirmModal = document.getElementById('confirmModal');
            if (confirmModal) confirmModal.hidden = true;

            lbImg.src = item.image_url || '';
            lbImg.alt = item.title || 'Doodle';
            lbTitle.textContent = item.title || 'Untitled';
            lbArtist.textContent = item.artist ? ('By ' + item.artist) : '';
            lb.hidden = false;
        }
    }
});

// Lightbox close
document.getElementById('lightboxClose').addEventListener('click', () => {
    document.getElementById('lightbox').hidden = true;
});

// Event listeners for search & sort
searchInput.addEventListener("input", renderGallery);
sortSelect.addEventListener("change", renderGallery);

// Initial Load
loadGallery();