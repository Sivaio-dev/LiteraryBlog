// js/api.js
export const API_BASE = 'http://localhost:8080/api';

function getAuthHeaders() {
    const token = localStorage.getItem('jwtToken');
    //console.log('Token:', token);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Helper to handle response errors and 401
async function handleResponse(res) {
    if (res.status === 401) {
        localStorage.removeItem('jwtToken');
        window.location.hash = '#/admin/login';
        throw new Error('Unauthorized - please login again.');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || 'Request failed');
    }
    return res.json();
}

// --- Public ---
export async function getPosts(page = 0, size = 10) {
    const res = await fetch(`${API_BASE}/posts?page=${page}&size=${size}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
}

export async function getPostBySlug(slug) {
    const res = await fetch(`${API_BASE}/posts/${slug}`);
    if (!res.ok) throw new Error('Post not found');
    return res.json();
}

export async function searchPosts(query, page = 0, size = 10) {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
    return res.json();
}

export async function getPostsByCategory(slug, page = 0, size = 10) {
    const res = await fetch(`${API_BASE}/categories/${slug}/posts?page=${page}&size=${size}`);
    return res.json();
}

export async function getCategoryBySlug(slug) {
    const res = await fetch(`${API_BASE}/categories/${slug}`);
    if (!res.ok) throw new Error('Category not found');
    return res.json();
}

/* export async function toggleLike(postId) {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST' });
    return res.json();
}

export async function getLikeStatus(postId) {
    const res = await fetch(`${API_BASE}/posts/${postId}/likes`);
    return res.json();
} */

// --- Admin ---
export async function getAdminPosts() {
    const headers = getAuthHeaders();
    console.log('Headers:', headers);
    const res = await fetch(`${API_BASE}/admin/posts`, { headers });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Unauthorized');
    }
    return res.json();
}

export async function createPost(postData) {
    const res = await fetch(`${API_BASE}/admin/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(postData)
    });
    /*if(res.ok) {
        alert("Post created");
        loadAdminPosts();
    } else if (!res.ok) { throw new Error('Post Create failed'); } */
    return handleResponse(res);
}

export async function updatePost(id, postData) {
    //console.log('Updating post ID:', id);
    //console.log('Update data:', postData);
    const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(postData)
    });
    if (!res.ok) {
        const err = await res.json();
        console.error('Update response error:', err);
        throw new Error(err.message || 'Failed to update post');
    }
    return res.json();
}

export async function deletePost(id) {
    const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (res.status === 401) {
        localStorage.removeItem('jwtToken');
        window.location.hash = '#/admin/login';
        throw new Error('Unauthorized');
    }
    if (res.ok) {
        alert("Post deleted");
        loadAdminPosts();
    } else if (!res.ok) { throw new Error('Delete failed'); }
}

export async function getCategories() {
    const headers = getAuthHeaders();
    console.log('Headers:', headers);
    const res = await fetch(`${API_BASE}/admin/categories`, { headers });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Unauthorized');
    }
    return res.json();
}

export async function getPublicCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
}

export async function createCategory(name) {
    const res = await fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
    });
    return handleResponse(res);
}

export async function updateCategory(id, name) {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
    });
    return handleResponse(res);
}

export async function deleteCategory(id) {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Delete failed');
}
