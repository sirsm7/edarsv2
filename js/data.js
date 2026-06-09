// ==========================================
// EDARS V3.0 - DATA MODULE (API LAYER)
// Menguruskan hubungan Supabase, CSV Parsing & Data Fetching.
// ==========================================

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { clean, extractSchool, updateLog } from './utils.js';

// 1. INIT SUPABASE CLIENT
// ==========================================
// Kita guna global 'supabase' dari CDN yang dimuatkan di index.html
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export { supabaseClient };

// ==========================================
// 2. CSV PARSING & UPLOAD LOGIC
// ==========================================

/**
 * Membaca fail CSV tempatan dan menukarnya kepada JSON.
 * @param {File} file - Fail CSV yang dimuat naik
 */
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        // PapaParse dimuatkan via CDN (window.Papa)
        Papa.parse(file, { 
            header: false, 
            skipEmptyLines: true, 
            complete: (res) => resolve(res.data), 
            error: reject 
        });
    });
}

/**
 * Memeriksa sama ada fail CSV mempunyai header yang sah.
 * @param {Array} headerRow - Baris pertama CSV
 */
export function validateCSVHeadersSmart(headerRow) {
    const headers = headerRow.map(h => clean(h).toUpperCase());
    
    // Kriteria wajib: Mesti ada Tahun, Nama Exam, dan Kod Sekolah
    const hasYear = headers.includes('TAHUN');
    const hasExam = headers.includes('NAMA PEPERIKSAAN') || headers.includes('AKTIVITI PENTAKSIRAN');
    const hasSchoolCode = headers.some(h => h.includes('KOD SEKOLAH') || h.includes('KOD_SEKOLAH') || h.includes('KOD | SEKOLAH'));
    
    return hasYear && hasExam && hasSchoolCode;
}

/**
 * Memproses data CSV dan memuat naik ke Supabase secara berkelompok (batch).
 * @param {Array} rows - Data mentah CSV
 */
export async function processAndUploadDataSmart(rows) {
    if (!rows || rows.length < 2) return;
    
    const header = rows[0].map(h => clean(h).toUpperCase()); 
    
    // Pemetaan Indeks Lajur (Auto-detect)
    const idxYear = header.indexOf('TAHUN');
    const idxExam = header.indexOf('NAMA PEPERIKSAAN') !== -1 ? header.indexOf('NAMA PEPERIKSAAN') : header.indexOf('AKTIVITI PENTAKSIRAN');
    
    // Cari Lajur Kod Sekolah (Sokong pelbagai format nama)
    const idxSchoolCode = header.findIndex(h => h.includes('KOD SEKOLAH') || h.includes('KOD | SEKOLAH') || h.includes('KOD_SEKOLAH'));
    
    // Cari Lajur Metadata Lain
    const idxID = header.findIndex(h => h.includes('ID INDIVIDU') || h.includes('MYKID'));
    const idxIC = header.findIndex(h => h.includes('NO. KP') || h.includes('KP'));
    const idxName = header.findIndex(h => h.includes('NAMA MURID') || h.includes('NAMA'));
    const idxForm = header.indexOf('TINGKATAN');
    const idxClass = header.findIndex(h => h.includes('KELAS'));
    const idxGender = header.findIndex(h => h.includes('JANTINA'));
    const idxRace = header.findIndex(h => h.includes('KAUM'));
    const idxReligion = header.findIndex(h => h.includes('AGAMA'));

    let batch = [];
    
    // Loop data baris demi baris
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 5) continue; // Skip baris rosak/kosong

        const rawExam = clean(row[idxExam]); 
        const rawYear = clean(row[idxYear]);
        
        if (!rawExam || !rawYear) continue;
        
        // Format Nama Unik: "PPT (2025)"
        const uniqueExamName = `${rawExam} (${rawYear})`;
        const rawSchool = clean(row[idxSchoolCode]);

        // Bina Objek Rekod
        const record = {
            kod_sekolah: rawSchool.split('|')[0].trim(), 
            nama_sekolah: extractSchool(rawSchool),
            id_individu: clean(row[idxID]), 
            no_kp: clean(row[idxIC]), 
            nama_murid: clean(row[idxName]),
            tingkatan: clean(row[idxForm]).toUpperCase(), 
            kelas: clean(row[idxClass]),
            jantina: clean(row[idxGender]), 
            agama: clean(row[idxReligion]), 
            kaum: clean(row[idxRace]),
            nama_peperiksaan: uniqueExamName, 
            markah_data: {} // JSONB column
        };

        const metadataIndices = [idxYear, idxExam, idxSchoolCode, idxID, idxIC, idxName, idxForm, idxClass, idxGender, idxRace, idxReligion];
        
        // Simpan Markah & Gred Subjek ke dalam JSON column
        for (let j = 0; j < header.length; j++) {
            if (!metadataIndices.includes(j)) {
                const colName = header[j];
                const val = clean(row[j]);
                // Simpan hanya jika nama lajur pendek (elak metadata panjang masuk sini)
                if (colName && colName.length < 15) { 
                    record.markah_data[colName] = val;
                }
            }
        }
        
        batch.push(record);
        
        // Batch upload (50 rows per request) untuk prestasi optimum
        if (batch.length >= 50) { 
            const { error } = await supabaseClient
                .from('edars_data')
                // [SURGICAL EDIT START] Tukar ignoreDuplicates ke false untuk paksa kemas kini data sedia ada
                .upsert(batch, { onConflict: 'id_individu, nama_peperiksaan', ignoreDuplicates: false });
                // [SURGICAL EDIT END]
            
            if (error) throw new Error(error.message);
            batch = []; 
        }
    }
    
    // Upload baki batch terakhir
    if (batch.length > 0) {
        const { error } = await supabaseClient
            .from('edars_data')
            // [SURGICAL EDIT START] Tukar ignoreDuplicates ke false untuk paksa kemas kini data sedia ada
            .upsert(batch, { onConflict: 'id_individu, nama_peperiksaan', ignoreDuplicates: false });
            // [SURGICAL EDIT END]
        
        if (error) throw new Error(error.message);
    }
}

// ==========================================
// 3. ADMIN TOOLS
// ==========================================

export async function resetDatabase() {
    try {
        // Ambil senarai peperiksaan sedia ada dalam DB
        const exams = await fetchExamList();

        if (!exams || exams.length === 0) {
            Swal.fire('Info', 'Pangkalan data sudah kosong. Tiada data peperiksaan untuk dipadam.', 'info');
            return;
        }

        // Bina pilihan dropdown untuk SweetAlert
        const examOptions = {};
        exams.forEach(exam => {
            examOptions[exam] = exam;
        });

        // Amaran Tahap 1: Pemilihan Peperiksaan
        const res1 = await Swal.fire({ 
            title: 'PILIH DATA UNTUK DIPADAM', 
            text: "Sila pilih nama peperiksaan yang ingin dipadam dari pangkalan data. Tindakan ini tidak boleh dikembalikan.", 
            icon: 'warning', 
            input: 'select',
            inputOptions: examOptions,
            inputPlaceholder: '-- Sila Pilih Peperiksaan --',
            showCancelButton: true, 
            confirmButtonColor: '#d33', 
            confirmButtonText: 'Seterusnya',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                return new Promise((resolve) => {
                    if (value) resolve();
                    else resolve('Sila pilih satu peperiksaan terlebih dahulu!');
                });
            }
        });

        if (res1.isConfirmed && res1.value) {
            const selectedExam = res1.value;

            // Amaran Tahap 2 (Double Confirmation)
            const res2 = await Swal.fire({ 
                title: 'PENGESAHAN TERAKHIR', 
                html: `Anda pasti mahu memadam <b>KESEMUA REKOD</b> bagi peperiksaan:<br><br><span class="text-red-600 font-bold text-lg">${selectedExam}</span><br><br>Sila taip perkataan <b>PADAM</b> untuk meneruskan.`, 
                input: 'text', 
                inputAttributes: { autocapitalize: 'off' },
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Ya, Padam',
                cancelButtonText: 'Batal',
                preConfirm: (v) => v !== 'PADAM' ? Swal.showValidationMessage('Perkataan salah. Operasi dibatalkan.') : true 
            });

            if (res2.isConfirmed) {
                Swal.showLoading();
                
                // Padam spesifik mengikut nama peperiksaan
                const { error } = await supabaseClient
                    .from('edars_data')
                    .delete()
                    .eq('nama_peperiksaan', selectedExam);
                
                if (!error) {
                    Swal.fire('Berjaya', `Data bagi peperiksaan ${selectedExam} telah berjaya dipadam.`, 'success').then(() => location.reload());
                } else {
                    Swal.fire('Ralat', error.message, 'error');
                }
            }
        }
    } catch (err) {
        Swal.fire('Ralat Sistem', err.message, 'error');
    }
}

// ==========================================
// 4. DATA FETCHING SERVICES (GETTERS)
// ==========================================

/**
 * Mendapatkan senarai unik Nama Peperiksaan.
 */
export async function fetchExamList() {
    const { data, error } = await supabaseClient.from('edars_data').select('nama_peperiksaan');
    if (error) throw error;
    // Return unique sorted list
    return [...new Set(data.map(i => i.nama_peperiksaan))].sort();
}

/**
 * Mendapatkan senarai Tingkatan bagi Peperiksaan tertentu.
 */
export async function fetchFormsForExam(examName) {
    const { data, error } = await supabaseClient
        .from('edars_data')
        .select('tingkatan')
        .eq('nama_peperiksaan', examName);
        
    if (error) throw error;
    return [...new Set(data.map(i => i.tingkatan))].sort();
}

/**
 * Mendapatkan senarai Sekolah bagi Peperiksaan & Tingkatan tertentu.
 */
export async function fetchSchoolsForForm(examName, formName) {
    const { data, error } = await supabaseClient
        .from('edars_data')
        .select('nama_sekolah, kod_sekolah') 
        .eq('nama_peperiksaan', examName)
        .eq('tingkatan', formName);

    if (error) throw error;

    // Proses data unik dan susun ikut kod sekolah
    const uniqueSchools = Object.values(
        data.reduce((acc, curr) => {
            if (!acc[curr.nama_sekolah]) acc[curr.nama_sekolah] = curr;
            return acc;
        }, {})
    ).sort((a, b) => {
        return (a.kod_sekolah || "").localeCompare(b.kod_sekolah || "");
    });
    
    return uniqueSchools;
}

/**
 * Mendapatkan data penuh pelajar untuk Analisis.
 * @param {string} exam - Nama Peperiksaan
 * @param {string} form - Tingkatan
 * @param {string} school - Nama Sekolah (atau 'SEMUA')
 */
export async function fetchDataForAnalytics(exam, form, school) {
    let query = supabaseClient
        .from('edars_data')
        .select('*')
        .eq('nama_peperiksaan', exam)
        .eq('tingkatan', form);
    
    if (school !== 'SEMUA') {
        query = query.eq('nama_sekolah', school);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}