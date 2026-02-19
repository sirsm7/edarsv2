// ==========================================
// EDARS V3.0 - KPI GENERATOR MODULE
// Modul khusus untuk menjana Jadual Interaktif Penetapan KPI.
// Menguruskan pengiraan TOV, OTI, dan eksport Excel dengan Formula.
// ==========================================

import { GRED_POINTS, SUBJEK_KECUALI } from './config.js';
import * as Templates from './templates.js';
import * as State from './state.js';

// ==========================================
// 1. CORE CALCULATION LOGIC
// ==========================================

function calculateGPS(studentList) {
    let totalPoints = 0;
    let totalSubjects = 0;

    studentList.forEach(s => {
        const marks = s.markah_data || {};
        Object.keys(marks).forEach(k => {
            if (k.startsWith('G') || k.startsWith('GRED')) {
                const kod = k.replace(/^G_?|RED /g, '').trim();
                const g = marks[k];
                
                // Abaikan subjek yang dikecualikan & gred tidak sah
                if (!SUBJEK_KECUALI.includes(kod) && GRED_POINTS.hasOwnProperty(g) && g !== 'TH') {
                    totalPoints += GRED_POINTS[g];
                    totalSubjects++;
                }
            }
        });
    });

    return totalSubjects > 0 ? (totalPoints / totalSubjects) : 0;
}

function processSchoolKPIData(data1, data2) {
    // Grouping by School
    const schools = {};

    const addToSchool = (list, key) => {
        list.forEach(s => {
            if (!schools[s.nama_sekolah]) {
                schools[s.nama_sekolah] = {
                    name: s.nama_sekolah,
                    code: s.kod_sekolah,
                    students1: [],
                    students2: []
                };
            }
            schools[s.nama_sekolah][key].push(s);
        });
    };

    addToSchool(data1, 'students1'); // Exam 1 (Semasa / AR)
    addToSchool(data2, 'students2'); // Exam 2 (Base Line / TOV)

    return Object.values(schools).sort((a, b) => (a.code || "").localeCompare(b.code || "")).map((sc, index) => {
        const gps1 = calculateGPS(sc.students1); // AR 1
        const gps2 = calculateGPS(sc.students2); // TOV

        // Logic TOV & OTI 
        // Nota: Walaupun kita eksport formula, kita juga kira nilai awal sebagai fallback/preview data
        const tov = gps2;
        const ar1 = gps1;
        
        return {
            bil: index + 1,
            code: sc.code,
            name: sc.name,
            tov: tov,
            ar1: ar1
        };
    });
}

// ==========================================
// 2. EXCEL GENERATION (WITH FORMULAS)
// ==========================================

export function generateAndExportKPI() {
    // 1. Dapatkan Data dari State
    const data1 = State.getMainData();       // E1
    const data2 = State.getComparisonData(); // E2

    // Dapatkan Nama Exam untuk Header
    const nameE1 = State.getFilter('exam1') || "EXAM 1";
    const nameE2 = State.getFilter('exam2') || "EXAM 2";

    if (!data1.length || !data2.length) {
        Swal.fire('Ralat', 'Data perbandingan tidak lengkap.', 'error');
        return;
    }

    // 2. Proses Data
    const kpiData = processSchoolKPIData(data1, data2);

    // 3. Bina HTML Table String dengan Namespace Excel
    // Kita MESTI tambah 'xmlns:x' untuk support atribut x:fmla dan x:num
    let tableHTML = `<table xmlns:x="urn:schemas-microsoft-com:office:excel">`;
    tableHTML += Templates.getKPIExportHeader(nameE1, nameE2);
    tableHTML += `<tbody>`;

    kpiData.forEach((row, i) => {
        // Logik Baris Excel: Header ada 3 baris. Data bermula baris ke-4.
        const excelRow = i + 4; 
        
        const fmt = (num) => typeof num === 'number' ? num.toFixed(2) : '0.00';
        
        // PENTING: Atribut x:num memberitahu Excel ini adalah nombor (bukan teks)
        // Atribut x:fmla memberitahu Excel ini adalah formula
        
        // Col D = TOV
        // Col E = OTI 1 Formula: D{row} - (D{row}*0.05)
        // Col F = AR 1
        // Col G = Prestasi 1 Formula: (D{row} - F{row}) / D{row}  --> Format Percent
        // Col H = OTI 2 Formula: D{row} - (D{row}*0.10)
        // Col K = OTI 3 Formula: D{row} - (D{row}*0.20)
        
        // Formula Logic Strings
        const fmlaOTI1 = `=D${excelRow}-(D${excelRow}*0.05)`;
        const fmlaPrestasi1 = `=(D${excelRow}-F${excelRow})/D${excelRow}`;
        const fmlaOTI2 = `=D${excelRow}-(D${excelRow}*0.10)`;
        const fmlaOTI3 = `=D${excelRow}-(D${excelRow}*0.20)`;

        // Fallback Values (Untuk display jika formula gagal diproses oleh viewer selain Excel)
        const valOTI1 = row.tov - (row.tov * 0.05);
        const valPrestasi1 = row.tov > 0 ? (row.tov - row.ar1)/row.tov : 0;
        const valOTI2 = row.tov - (row.tov * 0.10);
        const valOTI3 = row.tov - (row.tov * 0.20);

        tableHTML += `
            <tr>
                <td style="border: 1px solid #9ca3af; text-align: center;">${row.bil}</td>
                <td style="border: 1px solid #9ca3af; text-align: center;">${row.code}</td>
                <td style="border: 1px solid #9ca3af;">${row.name}</td>
                
                <!-- TOV (Col D) -->
                <td style="border: 1px solid #9ca3af; text-align: center; background-color: #fffbeb;" x:num="${row.tov}">${fmt(row.tov)}</td>
                
                <!-- OTI 1 (Col E) - FORMULA -->
                <td style="border: 1px solid #9ca3af; text-align: center; background-color: #eff6ff;" x:num="${valOTI1}" x:fmla="${fmlaOTI1}">${fmt(valOTI1)}</td>
                
                <!-- AR 1 (Col F) -->
                <td style="border: 1px solid #9ca3af; text-align: center; background-color: #f0fdf4;" x:num="${row.ar1}">${fmt(row.ar1)}</td>
                
                <!-- PRESTASI 1 (Col G) - FORMULA PERCENT -->
                <td style="border: 1px solid #9ca3af; text-align: center; background-color: #dcfce7;" x:num="${valPrestasi1}" x:fmla="${fmlaPrestasi1}" style="mso-number-format:Percent">${(valPrestasi1*100).toFixed(2)}%</td>
                
                <!-- OTI 2 (Col H) - FORMULA -->
                <td style="border: 1px solid #9ca3af; text-align: center; background-color: #eff6ff;" x:num="${valOTI2}" x:fmla="${fmlaOTI2}">${fmt(valOTI2)}</td>
                
                <!-- AR 2 (Col I) - KOSONG -->
                <td style="border: 1px solid #9ca3af; text-align: center;"></td>
                
                <!-- PRESTASI 2 (Col J) - KOSONG (Formula placeholder kalau user isi AR2 nanti: =(D-I)/D) -->
                <td style="border: 1px solid #9ca3af; text-align: center;"></td>
                
                <!-- OTI 3 (Col K) - FORMULA -->
                <td style="border: 1px solid #9ca3af; text-align: center; background-color: #eff6ff;" x:num="${valOTI3}" x:fmla="${fmlaOTI3}">${fmt(valOTI3)}</td>
                
                <!-- AR 3 (Col L) - KOSONG -->
                <td style="border: 1px solid #9ca3af; text-align: center;"></td>
                
                <!-- PRESTASI 3 (Col M) - KOSONG -->
                <td style="border: 1px solid #9ca3af; text-align: center;"></td>
                
                <!-- KPI TAHUN SEMASA (Col N) - KOSONG -->
                <td style="border: 1px solid #9ca3af; text-align: center; background-color: #faf5ff;"></td> 
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;

    // 4. Export Mechanism (Excel Namespace Wrapper)
    const filename = `Jadual_KPI_Interaktif_${new Date().toLocaleDateString('ms-MY').replace(/\//g,'-')}`;
    
    // Header XML untuk Excel mengenal formula
    const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]>
            <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>KPI Sekolah</x:Name>
                        <x:WorksheetOptions>
                            <x:DisplayGridlines/>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
                th { background-color: #e5e7eb; border: 1px solid #000; padding: 5px; }
                td { border: 1px solid #000; padding: 4px; }
            </style>
        </head>
        <body>
            ${tableHTML}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${filename}.xls`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}