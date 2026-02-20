// ==========================================
// EDARS V3.0 - TEMPLATES MODULE
// Mengandungi semua struktur HTML (View Layer).
// Fungsi tulen: Input Data -> Output HTML String.
// ==========================================

import { getLMSColor } from './utils.js';
import { NAMA_SUBJEK } from './config.js';

// ... (Kekalkan fungsi header subjek lain seperti sedia ada) ...
// ... (getComplexSubjectHeader, getComponentSchoolHeader, etc) ...

export function getComplexSubjectHeader() {
    return `
    <tr>
        <th rowspan="2" class="w-10 text-center border-r bg-gray-50">BIL</th>
        <th rowspan="2" class="w-16 text-center border-r bg-gray-50">KOD</th>
        <th rowspan="2" class="text-left border-r bg-gray-50">MATA PELAJARAN</th>
        <th rowspan="2" class="w-16 text-center border-r bg-gray-50">DAFTAR</th>
        <th rowspan="2" class="w-16 text-center border-r bg-gray-50">HADIR</th>
        <th colspan="5" class="text-center bg-emerald-50 text-emerald-800 border-b border-emerald-200 border-r">CEMERLANG</th>
        <th colspan="6" class="text-center bg-blue-50 text-blue-800 border-b border-blue-200 border-r">KEPUJIAN</th>
        <th colspan="2" class="text-center bg-indigo-50 text-indigo-800 border-b border-indigo-200 border-r">KREDIT (A-C)</th>
        <th rowspan="2" class="w-10 text-center border-r bg-gray-50">D</th>
        <th rowspan="2" class="w-10 text-center border-r bg-gray-50">E</th>
        <th rowspan="2" class="w-10 text-center border-r bg-red-50 text-red-600 font-bold">G</th>
        <th rowspan="2" class="w-16 text-center border-r bg-blue-50 text-blue-700 font-bold">% LULUS</th>
        <th rowspan="2" class="w-16 text-center bg-gray-100 font-bold">GPMP</th>
    </tr>
    <tr class="text-[10px]">
        <th class="text-center bg-emerald-50/50 text-emerald-700 border-r">A+</th>
        <th class="text-center bg-emerald-50/50 text-emerald-700 border-r">A</th>
        <th class="text-center bg-emerald-50/50 text-emerald-700 border-r">A-</th>
        <th class="text-center bg-emerald-100 text-emerald-900 font-bold border-r">JUM</th>
        <th class="text-center bg-emerald-100 text-emerald-900 font-bold border-r">%</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">B+</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">B</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">C+</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">C</th>
        <th class="text-center bg-blue-100 text-blue-900 font-bold border-r">JUM</th>
        <th class="text-center bg-blue-100 text-blue-900 font-bold border-r">%</th>
        <th class="text-center bg-indigo-100 text-indigo-900 font-bold border-r">JUM</th>
        <th class="text-center bg-indigo-100 text-indigo-900 font-bold border-r">%</th>
    </tr>`;
}

export function getComponentSchoolHeader() {
    return `
    <tr>
        <th rowspan="2" class="w-10 text-center border-r bg-gray-50">BIL</th>
        <th rowspan="2" class="w-20 text-center border-r bg-gray-50">KOD SEKOLAH</th>
        <th rowspan="2" class="text-left border-r bg-gray-50">NAMA SEKOLAH</th>
        <th rowspan="2" class="w-16 text-center border-r bg-gray-50">DAFTAR</th>
        <th rowspan="2" class="w-16 text-center border-r bg-gray-50">HADIR</th>
        <th colspan="5" class="text-center bg-emerald-50 text-emerald-800 border-b border-emerald-200 border-r">CEMERLANG</th>
        <th colspan="6" class="text-center bg-blue-50 text-blue-800 border-b border-blue-200 border-r">KEPUJIAN</th>
        <th colspan="2" class="text-center bg-indigo-50 text-indigo-800 border-b border-indigo-200 border-r">KREDIT (A-C)</th>
        <th rowspan="2" class="w-10 text-center border-r bg-gray-50">D</th>
        <th rowspan="2" class="w-10 text-center border-r bg-gray-50">E</th>
        <th rowspan="2" class="w-10 text-center border-r bg-red-50 text-red-600 font-bold">G</th>
        <th rowspan="2" class="w-16 text-center border-r bg-blue-50 text-blue-700 font-bold">% LULUS</th>
        <th rowspan="2" class="w-16 text-center bg-gray-100 font-bold">GPMP</th>
    </tr>
    <tr class="text-[10px]">
        <th class="text-center bg-emerald-50/50 text-emerald-700 border-r">A+</th>
        <th class="text-center bg-emerald-50/50 text-emerald-700 border-r">A</th>
        <th class="text-center bg-emerald-50/50 text-emerald-700 border-r">A-</th>
        <th class="text-center bg-emerald-100 text-emerald-900 font-bold border-r">JUM</th>
        <th class="text-center bg-emerald-100 text-emerald-900 font-bold border-r">%</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">B+</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">B</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">C+</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">C</th>
        <th class="text-center bg-blue-100 text-blue-900 font-bold border-r">JUM</th>
        <th class="text-center bg-blue-100 text-blue-900 font-bold border-r">%</th>
        <th class="text-center bg-indigo-100 text-indigo-900 font-bold border-r">JUM</th>
        <th class="text-center bg-indigo-100 text-indigo-900 font-bold border-r">%</th>
    </tr>`;
}

export function getComponentSimpleHeader() {
    return `
    <tr>
        <th class="w-10 text-center border-r bg-gray-50">BIL</th>
        <th class="w-20 text-center border-r bg-gray-50">KOD</th>
        <th class="text-left border-r bg-gray-50">MATA PELAJARAN</th>
        <th class="w-16 text-center border-r bg-gray-50">AMBIL</th>
        <th class="w-16 text-center border-r bg-gray-50">HADIR</th>
        <th class="w-20 text-center border-r bg-blue-50 text-blue-700">% LULUS</th>
        <th class="w-16 text-center bg-gray-100 font-bold">GPMP</th>
    </tr>`;
}

export function getComparisonDetailHeader() {
    return `
    <thead>
    <tr>
        <th rowspan="2" class="w-10 text-center border-r bg-gray-50">BIL</th>
        <th rowspan="2" class="text-left border-r bg-gray-50">NAMA SEKOLAH</th>
        <th colspan="3" class="text-center bg-emerald-50 text-emerald-800 border-b border-emerald-200 border-r">CEMERLANG (%)</th>
        <th colspan="3" class="text-center bg-blue-50 text-blue-800 border-b border-blue-200 border-r">KEPUJIAN (%)</th>
        <th colspan="3" class="text-center bg-indigo-50 text-indigo-800 border-b border-indigo-200 border-r">LULUS (%)</th>
        <th colspan="3" class="text-center bg-gray-100 text-gray-900 border-b border-gray-300">GPMP</th>
    </tr>
    <tr class="text-[10px]">
        <th class="text-center bg-emerald-50/50 text-emerald-700 border-r">E1</th>
        <th class="text-center bg-emerald-50/30 text-gray-500 border-r">E2</th>
        <th class="text-center bg-emerald-100 text-emerald-900 font-bold border-r">BEZA</th>
        <th class="text-center bg-blue-50/50 text-blue-700 border-r">E1</th>
        <th class="text-center bg-blue-50/30 text-gray-500 border-r">E2</th>
        <th class="text-center bg-blue-100 text-blue-900 font-bold border-r">BEZA</th>
        <th class="text-center bg-indigo-50/50 text-indigo-700 border-r">E1</th>
        <th class="text-center bg-indigo-50/30 text-gray-500 border-r">E2</th>
        <th class="text-center bg-indigo-100 text-indigo-900 font-bold border-r">BEZA</th>
        <th class="text-center bg-gray-50 text-gray-800 border-r">E1</th>
        <th class="text-center bg-gray-50 text-gray-500 border-r">E2</th>
        <th class="text-center bg-gray-200 text-gray-900 font-bold">BEZA</th>
    </tr>
    </thead>`;
}

// ------------------------------------------
// KPI EXPORT HEADER (DYNAMIC & EXCEL STRUCTURE)
// ------------------------------------------
export function getKPIExportHeader(nameE1 = "EXAM 1", nameE2 = "EXAM 2") {
    // Baris 1: Tajuk Utama
    // Baris 2: Header Utama
    // Baris 3: Keterangan (Dinamik mengikut nama Exam sebenar)
    
    // Pastikan input selamat (uppercase)
    const n1 = nameE1.toUpperCase();
    const n2 = nameE2.toUpperCase();

    return `
    <thead>
        <tr>
            <th colspan="14" class="text-center font-bold bg-gray-200 border text-xl p-4">JADUAL INTERAKTIF PENETAPAN KPI</th>
        </tr>
        <tr class="bg-gray-100 font-bold text-center">
            <th class="border p-2 w-10">BIL</th>
            <th class="border p-2 w-24">KOD SEKOLAH</th>
            <th class="border p-2 text-left">NAMA SEKOLAH</th>
            
            <th class="border p-2 bg-yellow-50 w-24">TOV</th>
            <th class="border p-2 bg-blue-50 w-24">OTI 1</th>
            <th class="border p-2 bg-green-50 w-24">AR 1</th>
            <th class="border p-2 bg-green-100 w-24">PRESTASI</th>
            
            <th class="border p-2 bg-blue-50 w-24">OTI 2</th>
            <th class="border p-2 bg-white w-24">AR 2</th>
            <th class="border p-2 bg-white w-24">PRESTASI</th>
            
            <th class="border p-2 bg-blue-50 w-24">OTI 3</th>
            <th class="border p-2 bg-white w-24">AR 3</th>
            <th class="border p-2 bg-white w-24">PRESTASI</th>
            
            <th class="border p-2 bg-purple-50 w-24">KPI TAHUN SEMASA</th>
        </tr>
        <tr class="bg-gray-50 text-[10px] text-center text-gray-500">
            <th class="border"></th>
            <th class="border"></th>
            <th class="border"></th>
            
            <th class="border">GPS DARI ${n2}</th>
            <th class="border">TOV - (TOV*5%)</th>
            <th class="border">GPS DARI ${n1}</th>
            <th class="border">TOV - AR 1 / TOV</th>
            
            <th class="border">TOV - (TOV*10%)</th>
            <th class="border">BIARKAN KOSONG</th>
            <th class="border">TOV - AR 2 / TOV</th>
            
            <th class="border">TOV - (TOV*20%)</th>
            <th class="border">BIARKAN KOSONG</th>
            <th class="border">TOV - AR 3 / TOV</th>
            
            <th class="border">BIARKAN KOSONG</th>
        </tr>
    </thead>`;
}

// ... (Kekalkan fungsi baris lain seperti sedia ada) ...
// ... (getAggregateRow, getSubjectStatsRow, etc) ...

export function getAggregateRow(s, i) {
    const plbm = s.bm.hadir>0 ? (s.bm.lulus/s.bm.hadir*100).toFixed(2) : "0.00"; 
    const gpbm = s.bm.hadir>0 ? (s.bm.point/s.bm.hadir).toFixed(2) : "-"; 
    const plsej = s.sej.hadir>0 ? (s.sej.lulus/s.sej.hadir*100).toFixed(2) : "0.00"; 
    const gpsej = s.sej.hadir>0 ? (s.sej.point/s.sej.hadir).toFixed(2) : "-"; 
    const plms = s.calon>0 ? (s.lms/s.calon*100).toFixed(2) : "0.00"; 
    const ptlms = s.calon>0 ? (s.tlms/s.calon*100).toFixed(2) : "0.00"; 
    const gps = s.sumSubject > 0 ? (s.sumPoint/s.sumSubject).toFixed(2) : "0.00";

    return `
    <tr class="transition-colors text-gray-700">
        <td class="text-center font-medium text-gray-400">${i+1}</td>
        <td class="font-medium text-left">
            <div class="text-[10px] text-gray-400 leading-none mb-0.5">[${s.code}]</div>
            <div class="text-gray-800 font-semibold uppercase tracking-tight">${s.name}</div>
        </td>
        <td class="text-center font-bold text-gray-700">${s.calon}</td>
        <td class="text-center text-gray-400">${s.hadir_exam}</td>
        <td class="text-center font-bold text-gray-900 bg-gray-50/50">${gps}</td>
        
        <td class="text-center text-gray-500">${s.bm.lulus}</td>
        <td class="text-center text-blue-600 font-medium">${plbm}</td>
        <td class="text-center text-gray-400 text-xs">${gpbm}</td>
        
        <td class="text-center text-gray-500">${s.sej.lulus}</td>
        <td class="text-center text-blue-600 font-medium">${plsej}</td>
        <td class="text-center text-gray-400 text-xs">${gpsej}</td>
        
        <td class="text-center font-bold text-gray-700 bg-green-50/30">${s.lms}</td>
        <td class="text-center font-bold ${getLMSColor(plms)} bg-green-50/30">${plms}</td>
        
        <td class="text-center font-bold text-red-600 bg-red-50/30">${s.tlms}</td>
        <td class="text-center text-red-500 text-xs bg-red-50/30">${ptlms}</td>
    </tr>`; 
}

export function getSubjectStatsRow(s, i) {
    const gpmp = s.hadir>0 ? (s.point/s.hadir).toFixed(2) : "-"; 
    const lulus = s['A+']+s['A']+s['A-']+s['B+']+s['B']+s['C+']+s['C']+s['D']+s['E'];
    const pl = s.hadir>0 ? ((lulus/s.hadir)*100).toFixed(2) : "0.00"; 
    
    const sumCem = (s['A+']||0) + (s['A']||0) + (s['A-']||0);
    const perCem = s.hadir>0 ? ((sumCem/s.hadir)*100).toFixed(2) : "0.00";
    
    const sumKep = (s['B+']||0) + (s['B']||0) + (s['C+']||0) + (s['C']||0);
    const perKep = s.hadir>0 ? ((sumKep/s.hadir)*100).toFixed(2) : "0.00";
    
    const sumKredit = sumCem + sumKep;
    const perKredit = s.hadir>0 ? ((sumKredit/s.hadir)*100).toFixed(2) : "0.00";

    return `
    <tr class="transition-colors text-gray-700 hover:bg-gray-50">
        <td class="text-center text-gray-400 border-r border-gray-100">${i+1}</td>
        <td class="text-center font-bold text-gray-600 border-r border-gray-100">${s.kod}</td>
        <td class="font-medium text-left uppercase text-xs tracking-wide border-r border-gray-100">${s.nama}</td>
        <td class="text-center bg-gray-50/50 text-gray-500 border-r border-gray-100">${s.ambil}</td>
        <td class="text-center bg-gray-50/50 font-medium border-r border-gray-100">${s.hadir}</td>
        
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['A+']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['A']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['A-']}</td>
        <td class="text-center font-bold text-emerald-700 bg-emerald-50/30 border-r border-emerald-100">${sumCem}</td>
        <td class="text-center font-bold text-emerald-700 bg-emerald-50/30 border-r border-emerald-100 text-xs">${perCem}%</td>
        
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['B+']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['B']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['C+']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['C']}</td>
        <td class="text-center font-bold text-blue-700 bg-blue-50/30 border-r border-blue-100">${sumKep}</td>
        <td class="text-center font-bold text-blue-700 bg-blue-50/30 border-r border-blue-100 text-xs">${perKep}%</td>

        <td class="text-center font-bold text-indigo-800 bg-indigo-50/30 border-r border-indigo-100">${sumKredit}</td>
        <td class="text-center font-bold text-indigo-800 bg-indigo-50/30 border-r border-indigo-100 text-xs">${perKredit}%</td>

        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['D']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['E']}</td>
        <td class="text-center font-bold text-red-600 bg-red-50/30 border-r border-gray-100">${s['G']}</td>
        <td class="text-center font-bold text-blue-700 bg-blue-50/30 border-r border-gray-100">${pl}%</td>
        <td class="text-center font-bold text-gray-900 bg-gray-100">${gpmp}</td>
    </tr>`; 
}

export function getComponentSchoolRow(s, i) {
    // Nota: Data sekolah guna property 'code', 'name', 'daftar'
    const gpmp = s.hadir>0 ? (s.point/s.hadir).toFixed(2) : "-"; 
    const lulus = s['A+']+s['A']+s['A-']+s['B+']+s['B']+s['C+']+s['C']+s['D']+s['E'];
    const pl = s.hadir>0 ? ((lulus/s.hadir)*100).toFixed(2) : "0.00"; 
    
    const sumCem = (s['A+']||0) + (s['A']||0) + (s['A-']||0);
    const perCem = s.hadir>0 ? ((sumCem/s.hadir)*100).toFixed(2) : "0.00";
    
    const sumKep = (s['B+']||0) + (s['B']||0) + (s['C+']||0) + (s['C']||0);
    const perKep = s.hadir>0 ? ((sumKep/s.hadir)*100).toFixed(2) : "0.00";
    
    const sumKredit = sumCem + sumKep;
    const perKredit = s.hadir>0 ? ((sumKredit/s.hadir)*100).toFixed(2) : "0.00";

    return `
    <tr class="transition-colors text-gray-700 hover:bg-gray-50">
        <td class="text-center text-gray-400 border-r border-gray-100">${i+1}</td>
        <td class="text-center font-bold text-gray-600 border-r border-gray-100">${s.code}</td>
        <td class="font-medium text-left uppercase text-xs tracking-wide border-r border-gray-100">${s.name}</td>
        <td class="text-center bg-gray-50/50 text-gray-500 border-r border-gray-100">${s.daftar}</td>
        <td class="text-center bg-gray-50/50 font-medium border-r border-gray-100">${s.hadir}</td>
        
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['A+']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['A']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['A-']}</td>
        <td class="text-center font-bold text-emerald-700 bg-emerald-50/30 border-r border-emerald-100">${sumCem}</td>
        <td class="text-center font-bold text-emerald-700 bg-emerald-50/30 border-r border-emerald-100 text-xs">${perCem}%</td>
        
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['B+']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['B']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['C+']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['C']}</td>
        <td class="text-center font-bold text-blue-700 bg-blue-50/30 border-r border-blue-100">${sumKep}</td>
        <td class="text-center font-bold text-blue-700 bg-blue-50/30 border-r border-blue-100 text-xs">${perKep}%</td>

        <td class="text-center font-bold text-indigo-800 bg-indigo-50/30 border-r border-indigo-100">${sumKredit}</td>
        <td class="text-center font-bold text-indigo-800 bg-indigo-50/30 border-r border-indigo-100 text-xs">${perKredit}%</td>

        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['D']}</td>
        <td class="text-center text-gray-400 text-xs border-r border-gray-100">${s['E']}</td>
        <td class="text-center font-bold text-red-600 bg-red-50/30 border-r border-gray-100">${s['G']}</td>
        <td class="text-center font-bold text-blue-700 bg-blue-50/30 border-r border-gray-100">${pl}%</td>
        <td class="text-center font-bold text-gray-900 bg-gray-100">${gpmp}</td>
    </tr>`; 
}

export function getTLMSRow(t, i) {
    return `
    <tr class="transition-colors text-gray-700 hover:bg-red-50/10">
        <td class="text-center text-gray-400">${i+1}</td>
        <td class="text-center text-gray-400 text-xs">${t.id}</td>
        <td class="font-bold text-gray-800 uppercase text-left">${t.nama}</td>
        <td class="text-xs font-medium text-gray-500 uppercase text-left">${t.sekolah || t.kelas}</td>
        <td class="text-center font-bold ${t.bm==='G'?'text-red-600 bg-red-50/50':'text-gray-700'}">${t.bm}</td>
        <td class="text-center font-bold ${t.sej==='G'?'text-red-600 bg-red-50/50':'text-gray-700'}">${t.sej}</td>
        <td class="text-center text-xs text-red-500 font-bold bg-red-50/30">${t.isu}</td>
    </tr>`; 
}

export function getComponentSimpleRow(sub, i) {
    const gpmp = sub.hadir>0?(sub.point/sub.hadir).toFixed(2):"-"; 
    const perLulus = sub.hadir>0?((sub.lulus/sub.hadir)*100).toFixed(2):"0.00"; 
    return `
    <tr class="transition-colors text-gray-700 hover:bg-purple-50/10">
        <td class="text-center text-gray-400">${i+1}</td>
        <td class="text-center font-bold text-gray-600">${sub.kod}</td>
        <td class="text-xs font-medium uppercase text-left tracking-wide">${sub.nama}</td>
        <td class="text-center bg-gray-50/50 text-gray-500">${sub.ambil}</td>
        <td class="text-center bg-gray-50/50 font-medium">${sub.hadir}</td>
        <td class="text-center font-bold text-blue-700 bg-blue-50/30">${perLulus}%</td>
        <td class="text-center font-bold text-gray-900 bg-gray-100">${gpmp}</td>
    </tr>`; 
}

export function getComparisonCard(label, v1, v2, stat, suffix = '') {
    return `
        <div class="kpi-card border-t-4 ${stat.color.includes('green') ? 'border-green-500 text-green-700' : (stat.color.includes('red') ? 'border-red-500 text-red-700' : 'border-gray-300 text-gray-500')}">
            <div class="kpi-value text-3xl mb-1 flex justify-center items-center gap-2">
                <span class="pdf-arrow text-2xl">${stat.arrow}</span> ${stat.diff.toFixed(2)}${suffix}
            </div>
            <div class="kpi-label mb-3">${label}</div>
            <div class="flex justify-center items-center gap-3 text-xs text-gray-400 font-mono bg-gray-50 py-1 px-3 rounded-full mx-auto w-max">
                <span>E1: <b>${v1}${suffix}</b></span> <span class="opacity-50">vs</span> <span>E2: <b>${v2}${suffix}</b></span>
            </div>
        </div>
    `;
}

// Helper untuk format beza dalam jadual perbandingan
function formatDiff(v1, v2, isInverse = false) {
    const diff = v1 - v2;
    const diffStr = Math.abs(diff).toFixed(2);
    let color = "text-gray-400";
    let arrow = "-";
    
    if (diff !== 0) {
        if (isInverse) { // Utk GPMP: Makin rendah makin bagus
            if (diff < 0) { color = "text-green-600 font-bold"; arrow = "▼"; }
            else { color = "text-red-600 font-bold"; arrow = "▲"; }
        } else { // Utk Peratus: Makin tinggi makin bagus
            if (diff > 0) { color = "text-green-600 font-bold"; arrow = "▲"; }
            else { color = "text-red-600 font-bold"; arrow = "▼"; }
        }
    }
    return `<span class="${color}">${arrow} ${diffStr}</span>`;
}

export function getComparisonDetailRow(s, i) {
    const calcPerc = (val, total) => total > 0 ? ((val / total) * 100) : 0;

    // DATA E1
    const h1 = s.e1.hadir;
    const cem1 = calcPerc(s.e1.cemerlang, h1);
    const kep1 = calcPerc(s.e1.kepujian, h1);
    const lus1 = calcPerc(s.e1.lulus, h1);
    const gp1 = h1 > 0 ? (s.e1.point / h1) : 0;

    // DATA E2
    const h2 = s.e2.hadir;
    const cem2 = calcPerc(s.e2.cemerlang, h2);
    const kep2 = calcPerc(s.e2.kepujian, h2);
    const lus2 = calcPerc(s.e2.lulus, h2);
    const gp2 = h2 > 0 ? (s.e2.point / h2) : 0;

    return `
    <tr class="transition-colors text-gray-700 hover:bg-gray-50">
        <td class="text-center text-gray-400 border-r border-gray-100">${i+1}</td>
        <td class="font-medium text-left border-r border-gray-100">
            <span class="text-[10px] text-gray-400 block leading-none">[${s.code}]</span>
            <span class="font-semibold uppercase text-xs tracking-tight">${s.name}</span>
        </td>

        <td class="text-center bg-emerald-50/30 text-emerald-800 border-r border-emerald-100 text-xs font-bold">${cem1.toFixed(2)}</td>
        <td class="text-center bg-gray-50 text-gray-400 border-r border-gray-100 text-xs">${cem2.toFixed(2)}</td>
        <td class="text-center bg-emerald-50 text-xs border-r border-emerald-100">${formatDiff(cem1, cem2)}</td>

        <td class="text-center bg-blue-50/30 text-blue-800 border-r border-blue-100 text-xs font-bold">${kep1.toFixed(2)}</td>
        <td class="text-center bg-gray-50 text-gray-400 border-r border-gray-100 text-xs">${kep2.toFixed(2)}</td>
        <td class="text-center bg-blue-50 text-xs border-r border-blue-100">${formatDiff(kep1, kep2)}</td>

        <td class="text-center bg-indigo-50/30 text-indigo-800 border-r border-indigo-100 text-xs font-bold">${lus1.toFixed(2)}</td>
        <td class="text-center bg-gray-50 text-gray-400 border-r border-gray-100 text-xs">${lus2.toFixed(2)}</td>
        <td class="text-center bg-indigo-50 text-xs border-r border-indigo-100">${formatDiff(lus1, lus2)}</td>

        <td class="text-center bg-gray-100 text-gray-900 border-r border-gray-200 text-xs font-bold">${gp1.toFixed(2)}</td>
        <td class="text-center bg-gray-50 text-gray-400 border-r border-gray-100 text-xs">${gp2.toFixed(2)}</td>
        <td class="text-center bg-gray-200 text-xs">${formatDiff(gp1, gp2, true)}</td>
    </tr>`;
}

// ==========================================
// 3. CONTAINERS & WRAPPERS
// ==========================================

export function getDetailedTableBlock(kod, subName, rows, btnPdfId, btnExcelId, tableId, headerHtml, colorTheme = "emerald", titlePrefix = "") {
    return `
    <div class="result-container border-t-4 border-${colorTheme}-500 mb-8">
        <div class="p-5 bg-${colorTheme}-50/30 border-b border-${colorTheme}-100 flex justify-between items-center flex-wrap gap-4">
            <div>
                <h3 class="font-bold text-${colorTheme}-900 font-oswald uppercase text-lg tracking-wide">
                    ${titlePrefix}${kod} - ${subName}
                </h3>
            </div>
            <div class="flex gap-2">
                <button id="${btnPdfId}" class="btn-pdf text-xs">📄 PDF</button>
                <button id="${btnExcelId}" class="btn-excel text-xs">📥 EXCEL</button>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table id="${tableId}">
                ${headerHtml}
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}