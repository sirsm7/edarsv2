// ==========================================
// EDARS V3.0 - UTILITIES MODULE
// Mengandungi fungsi bantuan umum (Pure Functions) & Eksport Excel.
// KEMASKINI V3.1: Eksport Excel pintar dengan tapisan lajur tersembunyi (Hidden Columns).
// ==========================================

// 1. PEMBERSIHAN DATA & PENGEKSTRAKAN TEKS
// ==========================================

/**
 * Membersihkan string dari whitespace dan quotes berlebihan.
 * @param {any} t - Teks input
 */
export function clean(t) { 
    if (t === undefined || t === null) return "";
    return t.toString().trim().replace(/^"|"$/g, ''); 
}

/**
 * Mengambil nama sekolah daripada format "KOD | NAMA".
 * @param {string} t - String input (cth: "MBA001 | SMK CONTOH")
 */
export function extractSchool(t) { 
    if (!t) return "";
    return t.includes('|') ? t.split('|')[1].trim() : t; 
}

// 2. HELPER AKADEMIK (GRED & MARKAH)
// ==========================================

/**
 * Mendapatkan gred subjek daripada objek markah dengan pelbagai variasi kunci.
 * @param {Object} marks - Objek markah pelajar (markah_data)
 * @param {string} subjectCode - Kod subjek (cth: BM, SEJ)
 */
export function getGrade(marks, subjectCode) { 
    if (!marks) return 'TH';
    
    // Cuba cari padanan kunci yang mungkin wujud dalam CSV
    const variations = [
        `G${subjectCode}`,       // GBM
        `G_${subjectCode}`,      // G_BM
        `GRED ${subjectCode}`,   // GRED BM
        `GRED_${subjectCode}`,   // GRED_BM
        subjectCode              // BM (Kadang-kadang gred diletak terus di nama subjek)
    ];

    for (const key of variations) {
        if (marks[key] !== undefined) {
            return marks[key].toString().trim().toUpperCase();
        }
    }
    
    return 'TH'; // Default jika tidak jumpa
}

/**
 * Menentukan sama ada gred tersebut dikira LULUS.
 * @param {string} g - Gred
 */
export function isLulusGrade(g) { 
    const badGrades = ['G', 'TH', 'T', ''];
    return !badGrades.includes(g); 
}

/**
 * Memberikan kelas warna Tailwind berdasarkan nilai peratusan (KPI).
 * @param {number|string} val - Nilai peratusan
 */
export function getLMSColor(val) { 
    const num = parseFloat(val);
    if (isNaN(num)) return 'text-gray-500';
    
    if (num >= 80) return 'text-green-600 font-bold'; // Cemerlang
    if (num >= 50) return 'text-blue-600';            // Baik
    return 'text-red-600 font-bold';                  // Kritikal
}

// 3. UI HELPERS (LOG SISTEM)
// ==========================================

/**
 * Menambah mesej ke dalam kotak log sistem di UI.
 * @param {string} msg - Mesej untuk dipaparkan
 * @param {string} clr - Kelas warna Tailwind (default: gray)
 */
export function updateLog(msg, clr = 'text-gray-600') { 
    const logContainer = document.getElementById('uploadLog');
    if (!logContainer) return;

    const time = new Date().toLocaleTimeString('ms-MY', { hour12: false });
    const logItem = `
        <div class="${clr} mb-1 border-b border-gray-100 pb-1 text-[11px] font-mono">
            <span class="text-gray-400 mr-2">[${time}]</span>${msg}
        </div>`;
    
    logContainer.innerHTML += logItem; 
    logContainer.scrollTop = logContainer.scrollHeight; 
}

// 4. EXCEL EXPORT HELPER (UTF-8 SUPPORT)
// ==========================================

/**
 * Mengeksport HTML Table ke fail Excel (.xls)
 * @param {string} tableID - ID elemen table dalam DOM
 * @param {string} filename - Nama fail tanpa extension
 */
export function exportTableToExcel(tableID, filename) { 
    const table = document.getElementById(tableID); 
    if (!table) {
        console.error(`Jadual ${tableID} tidak ditemui.`);
        Swal.fire('Ralat', 'Jadual tidak ditemui untuk dieksport.', 'error');
        return;
    }
    
    // [SURGICAL EDIT] Klon jadual untuk elak rosakkan UI sebenar
    const clonedTable = table.cloneNode(true);
    
    // [SURGICAL EDIT] Buang elemen dengan class .hidden atau col-e3 yang disorok
    const hiddenElements = clonedTable.querySelectorAll('.hidden');
    hiddenElements.forEach(el => el.remove());

    // 1. Bina Template HTML dengan Meta Charset menggunakan jadual yang telah dibersihkan
    const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]>
            <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>${filename}</x:Name>
                        <x:WorksheetOptions>
                            <x:DisplayGridlines/>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                table { border-collapse: collapse; width: 100%; }
                td, th { border: 1px solid #000000; padding: 5px; vertical-align: middle; text-align: center; font-family: sans-serif; }
                .text-left { text-align: left; }
                .font-bold { font-weight: bold; }
                .bg-gray-800 { background-color: #1f2937; color: white; }
                .bg-blue-900 { background-color: #1e3a8a; color: white; }
            </style>
        </head>
        <body>
            ${clonedTable.outerHTML}
        </body>
        </html>
    `;

    // 2. Guna Blob dengan BOM (Byte Order Mark) untuk paksa UTF-8
    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/vnd.ms-excel;charset=utf-8'
    });
    
    // 3. Trigger Download
    const downloadLink = document.createElement('a'); 
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `${filename}.xls`; 
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}