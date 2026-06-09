// ==========================================
// EDARS V3.0 - PDF EXPORT MODULE (VECTOR FIX & EMOJI CLEANER)
// Modul global untuk menjana laporan PDF menggunakan jsPDF & AutoTable.
// KEMASKINI: Ditambah penapis Emoji (Folder 📂) untuk elak isu simbol pelik.
// KEMASKINI V3.1: Logik DOM Cleansing pintar untuk lajur E3 tersembunyi.
// ==========================================

window.exportTableToPDF = function(tableId, reportTitle, fileNamePrefix) {
    
    // 1. Semakan Library (Dimuatkan via CDN di dashboard.html)
    if (!window.jspdf) {
        Swal.fire('Ralat', 'Library jsPDF tidak ditemui. Sila refresh halaman.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    
    // Setup Dokumen (Landscape, A4)
    const doc = new jsPDF('l', 'mm', 'a4');
    
    const dateStr = new Date().toLocaleDateString('ms-MY', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // ==========================================
    // HELPER: DOM CLEANSING (Surgical Edit)
    // ==========================================
    const originalTable = document.getElementById(tableId);
    if (!originalTable) {
        Swal.fire('Ralat', 'Jadual tidak ditemui untuk dieksport ke PDF.', 'error');
        return;
    }

    // [SURGICAL EDIT] Klon jadual untuk mengelak kerosakan UI pada paparan pengguna
    const clonedTable = originalTable.cloneNode(true);
    
    // [SURGICAL EDIT] Bersihkan sebarang lajur (column) atau sel yang mempunyai kelas '.hidden'
    // Ini menyelesaikan isu AutoTable yang keliru dengan colspan E3 ketika dalam Mod E2
    const hiddenElements = clonedTable.querySelectorAll('.hidden');
    hiddenElements.forEach(el => el.remove());

    // ==========================================
    // HELPER: COLOR EXTRACTION
    // ==========================================
    const getRgbFromCss = (element, property) => {
        const style = window.getComputedStyle(element);
        const colorStr = style.getPropertyValue(property);
        if (!colorStr || colorStr === 'rgba(0, 0, 0, 0)' || colorStr === 'transparent') return null;
        const rgb = colorStr.match(/\d+/g);
        return (rgb && rgb.length >= 3) ? [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])] : null;
    };

    // ==========================================
    // COMPONENT: BANNER HEADER (WEB STYLE)
    // ==========================================
    const drawHeader = (data) => {
        // 1. Latar Belakang Banner (Biru Gelap seperti Web)
        doc.setFillColor(30, 58, 138); // #1e3a8a
        doc.rect(0, 0, 297, 25, 'F'); // Full width bar

        // 2. Garisan Accent (Kuning/Amber di bawah banner)
        doc.setDrawColor(251, 191, 36); // #fbbf24
        doc.setLineWidth(1.5);
        doc.line(0, 25, 297, 25);

        // 3. Teks Tajuk (Putih)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("EDARS PPD ALOR GAJAH", 14, 12);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(220, 220, 220); // Off-white
        doc.text("Sistem Analisis & Pelaporan Data Peperiksaan Berpusat", 14, 18);

        // 4. Tajuk Laporan Spesifik (Hitam di bawah banner)
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0); 
        doc.text(reportTitle.toUpperCase(), 14, 35);
        
        // 5. Timestamp
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(`Dijana pada: ${dateStr}`, 280, 35, { align: 'right' });
    };

    // ==========================================
    // CORE: TABLE GENERATION
    // ==========================================
    // [SURGICAL EDIT] Tukar 'html: `#${tableId}`' kepada jadual yang di-klon (clonedTable)
    doc.autoTable({
        html: clonedTable,
        startY: 40,
        theme: 'grid',
        styles: {
            fontSize: 8, 
            cellPadding: 3, 
            valign: 'middle', 
            halign: 'center',
            lineWidth: 0.1, 
            lineColor: [229, 231, 235], // Kelabu cair
            font: "helvetica", 
            textColor: [31, 41, 55] // Kelabu gelap
        },
        headStyles: {
            fillColor: [30, 58, 138], // Header Biru Web
            textColor: 255, 
            fontStyle: 'bold', 
            halign: 'center', 
            valign: 'middle',
            lineWidth: 0.1
        },

        // ------------------------------------------
        // PHASE 1: PARSING & SANITIZATION (VECTOR PREP)
        // ------------------------------------------
        didParseCell: function(data) {
            // A. CSS MIRRORING (Warna & Bold)
            if (data.cell.raw && data.cell.raw.nodeType === 1) {
                const el = data.cell.raw;
                const style = window.getComputedStyle(el);

                // Background Color
                const bgColor = getRgbFromCss(el, 'background-color');
                if (bgColor) {
                    const isWhite = bgColor[0]===255 && bgColor[1]===255 && bgColor[2]===255;
                    const isTransparent = style.backgroundColor === 'rgba(0, 0, 0, 0)';
                    if (!isWhite && !isTransparent) data.cell.styles.fillColor = bgColor;
                }

                // Text Color
                const txtColor = getRgbFromCss(el, 'color');
                if (txtColor) data.cell.styles.textColor = txtColor;

                // Font Weight
                const fw = style.fontWeight;
                if (fw === '700' || fw === 'bold' || fw >= 600) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }

            // B. TEKS CLEANING (EMOJI & ARROW REMOVAL)
            // Membersihkan teks daripada simbol yang tidak disokong oleh jsPDF standard
            if (data.cell.text) {
                data.cell.text = data.cell.text.map(line => {
                    
                    // 1. Kesan Arrow (Untuk lukisan vektor nanti)
                    if (line.includes('▲') || line.includes('\u25B2')) data.cell._arrowType = 'up';
                    if (line.includes('▼') || line.includes('\u25BC')) data.cell._arrowType = 'down';

                    // 2. Pembersihan Agresif
                    return line
                        .replace(/[▲▼\u25B2\u25BC]/g, '')       // Buang Arrow
                        .replace(/📂|📭|📋|⚡|💯|👥|🔐|🏠|↺|📊/g, '') // Buang Emoji UI Spesifik (TERMASUK FOLDER)
                        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Buang Emoji Generik lain
                        .replace(/唐|投|搭|脹|笞｡/g, '')     // Buang Sampah Legasi
                        .trim();
                });
            }
        },

        // ------------------------------------------
        // PHASE 2: DRAWING (VECTOR GRAPHICS)
        // ------------------------------------------
        didDrawCell: function(data) {
            // Lukis anak panah vektor JIKA flag dikesan dalam Phase 1
            if (data.cell._arrowType) {
                const cell = data.cell;
                const docInst = data.doc;
                
                // 1. Tentukan Warna (Hijau untuk Naik, Merah untuk Turun)
                if (data.cell._arrowType === 'up') {
                    docInst.setFillColor(22, 163, 74); // #16a34a (Green)
                } else {
                    docInst.setFillColor(220, 38, 38); // #dc2626 (Red)
                }

                // 2. Kira Koordinat
                const textWidth = docInst.getTextWidth(cell.text[0]);
                const cellCenterX = cell.x + (cell.width / 2);
                
                // Offset: Letak di sebelah kanan teks
                // Nota: Jika teks kosong (sebab emoji dibuang), anak panah akan duduk di tengah
                const arrowX = textWidth > 0 ? (cellCenterX + (textWidth / 2) + 1.5) : cellCenterX; 
                const arrowY = cell.y + (cell.height / 2);
                
                // Saiz Segitiga
                const s = 1.2; 

                // 3. Lukis Segitiga Vektor
                if (data.cell._arrowType === 'up') {
                    docInst.triangle(arrowX, arrowY - s, arrowX - s, arrowY + s, arrowX + s, arrowY + s, 'F');
                } else {
                    docInst.triangle(arrowX, arrowY + s, arrowX - s, arrowY - s, arrowX + s, arrowY - s, 'F');
                }
            }
        },

        didDrawPage: drawHeader,
        margin: { top: 40, left: 14, right: 14 },
    });

    // Simpan Fail
    const cleanName = fileNamePrefix.replace(/[^a-zA-Z0-9-_]/g, '_');
    const finalName = `${cleanName}_${dateStr.replace(/[:\/,\s]/g, '-')}.pdf`;
    doc.save(finalName);
};