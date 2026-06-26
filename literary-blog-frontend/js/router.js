// js/router.js
import { renderHeader, renderFooter } from './main.js';

const pagesPath = 'pages/';

const routes = {
    '/': `${pagesPath}home.html`,
    '/blogs': `${pagesPath}blog-list.html`,
    '/blog/:slug': `${pagesPath}blog-detail.html`,
    '/category/:slug': `${pagesPath}category.html`,
    '/search': `${pagesPath}search.html`,
    '/about': `${pagesPath}about.html`,
    '/contact': `${pagesPath}contact.html`,
    '/admin/login': `${pagesPath}admin-login.html`,
    '/admin/dashboard': `${pagesPath}admin-dashboard.html`,
    '/admin/posts': `${pagesPath}admin-posts.html`,
    '/admin/posts/create': `${pagesPath}admin-post-form.html`,
    '/admin/posts/edit/:id': `${pagesPath}admin-post-form.html`,
    '/admin/categories': `${pagesPath}admin-categories.html`
};

export function initRouter() {
    window.addEventListener('hashchange', loadPage);
    loadPage();
}

function loadPage() {
    const fullHash = window.location.hash.slice(1) || '/';
    const [path, queryString] = fullHash.split('?');
    const pageFile = matchRoute(path);
    if (pageFile) {
        fetch(pageFile)
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('pageContent');
                container.innerHTML = html;

                // --- Execute all <script> tags inside the fragment ---
                const scripts = container.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    // Copy all attributes (type, src, etc.)
                    for (let i = 0; i < oldScript.attributes.length; i++) {
                        const attr = oldScript.attributes[i];
                        newScript.setAttribute(attr.name, attr.value);
                    }
                    // Copy the script content (for inline scripts)
                    newScript.textContent = oldScript.textContent;
                    // Replace the old script with the new one to execute it
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

                // Now execute page-specific scripts (like loading data)
                executePageScripts(path, queryString);
                highlightNav();
            })
            .catch(err => {
                document.getElementById('pageContent').innerHTML = '<h1>404 Page Not Found</h1>';
                console.error(err);
            });
    } else {
        document.getElementById('pageContent').innerHTML = '<h1>404 Page Not Found</h1>';
    }
}

function matchRoute(path) {
    // Exact match
    if (routes[path]) return routes[path];
    // Dynamic
    for (let key of Object.keys(routes)) {
        const pattern = key.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp('^' + pattern + '$');
        if (regex.test(path)) {
            return routes[key];
        }
    }
    return null;
}

function executePageScripts(path, queryString) {
    // Extract slug from path for blog detail and category
    let slug = null;
    if (path.startsWith('/blog/')) {
        slug = path.split('/')[2];
        if (typeof window.loadBlogDetail === 'function') {
            window.loadBlogDetail(slug);
        }
    }
    if (path.startsWith('/category/')) {
        slug = path.split('/')[2];
        if (typeof window.loadCategory === 'function') {
            window.loadCategory(slug);
        }
    }
    if (path === '/') {
        if (typeof window.loadHome === 'function') window.loadHome();
    }
    if (path === '/blogs') {
        if (typeof window.loadBlogList === 'function') window.loadBlogList();
    }
    if (path === '/search') {
        // Extract query from query string
        const params = new URLSearchParams(queryString);
        const q = params.get('q');
        if (typeof window.loadSearchResults === 'function') {
            window.loadSearchResults(q);
        }
    }
    if (path === '/admin/dashboard') {
        if (typeof window.loadDashboard === 'function') {
            window.loadDashboard();
        }
    }
    if (path === '/admin/posts') {
        if (typeof window.loadAdminPosts === 'function') window.loadAdminPosts();
    }
    if (path === '/admin/categories') {
        if (typeof window.loadAdminCategories === 'function') window.loadAdminCategories();
    }
    if (path === '/admin/posts/create' || path.startsWith('/admin/posts/edit/')) {
        if (typeof window.initPostForm === 'function') {
            setTimeout(() => window.initPostForm(), 200);
        }
    }
}

function highlightNav() {
    // can be empty or add active class logic
}