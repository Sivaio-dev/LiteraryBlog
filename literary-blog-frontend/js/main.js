// js/main.js

import { initRouter } from './router.js';
import { isAuthenticated, logout } from './auth.js';
import * as api from './api.js';

// Author name
const AUTHOR_NAME = 'Kesavan';

// --- Header / Footer renderers (exported for router) ---
export function renderHeader() {
    const isLoggedIn = isAuthenticated();
    return `
    <nav class="navbar navbar-expand-md navbar-light">
        <div class="container">
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item"><a class="nav-link" href="#/">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/blogs">Writings</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="#/contact">Contact</a></li>
                </ul>
                <!-- Search Form -->
                <form class="d-flex search-form me-2" id="searchForm">
                    <input class="form-control me-2" type="search" id="searchInput" placeholder="Search" aria-label="Search">
                    <button class="btn btn-outline-success" type="submit">Search</button>
                </form>
                <!-- Auth & Theme Toggle -->
                <div class="d-flex align-items-center gap-2 auth-section">
                    ${isLoggedIn ? `
                    <div class="dropdown">
                        <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Admin
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#/admin/dashboard">Dashboard</a></li>
                            <li><a class="dropdown-item" href="#/admin/posts">Manage Posts</a></li>
                            <li><a class="dropdown-item" href="#/admin/categories">Categories</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
                        </ul>
                    </div>
                    ` : `
                    <a class="btn btn-outline-primary" href="#/admin/login">Login</a>
                    `}
                    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
                        <i class="fas ${document.body.classList.contains('dark-mode') ? 'fa-sun' : 'fa-moon'}"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>
    `;
}

export function renderFooter() {
    return `
    <footer class="py-3 mt-5">
        <div class="container text-center">
            <p>&copy; 2026 Kesavan | கேசவன். All rights reserved.</p>
        </div>
    </footer>
    `;
}

// --- Page load functions (will be called by router) ---

// Home
window.loadHome = async function() {
    try {
        const data = await api.getPosts(0, 9);
        const posts = data.content || [];
        const container = document.getElementById('latestPosts');
        if (!container) return;
        if (posts.length === 0) {
            container.innerHTML = '<p>No posts yet.</p>';
            return;
        }
        container.innerHTML = posts.map(post => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    ${post.coverImage ? `<img src="${post.coverImage}" class="card-img-top" alt="Cover">` : ''}
                    <div class="card-body">
                        <h5 class="card-title">${post.title}</h5>
                        <p class="card-text">${post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 100) : ''}...</p>
                        <a href="#/blog/${post.slug}" class="btn btn-outline-primary">Read More</a>
                    </div>
                    <div class="card-footer text-muted">
                        ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''} by ${AUTHOR_NAME}
                    </div>
                </div>
            </div>
        `).join('');
        container.innerHTML += `
            <div class="col-12 text-center mt-4">
                <a href="#/blogs" class="btn btn-outline-primary btn-lg">View All Posts</a>
            </div>
        `;
    } catch (err) {
        document.getElementById('latestPosts').innerHTML = '<p class="text-danger">Failed to load posts.</p>';
    }
};

// Handle login form submission
document.addEventListener('submit', function(e) {
    const form = e.target.closest('#loginForm');
    if (!form) return;
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    import('./auth.js').then(module => {
        module.login(email, password)
            .then(() => {
                window.location.hash = '#/admin/posts';
            })
            .catch(err => {
                document.getElementById('loginError').textContent = err.message;
            });
    });
});

async function loadCategoriesSidebar() {
    try {
        const categories = await api.getPublicCategories();
        const container = document.getElementById('categorySidebar');
        if (!container) return;
        if (categories.length === 0) {
            container.innerHTML = '<li class="list-group-item">No categories</li>';
            return;
        }
        container.innerHTML = categories.map(cat => `
            <li class="list-group-item">
                <a href="#/category/${cat.slug}">${cat.name}</a>
            </li>
        `).join('');
    } catch (err) {
        console.error('Failed to load categories sidebar:', err);
        const container = document.getElementById('categorySidebar');
        if (container) container.innerHTML = '<li class="list-group-item text-danger">Failed to load categories</li>';
    }
}

// Blog List
window.loadBlogList = async function() {
    const container = document.getElementById('blogListContainer');
    if (!container) return;
    try {
        // 👇 Parse page from hash (e.g., #/blogs?page=1)
        const hash = window.location.hash;
        const queryString = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(queryString);
        const page = parseInt(params.get('page')) || 0;

        const data = await api.getPosts(page, 10);
        const posts = data.content || [];
        if (posts.length === 0 && page === 0) {
            container.innerHTML = '<p class="text-muted">No posts yet.</p>';
        } else if (posts.length === 0) {
            container.innerHTML = '<p class="text-muted">No more posts.</p>';
        } else {
            container.innerHTML = posts.map(post => `
                <div class="card mb-3">
                    <div class="card-body">
                        <h3><a href="#/blog/${post.slug}">${post.title}</a></h3>
                        <div class="text-muted small">
                            ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''} by ${AUTHOR_NAME}
                            ${(post.categoryNames || []).map(c => `<span class="badge bg-info ms-1">${c}</span>`).join('')}
                        </div>
                        <p class="card-text mt-2">${post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 200) : ''}...</p>
                        <a href="#/blog/${post.slug}" class="btn btn-sm btn-outline-primary">Read More</a>
                    </div>
                </div>
            `).join('');
        }

        // Pagination
        const pagination = document.getElementById('pagination');
        if (pagination && data.totalPages > 1) {
            let html = '<ul class="pagination justify-content-center">';
            // Previous
            html += `<li class="page-item ${data.first ? 'disabled' : ''}">
                <a class="page-link" href="#/blogs?page=${data.number - 1}">Previous</a>
            </li>`;
            // Page numbers
            for (let i = 0; i < data.totalPages; i++) {
                html += `<li class="page-item ${i === data.number ? 'active' : ''}">
                    <a class="page-link" href="#/blogs?page=${i}">${i+1}</a>
                </li>`;
            }
            // Next
            html += `<li class="page-item ${data.last ? 'disabled' : ''}">
                <a class="page-link" href="#/blogs?page=${data.number + 1}">Next</a>
            </li>`;
            html += '</ul>';
            pagination.innerHTML = html;
        } else if (pagination) {
            pagination.innerHTML = '';
        }

        // Load categories sidebar
        await loadCategoriesSidebar();
    } catch (err) {
        container.innerHTML = '<p class="text-danger">Failed to load posts.</p>';
        console.error(err);
    }
};

// Blog Details
window.loadBlogDetail = async function(slug) {
    const container = document.getElementById('blogDetail');
    if (!container) return;
    try {
        const res = await fetch(`${api.API_BASE}/posts/${slug}`);
        if (!res.ok) throw new Error('Post not found');
        const post = await res.json();
        container.innerHTML = `
            <h1>${post.title}</h1>
            <div class="text-muted mb-3">
                ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''} by ${AUTHOR_NAME}
            </div>
            ${post.coverImage ? `<img src="${post.coverImage}" class="img-fluid mb-4" alt="Cover">` : ''}
            <div>${post.content}</div>
            <div class="mt-3">
                ${(post.categoryNames || []).map(c => `<span class="badge bg-info me-1">${c}</span>`).join('')}
            </div>
        `;
        container.querySelectorAll('a').forEach(link => link.target = '_blank');
        // Init like button
        if (typeof window.initLikeButton === 'function') window.initLikeButton();
    } catch (err) {
        container.innerHTML = '<p class="text-danger">Post not found.</p>';
    }
};

// Blog Detail with like
/* window.initLikeButton = function() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = document.getElementById('likeCount');
    if (!likeBtn) return;
    const postId = likeBtn.dataset.postId;
    // Get initial status
    api.getLikeStatus(postId).then(data => {
        if (data.liked) likeBtn.classList.add('liked');
        likeCount.textContent = data.count;
    }).catch(console.error);

    likeBtn.addEventListener('click', function() {
        api.toggleLike(postId).then(data => {
            likeCount.textContent = data.count;
            if (data.liked) {
                this.classList.add('liked');
            } else {
                this.classList.remove('liked');
            }
        }).catch(console.error);
    });
}; */

// Search
window.loadSearchResults = async function(query) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    if (!query) {
        container.innerHTML = '<p>Please enter a search term.</p>';
        return;
    }
    try {
        const res = await fetch(`${api.API_BASE}/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const results = data.content || [];
        if (results.length === 0) {
            container.innerHTML = `<p>No results for "${query}".</p>`;
            return;
        }
        container.innerHTML = results.map(post => `
            <div class="card mb-2">
                <div class="card-body">
                    <h5><a href="#/blog/${post.slug}">${post.title}</a></h5>
                    <p>${post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 100) : ''}...</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p class="text-danger">Search failed.</p>';
    }
};

// Category
window.loadCategory = async function(slug) {
    const container = document.getElementById('categoryPosts');
    if (!container) return;
    try {
        // Fetch category details (to get the actual name)
        const category = await api.getCategoryBySlug(slug);
        document.getElementById('categoryTitle').textContent = `Category: ${category.name}`;

        // Use the API module to fetch posts by category
        const data = await api.getPostsByCategory(slug);
        const posts = data.content || [];
        if (posts.length === 0) {
            container.innerHTML = '<p>No posts in this category.</p>';
            return;
        }
        container.innerHTML = posts.map(post => `
            <div class="card mb-2">
                <div class="card-body">
                    <h5><a href="#/blog/${post.slug}">${post.title}</a></h5>
                    <small class="text-muted">${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</small>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading category:', err);
        container.innerHTML = '<p class="text-danger">Failed to load category posts.</p>';
    }
};

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', function() {
    // Render header/footer
    document.getElementById('header').innerHTML = renderHeader();
    document.getElementById('footer').innerHTML = renderFooter();

    // --- Theme Toggle Functions ---
    function applyTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (savedTheme === 'light') {
            document.body.classList.remove('dark-mode');
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-mode');
            }
            // Force light mode as default (no system check)
            //document.body.classList.remove('dark-mode');
        }
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        const icon = toggle.querySelector('i');
        if (!icon) return;
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        updateThemeIcon();
    }

    // Apply saved theme (or system preference)
    applyTheme();

    // Event delegation for theme toggle (works even when header is re-rendered)
    document.addEventListener('click', function(e) {
        const toggle = e.target.closest('#themeToggle');
        if (toggle) {
            e.preventDefault();
            toggleTheme();
        }
    });

    // Logout
    document.addEventListener('click', function(e) {
        if (e.target.id === 'logoutBtn') {
            e.preventDefault();
            logout();
        }
    });

    // Search form submission – delegated event
    document.addEventListener('submit', function(e) {
        const form = e.target.closest('#searchForm');
        if (!form) return;
        e.preventDefault();
        const input = form.querySelector('#searchInput');
        const query = input ? input.value : '';
        if (query.trim()) {
            window.location.hash = `#/search?q=${encodeURIComponent(query.trim())}`;
        }
    });

    function highlightNav() {
        const currentPath = window.location.hash.slice(1) || '/';
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Update theme icon when hash changes (header re-rendered)
    window.addEventListener('hashchange', function() {
        // Re-render header
        document.getElementById('header').innerHTML = renderHeader();
        updateThemeIcon(); // ← ensure the toggle icon matches current theme
        highlightNav();
    });

    // Init router
    initRouter();
    
    // Initial highlight
    highlightNav();
});