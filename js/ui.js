// ==========================================
// EDARS V3.0 - UI RENDER MODULE (REFACTORED)
// Menguruskan orkestrasi DOM. Logik HTML dipindahkan ke templates.js.
// KEMASKINI V3.1: Sokongan Paparan Matriks 3 Peperiksaan (E1, E2, E3).
// ==========================================

import { exportTableToExcel } from './utils.js';
import { SUBJECT_PRIORITY, NAMA_SUBJEK, STATIC_OPTIONS } from './config.js';
import * as Templates from './templates.js';

// ==========================================
// 1. HELPER: STATIC DROPDOWNS & SORTING
// ==========================================

/**
 * Memasukkan data statik ke dalam dropdown UI secara dinamik.
 */
export function initStaticDropdowns() {
    const demogSelect = document.getElementById('demogSelect');
    const componentSelect = document.getElementById('componentSelect');
    const creditSelect = document.getElementById('selectCreditSubject');

    const populateSelect = (selectEl, optionsData) => {
        if (!selectEl || !optionsData) return;
        selectEl.innerHTML = ''; 
        optionsData.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            if (opt.disabled) optionEl.disabled = true;
            selectEl.appendChild(optionEl);
        });
    };

    populateSelect(demogSelect, STATIC_OPTIONS.DEMOG);
    populateSelect(componentSelect, STATIC_OPTIONS.COMPONENT);
    populateSelect(creditSelect, STATIC_OPTIONS.CREDIT_SUBJECT);
}

const sortSubjects = (a, b) => {
    const codeA = a.kod || a || "";
    const codeB = b.kod || b || "";
    const idxA = SUBJECT_PRIORITY.indexOf(codeA);
    const idxB = SUBJECT_PRIORITY.indexOf(codeB);
    const weightA = idxA === -1 ? 999 : idxA;
    const weightB = idxB === -1 ? 999 : idxB;
    if (weightA !== weightB) return weightA - weightB;
    return codeA.localeCompare(codeB);
};

// ==========================================
// 2. KPI UPDATER
// ==========================================

export function updateKPI(calon, gp, lms, tlms, isComponent = false) { 
    const elCalon = document.getElementById('kpiCalon');
    const elGP = document.getElementById('kpiGP');
    const elLMS = document.getElementById('kpiLMS');
    const elTLMS = document.getElementById('kpiTLMS');

    if(elCalon) elCalon.innerText = calon; 
    if(elGP) elGP.innerText = gp; 
    if(elLMS) elLMS.innerText = lms; 
    if(elTLMS) elTLMS.innerText = tlms; 

    const kpiSection = document.getElementById('kpiSection');
    const cardLMS = document.getElementById('kpiLMS')?.parentElement;
    const cardTLMS = document.getElementById('kpiTLMS')?.parentElement;

    if (isComponent) {
        if(cardLMS) cardLMS.classList.add('hidden');
        if(cardTLMS) cardTLMS.classList.add('hidden');
        if(kpiSection) {
            kpiSection.classList.remove('md:grid-cols-4');
            kpiSection.classList.add('md:grid-cols-2');
        }
    } else {
        if(cardLMS) cardLMS.classList.remove('hidden');
        if(cardTLMS) cardTLMS.classList.remove('hidden');
        if(kpiSection) {
            kpiSection.classList.remove('md:grid-cols-2');
            kpiSection.classList.add('md:grid-cols-4');
        }
    }
}

// ==========================================
// 3. RENDER AGGREGATE (RUMUSAN DAERAH)
// ==========================================

export function renderAggregateTable(data) {
    const { schools, district, tlmsList } = data;
    
    // 1. Jadual Utama
    const tbody = document.getElementById('tbodyAggregate');
    if (tbody) {
        tbody.innerHTML = Object.values(schools)
            .sort((a,b) => (a.code || "").localeCompare(b.code || "")) 
            .map((s,i) => Templates.getAggregateRow(s, i)).join('');
    }

    // 2. Jadual Statistik Subjek Daerah
    const tableSub = document.getElementById('tableSubjectDistrict');
    const tbodySub = document.getElementById('tbodySubjectDistrict');
    
    if (tableSub && tbodySub) {
        const thead = tableSub.querySelector('thead');
        if (thead) thead.innerHTML = Templates.getComplexSubjectHeader();

        tbodySub.innerHTML = Object.values(district.subjectStats)
            .sort(sortSubjects)
            .map((s,i) => Templates.getSubjectStatsRow(s, i)).join('');
    }

    // 3. Jadual TLMS Daerah
    const tbodyTLMS = document.getElementById('tbodyDistrictTLMS');
    if (tbodyTLMS && tlmsList) {
        tbodyTLMS.innerHTML = tlmsList
            .sort((a,b) => a.nama.localeCompare(b.nama))
            .map((t,i) => Templates.getTLMSRow(t, i)).join(''); 
    }

    updateKPI(
        district.calon, 
        district.sumSubject>0 ? (district.sumPoint/district.sumSubject).toFixed(2) : "0.00", 
        ((district.lms/district.calon)*100).toFixed(2)+"%", 
        district.tlms,
        false
    );
}

// ==========================================
// 4. RENDER SCHOOL DETAIL (ANALISA SEKOLAH)
// ==========================================

export function renderSchoolDetailTable(data) {
    const { subjects, tlmsList, stats } = data;
    
    const tableSub = document.getElementById('tableSubject');
    const tbody = document.getElementById('tbodySubject');
    
    if (tableSub && tbody) {
        const thead = tableSub.querySelector('thead');
        if (thead) thead.innerHTML = Templates.getComplexSubjectHeader();

        tbody.innerHTML = Object.values(subjects)
            .sort(sortSubjects)
            .map((s,i) => Templates.getSubjectStatsRow(s, i)).join('');
    }

    const tbodyTLMS = document.getElementById('tbodyTLMS');
    if (tbodyTLMS) {
        tbodyTLMS.innerHTML = tlmsList
            .sort((a,b)=>a.nama.localeCompare(b.nama))
            .map((t,i)=> Templates.getTLMSRow(t, i)).join('');
    }

    updateKPI(
        stats.calon, 
        stats.sumSubject>0 ? (stats.sumPoint/stats.sumSubject).toFixed(2) : "0.00", 
        ((stats.lms/stats.calon)*100).toFixed(2)+"%", 
        stats.tlms,
        false
    );
}

// ==========================================
// 5. RENDER COMPONENT (ANALISA KOMPONEN)
// ==========================================

export function renderComponentTable(data) {
    const { subjects, schools, compStats, validSubjectCodes, subjectSchoolMatrix } = data;
    
    // 1. Header Suntikan (Fix Visual)
    const theadComp = document.querySelector('#tableCompSubject full_table thead');
    const theadCompReal = document.querySelector('#tableCompSubject thead');
    if (theadCompReal) theadCompReal.innerHTML = Templates.getComponentSimpleHeader();

    // 2. Data Body
    document.getElementById('tbodyCompSubject').innerHTML = Object.values(subjects)
        .sort(sortSubjects)
        .map((sub,i) => Templates.getComponentSimpleRow(sub, i)).join('');
    
    // 3. Jadual Terperinci
    if (subjectSchoolMatrix) {
        renderDetailedComponentTables(subjectSchoolMatrix);
    }

    // 4. Jadual Matriks Sekolah
    let headerHTML = `<tr><th class="px-3 py-3 border-b-2 bg-gray-50 text-left font-semibold text-gray-600 text-xs">SEKOLAH</th>`; 
    
    const sortedCodes = [...validSubjectCodes].sort((a,b) => {
         const idxA = SUBJECT_PRIORITY.indexOf(a);
         const idxB = SUBJECT_PRIORITY.indexOf(b);
         const weightA = idxA === -1 ? 999 : idxA;
         const weightB = idxB === -1 ? 999 : idxB;
         if(weightA !== weightB) return weightA - weightB;
         return a.localeCompare(b);
    });

    sortedCodes.forEach(kod => { headerHTML += `<th class="px-2 py-3 border-b-2 bg-gray-50 text-center font-semibold text-gray-600 text-xs w-16">${kod}</th>`; }); 
    headerHTML += `<th class="px-2 py-3 border-b-2 bg-indigo-50 text-center font-bold text-indigo-900 text-xs w-20">GPK</th></tr>`; 
    document.getElementById('theadCompSchoolMatrix').innerHTML = headerHTML;
    
    document.getElementById('tbodyCompSchoolMatrix').innerHTML = Object.values(schools)
        .sort((a,b) => (a.code || "").localeCompare(b.code || ""))
        .map(s=>{ 
            let row = `<tr class="transition-colors text-gray-700">
                <td class="font-medium text-left">
                <span class="text-gray-400 text-[10px] mr-1 block leading-none">[${s.code}]</span>
                <span class="font-semibold uppercase text-xs tracking-tight">${s.name}</span>
            </td>`; 
            let sp=0, sc=0; 
            sortedCodes.forEach(kod=>{ 
                const d = s.subjects[kod]; 
                if(d && d.count>0) { 
                    const g=d.point/d.count; 
                    sp+=d.point; sc+=d.count; 
                    row+=`<td class="text-center text-gray-600 text-xs">${g.toFixed(2)}</td>`; 
                } else row+=`<td class="text-center text-gray-300 text-xs">-</td>`; 
            }); 
            const gpk = sc>0?(sp/sc).toFixed(2):"0.00"; 
            return row + `<td class="text-center font-bold bg-indigo-50/50 text-indigo-900">${gpk}</td></tr>`; 
        }).join('');
    
    updateKPI(compStats.calon, compStats.sumSubject>0 ? (compStats.sumPoint/compStats.sumSubject).toFixed(2) : "0.00", "-", "-", true);
}

function renderDetailedComponentTables(matrix) {
    const container = document.getElementById('componentDetailedContainer');
    if (!container) return;
    container.innerHTML = '';

    const subjects = Object.keys(matrix).sort(sortSubjects);
    if (subjects.length === 0) return;

    let fullHTML = '';
    
    // FIX: Gunakan Header Khas untuk Sekolah
    const headerHtml = Templates.getComponentSchoolHeader(); 

    subjects.forEach(kod => {
        const subData = matrix[kod];
        const subName = NAMA_SUBJEK[kod] || kod;
        const tableId = `tableDetail_${kod}`;
        const btnPdfId = `btnPdf_${kod}`;
        const btnExcelId = `btnExcel_${kod}`;

        // FIX: Gunakan Row Generator Khas untuk Sekolah
        const rows = Object.values(subData)
            .sort((a,b) => (a.code || "").localeCompare(b.code || ""))
            .map((s, i) => Templates.getComponentSchoolRow(s, i)).join('');

        fullHTML += Templates.getDetailedTableBlock(kod, subName, rows, btnPdfId, btnExcelId, tableId, headerHtml, "emerald");
    });

    container.innerHTML = fullHTML;

    // BIND EVENTS
    subjects.forEach(kod => {
        const tableId = `tableDetail_${kod}`;
        const subName = NAMA_SUBJEK[kod] || kod;
        
        const btnPdf = document.getElementById(`btnPdf_${kod}`);
        if(btnPdf) btnPdf.addEventListener('click', () => {
            if(window.exportTableToPDF) window.exportTableToPDF(tableId, `Analisa ${subName}`, `Analisa_${kod}_Sekolah`);
        });

        const btnExcel = document.getElementById(`btnExcel_${kod}`);
        if(btnExcel) btnExcel.addEventListener('click', () => exportTableToExcel(tableId, `Analisa_${kod}_Sekolah`));
    });
}

// ==========================================
// 6. RENDER COMPARISON (PERBANDINGAN)
// ==========================================

function renderComparisonKPICards(districtStats) {
    const container = document.getElementById('comparisonKPIContainer');
    if (!container) return;

    const { ex1, ex2, isComponent } = districtStats;
    const labelGP = isComponent ? 'GPK' : 'GPD';
    const labelLMS = '% LMS';

    // Helper Kira Beza
    const calc = (val1, val2, isInverse = false) => {
        const v1 = parseFloat(val1);
        const v2 = parseFloat(val2);
        const diff = v1 - v2;
        let color = 'text-gray-400';
        let arrow = '-';

        if (diff !== 0) {
            if (isInverse) { 
                if (diff < 0) { color = 'text-green-600 font-bold'; arrow = '▼'; }
                else { color = 'text-red-600 font-bold'; arrow = '▲'; }
            } else { 
                if (diff > 0) { color = 'text-green-600 font-bold'; arrow = '▲'; }
                else { color = 'text-red-600 font-bold'; arrow = '▼'; }
            }
        }
        return { diff: Math.abs(diff), color, arrow };
    };

    const statCalon = calc(ex1.calon, ex2.calon, false);
    const gp1 = ex1.sumSubject > 0 ? (ex1.sumPoint / ex1.sumSubject) : 0;
    const gp2 = ex2.sumSubject > 0 ? (ex2.sumPoint / ex2.sumSubject) : 0;
    const statGP = calc(gp1.toFixed(2), gp2.toFixed(2), true); 

    let html = `
        ${Templates.getComparisonCard('BEZA CALON', ex1.calon, ex2.calon, statCalon)}
        ${Templates.getComparisonCard(`BEZA ${labelGP}`, gp1.toFixed(2), gp2.toFixed(2), statGP)}
    `;

    if (!isComponent) {
        const lms1 = ex1.calon > 0 ? (ex1.lms / ex1.calon * 100) : 0;
        const lms2 = ex2.calon > 0 ? (ex2.lms / ex2.calon * 100) : 0;
        const statLMS = calc(lms1.toFixed(2), lms2.toFixed(2), false);
        html += `${Templates.getComparisonCard(`BEZA ${labelLMS}`, lms1.toFixed(2), lms2.toFixed(2), statLMS, '%')}`;
        
        const statTLMS = calc(ex1.tlms, ex2.tlms, true);
        html += Templates.getComparisonCard('BEZA TLMS', ex1.tlms, ex2.tlms, statTLMS);
        
        container.classList.remove('md:grid-cols-4');
        container.classList.add('md:grid-cols-4');
    } else {
        container.classList.remove('md:grid-cols-4');
        container.classList.add('md:grid-cols-2');
    }

    container.innerHTML = html;
    container.classList.remove('hidden');
}

// [SURGICAL EDIT] Mengintegrasikan Header & Data E3 ke dalam jadual
export function renderComparisonTables(data, names) {
    const { schoolMap, subMap, districtStats } = data; 
    const { name1, name2, name3 } = names;
    const isE3 = !!name3;
    const hiddenCls = isE3 ? '' : 'hidden';

    // 1. Suntik Nama Header
    document.getElementById('headExam1').innerText = name1; 
    document.getElementById('headExam2').innerText = name2;
    document.getElementById('headSubExam1').innerText = name1; 
    document.getElementById('headSubExam2').innerText = name2;
    document.getElementById('headTLMSExam1').innerText = name1; 
    document.getElementById('headTLMSExam2').innerText = name2;

    if (isE3) {
        if(document.getElementById('headExam3')) document.getElementById('headExam3').innerText = name3;
        if(document.getElementById('headSubExam3')) document.getElementById('headSubExam3').innerText = name3;
        if(document.getElementById('headTLMSExam3')) document.getElementById('headTLMSExam3').innerText = name3;
    }

    // Toggle Kolum E3
    const e3Cols = document.querySelectorAll('#viewComparison .col-e3');
    if (isE3) {
        e3Cols.forEach(el => el.classList.remove('hidden'));
    } else {
        e3Cols.forEach(el => el.classList.add('hidden'));
    }

    if (districtStats) renderComparisonKPICards(districtStats);

    // 2. Jadual Banding Sekolah (GPS/LMS)
    document.getElementById('tbodyCompareSchools').innerHTML = Object.values(schoolMap)
        .sort((a,b) => (a.code || "").localeCompare(b.code || "")) 
        .map((s, i) => {
            const gps1 = s.ex1.gps; 
            const gps2 = s.ex2.gps; 
            const diffGPS = gps1 - gps2; 
            const colorGPS = diffGPS === 0 ? 'text-gray-400' : (diffGPS < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowGPS = diffGPS === 0 ? '-' : (diffGPS < 0 ? '▲' : '▼'); 

            const lmsPerc1 = s.ex1.calonCount > 0 ? (s.ex1.lmsCount / s.ex1.calonCount) * 100 : 0;
            const lmsPerc2 = s.ex2.calonCount > 0 ? (s.ex2.lmsCount / s.ex2.calonCount) * 100 : 0;
            const diffLMS = lmsPerc1 - lmsPerc2; 
            const colorLMS = diffLMS === 0 ? 'text-gray-400' : (diffLMS > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            const arrowLMS = diffLMS === 0 ? '-' : (diffLMS > 0 ? '▲' : '▼');

            // Data E3
            const calon3 = s.ex3 ? s.ex3.calonCount : 0;
            const gps3 = s.ex3 ? s.ex3.gps : 0;
            const diffGPS3 = gps1 - gps3; 
            const colorGPS3 = diffGPS3 === 0 ? 'text-gray-400' : (diffGPS3 < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowGPS3 = diffGPS3 === 0 ? '-' : (diffGPS3 < 0 ? '▲' : '▼'); 

            const lmsPerc3 = s.ex3 && s.ex3.calonCount > 0 ? (s.ex3.lmsCount / s.ex3.calonCount) * 100 : 0;
            const diffLMS3 = lmsPerc1 - lmsPerc3; 
            const colorLMS3 = diffLMS3 === 0 ? 'text-gray-400' : (diffLMS3 > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            const arrowLMS3 = diffLMS3 === 0 ? '-' : (diffLMS3 > 0 ? '▲' : '▼');

            return `
            <tr class="transition-colors text-gray-700 hover:bg-cyan-50/10">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="font-medium text-left">
                    <span class="text-gray-400 text-[10px] block leading-none">[${s.code}]</span>
                    <span class="font-semibold uppercase text-xs tracking-tight text-gray-800">${s.name}</span>
                </td>
                <td class="text-center bg-gray-50/50 text-gray-600">${s.ex1.calonCount || 0}</td>
                <td class="text-center bg-gray-50/50 font-bold text-gray-800">${gps1.toFixed(2)}</td>
                <td class="text-center bg-gray-50/50 text-blue-600 font-bold">${lmsPerc1.toFixed(2)}%</td>
                
                <td class="text-center bg-blue-50/30 text-gray-600">${s.ex2.calonCount || 0}</td>
                <td class="text-center bg-blue-50/30 font-bold text-gray-800">${gps2.toFixed(2)}</td>
                <td class="text-center bg-blue-50/30 text-blue-600 font-bold">${lmsPerc2.toFixed(2)}%</td>

                <!-- COL E3 -->
                <td class="text-center bg-emerald-50/30 text-gray-600 col-e3 ${hiddenCls}">${calon3}</td>
                <td class="text-center bg-emerald-50/30 font-bold text-gray-800 col-e3 ${hiddenCls}">${gps3.toFixed(2)}</td>
                <td class="text-center bg-emerald-50/30 text-emerald-600 font-bold col-e3 ${hiddenCls}">${lmsPerc3.toFixed(2)}%</td>
                
                <!-- BEZA 1 -->
                <td class="text-center font-bold bg-gray-100 ${colorGPS}">${Math.abs(diffGPS).toFixed(2)} <span class="pdf-arrow text-xs ml-1">${arrowGPS}</span></td>
                <td class="text-center font-bold bg-gray-100 ${colorLMS}">${Math.abs(diffLMS).toFixed(2)}% <span class="pdf-arrow text-xs ml-1">${arrowLMS}</span></td>
                
                <!-- BEZA 2 (E3) -->
                <td class="text-center font-bold bg-gray-100/50 border-l border-gray-200 ${colorGPS3} col-e3 ${hiddenCls}">${Math.abs(diffGPS3).toFixed(2)} <span class="pdf-arrow text-xs ml-1">${arrowGPS3}</span></td>
                <td class="text-center font-bold bg-gray-100/50 ${colorLMS3} col-e3 ${hiddenCls}">${Math.abs(diffLMS3).toFixed(2)}% <span class="pdf-arrow text-xs ml-1">${arrowLMS3}</span></td>
            </tr>`;
        }).join('');

    // 3. Jadual Banding TLMS
    document.getElementById('tbodyCompareTLMS').innerHTML = Object.values(schoolMap)
        .sort((a,b) => (a.code || "").localeCompare(b.code || ""))
        .map((s, i) => {
            const tlms1 = (s.ex1.calonCount || 0) - s.ex1.lmsCount;
            const tlms2 = (s.ex2.calonCount || 0) - s.ex2.lmsCount;
            const tlmsPerc1 = s.ex1.calonCount > 0 ? (tlms1 / s.ex1.calonCount) * 100 : 0;
            const tlmsPerc2 = s.ex2.calonCount > 0 ? (tlms2 / s.ex2.calonCount) * 100 : 0;
            const diffTLMSPerc = tlmsPerc1 - tlmsPerc2;
            const colorTLMS = diffTLMSPerc === 0 ? 'text-gray-400' : (diffTLMSPerc < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            const arrowTLMS = diffTLMSPerc === 0 ? '-' : (diffTLMSPerc < 0 ? '▼' : '▲'); 

            // Data E3
            const tlms3 = s.ex3 ? ((s.ex3.calonCount || 0) - s.ex3.lmsCount) : 0;
            const tlmsPerc3 = s.ex3 && s.ex3.calonCount > 0 ? (tlms3 / s.ex3.calonCount) * 100 : 0;
            const diffTLMSPerc3 = tlmsPerc1 - tlmsPerc3;
            const colorTLMS3 = diffTLMSPerc3 === 0 ? 'text-gray-400' : (diffTLMSPerc3 < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            const arrowTLMS3 = diffTLMSPerc3 === 0 ? '-' : (diffTLMSPerc3 < 0 ? '▼' : '▲');

            return `
            <tr class="transition-colors text-gray-700 hover:bg-rose-50/10">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="font-medium text-left">
                    <span class="text-gray-400 text-[10px] block leading-none">[${s.code}]</span>
                    <span class="font-semibold uppercase text-xs tracking-tight">${s.name}</span>
                </td>
                <td class="text-center bg-red-50/30 font-bold text-gray-700">${tlms1}</td>
                <td class="text-center bg-red-50/30 text-red-600 font-bold">${tlmsPerc1.toFixed(2)}%</td>
                <td class="text-center bg-red-100/50 font-bold text-gray-700">${tlms2}</td>
                <td class="text-center bg-red-100/50 text-red-600 font-bold">${tlmsPerc2.toFixed(2)}%</td>
                
                <!-- COL E3 -->
                <td class="text-center bg-red-50/50 font-bold text-gray-700 col-e3 ${hiddenCls}">${tlms3}</td>
                <td class="text-center bg-red-50/50 text-red-600 font-bold col-e3 ${hiddenCls}">${tlmsPerc3.toFixed(2)}%</td>

                <!-- BEZA 1 -->
                <td class="text-center font-bold bg-gray-100 ${colorTLMS}">${Math.abs(tlms1 - tlms2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorTLMS}">${Math.abs(diffTLMSPerc).toFixed(2)}% <span class="pdf-arrow text-xs ml-1">${arrowTLMS}</span></td>

                <!-- BEZA 2 (E3) -->
                <td class="text-center font-bold bg-gray-100/50 border-l border-gray-200 ${colorTLMS3} col-e3 ${hiddenCls}">${Math.abs(tlms1 - tlms3)}</td>
                <td class="text-center font-bold bg-gray-100/50 ${colorTLMS3} col-e3 ${hiddenCls}">${Math.abs(diffTLMSPerc3).toFixed(2)}% <span class="pdf-arrow text-xs ml-1">${arrowTLMS3}</span></td>
            </tr>`;
        }).join('');

    // 4. Jadual Banding Subjek
    document.getElementById('tbodyCompareSubjects').innerHTML = Object.values(subMap)
        .sort(sortSubjects)
        .map((s, i) => {
            const getStats = (o) => ({ gpmp: o && o.ct > 0 ? (o.pt/o.ct) : 0, perc: o && o.ct > 0 ? (o.lulus/o.ct)*100 : 0 }); 
            const st1 = getStats(s.ex1); 
            const st2 = getStats(s.ex2); 
            const diffGP = st1.gpmp - st2.gpmp; 
            const isGPBetter = diffGP < 0; 
            const colorClassGP = diffGP === 0 ? 'text-gray-400' : (isGPBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowVisual = diffGP > 0 ? '▲' : (diffGP < 0 ? '▼' : '-');

            const diffLulus = st1.perc - st2.perc;
            const isLulusBetter = diffLulus > 0;
            const colorClassLulus = diffLulus === 0 ? 'text-gray-400' : (isLulusBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            
            // Data E3
            const st3 = s.ex3 ? getStats(s.ex3) : { gpmp: 0, perc: 0 };
            const diffGP3 = st1.gpmp - st3.gpmp; 
            const isGPBetter3 = diffGP3 < 0; 
            const colorClassGP3 = diffGP3 === 0 ? 'text-gray-400' : (isGPBetter3 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowVisual3 = diffGP3 > 0 ? '▲' : (diffGP3 < 0 ? '▼' : '-');

            const diffLulus3 = st1.perc - st3.perc;
            const isLulusBetter3 = diffLulus3 > 0;
            const colorClassLulus3 = diffLulus3 === 0 ? 'text-gray-400' : (isLulusBetter3 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');

            return `
            <tr class="transition-colors text-gray-700 hover:bg-orange-50/20">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="text-center font-bold text-gray-600">${s.kod}</td>
                <td class="text-xs font-medium uppercase text-left tracking-wide">${s.nama}</td>
                
                <td class="text-center bg-gray-50/50 text-blue-700 font-medium">${st1.perc.toFixed(2)}%</td>
                <td class="text-center bg-gray-50/50 font-bold text-gray-800">${st1.gpmp.toFixed(2)}</td>
                <td class="text-center bg-orange-50/30 text-blue-700 font-medium">${st2.perc.toFixed(2)}%</td>
                <td class="text-center bg-orange-50/30 font-bold text-gray-800">${st2.gpmp.toFixed(2)}</td>

                <!-- COL E3 -->
                <td class="text-center bg-emerald-50/30 text-blue-700 font-medium col-e3 ${hiddenCls}">${st3.perc.toFixed(2)}%</td>
                <td class="text-center bg-emerald-50/30 font-bold text-gray-800 col-e3 ${hiddenCls}">${st3.gpmp.toFixed(2)}</td>

                <!-- BEZA 1 -->
                <td class="text-center font-bold bg-gray-100 ${colorClassGP}">${Math.abs(diffGP).toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorClassLulus}">${Math.abs(diffLulus).toFixed(2)}%</td>
                <td class="text-center font-bold ${colorClassGP}"><span class="pdf-arrow text-sm">${arrowVisual}</span></td>

                <!-- BEZA 2 (E3) -->
                <td class="text-center font-bold bg-gray-100/50 border-l border-gray-200 ${colorClassGP3} col-e3 ${hiddenCls}">${Math.abs(diffGP3).toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100/50 ${colorClassLulus3} col-e3 ${hiddenCls}">${Math.abs(diffLulus3).toFixed(2)}%</td>
                <td class="text-center font-bold ${colorClassGP3} col-e3 ${hiddenCls}"><span class="pdf-arrow text-sm">${arrowVisual3}</span></td>
            </tr>`;
        }).join('');
}

// [SURGICAL EDIT] Mengintegrasikan Header & Data E3 ke dalam jadual komponen
export function renderComparisonComponentTable(data, names) {
    const { subMap, schoolMap, districtStats, comparisonMatrix } = data;
    const { name1, name2, name3 } = names;
    const isE3 = !!name3;
    const hiddenCls = isE3 ? '' : 'hidden';

    // 1. Suntik Nama Header
    document.getElementById('headCompSubExam1').innerText = name1; 
    document.getElementById('headCompSubExam2').innerText = name2;
    document.getElementById('headCompSchoolExam1').innerText = name1; 
    document.getElementById('headCompSchoolExam2').innerText = name2;

    if (isE3) {
        if(document.getElementById('headCompSubExam3')) document.getElementById('headCompSubExam3').innerText = name3;
        if(document.getElementById('headCompSchoolExam3')) document.getElementById('headCompSchoolExam3').innerText = name3;
    }

    // Toggle Kolum E3
    const e3Cols = document.querySelectorAll('#viewComparison .col-e3');
    if (isE3) {
        e3Cols.forEach(el => el.classList.remove('hidden'));
    } else {
        e3Cols.forEach(el => el.classList.add('hidden'));
    }

    if (districtStats) renderComparisonKPICards(districtStats);

    document.getElementById('tbodyCompareCompSubjects').innerHTML = Object.values(subMap)
        .sort(sortSubjects)
        .map((s, i) => {
            const getStats = (o) => ({ gpmp: o && o.ct > 0 ? (o.pt/o.ct) : 0, perc: o && o.ct > 0 ? (o.lulus/o.ct)*100 : 0 }); 
            const st1 = getStats(s.ex1); 
            const st2 = getStats(s.ex2); 
            const diffGP = st1.gpmp - st2.gpmp; 
            const isGPBetter = diffGP < 0; 
            const colorClassGP = diffGP === 0 ? 'text-gray-400' : (isGPBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowVisual = diffGP > 0 ? '▲' : (diffGP < 0 ? '▼' : '-');
            
            const diffLulus = st1.perc - st2.perc;
            const isLulusBetter = diffLulus > 0;
            const colorClassLulus = diffLulus === 0 ? 'text-gray-400' : (isLulusBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            
            // Data E3
            const st3 = s.ex3 ? getStats(s.ex3) : { gpmp: 0, perc: 0 };
            const diffGP3 = st1.gpmp - st3.gpmp; 
            const isGPBetter3 = diffGP3 < 0; 
            const colorClassGP3 = diffGP3 === 0 ? 'text-gray-400' : (isGPBetter3 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowVisual3 = diffGP3 > 0 ? '▲' : (diffGP3 < 0 ? '▼' : '-');

            const diffLulus3 = st1.perc - st3.perc;
            const isLulusBetter3 = diffLulus3 > 0;
            const colorClassLulus3 = diffLulus3 === 0 ? 'text-gray-400' : (isLulusBetter3 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');

            return `
            <tr class="transition-colors text-gray-700 hover:bg-pink-50/10">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="text-center font-bold text-gray-600">${s.kod}</td>
                <td class="text-xs font-medium uppercase text-left tracking-wide">${s.nama}</td>
                <td class="text-center bg-gray-50/50 text-blue-700 font-medium">${st1.perc.toFixed(2)}%</td>
                <td class="text-center bg-gray-50/50 font-bold text-gray-800">${st1.gpmp.toFixed(2)}</td>
                <td class="text-center bg-pink-50/30 text-blue-700 font-medium">${st2.perc.toFixed(2)}%</td>
                <td class="text-center bg-pink-50/30 font-bold text-gray-800">${st2.gpmp.toFixed(2)}</td>

                <!-- COL E3 -->
                <td class="text-center bg-emerald-50/30 text-blue-700 font-medium col-e3 ${hiddenCls}">${st3.perc.toFixed(2)}%</td>
                <td class="text-center bg-emerald-50/30 font-bold text-gray-800 col-e3 ${hiddenCls}">${st3.gpmp.toFixed(2)}</td>

                <!-- BEZA 1 -->
                <td class="text-center font-bold bg-gray-100 ${colorClassGP}">${Math.abs(diffGP).toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorClassLulus}">${Math.abs(diffLulus).toFixed(2)}%</td>
                <td class="text-center font-bold ${colorClassGP}"><span class="pdf-arrow text-sm">${arrowVisual}</span></td>

                <!-- BEZA 2 (E3) -->
                <td class="text-center font-bold bg-gray-100/50 border-l border-gray-200 ${colorClassGP3} col-e3 ${hiddenCls}">${Math.abs(diffGP3).toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100/50 ${colorClassLulus3} col-e3 ${hiddenCls}">${Math.abs(diffLulus3).toFixed(2)}%</td>
                <td class="text-center font-bold ${colorClassGP3} col-e3 ${hiddenCls}"><span class="pdf-arrow text-sm">${arrowVisual3}</span></td>
            </tr>`;
        }).join('');

    if (comparisonMatrix) {
        renderDetailedComparisonTables(comparisonMatrix, names); // Pass names untuk header E3
    }

    document.getElementById('tbodyCompareCompSchools').innerHTML = Object.values(schoolMap)
        .sort((a,b) => (a.code || "").localeCompare(b.code || ""))
        .map((s, i) => {
            const gpk1 = s.ex1.gpk;
            const gpk2 = s.ex2.gpk;
            const diffGPK = gpk1 - gpk2;
            const colorClass = diffGPK === 0 ? 'text-gray-400' : (diffGPK < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            const arrowVisual = diffGPK > 0 ? '▲' : (diffGPK < 0 ? '▼' : '-');

            // Data E3
            const gpk3 = s.ex3 ? s.ex3.gpk : 0;
            const diffGPK3 = gpk1 - gpk3;
            const colorClass3 = diffGPK3 === 0 ? 'text-gray-400' : (diffGPK3 < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            const arrowVisual3 = diffGPK3 > 0 ? '▲' : (diffGPK3 < 0 ? '▼' : '-');

            return `
            <tr class="transition-colors text-gray-700 hover:bg-purple-50/10">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="font-medium text-left">
                    <span class="text-gray-400 text-[10px] block leading-none">[${s.code}]</span>
                    <span class="font-semibold uppercase text-xs tracking-tight text-gray-800">${s.name}</span>
                </td>
                <td class="text-center bg-purple-50/30 text-gray-500 text-xs">${s.ex1.calon}</td>
                <td class="text-center bg-purple-50/30 font-bold text-gray-800">${gpk1.toFixed(2)}</td>
                <td class="text-center bg-purple-100/30 text-gray-500 text-xs">${s.ex2.calon}</td>
                <td class="text-center bg-purple-100/30 font-bold text-gray-800">${gpk2.toFixed(2)}</td>

                <!-- COL E3 -->
                <td class="text-center bg-emerald-50/30 text-gray-500 text-xs col-e3 ${hiddenCls}">${s.ex3 ? s.ex3.calon : 0}</td>
                <td class="text-center bg-emerald-50/30 font-bold text-gray-800 col-e3 ${hiddenCls}">${gpk3.toFixed(2)}</td>

                <!-- BEZA 1 -->
                <td class="text-center font-bold bg-gray-100 ${colorClass}">${Math.abs(diffGPK).toFixed(2)}</td>
                <td class="text-center font-bold ${colorClass}"><span class="pdf-arrow text-sm">${arrowVisual}</span></td>

                <!-- BEZA 2 (E3) -->
                <td class="text-center font-bold bg-gray-100/50 border-l border-gray-200 ${colorClass3} col-e3 ${hiddenCls}">${Math.abs(diffGPK3).toFixed(2)}</td>
                <td class="text-center font-bold ${colorClass3} col-e3 ${hiddenCls}"><span class="pdf-arrow text-sm">${arrowVisual3}</span></td>
            </tr>`;
        }).join('');
}

function renderDetailedComparisonTables(comparisonMatrix, names) {
    const container = document.getElementById('comparisonDetailedContainer');
    if (!container) return;
    container.innerHTML = '';

    const subjects = Object.keys(comparisonMatrix).sort(sortSubjects);
    if (subjects.length === 0) return;

    let fullHTML = '';
    const headerHtml = Templates.getComparisonDetailHeader(names);

    subjects.forEach(kod => {
        const subData = comparisonMatrix[kod];
        const subName = NAMA_SUBJEK[kod] || kod;
        const tableId = `tableCompDetail_${kod}`;
        const btnPdfId = `btnCompPdf_${kod}`;
        const btnExcelId = `btnCompExcel_${kod}`;

        const rows = Object.values(subData)
            .sort((a,b) => (a.code || "").localeCompare(b.code || ""))
            .map((s, i) => Templates.getComparisonDetailRow(s, i, names)).join('');

        fullHTML += Templates.getDetailedTableBlock(kod, subName, rows, btnPdfId, btnExcelId, tableId, headerHtml, "pink", "PERBANDINGAN: ");
    });

    container.innerHTML = fullHTML;

    subjects.forEach(kod => {
        const tableId = `tableCompDetail_${kod}`;
        const subName = NAMA_SUBJEK[kod] || kod;
        
        const btnPdf = document.getElementById(`btnCompPdf_${kod}`);
        if(btnPdf) btnPdf.addEventListener('click', () => {
            if(window.exportTableToPDF) window.exportTableToPDF(tableId, `Banding ${subName}`, `Banding_${kod}_Sekolah`);
        });

        const btnExcel = document.getElementById(`btnCompExcel_${kod}`);
        if(btnExcel) btnExcel.addEventListener('click', () => exportTableToExcel(tableId, `Banding_${kod}_Sekolah`));
    });
}

// ── SURGICAL EDIT START: Renderer Analisa Subjek Spesifik ──
// ==========================================
// 7. RENDER SINGLE SUBJECT (ANALISA SUBJEK SPESIFIK)
// ==========================================
export function renderSingleSubjectTable(result, isCompare, subjectCode, names = {}) {
    const thead = document.getElementById('theadSingleSubject');
    const tbody = document.getElementById('tbodySingleSubject');
    
    if (!thead || !tbody) return;

    const schoolData = Object.values(result.data).sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    
    let headerHtml = '';
    let rowsHtml = '';

    if (isCompare) {
        headerHtml = Templates.getComparisonDetailHeader(names);
        rowsHtml = schoolData.map((s, i) => Templates.getComparisonDetailRow(s, i, names)).join('');
    } else {
        headerHtml = Templates.getComponentSchoolHeader();
        rowsHtml = schoolData.map((s, i) => Templates.getComponentSchoolRow(s, i)).join('');
    }

    thead.innerHTML = headerHtml;
    tbody.innerHTML = rowsHtml;
}
// ── SURGICAL EDIT END ──

// ── SURGICAL EDIT START: Renderer Paparan Pelajar & Pencapaian ──
// ==========================================
// 8. RENDER STUDENT ACHIEVEMENT (PAPARAN PELAJAR)
// ==========================================

function escapeStudentAchievementHTML(value) {
    if (value === undefined || value === null) return '';
    return value.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getStudentAchievementSubjectCellClass(subjectResult) {
    if (!subjectResult || !subjectResult.isTaken) {
        return 'text-center text-gray-300 bg-gray-50/40';
    }

    if (subjectResult.isPass) {
        return 'text-center font-semibold text-emerald-700 bg-emerald-50/30';
    }

    if (subjectResult.gred === 'TH' || subjectResult.gred === 'T') {
        return 'text-center font-bold text-amber-700 bg-amber-50/40';
    }

    return 'text-center font-bold text-rose-700 bg-rose-50/40';
}

function getStudentAchievementStatusClass(status) {
    return status === 'LMS'
        ? 'text-center font-bold text-emerald-700 bg-emerald-50/50'
        : 'text-center font-bold text-rose-700 bg-rose-50/50';
}

function getStudentAchievementSubjectDisplay(subjectResult) {
    if (!subjectResult || !subjectResult.isTaken) return '-';

    const markah = subjectResult.markah || '-';
    const gred = subjectResult.gred || '-';

    return `${escapeStudentAchievementHTML(markah)} <span class="text-[10px] text-gray-500">(${escapeStudentAchievementHTML(gred)})</span>`;
}

// [SURGICAL EDIT] Mengintegrasikan Data Subjek E3 dan Beza 2 dalam paparan pelajar
function getStudentAchievementRow(row, index, subjects, isCompare, context = {}) {
    if (isCompare) {
        const isE3 = !!context.exam3;
        const comp = row.comparison || {};
        const comp2 = row.comparison2 || {};
        
        const gpsDiffClass = comp.gpsImprovement === 'UP' ? 'text-green-600' : (comp.gpsImprovement === 'DOWN' ? 'text-red-600' : 'text-gray-400');
        const gpsDiffClass2 = comp2.gpsImprovement === 'UP' ? 'text-green-600' : (comp2.gpsImprovement === 'DOWN' ? 'text-red-600' : 'text-gray-400');
        
        const totalTakenE1 = row.totalTaken || 0;
        const totalTakenE2 = comp.totalTaken || 0;
        const totalTakenE3 = comp2.totalTaken || 0;

        const subjectCells = subjects.map(subject => {
            const sr = row.subjects.find(item => item.kod === subject.kod) || {};
            
            // Perbezaan E1 vs E2
            let diffHtml = '-';
            let diffClass = 'text-gray-400';
            if (sr.diffStatus) {
                if (sr.diffStatus.type === 'UP') diffClass = 'text-green-600 font-bold';
                else if (sr.diffStatus.type === 'DOWN') diffClass = 'text-red-600 font-bold';
                else if (sr.diffStatus.type === 'NEW') diffClass = 'text-blue-600 font-bold';
                else if (sr.diffStatus.type === 'DROP') diffClass = 'text-rose-600 font-bold';
                diffHtml = sr.diffStatus.label;
            }

            // Perbezaan E1 vs E3
            let diffHtml2 = '-';
            let diffClass2 = 'text-gray-400';
            if (isE3 && sr.diffStatus2) {
                if (sr.diffStatus2.type === 'UP') diffClass2 = 'text-green-600 font-bold';
                else if (sr.diffStatus2.type === 'DOWN') diffClass2 = 'text-red-600 font-bold';
                else if (sr.diffStatus2.type === 'NEW') diffClass2 = 'text-blue-600 font-bold';
                else if (sr.diffStatus2.type === 'DROP') diffClass2 = 'text-rose-600 font-bold';
                diffHtml2 = sr.diffStatus2.label;
            }

            const e1Display = sr.isTaken ? `${escapeStudentAchievementHTML(sr.markah || '-')} <div class="text-[10px] text-gray-500 leading-none mt-0.5">(${escapeStudentAchievementHTML(sr.gred || '-')})</div>` : '-';
            const e2Display = sr.compIsTaken ? `${escapeStudentAchievementHTML(sr.compMark || '-')} <div class="text-[10px] text-gray-400 leading-none mt-0.5">(${escapeStudentAchievementHTML(sr.compGrade || '-')})</div>` : '-';
            const e3Display = sr.comp2IsTaken ? `${escapeStudentAchievementHTML(sr.comp2Mark || '-')} <div class="text-[10px] text-emerald-600/70 leading-none mt-0.5">(${escapeStudentAchievementHTML(sr.comp2Grade || '-')})</div>` : '-';

            const bgE1 = sr.isTaken && !sr.isPass && sr.gred !== 'TH' && sr.gred !== 'T' ? 'bg-red-50/20 text-red-700 font-bold' : (sr.isTaken ? 'bg-blue-50/10 text-gray-800' : 'bg-gray-50/20 text-gray-400');

            return `
                <td class="text-center align-middle border-r border-gray-100 ${bgE1}">${e1Display}</td>
                <td class="text-center align-middle border-r border-gray-100 bg-gray-50/30 text-gray-500 text-xs">${e2Display}</td>
                ${isE3 ? `<td class="text-center align-middle border-r border-emerald-100/50 bg-emerald-50/20 text-emerald-800/80 text-xs">${e3Display}</td>` : ''}
                <td class="text-center align-middle border-r border-gray-200 bg-gray-50/50 text-[10px] ${diffClass}">${diffHtml}</td>
                ${isE3 ? `<td class="text-center align-middle border-r border-gray-200 bg-gray-100/30 text-[10px] ${diffClass2}">${diffHtml2}</td>` : ''}
            `;
        }).join('');

        return `
            <tr class="transition-colors text-gray-700 hover:bg-cyan-50/20 border-b border-gray-100">
                <td class="text-center text-gray-400 border-r border-gray-100">${index + 1}</td>
                <td class="text-center text-[11px] font-mono text-gray-600 border-r border-gray-100">
                    <div>${escapeStudentAchievementHTML(row.id_individu || '-')}</div>
                    <div class="text-gray-400">${escapeStudentAchievementHTML(row.no_kp || '-')}</div>
                </td>
                <td class="text-left border-r border-gray-100">
                    <div class="font-bold text-gray-800 uppercase text-xs tracking-tight">${escapeStudentAchievementHTML(row.nama_murid || '-')}</div>
                    <div class="text-[10px] text-gray-400 uppercase">${escapeStudentAchievementHTML(row.jantina || '-')} | ${escapeStudentAchievementHTML(row.kaum || '-')}</div>
                </td>
                <td class="text-center font-semibold text-gray-700 border-r border-gray-200">${escapeStudentAchievementHTML(row.kelas || '-')}</td>
                
                <!-- Subjek Diambil -->
                <td class="text-center font-bold text-blue-700 bg-gray-50/50 border-r border-gray-100">${totalTakenE1}</td>
                <td class="text-center text-gray-500 bg-gray-50/50 border-r border-gray-200">${totalTakenE2}</td>
                ${isE3 ? `<td class="text-center text-emerald-700 bg-emerald-50/50 border-r border-gray-200">${totalTakenE3}</td>` : ''}
                
                <!-- Status LMS -->
                <td class="text-center font-bold border-r border-gray-100 ${row.lmsStatus === 'LMS' ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-700 bg-rose-50/50'}">${escapeStudentAchievementHTML(row.lmsStatus || '-')}</td>
                <td class="text-center text-[10px] font-semibold border-r border-emerald-100 ${comp.lmsStatus === 'LMS' ? 'text-emerald-600 bg-emerald-50/30' : 'text-rose-600 bg-rose-50/30'}">${escapeStudentAchievementHTML(comp.lmsStatus || '-')}</td>
                ${isE3 ? `<td class="text-center text-[10px] font-semibold border-r border-emerald-100 ${comp2.lmsStatus === 'LMS' ? 'text-emerald-600 bg-emerald-50/30' : 'text-rose-600 bg-rose-50/30'}">${escapeStudentAchievementHTML(comp2.lmsStatus || '-')}</td>` : ''}
                
                <!-- GPS -->
                <td class="text-center font-bold text-gray-900 bg-indigo-50/50 border-r border-gray-100">${escapeStudentAchievementHTML(row.gpsText || '-')}</td>
                <td class="text-center text-gray-500 bg-indigo-50/30 border-r border-gray-100 text-xs">${escapeStudentAchievementHTML(comp.gpsText || '-')}</td>
                ${isE3 ? `<td class="text-center text-emerald-700 bg-emerald-50/30 border-r border-gray-100 text-xs">${escapeStudentAchievementHTML(comp2.gpsText || '-')}</td>` : ''}
                <td class="text-center font-bold bg-indigo-100/50 border-r border-indigo-200 text-xs ${gpsDiffClass}">${escapeStudentAchievementHTML(comp.gpsDiffText || '-')}</td>
                ${isE3 ? `<td class="text-center font-bold bg-indigo-100/50 border-r border-indigo-200 text-xs ${gpsDiffClass2}">${escapeStudentAchievementHTML(comp2.gpsDiffText || '-')}</td>` : ''}
                
                <!-- Gred & Markah -->
                ${subjectCells}
            </tr>
        `;
    } else {
        // SINGLE MODE ROW
        const subjectCells = subjects.map(subject => {
            const subjectResult = row.subjects.find(item => item.kod === subject.kod);
            return `<td class="${getStudentAchievementSubjectCellClass(subjectResult)} border-r border-gray-100">${getStudentAchievementSubjectDisplay(subjectResult)}</td>`;
        }).join('');

        return `
            <tr class="transition-colors text-gray-700 hover:bg-cyan-50/20 border-b border-gray-100">
                <td class="text-center text-gray-400 border-r border-gray-100">${index + 1}</td>
                <td class="text-center text-[11px] font-mono text-gray-600 border-r border-gray-100">
                    <div>${escapeStudentAchievementHTML(row.id_individu || '-')}</div>
                    <div class="text-gray-400">${escapeStudentAchievementHTML(row.no_kp || '-')}</div>
                </td>
                <td class="text-left border-r border-gray-100">
                    <div class="font-bold text-gray-800 uppercase text-xs tracking-tight">${escapeStudentAchievementHTML(row.nama_murid || '-')}</div>
                    <div class="text-[10px] text-gray-400 uppercase">${escapeStudentAchievementHTML(row.jantina || '-')} | ${escapeStudentAchievementHTML(row.kaum || '-')}</div>
                </td>
                <td class="text-center font-semibold text-gray-700 border-r border-gray-100">${escapeStudentAchievementHTML(row.kelas || '-')}</td>
                <td class="text-center text-gray-600 border-r border-gray-100">${row.totalTaken || 0}</td>
                <td class="text-center font-bold text-emerald-700 border-r border-gray-100">${row.totalPass || 0}</td>
                <td class="text-center font-bold text-rose-700 border-r border-gray-100">${row.totalFail || 0}</td>
                <td class="text-center font-bold text-indigo-700 border-r border-gray-100">${row.totalCredit || 0}</td>
                <td class="text-center font-bold text-gray-900 border-r border-gray-100">${escapeStudentAchievementHTML(row.gpsText || '-')}</td>
                <td class="border-r border-gray-100 ${getStudentAchievementStatusClass(row.lmsStatus)}">${escapeStudentAchievementHTML(row.lmsStatus || '-')}</td>
                ${subjectCells}
                <td class="text-left text-[10px] text-rose-700 font-semibold align-middle leading-snug break-words max-w-[150px]">${escapeStudentAchievementHTML(row.issueText || '-')}</td>
            </tr>
        `;
    }
}

function getStudentAchievementEmptyRow(colspan, message) {
    return `
        <tr>
            <td colspan="${colspan}" class="text-center py-10 text-sm text-gray-400 italic">
                ${escapeStudentAchievementHTML(message)}
            </td>
        </tr>
    `;
}

// [SURGICAL EDIT] Mengintegrasikan Header E3 dan BZA 2 dalam paparan pelajar
function getStudentAchievementHeader(subjects, isCompare, context = {}) {
    if (isCompare) {
        const isE3 = !!context.exam3;

        const subjectHeaders = subjects.map(subject => `
            <th class="border-r border-gray-300 text-center ${isE3 ? 'min-w-[180px]' : 'min-w-[140px]'} px-2 py-2" colspan="${isE3 ? 5 : 3}" title="${escapeStudentAchievementHTML(subject.nama)}">
                <div class="font-bold">${escapeStudentAchievementHTML(subject.kod)}</div>
                <div class="text-[9px] font-medium text-gray-500 normal-case leading-tight mt-0.5">${escapeStudentAchievementHTML(subject.nama)}</div>
            </th>
        `).join('');

        const subjectSubHeaders = subjects.map(subject => `
            <th class="border-r border-gray-200 text-center text-[10px] bg-blue-50/50 w-16 py-1">E1</th>
            <th class="border-r border-gray-200 text-center text-[10px] bg-gray-50/50 w-16 py-1">E2</th>
            ${isE3 ? `<th class="border-r border-emerald-100/50 text-center text-[10px] bg-emerald-50/50 w-16 py-1">E3</th>` : ''}
            <th class="border-r border-gray-300 text-center text-[10px] bg-gray-100 w-16 py-1">BZA 1</th>
            ${isE3 ? `<th class="border-r border-gray-300 text-center text-[10px] bg-gray-100/50 w-16 py-1">BZA 2</th>` : ''}
        `).join('');

        return `
            <tr>
                <th rowspan="2" class="border-r border-b text-center w-10 bg-gray-50">Bil</th>
                <th rowspan="2" class="border-r border-b text-center min-w-[120px] bg-gray-50">ID / KP</th>
                <th rowspan="2" class="border-r border-b text-left min-w-[200px] bg-gray-50">Nama Murid</th>
                <th rowspan="2" class="border-r border-b text-center min-w-[80px] bg-gray-50">Kelas</th>
                <th colspan="${isE3 ? 3 : 2}" class="border-r border-b border-gray-300 text-center bg-gray-100">Subjek (Ambil)</th>
                <th colspan="${isE3 ? 3 : 2}" class="border-r border-b border-emerald-200 text-center bg-emerald-50">LMS</th>
                <th colspan="${isE3 ? 5 : 3}" class="border-r border-b border-indigo-200 text-center bg-indigo-50">GPS</th>
                ${subjectHeaders}
            </tr>
            <tr class="text-[10px]">
                <!-- Ambil -->
                <th class="border-r border-b border-gray-200 text-center bg-gray-50 py-1">E1</th>
                <th class="border-r border-b border-gray-300 text-center bg-gray-50 py-1">E2</th>
                ${isE3 ? `<th class="border-r border-b border-emerald-200 text-center bg-emerald-50 py-1">E3</th>` : ''}
                
                <!-- LMS -->
                <th class="border-r border-b border-emerald-200 text-center bg-emerald-50 py-1">E1</th>
                <th class="border-r border-b border-emerald-200 text-center bg-emerald-50 py-1">E2</th>
                ${isE3 ? `<th class="border-r border-b border-emerald-200 text-center bg-emerald-50 py-1">E3</th>` : ''}

                <!-- GPS -->
                <th class="border-r border-b border-indigo-200 text-center bg-indigo-50 py-1">E1</th>
                <th class="border-r border-b border-indigo-200 text-center bg-indigo-50 py-1">E2</th>
                ${isE3 ? `<th class="border-r border-b border-emerald-200 text-center bg-emerald-50 py-1">E3</th>` : ''}
                <th class="border-r border-b border-indigo-300 text-center bg-indigo-100 font-bold py-1">BZA 1</th>
                ${isE3 ? `<th class="border-r border-b border-indigo-300 text-center bg-indigo-100/50 font-bold py-1">BZA 2</th>` : ''}
                
                <!-- Gred Matriks -->
                ${subjectSubHeaders}
            </tr>
        `;
    }

    const subjectHeaders = subjects.map(subject => `
        <th class="border-r text-center min-w-[90px] px-2 py-2 align-middle bg-gray-50" title="${escapeStudentAchievementHTML(subject.nama)}">
            <div class="font-bold">${escapeStudentAchievementHTML(subject.kod)}</div>
            <div class="text-[9px] font-medium text-gray-500 normal-case leading-tight mt-0.5">${escapeStudentAchievementHTML(subject.nama)}</div>
        </th>
    `).join('');

    return `
        <tr>
            <th class="border-r border-b text-center w-10 bg-gray-50">Bil</th>
            <th class="border-r border-b text-center min-w-[120px] bg-gray-50">ID / KP</th>
            <th class="border-r border-b text-left min-w-[220px] bg-gray-50">Nama Murid</th>
            <th class="border-r border-b text-center min-w-[80px] bg-gray-50">Kelas</th>
            <th class="border-r border-b text-center min-w-[70px] bg-gray-50">Subjek</th>
            <th class="border-r border-b text-center min-w-[70px] bg-gray-50">Lulus</th>
            <th class="border-r border-b text-center min-w-[70px] bg-gray-50">Gagal</th>
            <th class="border-r border-b text-center min-w-[70px] bg-gray-50">Kredit</th>
            <th class="border-r border-b text-center min-w-[70px] bg-gray-50">GPS</th>
            <th class="border-r border-b text-center min-w-[70px] bg-gray-50">LMS</th>
            ${subjectHeaders}
            <th class="border-r border-b text-left min-w-[180px] bg-gray-50">Isu</th>
        </tr>
    `;
}

function updateStudentAchievementInfo(data, isCompare) {
    const info = document.getElementById('studentAchievementInfo');
    if (!info) return;

    const summary = data?.summary || {};
    const subjects = Array.isArray(data?.subjects) ? data.subjects : [];
    const rows = Array.isArray(data?.rows) ? data.rows : [];

    if (rows.length === 0) {
        info.innerHTML = 'Tiada rekod pelajar untuk dipaparkan bagi pilihan semasa.';
        return;
    }

    if (isCompare) {
        info.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                <div><span class="text-gray-400">Calon Diperiksa:</span> <span class="text-gray-900 font-bold">${summary.totalStudents || 0}</span></div>
                <div><span class="text-gray-400">Subjek Dikesan:</span> <span class="text-gray-900 font-bold">${subjects.length}</span></div>
                <div class="col-span-2 text-right"><span class="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">▲ Peningkatan</span> <span class="text-red-600 bg-red-50 px-2 py-1 rounded ml-2">▼ Penurunan</span> <span class="text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">Subjek Baru</span></div>
            </div>
        `;
    } else {
        info.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
                <div><span class="text-gray-400">Calon:</span> <span class="text-gray-900 font-bold">${summary.totalStudents || 0}</span></div>
                <div><span class="text-gray-400">Subjek Dikesan:</span> <span class="text-gray-900 font-bold">${subjects.length}</span></div>
                <div><span class="text-gray-400">GPS:</span> <span class="text-gray-900 font-bold">${escapeStudentAchievementHTML(summary.gpsText || '-')}</span></div>
                <div><span class="text-gray-400">% LMS:</span> <span class="text-emerald-700 font-bold">${escapeStudentAchievementHTML(summary.lmsPercentText || '0.00%')}</span></div>
                <div><span class="text-gray-400">TLMS:</span> <span class="text-rose-700 font-bold">${summary.totalTLMS || 0}</span></div>
            </div>
        `;
    }
}

export function renderStudentAchievementTable(data, context = {}) {
    const thead = document.getElementById('theadStudentAchievement');
    const tbody = document.getElementById('tbodyStudentAchievement');
    const subtitle = document.getElementById('studentAchievementSubtitle');

    if (!thead || !tbody) return;

    const subjects = Array.isArray(data?.subjects) ? data.subjects : [];
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    
    // Semak mod perbandingan (daripada context atau kehadiran objek comparison)
    const isCompare = context.isCompare || (rows.length > 0 && rows[0].comparison !== undefined && rows[0].comparison !== null);
    const isE3 = !!context.exam3;

    const totalColumns = isCompare ? (isE3 ? 14 : 11) + (subjects.length * (isE3 ? 5 : 3)) : 11 + subjects.length;

    thead.innerHTML = getStudentAchievementHeader(subjects, isCompare, context);

    if (subtitle) {
        const examText = context.exam ? escapeStudentAchievementHTML(context.exam) : '';
        const formText = context.form ? escapeStudentAchievementHTML(context.form) : '';
        const schoolText = context.school ? escapeStudentAchievementHTML(context.school) : '';
        const exam2Text = context.exam2 ? escapeStudentAchievementHTML(context.exam2) : '';
        const exam3Text = context.exam3 ? escapeStudentAchievementHTML(context.exam3) : '';
        
        let subtitleParts = [];
        if (isCompare && exam2Text) {
            const comparisonStr = exam3Text ? `Perbandingan: ${examText} vs ${exam2Text} vs ${exam3Text}` : `Perbandingan: ${examText} vs ${exam2Text}`;
            subtitleParts = [comparisonStr, formText, schoolText].filter(Boolean);
        } else {
            subtitleParts = [examText, formText, schoolText].filter(Boolean);
        }

        subtitle.innerHTML = subtitleParts.length > 0
            ? subtitleParts.join(' <span class="mx-2 text-gray-300">|</span> ')
            : 'Paparan murid berdasarkan data analisis semasa';
    }

    updateStudentAchievementInfo(data, isCompare);

    if (rows.length === 0) {
        tbody.innerHTML = getStudentAchievementEmptyRow(totalColumns, 'Tiada rekod pelajar untuk dipaparkan.');
        return;
    }

    tbody.innerHTML = rows
        .map((row, index) => getStudentAchievementRow(row, index, subjects, isCompare, context))
        .join('');
}
// ── SURGICAL EDIT END ──