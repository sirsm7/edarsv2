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
        // KEMASKINI: Buang truncate, tambah flex-1, break-words dan leading-snug untuk wrap yang kemas
        const label = fullName ? `<span class="font-bold text-gray-700 w-12 shrink-0">${subCode}</span> <span class="flex-1 text-gray-500 text-[10px] break-words leading-snug border-l border-gray-200 pl-2 ml-1 uppercase tracking-wide">${fullName}</span>` : `<span class="font-bold text-gray-700">${subCode}</span>`;
        
        // KEMASKINI: Tambah h-full pada label dan buang overflow-hidden pada div
        return `
        <label class="group flex items-center p-3 h-full bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer select-none">
            <input type="checkbox" name="chkSubject" value="${subCode}" class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 shrink-0 mr-3">
            <div class="flex items-center w-full">
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

// [COMMENT SYNTAX] SURGICAL EDIT START: Menambah sokongan parameter E3 (comparisonStudents2) dan logik pengekstrakan markahnya
/**
 * Menjana data laporan khas berdasarkan kriteria.
 * @param {Array} students - Data pelajar (E1)
 * @param {Array} selectedSubjects - Subjek yang dipilih user
 * @param {string} mode - Mode tapisan (TH, G, DE, LE10)
 * @param {Array} comparisonStudents - Data pelajar banding (E2) - Optional
 * @param {Array} comparisonStudents2 - Data pelajar banding (E3) - Optional
 */
export function generateSpecialReportData(students, selectedSubjects, mode, comparisonStudents = [], comparisonStudents2 = []) {
    let results = [];
    
    // Bina Map untuk carian pantas data perbandingan (Exam 2)
    const comparisonMap = new Map();
    if (comparisonStudents && comparisonStudents.length > 0) {
        comparisonStudents.forEach(s => {
            if (s.id_individu) comparisonMap.set(s.id_individu, s);
        });
    }

    // Bina Map untuk carian pantas data perbandingan (Exam 3)
    const comparisonMap2 = new Map();
    if (comparisonStudents2 && comparisonStudents2.length > 0) {
        comparisonStudents2.forEach(s => {
            if (s.id_individu) comparisonMap2.set(s.id_individu, s);
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
                let compData2 = null;

                // LOGIK PERBANDINGAN PINTAR E1 vs E2
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

                // LOGIK PERBANDINGAN PINTAR E1 vs E3
                if (comparisonMap2.size > 0) {
                    const match2 = comparisonMap2.get(s.id_individu);
                    if (match2) {
                        const marks3 = match2.markah_data || {};
                        const gred3 = getGrade(marks3, subCode);
                        let rawMark3 = marks3[subCode] || marks3[`${subCode}`] || "-";
                        
                        compData2 = {
                            markah: rawMark3,
                            gred: gred3,
                            status: calculateImprovement(rawMark, gred, rawMark3, gred3)
                        };
                    } else {
                        compData2 = { markah: '-', gred: '-', status: { type: 'NEW', label: 'BARU' } }; 
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
                    comparison: compData,
                    comparison2: compData2
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
// [COMMENT SYNTAX] SURGICAL EDIT END

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

// [COMMENT SYNTAX] SURGICAL EDIT START: Menyuntik header dan sel E3 ➔ E2 ➔ E1 berserta Beza E1-E3
export function renderSpecialTable(results, mode, isCompareMode, showSchool = true, isE3 = false) {
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
        if (isE3) {
            headerHtml += '<th class="text-center w-24 bg-emerald-50/50 text-emerald-800" title="Penanda Aras 2">E3 (Pilihan)</th>';
        }
        headerHtml += '<th class="text-center w-24 bg-gray-50/50 text-gray-600" title="Penanda Aras 1">E2 (Asal)</th>';
        headerHtml += '<th class="text-center w-24 bg-blue-50/50 text-blue-800">E1 (Semasa)</th>';
        headerHtml += '<th class="text-center w-20" title="Beza E1 - E2">BZA 1</th>';
        if (isE3) {
            headerHtml += '<th class="text-center w-20" title="Beza E1 - E3">BZA 2</th>';
        }
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
    const colSpan = 3 + (showSchool ? 1 : 0) + (isCompareMode ? (isE3 ? 5 : 3) : 2);

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

        html += `<tr class="transition-colors hover:bg-gray-50 border-b border-gray-100">`;
        html += `<td class="text-center text-gray-400 font-medium">${counter++}</td>`;
        html += `<td class="font-medium uppercase text-gray-700">${r.nama}</td>`;
        html += `<td class="text-center text-gray-500 font-medium text-xs">${r.kelas}</td>`;
        
        if (showSchool) {
            html += `<td class="text-xs font-medium uppercase text-gray-500 text-left tracking-wide">${r.sekolah}</td>`;
        }

        if (isCompareMode) {
            const c = r.comparison || { markah: '-', gred: '-', status: { type: 'NONE', label: '-' } };
            const c2 = r.comparison2 || { markah: '-', gred: '-', status: { type: 'NONE', label: '-' } };
            
            const getBezaUI = (status) => {
                let bezaClass = "text-gray-400 font-medium";
                let bezaBg = "bg-transparent";
                if (status.type === 'UP') { bezaClass = "text-green-600 font-bold"; bezaBg = "bg-green-50/50"; }
                else if (status.type === 'DOWN') { bezaClass = "text-red-600 font-bold"; bezaBg = "bg-red-50/50"; }
                else if (status.type === 'NEW') { bezaClass = "text-blue-600 font-bold"; bezaBg = "bg-blue-50/50"; }
                return { bezaClass, bezaBg };
            };

            const ui1 = getBezaUI(c.status);
            const ui2 = getBezaUI(c2.status);

            // Kolum E3
            if (isE3) {
                html += `
                <td class="text-center bg-emerald-50/30 text-emerald-700">
                    <div class="font-medium">${safeStr(c2.markah)}</div>
                    <div class="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded inline-block mt-1">${safeStr(c2.gred)}</div>
                </td>`;
            }

            // Kolum E2, E1, dan BZA1
            html += `
                <td class="text-center bg-gray-50/50 text-gray-500">
                    <div class="font-medium">${safeStr(c.markah)}</div>
                    <div class="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded inline-block mt-1">${safeStr(c.gred)}</div>
                </td>
                <td class="text-center bg-blue-50/30">
                    <div class="font-bold text-gray-800">${safeStr(r.markah)}</div>
                    <div class="badge-pill mt-1 ${getStatusClass(r.gred)} border text-[10px]">${safeStr(r.gred)}</div>
                </td>
                <td class="text-center text-xs font-oswald ${ui1.bezaClass} ${ui1.bezaBg}" title="E1-E2">
                    ${c.status.label}
                </td>
            `;

            // Kolum BZA2
            if (isE3) {
                html += `
                <td class="text-center text-xs font-oswald ${ui2.bezaClass} ${ui2.bezaBg} border-l border-gray-100/50" title="E1-E3">
                    ${c2.status.label}
                </td>`;
            }
            html += `</tr>`;
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
// [COMMENT SYNTAX] SURGICAL EDIT END

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