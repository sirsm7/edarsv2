// ==========================================
// EDARS V3.0 - SPECIAL REPORT MODULE (MODERNIZED & FIXED)
// Menguruskan Laporan Diagnostik (TH, Gagal, Kritikal).
// ==========================================

import { getGrade, exportTableToExcel, clean } from './utils.js';
import { NAMA_SUBJEK, SUBJECT_PRIORITY } from './config.js';

// ==========================================
// 1. UI RENDER: SUBJECT CHECKBOXES
// ==========================================

/**
 * Menjana senarai checkbox subjek berdasarkan data yang ada.
 * @param {Array} subjects - Senarai kod subjek
 */
export function renderSubjectCheckboxes(subjects) {
    const container = document.getElementById('subjectCheckboxContainer');
    if (!container) return;

    if (!subjects || subjects.length === 0) {
        container.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center p-8 text-gray-400"><span class="text-2xl mb-2">📭</span><p class="text-sm italic">Tiada subjek ditemui untuk tingkatan ini.</p></div>';
        return;
    }

    // Sort subjek checkbox ikut keutamaan global
    const sortedSubjects = [...subjects].sort((a, b) => {
        const idxA = SUBJECT_PRIORITY.indexOf(a);
        const idxB = SUBJECT_PRIORITY.indexOf(b);
        const weightA = idxA === -1 ? 999 : idxA;
        const weightB = idxB === -1 ? 999 : idxB;
        
        if (weightA !== weightB) return weightA - weightB;
        return a.localeCompare(b);
    });

    container.innerHTML = sortedSubjects.map(subCode => {
        const fullName = NAMA_SUBJEK[subCode] || "";
        const label = fullName ? `<span class="font-bold text-gray-700 w-12 shrink-0">${subCode}</span> <span class="text-gray-500 text-[10px] truncate border-l border-gray-200 pl-2 ml-1 uppercase tracking-wide">${fullName}</span>` : `<span class="font-bold text-gray-700">${subCode}</span>`;
        
        return `
        <label class="group flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer select-none">
            <input type="checkbox" name="chkSubject" value="${subCode}" class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 shrink-0 mr-3">
            <div class="flex items-center w-full overflow-hidden">
                ${label}
            </div>
        </label>
        `;
    }).join('');
}

/**
 * Pilih atau Nyahpilih semua checkbox subjek.
 * @param {boolean} isChecked - Status tick
 */
export function toggleAllSubjects(isChecked) {
    const checkboxes = document.querySelectorAll('input[name="chkSubject"]');
    checkboxes.forEach(cb => cb.checked = isChecked);
}

// ==========================================
// 2. CORE LOGIC: FILTER & COMPARE
// ==========================================

/**
 * Menjana data laporan khas berdasarkan kriteria.
 * @param {Array} students - Data pelajar (E1)
 * @param {Array} selectedSubjects - Subjek yang dipilih user
 * @param {string} mode - Mode tapisan (TH, G, DE, LE10)
 * @param {Array} comparisonStudents - Data pelajar banding (E2) - Optional
 */
export function generateSpecialReportData(students, selectedSubjects, mode, comparisonStudents = []) {
    let results = [];
    
    // Bina Map untuk carian pantas data perbandingan (Exam 2)
    const comparisonMap = new Map();
    if (comparisonStudents && comparisonStudents.length > 0) {
        comparisonStudents.forEach(s => {
            if (s.id_individu) comparisonMap.set(s.id_individu, s);
        });
    }

    students.forEach(s => {
        const marks = s.markah_data || {};
        
        selectedSubjects.forEach(subCode => {
            
            // --- RAW DATA CHECK ---
            const rawKey = Object.keys(marks).find(k => {
                const normalizedKey = k.toUpperCase().replace(/^GRED\s*|^G_?/, '').trim();
                return normalizedKey === subCode;
            });
            
            const rawValue = rawKey ? marks[rawKey] : undefined;
            if (rawValue === undefined || rawValue === null || rawValue === '') return; 

            // Dapatkan gred standard
            const gred = getGrade(marks, subCode);
            let rawMark = marks[subCode] || marks[`${subCode}`] || "-";
            
            // Filter Logic
            let isMatch = false;
            let markVal = parseFloat(rawMark); 

            if (mode === 'TH') {
                isMatch = (gred === 'TH' || gred === 'T');
            } else if (mode === 'G') {
                isMatch = (gred === 'G');
            } else if (mode === 'DE') {
                isMatch = (gred === 'D' || gred === 'E');
            } else if (mode === 'LE10') {
                if (!isNaN(markVal) && markVal <= 10 && gred !== 'TH' && gred !== 'T') {
                    isMatch = true;
                }
            }

            if (isMatch) {
                const fullName = NAMA_SUBJEK[subCode] || subCode;
                let compData = null;

                // LOGIK PERBANDINGAN PINTAR
                if (comparisonMap.size > 0) {
                    const match = comparisonMap.get(s.id_individu);
                    if (match) {
                        const marks2 = match.markah_data || {};
                        const gred2 = getGrade(marks2, subCode);
                        let rawMark2 = marks2[subCode] || marks2[`${subCode}`] || "-";
                        
                        compData = {
                            markah: rawMark2,
                            gred: gred2,
                            status: calculateImprovement(rawMark, gred, rawMark2, gred2)
                        };
                    } else {
                        compData = { markah: '-', gred: '-', status: { type: 'NEW', label: 'BARU' } }; 
                    }
                }

                results.push({
                    nama: s.nama_murid,
                    kelas: s.kelas,
                    sekolah: s.nama_sekolah,
                    subjek: subCode,
                    nama_subjek: fullName,
                    markah: rawMark,
                    gred: gred,
                    comparison: compData 
                });
            }
        });
    });

    results.sort((a, b) => {
        if (a.subjek !== b.subjek) {
             const idxA = SUBJECT_PRIORITY.indexOf(a.subjek);
             const idxB = SUBJECT_PRIORITY.indexOf(b.subjek);
             const weightA = idxA === -1 ? 999 : idxA;
             const weightB = idxB === -1 ? 999 : idxB;
             if (weightA !== weightB) return weightA - weightB;
             return a.subjek.localeCompare(b.subjek);
        }
        if (a.gred !== b.gred) return a.gred.localeCompare(b.gred);
        if (a.sekolah !== b.sekolah) return a.sekolah.localeCompare(b.sekolah);
        return a.nama.localeCompare(b.nama);
    });

    return results;
}

function calculateImprovement(m1, g1, m2, g2) {
    const m2Clean = String(m2).trim();
    const g2Clean = String(g2).trim();

    if (m2Clean === '-' || m2Clean === '' || m2Clean === 'undefined' || m2Clean === 'null') {
         return { type: 'NEW', label: '-' }; 
    }

    if (g1 === 'TH' && g2Clean === 'TH') return { type: 'SAME', val: 0, label: '-' };
    if (g1 === 'TH' && g2Clean !== 'TH') return { type: 'DOWN', val: -1, label: '▼ (Hadir->TH)' }; 
    if (g1 !== 'TH' && g2Clean === 'TH') return { type: 'UP', val: 1, label: '▲ (TH->Hadir)' }; 

    const val1 = parseFloat(m1);
    const val2 = parseFloat(m2Clean);

    if (!isNaN(val1) && !isNaN(val2)) {
        const diff = val1 - val2;
        if (diff > 0) return { type: 'UP', val: diff, label: `▲ +${diff}` };
        if (diff < 0) return { type: 'DOWN', val: diff, label: `▼ ${diff}` };
        return { type: 'SAME', val: 0, label: '-' };
    }

    if (g1 === g2Clean) return { type: 'SAME', val: 0, label: '-' };
    return { type: 'UNKNOWN', val: 0, label: '?' };
}

// ==========================================
// 3. UI RENDER: DYNAMIC TABLE
// ==========================================

export function renderSpecialTable(results, mode, isCompareMode, showSchool = true) {
    const tbody = document.getElementById('tbodySpecial');
    const titleEl = document.getElementById('specialReportTitle');
    const subtitleEl = document.getElementById('specialReportSubtitle');
    const container = document.getElementById('specialResultContainer');
    
    const thead = document.querySelector('#tableSpecial thead'); 

    if (!tbody || !thead) return;

    const safeStr = (val) => {
        if (val === undefined || val === null) return '-';
        const str = String(val).trim();
        if (str === '' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'null') return '-';
        return str;
    };

    const modeNames = {
        'TH': 'SENARAI CALON TIDAK HADIR (TH)',
        'G': 'SENARAI CALON GAGAL (G)',
        'DE': 'SENARAI CALON POTENSI LULUS (GRED D & E)',
        'LE10': 'SENARAI CALON KRITIKAL (MARKAH ≤ 10)'
    };
    titleEl.innerText = modeNames[mode] + (isCompareMode ? " (MOD PERBANDINGAN)" : "");
    const uniqueStudents = new Set(results.map(r => r.nama + r.kelas + r.sekolah)).size;
    subtitleEl.innerText = `DIJUMPAI ${results.length} REKOD ISU MELIBATKAN ${uniqueStudents} ORANG CALON.`;

    container.classList.remove('hidden');

    // Generate Dynamic Header based on showSchool
    let headerHtml = '<tr>';
    headerHtml += '<th class="w-12 text-center">Bil</th>';
    headerHtml += '<th class="text-left">Nama Murid</th>';
    headerHtml += '<th class="text-center w-24">Kelas</th>';
    
    if (showSchool) {
        headerHtml += '<th class="text-left" id="colSpecialSchool">Sekolah</th>';
    }

    if (isCompareMode) {
        headerHtml += '<th class="text-center w-28 bg-blue-50/50 text-blue-800">E1 (Semasa)</th>';
        headerHtml += '<th class="text-center w-28 bg-gray-50/50 text-gray-600">E2 (Asal)</th>';
        headerHtml += '<th class="text-center w-28">Beza</th>';
    } else {
        headerHtml += '<th class="text-center w-24">Markah</th>';
        headerHtml += '<th class="text-center w-20">Gred</th>';
    }
    headerHtml += '</tr>';
    
    thead.innerHTML = headerHtml;

    const getStatusClass = (g) => {
        if (g === 'TH' || g === 'T') return 'bg-pink-100 text-pink-700 border-pink-200';
        if (g === 'G') return 'bg-red-100 text-red-700 border-red-200';
        if (g === 'D' || g === 'E') return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-gray-100 text-gray-600 border-gray-200'; 
    };

    let currentSubject = null;
    let html = '';
    let counter = 1;
    
    // Kira Colspan untuk baris Grouping
    // Asas: Bil(1) + Nama(1) + Kelas(1) = 3
    // Tambahan: Sekolah (1 jika showSchool)
    // Data: Compare(3) atau Single(2)
    const colSpan = 3 + (showSchool ? 1 : 0) + (isCompareMode ? 3 : 2);

    results.forEach((r) => {
        if (r.subjek !== currentSubject) {
            currentSubject = r.subjek;
            const fullSubName = r.nama_subjek;
            
            // Modern Grouping Header
            html += `
                <tr class="bg-purple-50/50">
                    <td colspan="${colSpan}" class="py-4 px-5 text-left">
                        <div class="flex items-center gap-2">
                            <span class="bg-purple-200 text-purple-700 p-1 rounded text-xs">📂</span>
                            <span class="font-bold text-purple-900 font-oswald uppercase tracking-wide text-sm">${r.subjek} - ${fullSubName}</span>
                        </div>
                    </td>
                </tr>
            `;
            counter = 1; 
        }

        html += `<tr class="transition-colors hover:bg-gray-50">`;
        html += `<td class="text-center text-gray-400 font-medium">${counter++}</td>`;
        html += `<td class="font-medium uppercase text-gray-700">${r.nama}</td>`;
        html += `<td class="text-center text-gray-500 font-medium text-xs">${r.kelas}</td>`;
        
        if (showSchool) {
            html += `<td class="text-xs font-medium uppercase text-gray-500 text-left tracking-wide">${r.sekolah}</td>`;
        }

        if (isCompareMode) {
            const c = r.comparison || { markah: '-', gred: '-', status: { type: 'NONE', label: '-' } };
            
            let bezaClass = "text-gray-400 font-medium";
            let bezaBg = "bg-transparent";
            
            if (c.status.type === 'UP') { bezaClass = "text-green-600 font-bold"; bezaBg = "bg-green-50/50"; }
            else if (c.status.type === 'DOWN') { bezaClass = "text-red-600 font-bold"; bezaBg = "bg-red-50/50"; }
            else if (c.status.type === 'NEW') { bezaClass = "text-blue-600 font-bold"; bezaBg = "bg-blue-50/50"; }

            html += `
                <td class="text-center bg-blue-50/30">
                    <div class="font-bold text-gray-800">${safeStr(r.markah)}</div>
                    <div class="badge-pill mt-1 ${getStatusClass(r.gred)} border text-[10px]">${safeStr(r.gred)}</div>
                </td>
                <td class="text-center bg-gray-50/50 text-gray-500">
                    <div class="font-medium">${safeStr(c.markah)}</div>
                    <div class="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded inline-block mt-1">${safeStr(c.gred)}</div>
                </td>
                <td class="text-center text-xs font-oswald ${bezaClass} ${bezaBg}">
                    ${c.status.label}
                </td>
            </tr>`;
        } else {
            html += `
                <td class="text-center font-bold text-gray-800 font-data-num">${safeStr(r.markah)}</td>
                <td class="text-center">
                    <span class="badge-pill border ${getStatusClass(r.gred)}">${safeStr(r.gred)}</span>
                </td>
            </tr>`;
        }
    });

    tbody.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function setupSpecialExport(btnExcelId) {
    const btnExcel = document.getElementById(btnExcelId);
    if (btnExcel) {
        const newBtn = btnExcel.cloneNode(true);
        btnExcel.parentNode.replaceChild(newBtn, btnExcel);
        newBtn.onclick = () => {
            const title = document.getElementById('specialReportTitle').innerText.replace(/\s+/g, '_');
            exportTableToExcel('tableSpecial', title);
        };
    }
}