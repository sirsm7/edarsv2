// ==========================================
// EDARS V3.0 - UI RENDER MODULE (REFACTORED)
// Menguruskan orkestrasi DOM. Logik HTML dipindahkan ke templates.js.
// ==========================================

import { exportTableToExcel } from './utils.js';
import { SUBJECT_PRIORITY, NAMA_SUBJEK } from './config.js';
import * as Templates from './templates.js';

// ==========================================
// 1. HELPER: SORTING SUBJEK
// ==========================================

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
    const theadComp = document.querySelector('#tableCompSubject thead');
    if (theadComp) theadComp.innerHTML = Templates.getComponentSimpleHeader();

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
                <td class="font-medium text-left whitespace-nowrap">
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
// 6. RENDER COMPARISON (PERBANDINGAN E1 vs E2)
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

export function renderComparisonTables(data, names) {
    const { schoolMap, subMap, districtStats } = data; 
    const { name1, name2 } = names;

    document.getElementById('headExam1').innerText = name1; 
    document.getElementById('headExam2').innerText = name2;
    document.getElementById('headSubExam1').innerText = name1; 
    document.getElementById('headSubExam2').innerText = name2;
    document.getElementById('headTLMSExam1').innerText = name1; 
    document.getElementById('headTLMSExam2').innerText = name2;

    if (districtStats) renderComparisonKPICards(districtStats);

    // 1. Jadual Banding Sekolah (GPS/LMS)
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

            return `
            <tr class="transition-colors text-gray-700">
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
                <td class="text-center font-bold bg-gray-100 ${colorGPS}">${Math.abs(diffGPS).toFixed(2)} <span class="pdf-arrow text-xs ml-1">${arrowGPS}</span></td>
                <td class="text-center font-bold bg-gray-100 ${colorLMS}">${Math.abs(diffLMS).toFixed(2)}% <span class="pdf-arrow text-xs ml-1">${arrowLMS}</span></td>
            </tr>`;
        }).join('');

    // 2. Jadual Banding TLMS
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

            return `
            <tr class="transition-colors text-gray-700">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="font-medium text-left">
                    <span class="text-gray-400 text-[10px] block leading-none">[${s.code}]</span>
                    <span class="font-semibold uppercase text-xs tracking-tight">${s.name}</span>
                </td>
                <td class="text-center bg-red-50/30 font-bold text-gray-700">${tlms1}</td>
                <td class="text-center bg-red-50/30 text-red-600 font-bold">${tlmsPerc1.toFixed(2)}%</td>
                <td class="text-center bg-red-100/50 font-bold text-gray-700">${tlms2}</td>
                <td class="text-center bg-red-100/50 text-red-600 font-bold">${tlmsPerc2.toFixed(2)}%</td>
                <td class="text-center font-bold bg-gray-100 ${colorTLMS}">${Math.abs(tlms1 - tlms2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorTLMS}">${Math.abs(diffTLMSPerc).toFixed(2)}% <span class="pdf-arrow text-xs ml-1">${arrowTLMS}</span></td>
            </tr>`;
        }).join('');

    // 3. Jadual Banding Subjek
    document.getElementById('tbodyCompareSubjects').innerHTML = Object.values(subMap)
        .sort(sortSubjects)
        .map((s, i) => {
            const getStats = (o) => ({ gpmp: o.ct > 0 ? (o.pt/o.ct) : 0, perc: o.ct > 0 ? (o.lulus/o.ct)*100 : 0 }); 
            const st1 = getStats(s.ex1); 
            const st2 = getStats(s.ex2); 
            const diffGP = st1.gpmp - st2.gpmp; 
            const isGPBetter = diffGP < 0; 
            const colorClassGP = diffGP === 0 ? 'text-gray-400' : (isGPBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowVisual = diffGP > 0 ? '▲' : (diffGP < 0 ? '▼' : '-');

            const diffLulus = st1.perc - st2.perc;
            const isLulusBetter = diffLulus > 0;
            const colorClassLulus = diffLulus === 0 ? 'text-gray-400' : (isLulusBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            
            return `
            <tr class="transition-colors text-gray-700">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="text-center font-bold text-gray-600">${s.kod}</td>
                <td class="text-xs font-medium uppercase text-left tracking-wide">${s.nama}</td>
                <td class="text-center bg-gray-50/50 text-blue-700 font-medium">${st1.perc.toFixed(2)}%</td>
                <td class="text-center bg-gray-50/50 font-bold text-gray-800">${st1.gpmp.toFixed(2)}</td>
                <td class="text-center bg-orange-50/30 text-blue-700 font-medium">${st2.perc.toFixed(2)}%</td>
                <td class="text-center bg-orange-50/30 font-bold text-gray-800">${st2.gpmp.toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorClassGP}">${Math.abs(diffGP).toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorClassLulus}">${Math.abs(diffLulus).toFixed(2)}%</td>
                <td class="text-center font-bold ${colorClassGP}"><span class="pdf-arrow text-sm">${arrowVisual}</span></td>
            </tr>`;
        }).join('');
}

export function renderComparisonComponentTable(data, names) {
    const { subMap, schoolMap, districtStats, comparisonMatrix } = data;
    const { name1, name2 } = names;

    document.getElementById('headCompSubExam1').innerText = name1; 
    document.getElementById('headCompSubExam2').innerText = name2;
    document.getElementById('headCompSchoolExam1').innerText = name1; 
    document.getElementById('headCompSchoolExam2').innerText = name2;

    if (districtStats) renderComparisonKPICards(districtStats);

    document.getElementById('tbodyCompareCompSubjects').innerHTML = Object.values(subMap)
        .sort(sortSubjects)
        .map((s, i) => {
            const getStats = (o) => ({ gpmp: o.ct > 0 ? (o.pt/o.ct) : 0, perc: o.ct > 0 ? (o.lulus/o.ct)*100 : 0 }); 
            const st1 = getStats(s.ex1); 
            const st2 = getStats(s.ex2); 
            const diffGP = st1.gpmp - st2.gpmp; 
            const isGPBetter = diffGP < 0; 
            const colorClassGP = diffGP === 0 ? 'text-gray-400' : (isGPBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold'); 
            const arrowVisual = diffGP > 0 ? '▲' : (diffGP < 0 ? '▼' : '-');
            
            const diffLulus = st1.perc - st2.perc;
            const isLulusBetter = diffLulus > 0;
            const colorClassLulus = diffLulus === 0 ? 'text-gray-400' : (isLulusBetter ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            
            return `
            <tr class="transition-colors text-gray-700 hover:bg-pink-50/10">
                <td class="text-center text-gray-400">${i+1}</td>
                <td class="text-center font-bold text-gray-600">${s.kod}</td>
                <td class="text-xs font-medium uppercase text-left tracking-wide">${s.nama}</td>
                <td class="text-center bg-gray-50/50 text-blue-700 font-medium">${st1.perc.toFixed(2)}%</td>
                <td class="text-center bg-gray-50/50 font-bold text-gray-800">${st1.gpmp.toFixed(2)}</td>
                <td class="text-center bg-pink-50/30 text-blue-700 font-medium">${st2.perc.toFixed(2)}%</td>
                <td class="text-center bg-pink-50/30 font-bold text-gray-800">${st2.gpmp.toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorClassGP}">${Math.abs(diffGP).toFixed(2)}</td>
                <td class="text-center font-bold bg-gray-100 ${colorClassLulus}">${Math.abs(diffLulus).toFixed(2)}%</td>
                <td class="text-center font-bold ${colorClassGP}"><span class="pdf-arrow text-sm">${arrowVisual}</span></td>
            </tr>`;
        }).join('');

    if (comparisonMatrix) {
        renderDetailedComparisonTables(comparisonMatrix);
    }

    document.getElementById('tbodyCompareCompSchools').innerHTML = Object.values(schoolMap)
        .sort((a,b) => (a.code || "").localeCompare(b.code || ""))
        .map((s, i) => {
            const gpk1 = s.ex1.gpk;
            const gpk2 = s.ex2.gpk;
            const diffGPK = gpk1 - gpk2;
            const colorClass = diffGPK === 0 ? 'text-gray-400' : (diffGPK < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold');
            const arrowVisual = diffGPK > 0 ? '▲' : (diffGPK < 0 ? '▼' : '-');

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
                <td class="text-center font-bold bg-gray-100 ${colorClass}">${Math.abs(diffGPK).toFixed(2)}</td>
                <td class="text-center font-bold ${colorClass}"><span class="pdf-arrow text-sm">${arrowVisual}</span></td>
            </tr>`;
        }).join('');
}

function renderDetailedComparisonTables(comparisonMatrix) {
    const container = document.getElementById('comparisonDetailedContainer');
    if (!container) return;
    container.innerHTML = '';

    const subjects = Object.keys(comparisonMatrix).sort(sortSubjects);
    if (subjects.length === 0) return;

    let fullHTML = '';
    const headerHtml = Templates.getComparisonDetailHeader();

    subjects.forEach(kod => {
        const subData = comparisonMatrix[kod];
        const subName = NAMA_SUBJEK[kod] || kod;
        const tableId = `tableCompDetail_${kod}`;
        const btnPdfId = `btnCompPdf_${kod}`;
        const btnExcelId = `btnCompExcel_${kod}`;

        const rows = Object.values(subData)
            .sort((a,b) => (a.code || "").localeCompare(b.code || ""))
            .map((s, i) => Templates.getComparisonDetailRow(s, i)).join('');

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