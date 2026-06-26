// js/auth.js
import { API_BASE } from './api.js';

export async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Invalid credentials' }));
        throw new Error(err.message || 'Invalid credentials');
    }
    const data = await res.json();
    localStorage.setItem('jwtToken', data.token);
    //Landing page after login
    window.location.hash = '#/admin/dashboard';
    //window.location.hash = '#/admin/posts';
    // Force page reload to re-render header with admin menu
    window.location.reload();
    return data;
}

export function logout() {
    localStorage.removeItem('jwtToken');
    window.location.hash = '#/';
    window.location.reload();
}

export function getToken() {
    return localStorage.getItem('jwtToken');
}

export function isAuthenticated() {
    return !!getToken();
}