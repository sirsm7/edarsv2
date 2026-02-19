// ==========================================
// EDARS V3.0 - LOGIN MODULE
// Menguruskan autentikasi pengguna dan navigasi halaman utama.
// ==========================================

import { supabaseClient } from './data.js';

// 1. INIT & EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // UI Event Listeners
    setupEventListeners();

    // Auto-Check Session (Jika admin dah login, terus ke dashboard)
    // Ini mengelakkan admin perlu login berulang kali jika refresh page
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        redirectToDashboard('admin');
    }
});

function setupEventListeners() {
    // Butang Akses Awam
    const btnPublic = document.getElementById('btnPublicLogin');
    if (btnPublic) {
        btnPublic.addEventListener('click', handlePublicLogin);
    }

    // Butang Tukar ke Mod Admin
    const btnAdminMode = document.getElementById('btnAdminMode');
    if (btnAdminMode) {
        btnAdminMode.addEventListener('click', showAdminForm);
    }

    // Butang Kembali ke Menu Asal
    const btnBack = document.getElementById('btnBackToRole');
    if (btnBack) {
        btnBack.addEventListener('click', hideAdminForm);
    }

    // Butang Login Admin
    const btnLogin = document.getElementById('btnAdminLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', handleAdminLogin);
    }
    
    // Sokongan butang 'Enter' pada input password
    const passInput = document.getElementById('passwordInput');
    if (passInput) {
        passInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') handleAdminLogin(); 
        });
    }
}

// 2. UI TOGGLES (ANIMASI RINGKAS)
// ==========================================

function showAdminForm() {
    // Sembunyikan pilihan role, tunjuk form login
    const roleSel = document.getElementById('roleSelection');
    const loginForm = document.getElementById('adminLoginForm');
    
    if (roleSel) roleSel.classList.add('hidden');
    if (loginForm) {
        loginForm.classList.remove('hidden');
        // Auto focus pada password/email untuk UX lebih baik
        const passInput = document.getElementById('passwordInput');
        if (passInput) passInput.focus();
    }
}

function hideAdminForm() {
    // Kembali ke menu pilihan role
    const roleSel = document.getElementById('roleSelection');
    const loginForm = document.getElementById('adminLoginForm');
    
    if (loginForm) loginForm.classList.add('hidden');
    if (roleSel) roleSel.classList.remove('hidden');
}

// 3. HANDLERS (LOGIK UTAMA)
// ==========================================

function handlePublicLogin() {
    // Akses awam tak perlu login DB, hanya hantar flag 'mode=public'
    // Dashboard akan baca flag ini untuk sembunyikan fitur admin
    redirectToDashboard('public');
}

async function handleAdminLogin() {
    const emailField = document.getElementById('emailInput');
    const passField = document.getElementById('passwordInput');
    
    const email = emailField ? emailField.value.trim() : '';
    const password = passField ? passField.value.trim() : '';

    if (!email || !password) {
        Swal.fire({ title: 'Ralat', text: 'Sila masukkan Emel dan Kata Laluan.', icon: 'warning' });
        return;
    }

    const btn = document.getElementById('btnAdminLogin');
    const oriText = btn.innerHTML;
    
    // UI Feedback: Loading state
    btn.innerHTML = 'Menyemak...';
    btn.disabled = true;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Jika berjaya
        Swal.fire({
            title: 'Berjaya!',
            text: 'Log masuk diterima. Mengalih ke papan pemuka...',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
        }).then(() => {
            redirectToDashboard('admin');
        });

    } catch (err) {
        console.error("Login Error:", err);
        Swal.fire({ 
            title: 'Gagal Log Masuk', 
            text: 'Emel atau Kata Laluan salah. Sila cuba lagi.', 
            icon: 'error',
            confirmButtonColor: '#d33' 
        });
    } finally {
        // Reset butang
        btn.innerHTML = oriText;
        btn.disabled = false;
    }
}

/**
 * Mengarahkan pengguna ke Dashboard dengan parameter yang betul.
 * @param {string} role - 'admin' atau 'public'
 */
function redirectToDashboard(role) {
    if (role === 'public') {
        window.location.href = 'dashboard.html?mode=public';
    } else {
        window.location.href = 'dashboard.html';
    }
}