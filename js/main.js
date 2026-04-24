// ==========================================
// EDARS V3.0 - MAIN CONTROLLER (SMART FETCH ENABLED)
// Menguruskan aliran kerja aplikasi, event listeners, dan integrasi modul.
// KEMASKINI: Logik "Smart Fetch" dilaksanakan untuk prestasi mudah alih optimum.
// ==========================================

// 1. IMPORT MODUL
import { supabaseClient, fetchExamList, fetchFormsForExam, fetchSchoolsForForm, fetchDataForAnalytics, parseCSV, validateCSVHeadersSmart, processAndUploadDataSmart, resetDatabase } from './data.js';
import * as State from './state.js';
import * as Analytics from './analytics.js';
import * as UI from './ui.js';
import * as Special from './special.js';
import * as Credit from './credit.js';
import { updateLog, exportTableToExcel } from './utils.js';
import { generateAndExportKPI } from './kpi-generator.js'; // IMPORT BARU
// ── SURGICAL EDIT START: Import Kamus & Susunan Subjek ──
import { NAMA_SUBJEK, SUBJECT_PRIORITY } from './config.js';
// ── SURGICAL EDIT END ──

// ==========================================
// 2. INIT & AUTH CHECK
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // Semak Mod Akses (Public vs Admin)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'public') {
        setupPublicView();
    } else {
        // Semak Session Supabase untuk Admin
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'index.html'; 
            return;
        }
        setupAdminView();
    }

    // INIT STATIC DROPDOWNS (KEMASKINI BAHARU)
    // Menjana pilihan statik (Demografi, Komponen, Kredit) secara dinamik dari config.js
    UI.initStaticDropdowns();

    setupEventListeners();
    await loadInitialData();
});

function setupPublicView() {
    const adminControls = document.getElementById('adminControls');
    const adminTools = document.getElementById('adminToolsContainer');
    const btnExit = document.getElementById('btnPublicExit');
    
    if (adminControls) adminControls.classList.add('hidden');
    if (adminTools) adminTools.classList.add('hidden');
    if (btnExit) btnExit.classList.remove('hidden');
}

function setupAdminView() {
    const adminControls = document.getElementById('adminControls');
    const adminTools = document.getElementById('adminToolsContainer');
    const btnExit = document.getElementById('btnPublicExit');

    if (adminControls) adminControls.classList.remove('hidden');
    if (adminTools) adminTools.classList.remove('hidden');
    if (btnExit) btnExit.classList.add('hidden');
}

// ==========================================
// 3. EVENT LISTENERS SETUP
// ==========================================

function setupEventListeners() {
    // A. Navigasi & Admin Tools
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    const btnPublicExit = document.getElementById('btnPublicExit');
    if (btnPublicExit) btnPublicExit.addEventListener('click', () => window.location.href = 'index.html');
    
    const btnResetDB = document.getElementById('btnResetDB');
    if (btnResetDB) btnResetDB.addEventListener('click', resetDatabase);
    
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);

    // B. Filters (Dropdowns)
    document.getElementById('toggleCompare').addEventListener('change', handleModeToggle);
    document.getElementById('examSelect').addEventListener('change', handleExamChange);
    document.getElementById('formSelect').addEventListener('change', handleFormChange);
    document.getElementById('examSelect2').addEventListener('change', handleExam2Change); // Untuk perbandingan

    // C. Butang Tindakan Utama
    document.getElementById('btnAnalisa').addEventListener('click', loadAnalyticsDispatch);
    document.getElementById('btnResetView').addEventListener('click', () => resetDashboardView(true));
    
    // D. Butang Laporan Khas
    const btnSpecial = document.getElementById('btnSpecialReport');
    if (btnSpecial) btnSpecial.addEventListener('click', switchToSpecialReportView);
    
    const btnSelectAll = document.getElementById('btnSelectAll');
    if (btnSelectAll) btnSelectAll.addEventListener('click', () => Special.toggleAllSubjects(true));
    
    const btnDeselectAll = document.getElementById('btnDeselectAll');
    if (btnDeselectAll) btnDeselectAll.addEventListener('click', () => Special.toggleAllSubjects(false));
    
    const btnGenerateSpecial = document.getElementById('btnGenerateSpecial');
    if (btnGenerateSpecial) btnGenerateSpecial.addEventListener('click', handleGenerateSpecialReport);

    // E. Butang Analisa Kredit
    const btnCredit = document.getElementById('btnCreditAnalysis');
    if (btnCredit) btnCredit.addEventListener('click', switchToCreditAnalysisView);

    const btnGenerateCredit = document.getElementById('btnGenerateCredit');
    if (btnGenerateCredit) btnGenerateCredit.addEventListener('click', handleGenerateCreditAnalysis);

    // H. Butang Analisa Subjek Spesifik
    const btnSingleSubject = document.getElementById('btnSingleSubject');
    if (btnSingleSubject) btnSingleSubject.addEventListener('click', switchToSingleSubjectView);

    const btnGenerateSingleSubject = document.getElementById('btnGenerateSingleSubject');
    if (btnGenerateSingleSubject) btnGenerateSingleSubject.addEventListener('click', handleGenerateSingleSubject);

    // F. Setup Export Excel & PDF
    setupExportListeners();
    
    // G. Butang KPI Export (LISTENER BARU)
    const btnKPI = document.getElementById('btnExportKPI');
    if (btnKPI) btnKPI.addEventListener('click', generateAndExportKPI);
}

function setupExportListeners() {
    // Peta ID Butang -> [ID Table, Nama Fail]
    const exportMap = {
        'btnExportAggregate': ['tableAggregate', 'Analisa_LMS_Sekolah'],
        'btnExportSubjectDistrict': ['tableSubjectDistrict', 'Analisa_Subjek_Daerah'],
        'btnExportDistrictTLMS': ['tableDistrictTLMS', 'Senarai_TLMS_Daerah'],
        'btnExportSubject': ['tableSubject', 'Analisa_Subjek'],
        'btnExportTLMS': ['tableTLMS', 'Senarai_TLMS'],
        'btnExportCompSubject': ['tableCompSubject', 'Analisa_Subjek_Komponen'],
        'btnExportCompSchoolMatrix': ['tableCompSchoolMatrix', 'Analisa_Sekolah_Komponen'],
        
        'btnExportCompareSchools': ['tableCompareSchools', 'Perbandingan_GPS_Sekolah'],
        'btnExportCompareSubjects': ['tableCompareSubjects', 'Perbandingan_GPMP_Subjek'],
        'btnExportCompareCompSubjects': ['tableCompareCompSubjects', 'Perbandingan_Subjek_Komponen'],
        'btnExportCompareCompSchools': ['tableCompareCompSchools', 'Perbandingan_Sekolah_Komponen'],
        'btnExportCompareTLMS': ['tableCompareTLMS', 'Perbandingan_TLMS_Sekolah'],
        'btnExportSingleSubject': ['tableSingleSubject', 'Analisa_Subjek_Spesifik']
    };
    
    Object.keys(exportMap).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => exportTableToExcel(...exportMap[btnId]));
    });

    // Setup Export untuk modul spesifik
    Special.setupSpecialExport('btnExportSpecial');
    Credit.setupCreditExport('btnExportCredit');
    
    // PDF Listeners
    const pdfMap = {
        'btnPdfAggregate': ['tableAggregate', 'Rumusan LMS', 'LMS_Sekolah'],
        'btnPdfSubjectDistrict': ['tableSubjectDistrict', 'Analisa Subjek', 'Subjek_Daerah'],
        'btnPdfDistrictTLMS': ['tableDistrictTLMS', 'Senarai TLMS', 'TLMS_Daerah'],
        'btnPdfSubject': ['tableSubject', 'Analisa Subjek', 'Subjek_Sekolah'],
        'btnPdfTLMS': ['tableTLMS', 'Senarai TLMS', 'Murid_TLMS'],
        'btnPdfCompSubject': ['tableCompSubject', 'Analisa Komponen', 'Komponen_Subjek'],
        'btnPdfCompSchoolMatrix': ['tableCompSchoolMatrix', 'Pencapaian Sekolah', 'Komponen_Sekolah'],
        
        'btnPdfCompareSchools': ['tableCompareSchools', 'Banding GPS', 'Compare_GPS'],
        'btnPdfCompareSubjects': ['tableCompareSubjects', 'Banding GPMP', 'Compare_GPMP'],
        'btnPdfCompareCompSubjects': ['tableCompareCompSubjects', 'Banding Komponen', 'Compare_Subjek'],
        'btnPdfCompareCompSchools': ['tableCompareCompSchools', 'Banding GPK', 'Compare_GPK'],
        'btnPdfCompareTLMS': ['tableCompareTLMS', 'Banding TLMS', 'Compare_TLMS'],
        'btnPdfSpecial': ['tableSpecial', 'Laporan Khas', 'Laporan_Khas'],
        'btnPdfCredit': ['tableCreditAnalysis', 'Analisa Kredit', 'Analisa_Kredit'],
        'btnPdfSingleSubject': ['tableSingleSubject', 'Analisa Subjek', 'Analisa_Subjek_Spesifik']
    };

    Object.keys(pdfMap).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn && window.exportTableToPDF) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => window.exportTableToPDF(...pdfMap[btnId]));
        }
    });
}

// ==========================================
// 4. UI LOGIC (VIEW CONTROLLERS)
// ==========================================

function handleModeToggle() {
    const isCompare = document.getElementById('toggleCompare').checked;
    State.setFilter('isCompareMode', isCompare);

    const divExam2 = document.getElementById('divExam2');
    const lblExam1 = document.getElementById('lblExam1');
    const exam2Sel = document.getElementById('examSelect2');
    const form2Sel = document.getElementById('formSelect2');

    if (isCompare) {
        divExam2.classList.remove('hidden');
        lblExam1.innerText = "1. Peperiksaan (Utama)";
        if (exam2Sel.options.length <= 1) {
            const exam1Opts = document.getElementById('examSelect').innerHTML;
            exam2Sel.innerHTML = exam1Opts;
        }
    } else {
        divExam2.classList.add('hidden');
        lblExam1.innerText = "1. Peperiksaan";
        exam2Sel.value = ""; 
        form2Sel.value = ""; 
        State.setComparisonData([]); 
    }
    hideAllViews();
}

function hideAllViews() {
    ['viewAggregate', 'viewSchoolDetail', 'viewComponent', 'viewComparison', 'viewSpecialReport', 'viewCreditAnalysis', 'viewSingleSubject'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const kpi = document.getElementById('kpiSection');
    if (kpi) {
        kpi.classList.add('hidden');
        kpi.classList.remove('grid'); 
    }
}

function switchToSpecialReportView() {
    hideAllViews();
    document.getElementById('viewSpecialReport').classList.remove('hidden');
    
    // Checkbox hanya di-render jika data wujud
    if (State.hasData()) {
        const subjects = extractSubjectsFromData(State.getMainData());
        Special.renderSubjectCheckboxes(subjects);
    } else {
        Swal.fire('Info', 'Sila tekan butang "Jana Analisa" dahulu untuk memuatkan data.', 'info');
    }
}

function switchToCreditAnalysisView() {
    hideAllViews();
    document.getElementById('viewCreditAnalysis').classList.remove('hidden');

    if (!State.hasData()) {
        Swal.fire('Info', 'Sila tekan butang "Jana Analisa" dahulu untuk memuatkan data.', 'info');
    }
}

function switchToSingleSubjectView() {
    hideAllViews();
    document.getElementById('viewSingleSubject').classList.remove('hidden');

    if (State.hasData()) {
        const subjects = extractSubjectsFromData(State.getMainData());
        const selectEl = document.getElementById('selectSingleSubjectOption');
        selectEl.innerHTML = '';
        
        // Algoritma Susunan Pintar (Mengutamakan Subjek Teras)
        const sortedSubjects = subjects.sort((a, b) => {
            const idxA = SUBJECT_PRIORITY.indexOf(a);
            const idxB = SUBJECT_PRIORITY.indexOf(b);
            const weightA = idxA === -1 ? 999 : idxA;
            const weightB = idxB === -1 ? 999 : idxB;
            
            if (weightA !== weightB) return weightA - weightB;
            return a.localeCompare(b);
        });

        // Pemetaan Label (UX) dengan mengekalkan nilai asal kod (Value)
        sortedSubjects.forEach(sub => {
            const fullName = NAMA_SUBJEK[sub] || sub;
            const label = fullName !== sub ? `${sub} - ${fullName}` : sub;
            selectEl.add(new Option(label, sub));
        });
    } else {
        Swal.fire('Info', 'Sila tekan butang "Jana Analisa" dahulu untuk memuatkan data.', 'info');
    }
}

function resetDashboardView(fullReset = false) {
    hideAllViews();

    if (fullReset) {
        State.resetState();
        
        document.getElementById('examSelect').selectedIndex = 0; 
        document.getElementById('examSelect2').selectedIndex = 0;
        
        const formSel = document.getElementById('formSelect');
        formSel.innerHTML = '<option value="">-- Pilih Exam --</option>';
        formSel.disabled = true;

        const formSel2 = document.getElementById('formSelect2');
        formSel2.innerHTML = '<option value="">-- Pilih Exam 2 --</option>';
        formSel2.disabled = true;
        
        const schoolSel = document.getElementById('schoolSelect');
        schoolSel.innerHTML = '<option value="SEMUA">SEMUA SEKOLAH (DAERAH)</option>';
        schoolSel.disabled = true;
        
        document.getElementById('demogSelect').value = 'ALL';
        document.getElementById('componentSelect').value = 'NONE';
        
        document.getElementById('toggleCompare').checked = false;
        handleModeToggle(); 
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Paparan diset semula',
            showConfirmButton: false,
            timer: 1500
        });
    }
    document.getElementById('btnAnalisa').disabled = true;
}

// ==========================================
// 5. DATA HANDLING & HANDLERS
// ==========================================

async function loadInitialData() {
    try {
        const exams = await fetchExamList();
        const sel = document.getElementById('examSelect');
        const sel2 = document.getElementById('examSelect2');
        
        sel.innerHTML = '<option value="">-- Sila Pilih --</option>';
        sel2.innerHTML = '<option value="">-- Pilih Base Line --</option>';
        
        exams.forEach(e => {
            sel.add(new Option(e, e));
            sel2.add(new Option(e, e));
        });
    } catch (err) {
        console.error("Fail loading initial data", err);
    }
}

async function handleExamChange() {
    const exam = this.value;
    State.setFilter('exam1', exam);
    State.setMainData([]); // Clear data lama
    
    const formSel = document.getElementById('formSelect');
    formSel.innerHTML = '<option value="">Memuatkan...</option>';
    formSel.disabled = true;
    
    if (!exam) return;
    
    const forms = await fetchFormsForExam(exam);
    formSel.innerHTML = '<option value="">-- Pilih Tingkatan --</option>';
    forms.forEach(f => formSel.add(new Option(f, f)));
    formSel.disabled = false;
}

async function handleExam2Change() {
    const exam = this.value;
    State.setFilter('exam2', exam);
    State.setComparisonData([]); // Clear data lama
    
    const formSel2 = document.getElementById('formSelect2');
    formSel2.innerHTML = '<option value="">Memuatkan...</option>';
    formSel2.disabled = true;
    
    if (!exam) return;
    
    const forms = await fetchFormsForExam(exam);
    formSel2.innerHTML = '<option value="">-- Pilih Tingkatan --</option>';
    forms.forEach(f => formSel2.add(new Option(f, f)));
    formSel2.disabled = false;
}

async function handleFormChange() {
    const exam = document.getElementById('examSelect').value;
    const form = this.value;
    State.setFilter('form1', form);
    
    // SMART FETCH: Kosongkan data lama untuk paksa 'Jana Analisa'
    State.setMainData([]); 

    const schoolSelect = document.getElementById('schoolSelect');
    
    if (!form) return;
    schoolSelect.innerHTML = '<option value="">Memuatkan...</option>';
    
    // Muat turun HANYA senarai sekolah (Ringan)
    const schools = await fetchSchoolsForForm(exam, form);
    schoolSelect.innerHTML = '<option value="SEMUA">SEMUA SEKOLAH (DAERAH)</option>';
    schools.forEach(s => schoolSelect.add(new Option(s.nama_sekolah, s.nama_sekolah)));
    schoolSelect.disabled = false;
    document.getElementById('btnAnalisa').disabled = false;

    // NOTA: 'Silent Load' telah DIBUANG untuk mengelakkan bottleneck di mobile.
    // Data sebenar hanya akan diambil apabila butang 'Jana Analisa' ditekan.
}

function extractSubjectsFromData(data) {
    const subSet = new Set();
    data.forEach(s => {
        if (s.markah_data) {
            Object.keys(s.markah_data).forEach(k => {
                if (k.startsWith('G') || k.startsWith('GRED')) {
                    const kod = k.replace(/^G_?|RED /g, '').trim();
                    // ── SURGICAL EDIT START: Penapisan Mutlak Subjek ──
                    // Hanya subjek dalam whitelist DAN mempunyai rekod markah/gred sah sahaja diserap
                    if (kod && NAMA_SUBJEK.hasOwnProperty(kod)) {
                        const val = s.markah_data[k];
                        if (val !== undefined && val !== null && val.toString().trim() !== '') {
                            subSet.add(kod);
                        }
                    }
                    // ── SURGICAL EDIT END ──
                }
            });
        }
    });
    return Array.from(subSet).sort();
}

async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    
    const container = document.getElementById('uploadProgressContainer');
    if (container) container.classList.remove('hidden');
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            updateLog(`📂 Membaca: ${file.name}...`);
            const rows = await parseCSV(file);
            
            if (rows.length > 0 && validateCSVHeadersSmart(rows[0])) {
                await processAndUploadDataSmart(rows); 
                updateLog(`✅ Selesai: ${file.name}`, 'text-green-600 font-bold');
            } else {
                updateLog(`❌ Ralat Format: ${file.name}. Header salah/tidak lengkap.`, 'text-red-600 font-bold');
            }
        } catch (err) { 
            console.error(err); 
            updateLog(`❌ Ralat Sistem: ${file.name} - ${err.message}`, 'text-red-600'); 
        }
        
        const percent = Math.round(((i + 1) / files.length) * 100);
        const progBar = document.getElementById('progressBar');
        const progText = document.getElementById('progressText');
        if (progBar) progBar.style.width = `${percent}%`;
        if (progText) progText.innerText = `${percent}%`;
    }
    
    await Swal.fire({ title: 'Proses Tamat', text: 'Semua fail telah diproses.', icon: 'success', });
    loadInitialData();
    e.target.value = '';
}

// ==========================================
// 6. ANALYTICS EXECUTION (SMART FETCH IMPLEMENTATION)
// ==========================================

function loadAnalyticsDispatch() {
    const isCompare = document.getElementById('toggleCompare').checked;
    if (isCompare) {
        loadComparisonAnalytics();
    } else {
        loadSingleAnalytics();
    }
}

async function loadSingleAnalytics() {
    const exam = document.getElementById('examSelect').value;
    const form = document.getElementById('formSelect').value;
    const school = document.getElementById('schoolSelect').value;
    const demog = document.getElementById('demogSelect').value;
    const comp = document.getElementById('componentSelect').value;

    if (!exam || !form) return;
    Swal.fire({ title: 'Sedang Menganalisa...', didOpen: () => Swal.showLoading() });

    try {
        // SMART FETCH: Sentiasa ambil data baru berdasarkan filter sekolah SEMASA.
        // Jika pilih sekolah, ambil data sekolah itu sahaja. Jika SEMUA, ambil semua.
        // Ini mengurangkan saiz muat turun sebanyak 95% untuk analisis sekolah individu.
        let rawData = await fetchDataForAnalytics(exam, form, school);
        State.setMainData(rawData);
        
        // Tapis Data (Demografi)
        let filteredData = rawData;
        
        // Filter sekolah 'SEMUA' masih perlu dilakukan di klien jika rawData mengandungi semua sekolah
        // Tetapi jika DB dah filter (school !== 'SEMUA'), baris ini redundant tapi selamat.
        if (school !== 'SEMUA') filteredData = filteredData.filter(s => s.nama_sekolah === school);
        
        filteredData = filteredData.filter(s => Analytics.filterDemography(s, demog));
        
        if (filteredData.length === 0) { 
            Swal.fire('Tiada Data', 'Tiada rekod ditemui untuk kriteria ini.', 'info'); 
            return; 
        }

        // Render UI
        hideAllViews();
        const kpi = document.getElementById('kpiSection');
        if (kpi) {
            kpi.classList.remove('hidden'); 
            kpi.classList.add('grid');
        }

        if (comp !== 'NONE') {
            document.getElementById('viewComponent').classList.remove('hidden');
            const lbl = document.getElementById('labelGP');
            if (lbl) lbl.innerText = `GP (${comp})`;
            
            const analyticsResult = Analytics.calculateComponentData(filteredData, comp);
            UI.renderComponentTable(analyticsResult);
        } else if (school === 'SEMUA') {
            document.getElementById('viewAggregate').classList.remove('hidden');
            const lbl = document.getElementById('labelGP');
            if (lbl) lbl.innerText = "Gred Purata Daerah (GPD)";
            
            const analyticsResult = Analytics.calculateAggregateData(filteredData);
            UI.renderAggregateTable(analyticsResult);
        } else {
            document.getElementById('viewSchoolDetail').classList.remove('hidden');
            const lbl = document.getElementById('labelGP');
            if (lbl) lbl.innerText = "Gred Purata Sekolah (GPS)";
            
            const analyticsResult = Analytics.calculateSchoolDetailData(filteredData);
            UI.renderSchoolDetailTable(analyticsResult);
        }
        Swal.close();

    } catch (err) {
        console.error(err);
        Swal.fire('Ralat', err.message, 'error');
    }
}

async function loadComparisonAnalytics() {
    const exam1 = document.getElementById('examSelect').value;
    const exam2 = document.getElementById('examSelect2').value;
    const form1 = document.getElementById('formSelect').value;
    const form2 = document.getElementById('formSelect2').value;
    const school = document.getElementById('schoolSelect').value;
    const comp = document.getElementById('componentSelect').value;
    const demog = document.getElementById('demogSelect').value;

    if (!exam1 || !exam2 || !form1 || !form2) {
        return Swal.fire('Ralat', 'Sila pilih kedua-dua Peperiksaan dan Tingkatan.', 'warning');
    }
    
    if (exam1 === exam2 && form1 === form2) {
        return Swal.fire('Ralat', 'Sila pilih kombinasi Exam/Tingkatan yang berbeza.', 'warning');
    }

    Swal.fire({ title: 'Sedang Membuat Perbandingan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        // SMART FETCH: Ambil data untuk kedua-dua exam berdasarkan sekolah yang dipilih.
        let [data1, data2] = await Promise.all([
            fetchDataForAnalytics(exam1, form1, school),
            fetchDataForAnalytics(exam2, form2, school)
        ]);
        
        State.setMainData(data1);
        State.setComparisonData(data2);

        const applyFilters = (data) => {
            let res = data;
            if (school !== 'SEMUA') res = res.filter(s => s.nama_sekolah === school);
            res = res.filter(s => Analytics.filterDemography(s, demog));
            return res;
        };

        const filtered1 = applyFilters(data1);
        const filtered2 = applyFilters(data2);
        
        if (filtered1.length === 0 && filtered2.length === 0) { 
            Swal.fire('Tiada Data', 'Tiada data untuk kriteria ini selepas penapisan.', 'info'); 
            return; 
        }

        hideAllViews();
        document.getElementById('viewComparison').classList.remove('hidden');
        
        // --- LOGIK BUTTON KPI EXPORT (BARU) ---
        const btnKPI = document.getElementById('btnExportKPI');
        if (btnKPI) {
            if (school === 'SEMUA') btnKPI.classList.remove('hidden');
            else btnKPI.classList.add('hidden');
        }
        // --------------------------------------

        const compContainer = document.getElementById('comparisonComponentContainer');
        const generalContainer = document.getElementById('comparisonGeneralContainer');

        if (comp !== 'NONE') {
            compContainer.classList.remove('hidden');
            generalContainer.classList.add('hidden');
            const result = Analytics.calculateComparisonComponent(filtered1, filtered2, comp);
            UI.renderComparisonComponentTable(result, { name1: exam1, name2: exam2 });
        } else {
            compContainer.classList.add('hidden');
            generalContainer.classList.remove('hidden');
            const result = Analytics.calculateComparisonGeneral(filtered1, filtered2);
            UI.renderComparisonTables(result, { name1: exam1, name2: exam2 });
        }

        Swal.close();

    } catch (err) {
        console.error(err);
        Swal.fire('Ralat', 'Gagal memproses perbandingan.', 'error');
    }
}

// ==========================================
// 7. REPORT HANDLERS (SPECIAL & CREDIT)
// ==========================================

async function handleGenerateSpecialReport() {
    if (!State.hasData()) {
        Swal.fire('Ralat', 'Sila tekan butang "Jana Analisa" dahulu untuk memuatkan data.', 'warning');
        return;
    }

    const selectedCheckboxes = document.querySelectorAll('input[name="chkSubject"]:checked');
    if (selectedCheckboxes.length === 0) {
        Swal.fire('Peringatan', 'Sila pilih sekurang-kurangnya SATU subjek.', 'info');
        return;
    }
    const selectedSubjects = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    const modeEl = document.querySelector('input[name="specialType"]:checked');
    const mode = modeEl ? modeEl.value : 'TH';
    
    const school = document.getElementById('schoolSelect').value;
    const demog = document.getElementById('demogSelect').value;
    const isCompare = document.getElementById('toggleCompare').checked;
    
    let filteredData = State.getMainData();
    if (school !== 'SEMUA') filteredData = filteredData.filter(s => s.nama_sekolah === school);
    filteredData = filteredData.filter(s => Analytics.filterDemography(s, demog));

    if (filteredData.length === 0) {
        Swal.fire('Tiada Data', 'Tiada calon ditemui untuk kriteria Sekolah/Demografi ini.', 'info');
        return;
    }

    let comparisonData = [];
    if (isCompare) {
        if (!State.getComparisonData().length) {
            Swal.fire('Info', 'Data perbandingan tidak dimuatkan. Sila jana analisa perbandingan dahulu.', 'warning');
            return;
        }
        comparisonData = State.getComparisonData();
    }

    Swal.fire({ title: 'Menjana Laporan...', didOpen: () => Swal.showLoading() });
    
    setTimeout(() => {
        const results = Special.generateSpecialReportData(filteredData, selectedSubjects, mode, comparisonData);
        
        if (results.length === 0) {
            Swal.fire('Bersih', `Tiada calon ditemui untuk isu ${mode} dalam subjek yang dipilih.`, 'success');
            document.getElementById('specialResultContainer').classList.add('hidden');
        } else {
            // FIX: Hantar parameter boolean untuk kawal paparan kolum sekolah
            const showSchool = (school === 'SEMUA');
            Special.renderSpecialTable(results, mode, isCompare, showSchool);
            
            // Kod lama yang manipulasi DOM secara manual dibuang
            // Kerana logik renderSpecialTable yang baru sudah menguruskannya
            
            Swal.close();
        }
    }, 300);
}

async function handleGenerateCreditAnalysis() {
    if (!State.hasData()) {
        Swal.fire('Ralat', 'Sila tekan butang "Jana Analisa" dahulu untuk memuatkan data.', 'warning');
        return;
    }

    const selectedSubject = document.getElementById('selectCreditSubject').value;
    const school = document.getElementById('schoolSelect').value;
    const demog = document.getElementById('demogSelect').value;
    const isCompare = document.getElementById('toggleCompare').checked;

    let filteredData1 = State.getMainData();
    if (school !== 'SEMUA') filteredData1 = filteredData1.filter(s => s.nama_sekolah === school);
    filteredData1 = filteredData1.filter(s => Analytics.filterDemography(s, demog));

    if (filteredData1.length === 0) {
        Swal.fire('Tiada Data', 'Tiada calon untuk kriteria Sekolah/Demografi ini.', 'info');
        return;
    }

    let filteredData2 = [];
    if (isCompare) {
        let raw2 = State.getComparisonData();
        // Fallback: Jika data kosong, cuba fetch (tapi idealnya user patut tekan Jana Analisa dulu)
        if (raw2.length === 0) {
            const exam2 = document.getElementById('examSelect2').value;
            const form2 = document.getElementById('formSelect2').value;
            if (exam2 && form2) {
                 // Smart Fetch fallback
                 raw2 = await fetchDataForAnalytics(exam2, form2, school);
                 State.setComparisonData(raw2);
            } else {
                Swal.fire('Ralat', 'Data perbandingan hilang. Sila tekan "Jana Analisa" semula.', 'error');
                return;
            }
        }
        filteredData2 = raw2;
        if (school !== 'SEMUA') filteredData2 = filteredData2.filter(s => s.nama_sekolah === school);
        filteredData2 = filteredData2.filter(s => Analytics.filterDemography(s, demog));
    }

    Swal.fire({ title: 'Menjana Analisa Kredit...', didOpen: () => Swal.showLoading() });

    setTimeout(() => {
        const stats1 = Credit.calculateCreditAnalysis(filteredData1, selectedSubject);
        const stats2 = isCompare ? Credit.calculateCreditAnalysis(filteredData2, selectedSubject) : null;

        Credit.renderCreditAnalysisTable(stats1, stats2, isCompare, selectedSubject);

        const subNameEl = document.getElementById('selectCreditSubject');
        const subName = subNameEl.options[subNameEl.selectedIndex].text;
        
        document.getElementById('creditReportTitle').innerText = `ANALISA PENCAPAIAN KREDIT: ${subName}`;
        document.getElementById('creditReportSubtitle').innerText = isCompare 
            ? `Perbandingan antara ${document.getElementById('examSelect').value} vs ${document.getElementById('examSelect2').value}`
            : `Peperiksaan: ${document.getElementById('examSelect').value}`;
            
        document.getElementById('creditResultContainer').classList.remove('hidden');
        document.getElementById('creditResultContainer').scrollIntoView({ behavior: 'smooth' });

        Swal.close();
    }, 500);
}

async function handleGenerateSingleSubject() {
    if (!State.hasData()) {
        Swal.fire('Ralat', 'Sila tekan butang "Jana Analisa" dahulu untuk memuatkan data.', 'warning');
        return;
    }

    const selectedSubject = document.getElementById('selectSingleSubjectOption').value;
    const school = document.getElementById('schoolSelect').value;
    const demog = document.getElementById('demogSelect').value;
    const isCompare = document.getElementById('toggleCompare').checked;

    if (!selectedSubject) {
        Swal.fire('Peringatan', 'Sila pilih satu mata pelajaran.', 'info');
        return;
    }

    let filteredData1 = State.getMainData();
    if (school !== 'SEMUA') filteredData1 = filteredData1.filter(s => s.nama_sekolah === school);
    filteredData1 = filteredData1.filter(s => Analytics.filterDemography(s, demog));

    if (filteredData1.length === 0) {
        Swal.fire('Tiada Data', 'Tiada calon untuk kriteria Sekolah/Demografi ini.', 'info');
        return;
    }

    let filteredData2 = [];
    if (isCompare) {
        let raw2 = State.getComparisonData();
        if (raw2.length === 0) {
            const exam2 = document.getElementById('examSelect2').value;
            const form2 = document.getElementById('formSelect2').value;
            if (exam2 && form2) {
                 raw2 = await fetchDataForAnalytics(exam2, form2, school);
                 State.setComparisonData(raw2);
            } else {
                Swal.fire('Ralat', 'Data perbandingan hilang. Sila tekan "Jana Analisa" semula.', 'error');
                return;
            }
        }
        filteredData2 = raw2;
        if (school !== 'SEMUA') filteredData2 = filteredData2.filter(s => s.nama_sekolah === school);
        filteredData2 = filteredData2.filter(s => Analytics.filterDemography(s, demog));
    }

    Swal.fire({ title: 'Menjana Analisa Subjek...', didOpen: () => Swal.showLoading() });

    setTimeout(() => {
        // Panggil fungsi penjanaan dari modul Analytics
        const result = Analytics.calculateSingleSubjectMatrix(filteredData1, filteredData2, isCompare, selectedSubject);
        
        // Panggil fungsi paparan dari modul UI
        UI.renderSingleSubjectTable(result, isCompare, selectedSubject);

        // ── SURGICAL EDIT START: Papar Nama Penuh Subjek pada Tajuk Jadual ──
        const fullSubjectName = NAMA_SUBJEK[selectedSubject] || selectedSubject;
        document.getElementById('singleSubjectReportTitle').innerText = `ANALISA PENCAPAIAN SUBJEK: ${fullSubjectName}`;
        // ── SURGICAL EDIT END ──
        
        document.getElementById('singleSubjectReportSubtitle').innerText = isCompare 
            ? `Perbandingan antara ${document.getElementById('examSelect').value} vs ${document.getElementById('examSelect2').value}`
            : `Peperiksaan: ${document.getElementById('examSelect').value}`;
            
        document.getElementById('singleSubjectResultContainer').classList.remove('hidden');
        document.getElementById('singleSubjectResultContainer').scrollIntoView({ behavior: 'smooth' });

        Swal.close();
    }, 500);
}