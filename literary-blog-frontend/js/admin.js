// js/admin.js

import * as api from './api.js';
import { isAuthenticated } from './auth.js';

// Load admin posts
window.loadAdminPosts = async function() {
    if (!isAuthenticated()) {
        window.location.hash = '#/admin/login';
        return;
    }
    try {
        const posts = await api.getAdminPosts();
        const tbody = document.getElementById('adminPostsTableBody');
        if (!tbody) return;
        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No posts yet. Create your first post!</td></tr>';
            return;
        }
        // Sort posts by ID descending (newest first) or by published date
        const sortedPosts = [...posts].sort((a, b) => b.id - a.id);
        tbody.innerHTML = sortedPosts.map((post, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><a href="#/admin/posts/edit/${post.id}" class="text-decoration-none">${post.title}</a></td>
                <td><span class="badge ${post.status === 'PUBLISHED' ? 'bg-success' : 'bg-warning text-dark'}">${post.status}</span></td>
                <td>${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</td>
                <td class="text-end">
                    <a class="btn btn-sm btn-outline-warning me-1" href="#/admin/posts/edit/${post.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </a>
                    <button class="btn btn-sm btn-outline-danger delete-post" data-id="${post.id}" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Delete buttons
        document.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (!confirm('Delete this post?')) return;
                try {
                    await api.deletePost(this.dataset.id);
                    window.loadAdminPosts(); // reload
                } catch (err) {
                    alert('Delete failed: ' + err.message);
                }
            });
        });
    } catch (err) {
        if (err.message.includes('Unauthorized')) {
            window.location.hash = '#/admin/login';
        } else {
            document.getElementById('adminPostsTableBody').innerHTML = `<tr><td colspan="5" class="text-danger">Error: ${err.message}</td></tr>`;
        }
    }
};

// Load categories admin
window.loadAdminCategories = async function() {
    if (!isAuthenticated()) {
        window.location.hash = '#/admin/login';
        return;
    }
    try {
        const categories = await api.getCategories();
        const tbody = document.getElementById('categoryList');
        if (!tbody) return;
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No categories yet. Add your first category!</td></tr>';
            return;
        }
        // Sort by name alphabetically (optional)
        const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
        tbody.innerHTML = sorted.map((cat, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${cat.name}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-warning me-1 edit-category" data-id="${cat.id}" data-name="${cat.name}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-category" data-id="${cat.id}" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        if (err.message.includes('Unauthorized')) {
            window.location.hash = '#/admin/login';
        } else {
            document.getElementById('categoryList').innerHTML = `<tr><td colspan="3" class="text-danger">Error: ${err.message}</td></tr>`;
        }
    }
};

// Handle category add (called from admin-categories.html)
window.handleAddCategory = async function() {
    const input = document.getElementById('newCategoryName');
    const name = input.value.trim();
    if (!name) {
        alert('Please enter a category name');
        return;
    }
    try {
        await api.createCategory(name);
        input.value = '';
        window.loadAdminCategories(); // reload
    } catch (err) {
        alert('Failed to add category: ' + err.message);
    }
};

// Handle category (delegated)
document.addEventListener('click', async function(e) {
    const addBtn = e.target.closest('#addCategoryBtn');
    if (addBtn) {
        e.preventDefault();
        await window.handleAddCategory();
        return;
    }
    const deleteBtn = e.target.closest('.delete-category');
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (!confirm('Delete this category?')) return;
        try {
            await api.deleteCategory(id);
            window.loadAdminCategories();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
        return;
    }
    const editBtn = e.target.closest('.edit-category');
    if (editBtn) {
        const id = editBtn.dataset.id;
        const currentName = editBtn.dataset.name;
        const newName = prompt('New category name:', currentName);
        if (newName && newName.trim()) {
            try {
                await api.updateCategory(id, newName.trim());
                window.loadAdminCategories();
            } catch (err) {
                alert('Update failed: ' + err.message);
            }
        }
        return;
    }
});

// Create/Edit post form submission
document.addEventListener('submit', function(e) {
    const form = e.target.closest('#postForm');
    if (!form) return;
    e.preventDefault();

    //console.log('=== Form submitted ===');

    // Get form data
    const formData = new FormData(form);
    const data = {
        title: formData.get('title'),
        content: formData.get('content'),
        coverImage: formData.get('coverImage'),
        status: formData.get('status'),
        categorySlugs: formData.getAll('categorySlugs')
    };

    // Try to get edit ID from hidden input, fallback to URL hash
    let editId = document.getElementById('editPostId').value;
    if (!editId) {
        const hash = window.location.hash;
        const match = hash.match(/\/admin\/posts\/edit\/(\d+)/);
        editId = match ? match[1] : null;
        //console.log('Edit ID extracted from URL fallback:', editId);
    }
    //console.log('Edit ID final:', editId);
    //console.log('Post data:', data);

    if (editId && editId !== '') {
        // UPDATE
        //console.log('UPDATING post with ID:', editId);
        api.updatePost(editId, data)
            .then(() => {
                //console.log('Update successful:', response);
                window.location.hash = '#/admin/posts';
            })
            .catch(err => {
                console.error('Update failed:', err);
                alert('Update failed: ' + err.message);
            });
    } else {
        // CREATE
        //console.log('CREATING new post');
        api.createPost(data)
            .then(() => {
                //console.log('Create successful:', response);
                window.location.hash = '#/admin/posts';
            })
            .catch(err => {
                console.error('Create error:', err);
                alert('Create failed: ' + err.message);
            });
    }
});

// Helper: Load Categories for Form
async function loadCategoriesForForm() {
    try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${api.API_BASE}/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Unauthorized');
        const categories = await res.json();
        const container = document.getElementById('categoryCheckboxes');
        if (!container) return;
        container.innerHTML = categories.map(cat => `
            <div class="form-check">
                <input class="form-check-input category-checkbox" type="checkbox" name="categorySlugs" value="${cat.slug}" id="cat_${cat.id}">
                <label class="form-check-label" for="cat_${cat.id}">${cat.name}</label>
            </div>
        `).join('');

        const postCategories = window._postCategories || [];
        if (postCategories.length > 0) {
            document.querySelectorAll('.category-checkbox').forEach(cb => {
                const cat = categories.find(c => c.slug === cb.value);
                if (cat && postCategories.includes(cat.name)) {
                    cb.checked = true;
                }
            });
        }
    } catch (err) {
        console.error('Error loading categories:', err);
        document.getElementById('categoryCheckboxes').innerHTML = '<p class="text-danger">Failed to load categories.</p>';
    }
}

// --- Load Dashboard Stats ---
window.loadDashboard = async function() {
    if (!isAuthenticated()) {
        window.location.hash = '#/admin/login';
        return;
    }
    try {
        const posts = await api.getAdminPosts();
        const total = posts.length;
        const published = posts.filter(p => p.status === 'PUBLISHED').length;
        const drafts = posts.filter(p => p.status === 'DRAFT').length;
        //const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);

        document.getElementById('totalPosts').textContent = total;
        document.getElementById('publishedPosts').textContent = published;
        document.getElementById('draftPosts').textContent = drafts;
        //document.getElementById('totalLikes').textContent = totalLikes;
    } catch (err) {
        console.error('Failed to load dashboard:', err);
        document.querySelectorAll('.card-text').forEach(el => el.textContent = 'Error');
    }
};

// Tiptap Initialization
function loadTiptapScripts() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof Tiptap !== 'undefined' && typeof Tiptap.Editor !== 'undefined') {
            resolve();
            return;
        }
        // Load @tiptap/core (UMD)
        const coreScript = document.createElement('script');
        coreScript.src = 'https://cdn.jsdelivr.net/npm/@tiptap/core@2.0.0-beta.220/dist/tiptap.umd.min.js';
        coreScript.onload = () => {
            // Load @tiptap/starter-kit (UMD)
            const starterKitScript = document.createElement('script');
            starterKitScript.src = 'https://cdn.jsdelivr.net/npm/@tiptap/starter-kit@2.0.0-beta.220/dist/starter-kit.umd.min.js';
            starterKitScript.onload = () => {
                // Ensure the objects are attached to window
                if (typeof Tiptap !== 'undefined' && typeof TiptapStarterKit !== 'undefined') {
                    resolve();
                } else {
                    reject(new Error('Tiptap libraries not correctly attached to window'));
                }
            };
            starterKitScript.onerror = () => {
                reject(new Error('Failed to load @tiptap/starter-kit'));
            };
            document.head.appendChild(starterKitScript);
        };
        coreScript.onerror = () => {
            reject(new Error('Failed to load @tiptap/core'));
        };
        document.head.appendChild(coreScript);
    });
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// --- Initialise Quill Editor ---
window.initEditor = function(content) {
    //console.log('initEditor called');
    const editorEl = document.getElementById('editor');
    if (!editorEl) {
        console.error('Editor element #editor not found!');
        return;
    }
    const contentInput = document.getElementById('contentInput');
    const finalContent = content || contentInput?.value || '';

    // --- Clean up previous editor safely ---
    if (window.quillEditor) {
        try {
            // If it's a Quill instance, destroy it
            if (typeof window.quillEditor.destroy === 'function') {
                window.quillEditor.destroy();
            }
        } catch (e) {
            console.warn('Error destroying previous editor:', e);
        }
        window.quillEditor = null;
    }
    // Clear the container (remove any leftover DOM)
    editorEl.innerHTML = '';

    try {
        const quill = new Quill(editorEl, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Write your post content here...'
        });

        quill.root.innerHTML = finalContent;
        if (contentInput) contentInput.value = finalContent;
        quill.update();

        quill.on('text-change', function() {
            const html = quill.root.innerHTML;
            if (contentInput) contentInput.value = html;
        });

        window.quillEditor = quill;
        //console.log('✅ Quill editor initialised successfully');
    } catch (err) {
        //console.error('❌ Quill initialisation failed:', err);
        editorEl.innerHTML = `<textarea class="form-control" rows="10" style="font-family:monospace;">${finalContent}</textarea>`;
        const textarea = editorEl.querySelector('textarea');
        textarea.addEventListener('input', function() {
            if (contentInput) contentInput.value = this.value;
        });
    }
};

// Init Post Form (Create/Edit)
window.initPostForm = async function() {
    //console.log('initPostForm called');
    const form = document.getElementById('postForm');
    if (!form) {
        console.log('Not on post form page');
        return;
    }
    const hash = window.location.hash;
    const match = hash.match(/\/admin\/posts\/edit\/(\d+)/);
    const postId = match ? match[1] : null;
    //console.log('Post ID from URL:', postId);

    if (postId) {
        try {
            const token = localStorage.getItem('jwtToken');
            const res = await fetch(`${api.API_BASE}/admin/posts/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch post');
            const post = await res.json();
            //console.log('Post data loaded:', post);

            // Populate form fields
            document.getElementById('postTitle').value = post.title || '';
            document.getElementById('postCoverImage').value = post.coverImage || '';
            document.getElementById('postStatus').value = post.status || 'PUBLISHED';
            document.getElementById('contentInput').value = post.content || '';
            document.getElementById('editPostId').value = postId;
            document.getElementById('formTitle').textContent = 'Edit Post';
            document.getElementById('savePostBtn').textContent = 'Update';

            window._postCategories = post.categoryNames || [];
            await loadCategoriesForForm();
            await window.initEditor(post.content || '');
        } catch (err) {
            console.error('Error loading post:', err);
            alert('Failed to load post data');
        }
    } else {
        document.getElementById('formTitle').textContent = 'Create New Post';
        document.getElementById('savePostBtn').textContent = 'Save';
        window._postCategories = [];
        await loadCategoriesForForm();
        await window.initEditor('');
    }
    // --- Attach Cloudinary upload listener ---
    const uploadBtn = document.getElementById('uploadCoverBtn');
    const fileInput = document.getElementById('coverImageFile');
    if (uploadBtn && fileInput) {
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);

        newUploadBtn.addEventListener('click', async function() {
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select an image file.');
                return;
            }
            try {
                // --- Compress the image before upload ---
                const compressed = await compressImage(file, 800, 0.7);
                const formData = new FormData();
                formData.append('file', compressed);

                const token = localStorage.getItem('jwtToken');
                const res = await fetch(`${api.API_BASE}/admin/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                    // Do NOT set Content-Type
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Upload failed');
                }
                const data = await res.json();
                document.getElementById('postCoverImage').value = data.url;
                alert('✅ Image uploaded successfully!');
            } catch (err) {
                alert('❌ Upload failed: ' + err.message);
            }
        });
    }
};
