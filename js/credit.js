// ==========================================
// EDARS V3.0 - CREDIT ANALYSIS MODULE (MODERNIZED)
// Menguruskan Analisa Pencapaian Kredit (Gred Teras).
// Menggabungkan logik pengiraan dan paparan dalam satu modul.
// ==========================================

import { getGrade, exportTableToExcel, clean } from './utils.js';

// ==========================================
// 1. LOGIK PENGIRAAN (CALCULATION)
// ==========================================

/**
 * Mengira statistik kredit untuk satu set pelajar berdasarkan subjek dipilih.
 * @param {Array} students - Senarai pelajar
 * @param {string} subCode - Kod subjek (cth: 'BM', 'PAI_PM')
 */
export function calculateCreditAnalysis(students, subCode) {
    const GROUPS = {
        'CEMERLANG': ['A+', 'A', 'A-'],
        'KEPUJIAN': ['B+', 'B', 'C+', 'C'],
        'LULUS': ['D', 'E'],
        'GAGAL': ['G']
    };

    let stats = {
        grades: {
            'A+': 0, 'A': 0, 'A-': 0,
            'B+': 0, 'B': 0, 'C+': 0, 'C': 0,
            'D': 0, 'E': 0, 'G': 0, 'TH': 0
        },
        cats: {
            'CEMERLANG': 0, 'KEPUJIAN': 0, 'LULUS': 0, 'GAGAL': 0
        },
        total: { daftar: 0, hadir: 0, th: 0 }
    };

    students.forEach(s => {
        const marks = s.markah_data || {};
        let gred = '';

        // Logik Khas: Gabungan Pendidikan Islam & Moral
        if (subCode === 'PAI_PM') {
            // Priority: PAI dulu, kalau tiada/X baru PM
            let gPAI = getGrade(marks, 'PAI');
            let gPM = getGrade(marks, 'PM');

            // Logik pemilihan gred yang lebih bijak
            if (gPAI && gPAI !== 'X' && gPAI !== '' && gPAI !== 'TH') {
                gred = gPAI;
            } else if (gPM && gPM !== 'X' && gPM !== '') {
                gred = gPM;
            } else if (gPAI === 'TH') {
                gred = 'TH'; // Jika PAI TH, kira TH
            } else {
                return; // Tidak ambil dua-dua, skip pelajar ini
            }
        } else {
            gred = getGrade(marks, subCode);
        }

        gred = gred.trim().toUpperCase();
        
        // Skip jika tiada rekod gred langsung (bukan TH, tapi kosong)
        if (!gred && gred !== 'TH') return; 

        stats.total.daftar++;

        if (gred === 'TH' || gred === 'T') {
            stats.grades['TH']++;
            stats.total.th++;
        } else {
            stats.total.hadir++;
            if (stats.grades.hasOwnProperty(gred)) {
                stats.grades[gred]++;

                // Map to Category
                if (GROUPS.CEMERLANG.includes(gred)) stats.cats.CEMERLANG++;
                else if (GROUPS.KEPUJIAN.includes(gred)) stats.cats.KEPUJIAN++;
                else if (GROUPS.LULUS.includes(gred)) stats.cats.LULUS++;
                else if (GROUPS.GAGAL.includes(gred)) stats.cats.GAGAL++;
            } else if (gred === 'G') {
                // Kadang-kadang 'G' tiada dalam objek asal jika data pelik, kita paksa masuk
                stats.grades['G']++;
                stats.cats.GAGAL++;
            }
        }
    });

    return stats;
}

// ==========================================
// 2. LOGIK PAPARAN (RENDERING)
// ==========================================

// [COMMENT SYNTAX] SURGICAL EDIT START: Betulkan parameter untuk menyokong stats3 dan logik pemaparan matriks E3 ➔ E2 ➔ E1
/**
 * Menjana HTML Jadual Analisa Kredit.
 * @param {Object} stats1 - Statistik Exam 1
 * @param {Object} stats2 - Statistik Exam 2 (jika ada)
 * @param {Object} stats3 - Statistik Exam 3 (jika ada)
 * @param {boolean} isCompare - Adakah mod perbandingan aktif?
 * @param {string} subjectName - Nama subjek
 */
export function renderCreditAnalysisTable(stats1, stats2, stats3, isCompare, subjectName) {
    const thead = document.querySelector('#tableCreditAnalysis thead');
    const tbody = document.getElementById('tbodyCreditAnalysis');
    if (!tbody || !thead) return;

    const isE3 = isCompare && stats3 !== null && stats3 !== undefined;

    // A. SETUP HEADER (Dinamik ikut mod - Modern Clean Style)
    // Gunakan background lembut untuk membezakan seksyen tanpa border tebal
    if (isCompare) {
        thead.innerHTML = `
            <tr>
                <th class="px-4 py-3 bg-gray-50 border-b-2 text-left w-32 align-bottom">Kategori Gred</th>
                ${isE3 ? `
                <th class="px-2 py-2 bg-emerald-50/50 text-emerald-900 border-b-2 border-emerald-100 text-center" colspan="2">
                    <span class="text-[10px] uppercase tracking-wider opacity-70 block">Pilihan</span>
                    E3
                </th>
                ` : ''}
                <th class="px-2 py-2 bg-slate-50 text-slate-600 border-b-2 border-slate-200 text-center" colspan="2">
                    <span class="text-[10px] uppercase tracking-wider opacity-70 block">Asal</span>
                    E2
                </th>
                <th class="px-2 py-2 bg-blue-50/50 text-blue-900 border-b-2 border-blue-100 text-center" colspan="2">
                    <span class="text-[10px] uppercase tracking-wider opacity-70 block">Semasa</span>
                    E1
                </th>
                <th class="px-2 py-2 bg-indigo-50/50 text-indigo-900 border-b-2 border-indigo-100 text-center" colspan="2">
                    <span class="text-[10px] uppercase tracking-wider opacity-70 block">Analisis</span>
                    Perbezaan
                </th>
                <th class="px-4 py-3 bg-gray-50 border-b-2 text-center align-bottom" colspan="2">Analisa Kategori</th>
            </tr>
            <tr class="text-[10px] uppercase text-gray-500">
                <th class="bg-gray-50 border-b"></th> <!-- Spacer for Gred Column -->
                
                ${isE3 ? `
                <th class="bg-emerald-50/30 text-center py-2 border-b text-emerald-800">Bil</th>
                <th class="bg-emerald-50/30 text-center py-2 border-b text-emerald-800">%</th>
                ` : ''}
                
                <th class="bg-slate-50 text-center py-2 border-b text-slate-600">Bil</th>
                <th class="bg-slate-50 text-center py-2 border-b text-slate-600">%</th>
                
                <th class="bg-blue-50/30 text-center py-2 border-b text-blue-800">Bil</th>
                <th class="bg-blue-50/30 text-center py-2 border-b text-blue-800">%</th>
                
                ${isE3 ? `
                <th class="bg-indigo-50/30 text-center py-2 border-b text-indigo-800" title="Beza E1-E2">BZA 1 (%)</th>
                <th class="bg-indigo-50/30 text-center py-2 border-b text-indigo-800" title="Beza E1-E3">BZA 2 (%)</th>
                ` : `
                <th class="bg-indigo-50/30 text-center py-2 border-b text-indigo-800">Bil</th>
                <th class="bg-indigo-50/30 text-center py-2 border-b text-indigo-800">%</th>
                `}
                
                <th class="bg-gray-50 text-center py-2 border-b">Kumpulan</th>
                <th class="bg-gray-50 text-center py-2 border-b">Pencapaian</th>
            </tr>
        `;
    } else {
        thead.innerHTML = `
            <tr>
                <th class="px-6 py-4 bg-gray-50 border-b-2 text-left w-40 text-gray-600">Kategori Gred</th>
                <th class="px-4 py-4 bg-blue-50/30 border-b-2 text-blue-900 text-center w-32">Bilangan</th>
                <th class="px-4 py-4 bg-blue-50/30 border-b-2 text-blue-900 text-center w-32">Peratus (%)</th>
                <th class="px-6 py-4 bg-gray-50 border-b-2 text-gray-600 text-center">Analisa Kategori</th>
                <th class="px-6 py-4 bg-gray-50 border-b-2 text-gray-600 text-center">Pencapaian Kumpulan</th>
            </tr>
        `;
    }

    // B. SETUP ROWS CONFIGURATION
    const ROWS_CONFIG = [
        { gred: 'A+', span: 3, label: 'CEMERLANG', key: 'CEMERLANG', color: 'text-emerald-600' },
        { gred: 'A' },
        { gred: 'A-' },
        { gred: 'B+', span: 4, label: 'KEPUJIAN', key: 'KEPUJIAN', color: 'text-blue-600' },
        { gred: 'B' },
        { gred: 'C+' },
        { gred: 'C' },
        { gred: 'D', span: 2, label: 'LULUS (D & E)', key: 'LULUS', color: 'text-yellow-600' },
        { gred: 'E' },
        { gred: 'G', span: 1, label: 'GAGAL', key: 'GAGAL', color: 'text-red-600' },
        { gred: 'TH', span: 1, label: 'TIDAK HADIR', key: null, color: 'text-gray-400' }
    ];

    let html = '';
    const hadir1 = stats1.total.hadir; // Peratus dikira dari HADIR, bukan DAFTAR
    const hadir2 = isCompare && stats2 ? stats2.total.hadir : 0;
    const hadir3 = isE3 ? stats3.total.hadir : 0;

    const calcPerc = (val, total) => total > 0 ? ((val / total) * 100).toFixed(2) : "0.00";
    
    // Helper visual beza
    const getDiff = (v1, v2) => {
        const d = v1 - v2;
        const color = d > 0 ? 'text-green-600 font-bold' : (d < 0 ? 'text-red-600 font-bold' : 'text-gray-400');
        const bg = d !== 0 ? (d > 0 ? 'bg-green-50' : 'bg-red-50') : 'bg-transparent';
        const arrow = d > 0 ? '▲' : (d < 0 ? '▼' : '-');
        return { val: d, color, bg, arrow, txt: d > 0 ? '+' + d : d };
    };

    ROWS_CONFIG.forEach(row => {
        const g = row.gred;
        const count1 = stats1.grades[g] || 0;
        const perc1 = calcPerc(count1, hadir1);

        html += `<tr class="transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0">`;
        html += `<td class="px-4 py-3 font-bold font-oswald text-gray-700 bg-white">${g}</td>`;

        if (isCompare) {
            const count2 = stats2 ? (stats2.grades[g] || 0) : 0;
            const perc2 = calcPerc(count2, hadir2);
            
            const count3 = isE3 ? (stats3.grades[g] || 0) : 0;
            const perc3 = isE3 ? calcPerc(count3, hadir3) : "0.00";

            const diffBil = getDiff(count1, count2);
            const diffPerc1 = getDiff(parseFloat(perc1), parseFloat(perc2));
            const diffPerc2 = isE3 ? getDiff(parseFloat(perc1), parseFloat(perc3)) : null;

            html += `
                ${isE3 ? `
                <td class="px-2 py-2 font-medium text-gray-500 bg-emerald-50/30 text-center">${count3}</td>
                <td class="px-2 py-2 text-emerald-600 font-bold bg-emerald-50/30 text-xs text-center">${perc3}%</td>
                ` : ''}

                <td class="px-2 py-2 font-medium text-gray-500 bg-slate-50/30 text-center">${count2}</td>
                <td class="px-2 py-2 text-gray-400 bg-slate-50/30 text-xs text-center">${perc2}%</td>
                
                <td class="px-2 py-2 font-medium text-gray-700 bg-blue-50/10 text-center">${count1}</td>
                <td class="px-2 py-2 font-bold text-blue-600 bg-blue-50/10 text-center">${perc1}%</td>
                
                ${isE3 ? `
                <td class="px-2 py-2 font-medium ${diffPerc1.color} ${diffPerc1.bg} rounded text-center text-xs" title="E1-E2">${diffPerc1.val.toFixed(2)}%</td>
                <td class="px-2 py-2 font-medium ${diffPerc2.color} ${diffPerc2.bg} rounded text-center text-xs border-l border-indigo-100/50" title="E1-E3">${diffPerc2.val.toFixed(2)}%</td>
                ` : `
                <td class="px-2 py-2 font-medium ${diffBil.color} ${diffBil.bg} rounded text-center text-xs">${diffBil.txt}</td>
                <td class="px-2 py-2 font-medium ${diffPerc1.color} ${diffPerc1.bg} rounded text-center text-xs">${diffPerc1.val.toFixed(2)}%</td>
                `}
            `;
        } else {
            html += `
                <td class="px-4 py-3 font-oswald text-lg font-bold text-gray-700 text-center">${count1}</td>
                <td class="px-4 py-3 font-oswald text-blue-600 font-bold text-center bg-blue-50/30">${perc1}%</td>
            `;
        }

        // Column Span Logic (Kategori)
        if (row.span) {
            if (row.key) {
                const catCount1 = stats1.cats[row.key] || 0;
                const catPerc1 = calcPerc(catCount1, hadir1);
                let catContent = '';

                if (isCompare) {
                    const catCount2 = stats2 ? (stats2.cats[row.key] || 0) : 0;
                    const catPerc2 = calcPerc(catCount2, hadir2);
                    const diffCat1 = getDiff(parseFloat(catPerc1), parseFloat(catPerc2));
                    
                    let e3Html = '';
                    if (isE3) {
                        const catCount3 = stats3.cats[row.key] || 0;
                        const catPerc3 = calcPerc(catCount3, hadir3);
                        const diffCat2 = getDiff(parseFloat(catPerc1), parseFloat(catPerc3));
                        
                        e3Html = `
                            <div class="text-[10px] text-gray-400 mt-0.5">
                                E3: ${catPerc3}% (${catCount3})
                            </div>
                            <div class="text-xs ${diffCat2.color} mt-0.5 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100" title="E1-E3">
                                <span class="text-[10px]">${diffCat2.arrow}</span> ${Math.abs(diffCat2.val).toFixed(2)}% (BZA2)
                            </div>
                        `;
                    }

                    catContent = `
                        <div class="flex flex-col gap-1 items-center justify-center h-full py-1">
                            <div class="flex items-baseline gap-2">
                                <span class="text-sm font-bold text-gray-800" title="E1">${catPerc1}%</span>
                                <span class="text-[10px] text-gray-400">(${catCount1})</span>
                            </div>
                            <div class="w-full h-px bg-gray-200 my-0.5"></div>
                            <div class="text-[10px] text-gray-400">
                                E2: ${catPerc2}% (${catCount2})
                            </div>
                            <div class="text-xs ${diffCat1.color} mt-1 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100" title="E1-E2">
                                <span class="text-[10px]">${diffCat1.arrow}</span> ${Math.abs(diffCat1.val).toFixed(2)}% ${isE3 ? '(BZA1)' : ''}
                            </div>
                            ${e3Html}
                        </div>
                    `;
                } else {
                    catContent = `
                        <div class="flex flex-col items-center">
                            <div class="text-2xl font-bold text-gray-800 leading-none mb-1">${catCount1}</div>
                            <div class="text-sm text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">${catPerc1}%</div>
                        </div>
                    `;
                }

                html += `
                    <td rowspan="${row.span}" class="px-3 py-3 align-middle bg-white border-l border-gray-100 border-b border-gray-100">
                        <div class="flex items-center justify-center h-full">
                            <span class="font-bold font-oswald uppercase tracking-wider text-xs ${row.color || 'text-gray-600'} text-center">
                                ${row.label}
                            </span>
                        </div>
                    </td>
                    <td rowspan="${row.span}" class="px-3 py-3 align-middle bg-gray-50/30 text-center border-b border-gray-100">
                        ${catContent}
                    </td>
                `;
            } else {
                // Untuk baris TH/Lain-lain yang tiada kategori spesifik dalam jadual span
                html += `<td class="px-3 py-2 bg-gray-50/50 text-gray-300 font-bold text-xs text-center border-b border-gray-100" colspan="2">-</td>`;
            }
        }
        html += `</tr>`;
    });

    // FOOTER ROW (JUMLAH HADIR) - Sticky Bottom effect visual
    html += `
        <tr class="bg-gray-800 text-white font-bold text-sm">
            <td class="px-4 py-3 text-right uppercase tracking-wider font-oswald text-gray-300 text-xs">JUMLAH HADIR</td>
            ${isCompare 
                ? `
                   ${isE3 ? `<td class="px-2 py-2 text-center text-emerald-400 bg-gray-700/40" colspan="2">${hadir3}</td>` : ''}
                   <td class="px-2 py-2 text-center text-gray-400 bg-gray-700/30" colspan="2">${hadir2}</td>
                   <td class="px-2 py-2 text-center bg-gray-700/50" colspan="2">${hadir1}</td>
                   <td class="px-2 py-2 bg-gray-800" colspan="2"></td>
                  ` 
                : `<td class="px-4 py-3 text-center bg-gray-700/50 text-white text-lg font-oswald">${hadir1}</td><td class="px-4 py-3 bg-gray-800"></td>`
            }
            <td colspan="2" class="bg-gray-800"></td>
        </tr>
    `;

    tbody.innerHTML = html;
}
// [COMMENT SYNTAX] SURGICAL EDIT END

// ==========================================
// 3. EXPORT SETUP
// ==========================================

export function setupCreditExport(btnId) {
    const btn = document.getElementById(btnId);
    if (btn) {
        // Clone untuk buang listener lama
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.onclick = () => {
            const title = document.getElementById('creditReportTitle').innerText.replace(/\s+/g, '_');
            exportTableToExcel('tableCreditAnalysis', title);
        };
    }
}