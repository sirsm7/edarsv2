// ==========================================
// EDARS V3.0 - STATE MANAGEMENT MODULE
// Modul ini bertindak sebagai 'Single Source of Truth' untuk data aplikasi.
// Menggantikan penggunaan global variables dalam main.js.
// ==========================================

// 1. STATE PENYIMPANAN DATA (PRIVATE)
// Data mentah dari DB disimpan di sini. Tidak boleh diakses terus dari luar.
let _currentDataCache = [];      // Data Utama (Exam 1)
let _comparisonDataCache = [];   // Data Perbandingan 1 (Exam 2)
let _comparisonDataCache2 = [];  // [SURGICAL EDIT] Data Perbandingan 2 (Exam 3 - Pilihan)

// 2. STATE KONFIGURASI UI (PRIVATE)
// Menyimpan status pilihan dropdown semasa.
const _uiState = {
    exam1: '',
    form1: '',
    exam2: '',
    form2: '',
    exam3: '', // [SURGICAL EDIT] Tambahan untuk Peperiksaan ke-3
    form3: '', // [SURGICAL EDIT] Tambahan untuk Tingkatan ke-3
    school: 'SEMUA',
    demog: 'ALL',
    component: 'NONE',
    isCompareMode: false
};

// ==========================================
// 3. SETTERS (FUNGSI MENGEMASKINI DATA)
// ==========================================

/**
 * Simpan data utama (Exam 1) ke dalam memori.
 * @param {Array} data - Array objek pelajar
 */
export function setMainData(data) {
    if (Array.isArray(data)) {
        _currentDataCache = [...data]; // Buat salinan (immutable concept)
        console.log(`[State] Data Utama dikemaskini: ${_currentDataCache.length} rekod.`);
    } else {
        console.error('[State] Ralat: Data utama mesti dalam bentuk Array.');
        _currentDataCache = [];
    }
}

/**
 * Simpan data perbandingan pertama (Exam 2) ke dalam memori.
 * @param {Array} data - Array objek pelajar
 */
export function setComparisonData(data) {
    if (Array.isArray(data)) {
        _comparisonDataCache = [...data];
        console.log(`[State] Data Banding 1 dikemaskini: ${_comparisonDataCache.length} rekod.`);
    } else {
        console.error('[State] Ralat: Data banding mesti dalam bentuk Array.');
        _comparisonDataCache = [];
    }
}

/**
 * [SURGICAL EDIT] Simpan data perbandingan kedua (Exam 3) ke dalam memori.
 * @param {Array} data - Array objek pelajar
 */
export function setComparisonData2(data) {
    if (Array.isArray(data)) {
        _comparisonDataCache2 = [...data];
        console.log(`[State] Data Banding 2 (E3) dikemaskini: ${_comparisonDataCache2.length} rekod.`);
    } else {
        console.error('[State] Ralat: Data banding 2 (E3) mesti dalam bentuk Array.');
        _comparisonDataCache2 = [];
    }
}

/**
 * Kemaskini nilai filter UI.
 * @param {string} key - Kunci filter (cth: 'school', 'demog')
 * @param {any} value - Nilai baharu
 */
export function setFilter(key, value) {
    if (_uiState.hasOwnProperty(key)) {
        _uiState[key] = value;
    } else {
        console.warn(`[State] Amaran: Kunci filter '${key}' tidak wujud.`);
    }
}

// ==========================================
// 4. GETTERS (FUNGSI MENGAMBIL DATA)
// ==========================================

/**
 * Ambil salinan data utama (E1).
 * @returns {Array} Salinan data utama
 */
export function getMainData() {
    return [..._currentDataCache];
}

/**
 * Ambil salinan data perbandingan (E2).
 * @returns {Array} Salinan data perbandingan
 */
export function getComparisonData() {
    return [..._comparisonDataCache];
}

/**
 * [SURGICAL EDIT] Ambil salinan data perbandingan kedua (E3).
 * @returns {Array} Salinan data perbandingan 2
 */
export function getComparisonData2() {
    return [..._comparisonDataCache2];
}

/**
 * Ambil semua status filter semasa.
 * @returns {Object} Objek salinan state UI
 */
export function getUiState() {
    return { ..._uiState }; // Return shallow copy
}

/**
 * Ambil nilai spesifik filter.
 * @param {string} key 
 */
export function getFilter(key) {
    return _uiState[key];
}

// ==========================================
// 5. UTILITIES (RESET & CLEAR)
// ==========================================

/**
 * Kosongkan semua data dan reset filter ke nilai asal.
 * Digunakan apabila pengguna menekan butang 'Reset Paparan'.
 */
export function resetState() {
    _currentDataCache = [];
    _comparisonDataCache = [];
    _comparisonDataCache2 = []; // [SURGICAL EDIT] Kosongkan cache E3
    
    // Reset UI State ke default
    _uiState.exam1 = '';
    _uiState.form1 = '';
    _uiState.exam2 = '';
    _uiState.form2 = '';
    _uiState.exam3 = ''; // [SURGICAL EDIT] Reset state E3
    _uiState.form3 = ''; // [SURGICAL EDIT] Reset state form E3
    _uiState.school = 'SEMUA';
    _uiState.demog = 'ALL';
    _uiState.component = 'NONE';
    _uiState.isCompareMode = false;
    
    console.log('[State] Memori telah dikosongkan.');
}

/**
 * Semak adakah data utama wujud.
 */
export function hasData() {
    return _currentDataCache.length > 0;
}