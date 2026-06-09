// ==========================================
// EDARS V3.0 - ANALYTICS MODULE
// Modul ini mengandungi logik pengiraan statistik tulen.
// Bebas daripada manipulasi DOM (Pure Logic).
// KEMASKINI V3.1: Sokongan Mod Perbandingan 3 Peperiksaan (E1, E2, E3).
// ==========================================

import { GRED_POINTS, SUBJEK_KECUALI, NAMA_SUBJEK, COMPONENT_MAP, SUBJECT_PRIORITY } from './config.js';
import { getGrade, isLulusGrade } from './utils.js';

// ==========================================
// 1. DEMOGRAPHIC FILTER LOGIC
// ==========================================

/**
 * Menapis pelajar berdasarkan demografi (Jantina & Kaum).
 * @param {Object} student - Objek pelajar
 * @param {string} type - Jenis tapisan (cth: 'ALL', 'L', 'P_M', 'ALL_C')
 */
export function filterDemography(student, type) {
    if (type === 'ALL') return true;

    // Normalisasi data untuk elak error (Case Insensitive)
    const jantina = (student.jantina || '').toUpperCase();
    const kaum = (student.kaum || '').toUpperCase();

    // 1. Pengesanan Jantina Asas
    const isLelaki = jantina.includes('LELAKI') || jantina === 'L';
    const isPerempuan = jantina.includes('PEREMPUAN') || jantina === 'P';

    // 2. Pengesanan Kumpulan Kaum Utama
    const isMalay = kaum.includes('MELAYU');
    const isChinese = kaum.includes('CINA');
    const isIndian = kaum.includes('INDIA');
    
    // Pengesanan Orang Asli
    const isOrangAsli = kaum.includes('ORANG ASLI') || kaum.includes('ASLI') || kaum.includes('SEMELAI') || kaum.includes('JAKUN') || kaum.includes('TEMUAN'); 
    
    // 3. Logik LAIN-LAIN (Eksklusif)
    // Memastikan kategori ini tidak bertindih dengan M/C/I/OA
    const isOther = !isMalay && !isChinese && !isIndian && !isOrangAsli;

    // 4. Suis Logik Penapisan
    switch (type) {
        // --- JANTINA SAHAJA ---
        case 'L': return isLelaki;
        case 'P': return isPerempuan;
        
        // --- GABUNGAN KAUM (L+P) ---
        // Ini menjawab soalan anda: Memilih SEMUA jantina bagi kaum tertentu
        case 'ALL_M': return isMalay;       // Melayu (Lelaki + Perempuan)
        case 'ALL_C': return isChinese;     // Cina (Lelaki + Perempuan)
        case 'ALL_I': return isIndian;      // India (Lelaki + Perempuan)
        case 'ALL_OA': return isOrangAsli;  // Orang Asli (Lelaki + Perempuan)
        case 'ALL_OTH': return isOther;     // Lain-lain (Lelaki + Perempuan)

        // --- MELAYU (SPECIFIC) ---
        case 'L_M': return isLelaki && isMalay;
        case 'P_M': return isPerempuan && isMalay;

        // --- CINA (SPECIFIC) ---
        case 'L_C': return isLelaki && isChinese;
        case 'P_C': return isPerempuan && isChinese;

        // --- INDIA (SPECIFIC) ---
        case 'L_I': return isLelaki && isIndian;
        case 'P_I': return isPerempuan && isIndian;

        // --- ORANG ASLI (SPECIFIC) ---
        case 'L_OA': return isLelaki && isOrangAsli;
        case 'P_OA': return isPerempuan && isOrangAsli;

        // --- LAIN-LAIN (SPECIFIC) ---
        case 'L_OTH': return isLelaki && isOther;
        case 'P_OTH': return isPerempuan && isOther;

        // --- DEFAULT ---
        default: return true;
    }
}

// ==========================================
// 2. CALCULATE AGGREGATE (RUMUSAN DAERAH)
// ==========================================

export function calculateAggregateData(students) {
    const schools = {}; 
    let district = { 
        calon: 0, lms: 0, tlms: 0, 
        sumPoint: 0, sumSubject: 0, 
        subjectStats: {} 
    };
    let tlmsList = [];

    students.forEach(s => { 
        // 1. Inisialisasi Data Sekolah jika belum wujud
        if (!schools[s.nama_sekolah]) {
            schools[s.nama_sekolah] = { 
                name: s.nama_sekolah, 
                code: s.kod_sekolah, 
                calon: 0, hadir_exam: 0, lms: 0, tlms: 0, 
                sumPoint: 0, sumSubject: 0, 
                bm: { hadir: 0, lulus: 0, point: 0 }, 
                sej: { hadir: 0, lulus: 0, point: 0 } 
            }; 
        }
        
        const sc = schools[s.nama_sekolah]; 
        const marks = s.markah_data || {}; 
        
        const gBM = getGrade(marks, 'BM'); 
        const gSEJ = getGrade(marks, 'SEJ'); 
        
        sc.calon++; 
        district.calon++; 
        
        // 2. Kira LMS (Mesti Lulus BM & SEJ)
        const hasBM = gBM !== '' && gBM !== 'TH' && gBM !== 'T';
        const hasSEJ = gSEJ !== '' && gSEJ !== 'TH' && gSEJ !== 'T';

        if (hasBM || hasSEJ) sc.hadir_exam++; 
        
        // Statistik BM Sekolah
        if (hasBM) { 
            sc.bm.hadir++; 
            if (GRED_POINTS.hasOwnProperty(gBM)) sc.bm.point += GRED_POINTS[gBM]; 
            if (isLulusGrade(gBM)) sc.bm.lulus++; 
        } 
        
        // Statistik Sejarah Sekolah
        if (hasSEJ) { 
            sc.sej.hadir++; 
            if (GRED_POINTS.hasOwnProperty(gSEJ)) sc.sej.point += GRED_POINTS[gSEJ]; 
            if (isLulusGrade(gSEJ)) sc.sej.lulus++; 
        } 

        const isLMS = isLulusGrade(gBM) && isLulusGrade(gSEJ);
        
        if (isLMS) { 
            sc.lms++; 
            district.lms++; 
        } else { 
            sc.tlms++; 
            district.tlms++; 
            
            // Rekod Isu TLMS
            let isu = []; 
            if (!isLulusGrade(gBM)) isu.push(`BM:${gBM || '-'}`); 
            if (!isLulusGrade(gSEJ)) isu.push(`SEJ:${gSEJ || '-'}`); 
            
            tlmsList.push({
                id: s.id_individu, 
                nama: s.nama_murid, 
                sekolah: s.nama_sekolah, 
                bm: gBM, 
                sej: gSEJ, 
                isu: isu.join(' ')
            });
        } 
        
        // 3. Kira GPS Sekolah & Statistik Subjek Daerah
        Object.keys(marks).forEach(key => {
            if (key.startsWith('G') || key.startsWith('GRED')) {
                const kod = key.replace(/^G_?|RED /g, '').trim();
                
                // PENAPISAN MUTLAK (STRICT WHITELIST)
                if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                
                const g = marks[key] ? marks[key].toString().trim().toUpperCase() : '';

                if (g !== '' && g !== 'NULL' && g !== 'UNDEFINED') {
                    // Kira GPS (Kecuali subjek dalam SUBJEK_KECUALI)
                    if (!SUBJEK_KECUALI.includes(kod)) { 
                        if (GRED_POINTS.hasOwnProperty(g)) { 
                            sc.sumPoint += GRED_POINTS[g]; 
                            sc.sumSubject++; 
                            district.sumPoint += GRED_POINTS[g]; 
                            district.sumSubject++; 
                        } 
                    }

                    // Statistik Subjek Daerah
                    if (!district.subjectStats[kod]) {
                        district.subjectStats[kod] = {
                            kod: kod, 
                            nama: NAMA_SUBJEK[kod] || kod, 
                            ambil: 0, hadir: 0, point: 0, 
                            'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'E': 0, 'G': 0
                        };
                    }
                    
                    const sub = district.subjectStats[kod];
                    sub.ambil++; 

                    if (GRED_POINTS.hasOwnProperty(g)) {
                        sub.hadir++; 
                        sub.point += GRED_POINTS[g];
                        if (sub.hasOwnProperty(g)) sub[g]++;
                    } else if (g === 'TH' || g === 'T') {
                        sub['G']++; 
                    }
                }
            }
        });
    });

    // 4. GARBAGE COLLECTOR (Membuang Subjek Kosong)
    Object.keys(district.subjectStats).forEach(kod => {
        const sub = district.subjectStats[kod];
        if (sub.ambil === 0 || (sub.hadir === 0 && sub['G'] === 0)) {
            delete district.subjectStats[kod];
        }
    });

    return { schools, district, tlmsList };
}

// ==========================================
// 3. CALCULATE SCHOOL DETAIL (ANALISA SEKOLAH)
// ==========================================

export function calculateSchoolDetailData(students) {
    let subjects = {}; 
    let tlmsList = []; 
    let stats = { calon: 0, lms: 0, tlms: 0, sumPoint: 0, sumSubject: 0 };
    
    students.forEach(s => { 
        stats.calon++; 
        const marks = s.markah_data || {}; 
        const gBM = getGrade(marks, 'BM'); 
        const gSEJ = getGrade(marks, 'SEJ'); 
        
        // Kira LMS
        if (isLulusGrade(gBM) && isLulusGrade(gSEJ)) {
            stats.lms++; 
        } else { 
            stats.tlms++; 
            let isu = []; 
            if (!isLulusGrade(gBM)) isu.push(`BM:${gBM || '-'}`); 
            if (!isLulusGrade(gSEJ)) isu.push(`SEJ:${gSEJ || '-'}`); 
            
            tlmsList.push({
                id: s.id_individu, 
                nama: s.nama_murid, 
                kelas: s.kelas, 
                bm: gBM, 
                sej: gSEJ, 
                isu: isu.join(' ')
            }); 
        } 
        
        // Kira Statistik Subjek
        Object.keys(marks).forEach(k => { 
            if (k.startsWith('G') || k.startsWith('GRED')) { 
                const kod = k.replace(/^G_?|RED /g, '').trim(); 
                
                // PENAPISAN MUTLAK (STRICT WHITELIST)
                if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                
                const g = marks[k] ? marks[k].toString().trim().toUpperCase() : ''; 
                
                if (g !== '' && g !== 'NULL' && g !== 'UNDEFINED') { 
                    if (!subjects[kod]) {
                        subjects[kod] = {
                            kod: kod, 
                            nama: NAMA_SUBJEK[kod] || kod, 
                            ambil: 0, hadir: 0, point: 0, 
                            'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'E': 0, 'G': 0
                        }; 
                    }
                    
                    subjects[kod].ambil++; 
                    
                    if (GRED_POINTS.hasOwnProperty(g)) { 
                        subjects[kod].hadir++; 
                        subjects[kod].point += GRED_POINTS[g]; 
                        
                        // Kira GPS Sekolah
                        if (!SUBJEK_KECUALI.includes(kod)) { 
                            stats.sumPoint += GRED_POINTS[g]; 
                            stats.sumSubject++; 
                        } 
                        
                        if (subjects[kod].hasOwnProperty(g)) subjects[kod][g]++;
                        
                    } else if (g === 'TH' || g === 'T') {
                        subjects[kod]['G']++; 
                    }
                }
            } 
        }); 
    });

    // GARBAGE COLLECTOR
    Object.keys(subjects).forEach(kod => {
        const sub = subjects[kod];
        if (sub.ambil === 0 || (sub.hadir === 0 && sub['G'] === 0)) {
            delete subjects[kod];
        }
    });

    return { subjects, tlmsList, stats };
}

// ==========================================
// 4. COMPONENT CALCULATION (KPI KOMPONEN)
// ==========================================

// Helper: Menjana Data Matriks (Digunakan oleh Single & Comparison)
function generateMatrixData(students, targetSubjects, subjectsContainer, schoolsContainer, compStatsContainer) {
    let matrix = {};

    students.forEach(s => { 
        if (compStatsContainer) compStatsContainer.calon++; 
        const marks = s.markah_data || {}; 
        
        if (schoolsContainer && !schoolsContainer[s.nama_sekolah]) {
            schoolsContainer[s.nama_sekolah] = { 
                name: s.nama_sekolah, code: s.kod_sekolah, subjects: {} 
            }; 
        }
        const sc = schoolsContainer ? schoolsContainer[s.nama_sekolah] : null; 
        
        Object.keys(marks).forEach(k => { 
            if (k.startsWith('G') || k.startsWith('GRED')) { 
                const kod = k.replace(/^G_?|RED /g, '').trim(); 
                
                // PENAPISAN MUTLAK (STRICT WHITELIST)
                if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                
                if (targetSubjects.includes(kod)) { 
                    let gred = marks[k] ? marks[k].toString().trim().toUpperCase() : ''; 
                    
                    if (gred !== '' && gred !== 'NULL' && gred !== 'UNDEFINED') {
                        // A. DATA SUBJEK DAERAH
                        if (subjectsContainer) {
                            if (!subjectsContainer[kod]) {
                                subjectsContainer[kod] = { 
                                    kod: kod, nama: NAMA_SUBJEK[kod] || kod, ambil: 0, hadir: 0, point: 0, lulus: 0, g_count: 0 
                                }; 
                            }
                            subjectsContainer[kod].ambil++; 
                        }

                        // B. INIT DATA MATRIKS (SUBJEK -> SEKOLAH)
                        if (!matrix[kod]) matrix[kod] = {};
                        if (!matrix[kod][s.nama_sekolah]) {
                            matrix[kod][s.nama_sekolah] = {
                                name: s.nama_sekolah, code: s.kod_sekolah,
                                daftar: 0, hadir: 0, lulus: 0, point: 0,
                                'A+':0, 'A':0, 'A-':0, 'B+':0, 'B':0, 'C+':0, 'C':0, 'D':0, 'E':0, 'G':0,
                                cemerlang: 0, kepujian: 0, kredit: 0
                            };
                        }
                        const scSubDetail = matrix[kod][s.nama_sekolah];
                        scSubDetail.daftar++;
                        
                        if (GRED_POINTS.hasOwnProperty(gred)) { 
                            // Update Subjek Daerah
                            if (subjectsContainer) {
                                subjectsContainer[kod].hadir++; 
                                subjectsContainer[kod].point += GRED_POINTS[gred]; 
                                if (isLulusGrade(gred)) subjectsContainer[kod].lulus++; 
                            }
                            
                            // Update KPI Utama
                            if (compStatsContainer) {
                                compStatsContainer.sumPoint += GRED_POINTS[gred]; 
                                compStatsContainer.sumSubject++; 
                            }
                            
                            // Update GPK Matrix (Sekolah)
                            if (sc) {
                                if (!sc.subjects[kod]) sc.subjects[kod] = { point: 0, count: 0 }; 
                                sc.subjects[kod].point += GRED_POINTS[gred]; 
                                sc.subjects[kod].count++; 
                            }

                            // C. UPDATE DATA MATRIKS TERPERINCI
                            scSubDetail.hadir++;
                            scSubDetail.point += GRED_POINTS[gred];
                            if (isLulusGrade(gred)) scSubDetail.lulus++;
                            if (scSubDetail.hasOwnProperty(gred)) scSubDetail[gred]++;

                            // Kira Grouping
                            if (['A+', 'A', 'A-'].includes(gred)) { scSubDetail.cemerlang++; scSubDetail.kredit++; }
                            else if (['B+', 'B', 'C+', 'C'].includes(gred)) { scSubDetail.kepujian++; scSubDetail.kredit++; }
                            
                        } else if (gred === 'TH' || gred === 'T') {
                            if (subjectsContainer) {
                                subjectsContainer[kod].g_count++;
                            }
                        }
                    }
                } 
            } 
        }); 
    });
    return matrix;
}

export function calculateComponentData(students, compCode) {
    const targetSubjects = COMPONENT_MAP[compCode] || []; 
    let subjects = {}; 
    let schools = {};  
    let compStats = { calon: 0, sumPoint: 0, sumSubject: 0 };
    
    let subjectSchoolMatrix = generateMatrixData(students, targetSubjects, subjects, schools, compStats);

    // GARBAGE COLLECTOR
    Object.keys(subjects).forEach(kod => {
        const sub = subjects[kod];
        if (sub.ambil === 0 || (sub.hadir === 0 && sub.g_count === 0)) {
            delete subjects[kod];
            if (subjectSchoolMatrix[kod]) delete subjectSchoolMatrix[kod];
        }
    });

    const validSubjectCodes = Object.values(subjects)
        .sort((a,b) => a.kod.localeCompare(b.kod))
        .map(s => s.kod);
        
    return { subjects, schools, compStats, validSubjectCodes, subjectSchoolMatrix };
}

// ==========================================
// 5. COMPARISON LOGIC (PERBANDINGAN E1 vs E2 vs E3)
// ==========================================

function getDistrictSimpleStats(list, isComponent = false, targetSubjects = []) {
    let stats = { calon: 0, sumPoint: 0, sumSubject: 0, lms: 0, tlms: 0 };
    
    list.forEach(s => {
        const marks = s.markah_data || {};
        
        if (isComponent) {
            let taking = false;
            Object.keys(marks).forEach(k => {
                const kod = k.replace(/^G_?|RED /g, '').trim();
                // PENAPISAN MUTLAK
                if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                
                if (targetSubjects.includes(kod)) taking = true;
            });
            if (taking) stats.calon++;
        } else {
            stats.calon++;
            const gBM = getGrade(marks, 'BM');
            const gSEJ = getGrade(marks, 'SEJ');
            if (isLulusGrade(gBM) && isLulusGrade(gSEJ)) stats.lms++;
            else stats.tlms++;
        }

        Object.keys(marks).forEach(k => {
            if (k.startsWith('G') || k.startsWith('GRED')) {
                const kod = k.replace(/^G_?|RED /g, '').trim();
                
                // PENAPISAN MUTLAK
                if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                
                let g = marks[k] ? marks[k].toString().trim().toUpperCase() : '';
                
                const isRelevant = isComponent 
                    ? targetSubjects.includes(kod) 
                    : !SUBJEK_KECUALI.includes(kod);

                if (isRelevant && g !== '' && g !== 'NULL' && g !== 'UNDEFINED') {
                    if (GRED_POINTS.hasOwnProperty(g)) {
                        stats.sumPoint += GRED_POINTS[g];
                        stats.sumSubject++;
                    }
                }
            }
        });
    });
    return stats;
}

// [SURGICAL EDIT] Kemas kini penerimaan list3 untuk modul Banding General
export function calculateComparisonGeneral(list1, list2, list3 = []) {
    const stats1 = getDistrictSimpleStats(list1);
    const stats2 = getDistrictSimpleStats(list2);
    const stats3 = getDistrictSimpleStats(list3);
    const districtStats = { ex1: stats1, ex2: stats2, ex3: stats3 };

    // 1. Proses Sekolah
    const schoolMap = {};
    const processSchools = (list, key) => {
        list.forEach(s => {
            if (!schoolMap[s.nama_sekolah]) {
                schoolMap[s.nama_sekolah] = { 
                    name: s.nama_sekolah, code: s.kod_sekolah, 
                    ex1: { pt: 0, ct: 0, gps: 0, calonCount: 0, lmsCount: 0 }, 
                    ex2: { pt: 0, ct: 0, gps: 0, calonCount: 0, lmsCount: 0 },
                    ex3: { pt: 0, ct: 0, gps: 0, calonCount: 0, lmsCount: 0 } // [SURGICAL EDIT] 
                };
            }
            const sc = schoolMap[s.nama_sekolah];
            const marks = s.markah_data || {};
            
            sc[key].calonCount++;
            
            const gBM = getGrade(marks, 'BM');
            const gSEJ = getGrade(marks, 'SEJ');
            if (isLulusGrade(gBM) && isLulusGrade(gSEJ)) sc[key].lmsCount++;

            Object.keys(marks).forEach(k => {
                if (k.startsWith('G') || k.startsWith('GRED')) {
                    const kod = k.replace(/^G_?|RED /g, '').trim();
                    
                    // PENAPISAN MUTLAK
                    if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                    
                    if (!SUBJEK_KECUALI.includes(kod)) {
                        const g = marks[k] ? marks[k].toString().trim().toUpperCase() : '';
                        if (g !== '' && g !== 'NULL' && g !== 'UNDEFINED') {
                            if (GRED_POINTS.hasOwnProperty(g)) {
                                sc[key].pt += GRED_POINTS[g];
                                sc[key].ct++;
                            }
                        }
                    }
                }
            });
            sc[key].gps = sc[key].ct > 0 ? (sc[key].pt / sc[key].ct) : 0;
        });
    };
    processSchools(list1, 'ex1');
    processSchools(list2, 'ex2');
    if (list3.length) processSchools(list3, 'ex3'); // [SURGICAL EDIT]

    // 2. Proses Subjek
    const subMap = {};
    const processSubjects = (list, key) => {
        list.forEach(s => {
            const marks = s.markah_data || {};
            Object.keys(marks).forEach(k => {
                if (k.startsWith('G') || k.startsWith('GRED')) {
                    const kod = k.replace(/^G_?|RED /g, '').trim();
                    
                    // PENAPISAN MUTLAK
                    if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                    
                    const g = marks[k] ? marks[k].toString().trim().toUpperCase() : '';
                    if (g !== '' && g !== 'NULL' && g !== 'UNDEFINED') {
                        if (!subMap[kod]) subMap[kod] = { 
                            kod: kod, nama: NAMA_SUBJEK[kod] || kod, 
                            ex1: { pt: 0, ct: 0, lulus: 0, ambil: 0 }, 
                            ex2: { pt: 0, ct: 0, lulus: 0, ambil: 0 },
                            ex3: { pt: 0, ct: 0, lulus: 0, ambil: 0 } // [SURGICAL EDIT] 
                        };
                        const obj = subMap[kod][key];
                        obj.ambil++;
                        
                        if (GRED_POINTS.hasOwnProperty(g)) {
                            obj.pt += GRED_POINTS[g];
                            obj.ct++;
                            if (isLulusGrade(g)) obj.lulus++;
                        }
                    }
                }
            });
        });
    };
    processSubjects(list1, 'ex1');
    processSubjects(list2, 'ex2');
    if (list3.length) processSubjects(list3, 'ex3'); // [SURGICAL EDIT]

    // GARBAGE COLLECTOR
    Object.keys(subMap).forEach(kod => {
        const sub = subMap[kod];
        if (sub.ex1.ambil === 0 && sub.ex2.ambil === 0 && sub.ex3.ambil === 0) {
            delete subMap[kod];
        } else if (sub.ex1.ct === 0 && sub.ex2.ct === 0 && sub.ex3.ct === 0) {
            delete subMap[kod];
        }
    });

    return { schoolMap, subMap, districtStats };
}

// -----------------------------------------------------------
// NEW: ADVANCED COMPARISON LOGIC (MATRIKS GABUNGAN E1,E2,E3)
// -----------------------------------------------------------
// [SURGICAL EDIT] Kemas kini list3 untuk modul Komponen Perbandingan
export function calculateComparisonComponent(list1, list2, list3 = [], compCode) {
    const targetSubjects = COMPONENT_MAP[compCode] || [];
    
    const stats1 = getDistrictSimpleStats(list1, true, targetSubjects);
    const stats2 = getDistrictSimpleStats(list2, true, targetSubjects);
    const stats3 = getDistrictSimpleStats(list3, true, targetSubjects); // [SURGICAL EDIT]
    const districtStats = { ex1: stats1, ex2: stats2, ex3: stats3, isComponent: true };

    const matrix1 = generateMatrixData(list1, targetSubjects, null, null, null);
    const matrix2 = generateMatrixData(list2, targetSubjects, null, null, null);
    const matrix3 = generateMatrixData(list3, targetSubjects, null, null, null); // [SURGICAL EDIT]

    let comparisonMatrix = {};
    const allSubjects = new Set([...Object.keys(matrix1), ...Object.keys(matrix2), ...Object.keys(matrix3)]);
    
    allSubjects.forEach(kod => {
        comparisonMatrix[kod] = {};
        const schools1 = matrix1[kod] || {};
        const schools2 = matrix2[kod] || {};
        const schools3 = matrix3[kod] || {}; // [SURGICAL EDIT]
        const allSchools = new Set([...Object.keys(schools1), ...Object.keys(schools2), ...Object.keys(schools3)]);

        allSchools.forEach(schName => {
            const d1 = schools1[schName]; 
            const d2 = schools2[schName]; 
            const d3 = schools3[schName]; // [SURGICAL EDIT]
            const baseInfo = d1 || d2 || d3;
            
            comparisonMatrix[kod][schName] = {
                name: schName,
                code: baseInfo.code,
                e1: d1 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0 },
                e2: d2 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0 },
                e3: d3 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0 } // [SURGICAL EDIT]
            };
        });
    });

    // 4. Proses GPK Sekolah
    const schoolMap = {};
    const processCompSchools = (list, key) => {
        list.forEach(s => {
            if (!schoolMap[s.nama_sekolah]) {
                schoolMap[s.nama_sekolah] = { 
                    name: s.nama_sekolah, code: s.kod_sekolah, 
                    ex1: { pt: 0, ct: 0, gpk: 0, calon: 0 }, 
                    ex2: { pt: 0, ct: 0, gpk: 0, calon: 0 },
                    ex3: { pt: 0, ct: 0, gpk: 0, calon: 0 } // [SURGICAL EDIT]
                };
            }
            const sc = schoolMap[s.nama_sekolah];
            const marks = s.markah_data || {};
            let hasComp = false;

            Object.keys(marks).forEach(k => {
                if (k.startsWith('G') || k.startsWith('GRED')) {
                    const kod = k.replace(/^G_?|RED /g, '').trim();
                    
                    // PENAPISAN MUTLAK
                    if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                    
                    if (targetSubjects.includes(kod)) {
                        const g = marks[k] ? marks[k].toString().trim().toUpperCase() : '';
                        if (g !== '' && g !== 'NULL' && g !== 'UNDEFINED') {
                            hasComp = true;
                            if (GRED_POINTS.hasOwnProperty(g)) {
                                sc[key].pt += GRED_POINTS[g];
                                sc[key].ct++;
                            }
                        }
                    }
                }
            });
            if (hasComp) sc[key].calon++;
            sc[key].gpk = sc[key].ct > 0 ? (sc[key].pt / sc[key].ct) : 0;
        });
    };
    processCompSchools(list1, 'ex1');
    processCompSchools(list2, 'ex2');
    if (list3.length) processCompSchools(list3, 'ex3'); // [SURGICAL EDIT]

    // 5. Proses Subjek Ringkas (Jadual Atas)
    const subMap = {};
    const processCompSubjects = (list, key) => {
        list.forEach(s => {
            const marks = s.markah_data || {};
            Object.keys(marks).forEach(k => {
                if (k.startsWith('G') || k.startsWith('GRED')) {
                    const kod = k.replace(/^G_?|RED /g, '').trim();
                    
                    // PENAPISAN MUTLAK
                    if (!NAMA_SUBJEK.hasOwnProperty(kod)) return;
                    
                    if (targetSubjects.includes(kod)) {
                        const g = marks[k] ? marks[k].toString().trim().toUpperCase() : '';
                        if (g !== '' && g !== 'NULL' && g !== 'UNDEFINED') {
                            if (!subMap[kod]) subMap[kod] = { 
                                kod: kod, nama: NAMA_SUBJEK[kod] || kod, 
                                ex1: { pt: 0, ct: 0, lulus: 0, ambil: 0 }, 
                                ex2: { pt: 0, ct: 0, lulus: 0, ambil: 0 },
                                ex3: { pt: 0, ct: 0, lulus: 0, ambil: 0 } // [SURGICAL EDIT]
                            };
                            const obj = subMap[kod][key];
                            obj.ambil++;
                            
                            if (GRED_POINTS.hasOwnProperty(g)) {
                                obj.pt += GRED_POINTS[g];
                                obj.ct++;
                                if (isLulusGrade(g)) obj.lulus++;
                            }
                        }
                    }
                }
            });
        });
    };
    processCompSubjects(list1, 'ex1');
    processCompSubjects(list2, 'ex2');
    if (list3.length) processCompSubjects(list3, 'ex3'); // [SURGICAL EDIT]

    // GARBAGE COLLECTOR
    Object.keys(subMap).forEach(kod => {
        const sub = subMap[kod];
        if (sub.ex1.ambil === 0 && sub.ex2.ambil === 0 && sub.ex3.ambil === 0) {
            delete subMap[kod];
            if (comparisonMatrix[kod]) delete comparisonMatrix[kod];
        } else if (sub.ex1.ct === 0 && sub.ex2.ct === 0 && sub.ex3.ct === 0) {
            delete subMap[kod];
            if (comparisonMatrix[kod]) delete comparisonMatrix[kod];
        }
    });

    Object.keys(comparisonMatrix).forEach(kod => {
        if (!subMap[kod]) delete comparisonMatrix[kod];
    });

    return { schoolMap, subMap, districtStats, comparisonMatrix };
}

// -----------------------------------------------------------
// NEW: SINGLE SUBJECT ANALYSIS (ANALISA SUBJEK SPESIFIK)
// -----------------------------------------------------------
// [SURGICAL EDIT] Parameter list3 untuk E3 disuntik
export function calculateSingleSubjectMatrix(list1, list2, list3 = [], isCompare, subjectCode) {
    const targetSubjects = [subjectCode];
    
    // Kita gunakan enjin matriks sedia ada (generateMatrixData)
    // Parameter: (students, targetSubjects, subjectsContainer, schoolsContainer, compStatsContainer)
    // Kita lepaskan null kerana kita hanya mahu result matriks
    const matrix1 = generateMatrixData(list1, targetSubjects, null, null, null);
    const schools1 = matrix1[subjectCode] || {};

    if (!isCompare) {
        return { 
            isCompare: false, 
            subjectCode: subjectCode, 
            data: schools1 
        };
    } else {
        const matrix2 = generateMatrixData(list2, targetSubjects, null, null, null);
        const schools2 = matrix2[subjectCode] || {};
        
        const matrix3 = generateMatrixData(list3, targetSubjects, null, null, null); // [SURGICAL EDIT]
        const schools3 = matrix3[subjectCode] || {}; // [SURGICAL EDIT]
        
        let comparisonMatrix = {};
        
        // Dapatkan gabungan semua nama sekolah dari E1 & E2 & E3
        const allSchools = new Set([...Object.keys(schools1), ...Object.keys(schools2), ...Object.keys(schools3)]);
        
        allSchools.forEach(schName => {
            const d1 = schools1[schName]; 
            const d2 = schools2[schName]; 
            const d3 = schools3[schName]; // [SURGICAL EDIT]
            const baseInfo = d1 || d2 || d3; // Untuk dapatkan kod sekolah
            
            comparisonMatrix[schName] = {
                name: schName,
                code: baseInfo.code,
                // Pastikan tiada ralat undefined jika sekolah tiada dalam salah satu exam
                e1: d1 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0, 'A+':0, 'A':0, 'A-':0, 'B+':0, 'B':0, 'C+':0, 'C':0, 'D':0, 'E':0, 'G':0 },
                e2: d2 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0, 'A+':0, 'A':0, 'A-':0, 'B+':0, 'B':0, 'C+':0, 'C':0, 'D':0, 'E':0, 'G':0 },
                e3: d3 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0, 'A+':0, 'A':0, 'A-':0, 'B+':0, 'B':0, 'C+':0, 'C':0, 'D':0, 'E':0, 'G':0 } // [SURGICAL EDIT]
            };
        });

        return { 
            isCompare: true, 
            subjectCode: subjectCode, 
            data: comparisonMatrix 
        };
    }
}

// -----------------------------------------------------------
// NEW: STUDENT ACHIEVEMENT ANALYSIS (PAPARAN PELAJAR)
// -----------------------------------------------------------
function studentAchievementNormalizeValue(value) {
    if (value === undefined || value === null) return '';
    return value.toString().trim();
}

function studentAchievementNormalizeGrade(value) {
    return studentAchievementNormalizeValue(value).toUpperCase();
}

function studentAchievementIsEmptyValue(value) {
    const text = studentAchievementNormalizeValue(value).toUpperCase();
    return text === '' || text === 'NULL' || text === 'UNDEFINED';
}

function studentAchievementIsAbsentGrade(grade) {
    const g = studentAchievementNormalizeGrade(grade);
    return g === '' || g === 'TH' || g === 'T' || g === 'NULL' || g === 'UNDEFINED';
}

function studentAchievementIsKnownGrade(grade) {
    return Object.prototype.hasOwnProperty.call(GRED_POINTS, studentAchievementNormalizeGrade(grade));
}

function studentAchievementIsPassingGrade(grade) {
    const g = studentAchievementNormalizeGrade(grade);
    return studentAchievementIsKnownGrade(g) && g !== 'G';
}

function studentAchievementIsCreditGrade(grade) {
    const g = studentAchievementNormalizeGrade(grade);
    return ['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C'].includes(g);
}

function studentAchievementIsSubjectCode(key) {
    return Object.prototype.hasOwnProperty.call(NAMA_SUBJEK, key);
}

function studentAchievementGetSubjectName(subjectCode) {
    return NAMA_SUBJEK[subjectCode] || subjectCode;
}

function studentAchievementStripGradePrefix(key) {
    return studentAchievementNormalizeValue(key).replace(/^G_?|^GRED\s+|^GRED_/i, '').trim();
}

function studentAchievementGradeKeyCandidates(subjectCode) {
    return [
        `G${subjectCode}`,
        `G_${subjectCode}`,
        `GRED ${subjectCode}`,
        `GRED_${subjectCode}`
    ];
}

function studentAchievementGetSubjectMark(marks, subjectCode) {
    if (!marks || !subjectCode) return '';
    const value = marks[subjectCode];
    if (studentAchievementIsEmptyValue(value)) return '';
    return studentAchievementNormalizeValue(value).toUpperCase();
}

function studentAchievementGetSubjectGrade(marks, subjectCode) {
    if (!marks || !subjectCode) return '';
    const candidates = studentAchievementGradeKeyCandidates(subjectCode);

    for (const key of candidates) {
        if (marks[key] !== undefined && !studentAchievementIsEmptyValue(marks[key])) {
            return studentAchievementNormalizeGrade(marks[key]);
        }
    }

    return '';
}

function studentAchievementSubjectSortScore(subjectCode) {
    const idx = SUBJECT_PRIORITY.indexOf(subjectCode);
    return idx === -1 ? 9999 : idx;
}

function studentAchievementCompareSubjects(a, b) {
    const scoreA = studentAchievementSubjectSortScore(a);
    const scoreB = studentAchievementSubjectSortScore(b);

    if (scoreA !== scoreB) return scoreA - scoreB;

    const nameA = studentAchievementGetSubjectName(a);
    const nameB = studentAchievementGetSubjectName(b);

    if (nameA !== nameB) return nameA.localeCompare(nameB, 'ms-MY');
    return a.localeCompare(b, 'ms-MY');
}

function studentAchievementBuildIssueText(subjects) {
    return subjects
        .filter(item => item.isTaken && !item.isPass)
        .map(item => `${item.kod}:${item.gred || item.markah || '-'}`)
        .join(' ');
}

function studentAchievementBuildAchievementText(subjects) {
    return subjects
        .filter(item => item.isTaken)
        .map(item => `${item.kod} ${item.markah || '-'} (${item.gred || '-'})`)
        .join(' | ');
}

// [SURGICAL EDIT] Memastikan Subjek E3 turut dijejak
export function getStudentAchievementSubjectCodes(students, comparisonStudents = [], comparisonStudents2 = []) {
    const subjectSet = new Set();
    const allStudents = [
        ...(Array.isArray(students) ? students : []), 
        ...(Array.isArray(comparisonStudents) ? comparisonStudents : []),
        ...(Array.isArray(comparisonStudents2) ? comparisonStudents2 : [])
    ];

    allStudents.forEach(student => {
        const marks = student.markah_data || {};

        Object.keys(marks).forEach(rawKey => {
            const key = studentAchievementNormalizeValue(rawKey);

            if (studentAchievementIsSubjectCode(key)) {
                const mark = studentAchievementGetSubjectMark(marks, key);
                const grade = studentAchievementGetSubjectGrade(marks, key);

                if (!studentAchievementIsEmptyValue(mark) || !studentAchievementIsEmptyValue(grade)) {
                    subjectSet.add(key);
                }
                return;
            }

            if (key.startsWith('G') || key.startsWith('GRED')) {
                const possibleSubjectCode = studentAchievementStripGradePrefix(key);

                if (!studentAchievementIsSubjectCode(possibleSubjectCode)) return;

                const grade = studentAchievementGetSubjectGrade(marks, possibleSubjectCode);
                if (!studentAchievementIsEmptyValue(grade)) {
                    subjectSet.add(possibleSubjectCode);
                }
            }
        });
    });

    return Array.from(subjectSet).sort(studentAchievementCompareSubjects);
}

// [SURGICAL EDIT] Menyokong E3 dan beza matematik Trajektori E2 vs E1 dan E3 vs E2
export function calculateStudentAchievementData(students, comparisonStudents = [], comparisonStudents2 = [], options = {}) {
    const source = Array.isArray(students) ? students : [];
    const compSource = Array.isArray(comparisonStudents) ? comparisonStudents : [];
    const compSource2 = Array.isArray(comparisonStudents2) ? comparisonStudents2 : []; // E3

    const compMap = new Map();
    compSource.forEach(s => {
        if (s.id_individu) compMap.set(s.id_individu, s);
    });

    const compMap2 = new Map();
    compSource2.forEach(s => {
        if (s.id_individu) compMap2.set(s.id_individu, s);
    });

    const subjectCodes = Array.isArray(options.subjectCodes) && options.subjectCodes.length > 0
        ? options.subjectCodes.filter(studentAchievementIsSubjectCode).sort(studentAchievementCompareSubjects)
        : getStudentAchievementSubjectCodes(source, compSource, compSource2);

    const rows = source.map((student, index) => {
        const marks = student.markah_data || {};
        
        const compStudent = compMap.get(student.id_individu);
        const compMarks = compStudent ? (compStudent.markah_data || {}) : null;

        const compStudent2 = compMap2.get(student.id_individu);
        const compMarks2 = compStudent2 ? (compStudent2.markah_data || {}) : null; // E3

        let totalTaken = 0;
        let totalPresent = 0;
        let totalPass = 0;
        let totalFail = 0;
        let totalCredit = 0;
        let totalPoint = 0;
        let countedSubjects = 0;

        let compTotalTaken = 0;
        let compTotalPresent = 0;
        let compTotalPass = 0;
        let compTotalFail = 0;
        let compTotalCredit = 0;
        let compTotalPoint = 0;
        let compCountedSubjects = 0;

        let comp2TotalTaken = 0;
        let comp2TotalPresent = 0;
        let comp2TotalPass = 0;
        let comp2TotalFail = 0;
        let comp2TotalCredit = 0;
        let comp2TotalPoint = 0;
        let comp2CountedSubjects = 0;

        const subjectResults = subjectCodes.map(subjectCode => {
            const mark = studentAchievementGetSubjectMark(marks, subjectCode);
            const grade = studentAchievementGetSubjectGrade(marks, subjectCode);
            const hasMark = !studentAchievementIsEmptyValue(mark);
            const hasGrade = !studentAchievementIsEmptyValue(grade);
            const isTaken = hasMark || hasGrade;
            const isPresent = isTaken && !studentAchievementIsAbsentGrade(grade || mark);
            const isPass = hasGrade ? studentAchievementIsPassingGrade(grade) : false;
            const isFail = isTaken && hasGrade && !studentAchievementIsPassingGrade(grade);
            const isCredit = hasGrade && studentAchievementIsCreditGrade(grade);
            const point = studentAchievementIsKnownGrade(grade) ? GRED_POINTS[grade] : null;
            const isGpsCounted = isTaken && point !== null && !SUBJEK_KECUALI.includes(subjectCode);

            if (isTaken) totalTaken++;
            if (isPresent) totalPresent++;
            if (isPass) totalPass++;
            if (isFail) totalFail++;
            if (isCredit) totalCredit++;
            if (isGpsCounted) {
                totalPoint += point;
                countedSubjects++;
            }

            let compMark = '';
            let compGrade = '';
            let compIsTaken = false;
            let compIsPresent = false;
            let compIsPass = false;
            let compIsFail = false;
            let compIsCredit = false;
            let compPoint = null;
            let compIsGpsCounted = false;

            if (compMarks) {
                compMark = studentAchievementGetSubjectMark(compMarks, subjectCode);
                compGrade = studentAchievementGetSubjectGrade(compMarks, subjectCode);
                const compHasMark = !studentAchievementIsEmptyValue(compMark);
                const compHasGrade = !studentAchievementIsEmptyValue(compGrade);
                compIsTaken = compHasMark || compHasGrade;
                compIsPresent = compIsTaken && !studentAchievementIsAbsentGrade(compGrade || compMark);
                compIsPass = compHasGrade ? studentAchievementIsPassingGrade(compGrade) : false;
                compIsFail = compIsTaken && compHasGrade && !studentAchievementIsPassingGrade(compGrade);
                compIsCredit = compHasGrade && studentAchievementIsCreditGrade(compGrade);
                compPoint = studentAchievementIsKnownGrade(compGrade) ? GRED_POINTS[compGrade] : null;
                compIsGpsCounted = compIsTaken && compPoint !== null && !SUBJEK_KECUALI.includes(subjectCode);

                if (compIsTaken) compTotalTaken++;
                if (compIsPresent) compTotalPresent++;
                if (compIsPass) compTotalPass++;
                if (compIsFail) compTotalFail++;
                if (compIsCredit) compTotalCredit++;
                if (compIsGpsCounted) {
                    compTotalPoint += compPoint;
                    compCountedSubjects++;
                }
            }

            // [COMMENT SYNTAX] SURGICAL EDIT START: Logik Trajektori E2 vs E1
            let diffStatus = { type: 'NONE', label: '-', val: 0 };
            if (compIsTaken && isTaken) {
                if (studentAchievementIsAbsentGrade(grade) && studentAchievementIsAbsentGrade(compGrade)) diffStatus = { type: 'SAME', label: '-', val: 0 };
                else if (studentAchievementIsAbsentGrade(grade) && !studentAchievementIsAbsentGrade(compGrade)) diffStatus = { type: 'UP', label: '▲ HDR', val: 1 };
                else if (!studentAchievementIsAbsentGrade(grade) && studentAchievementIsAbsentGrade(compGrade)) diffStatus = { type: 'DOWN', label: '▼ TH', val: -1 };
                else {
                    const v1 = parseFloat(mark);
                    const v2 = parseFloat(compMark);
                    if (!isNaN(v1) && !isNaN(v2)) {
                        const diff = v2 - v1; // E2 - E1
                        if (diff > 0) diffStatus = { type: 'UP', label: `▲ +${diff}`, val: diff };
                        else if (diff < 0) diffStatus = { type: 'DOWN', label: `▼ ${Math.abs(diff)}`, val: diff };
                        else diffStatus = { type: 'SAME', label: '-', val: 0 };
                    } else if (grade !== compGrade) {
                         const p1 = GRED_POINTS[grade];
                         const p2 = GRED_POINTS[compGrade];
                         if (p1 !== undefined && p2 !== undefined) {
                             const diff = p1 - p2; // Point rendah lebih baik (E1 - E2)
                             if (diff > 0) diffStatus = { type: 'UP', label: `▲`, val: diff };
                             else if (diff < 0) diffStatus = { type: 'DOWN', label: `▼`, val: diff };
                             else diffStatus = { type: 'SAME', label: '-', val: 0 };
                         }
                    }
                }
            } else if (compIsTaken && !isTaken) {
                diffStatus = { type: 'NEW', label: 'BARU', val: 0 };
            } else if (!compIsTaken && isTaken) {
                diffStatus = { type: 'DROP', label: 'GUGUR', val: 0 };
            }
            // [COMMENT SYNTAX] SURGICAL EDIT END

            // DATA E3
            let comp2Mark = '';
            let comp2Grade = '';
            let comp2IsTaken = false;
            let comp2IsPresent = false;
            let comp2IsPass = false;
            let comp2IsFail = false;
            let comp2IsCredit = false;
            let comp2Point = null;
            let comp2IsGpsCounted = false;

            if (compMarks2) {
                comp2Mark = studentAchievementGetSubjectMark(compMarks2, subjectCode);
                comp2Grade = studentAchievementGetSubjectGrade(compMarks2, subjectCode);
                const comp2HasMark = !studentAchievementIsEmptyValue(comp2Mark);
                const comp2HasGrade = !studentAchievementIsEmptyValue(comp2Grade);
                comp2IsTaken = comp2HasMark || comp2HasGrade;
                comp2IsPresent = comp2IsTaken && !studentAchievementIsAbsentGrade(comp2Grade || comp2Mark);
                comp2IsPass = comp2HasGrade ? studentAchievementIsPassingGrade(comp2Grade) : false;
                comp2IsFail = comp2IsTaken && comp2HasGrade && !studentAchievementIsPassingGrade(comp2Grade);
                comp2IsCredit = comp2HasGrade && studentAchievementIsCreditGrade(comp2Grade);
                comp2Point = studentAchievementIsKnownGrade(comp2Grade) ? GRED_POINTS[comp2Grade] : null;
                comp2IsGpsCounted = comp2IsTaken && comp2Point !== null && !SUBJEK_KECUALI.includes(subjectCode);

                if (comp2IsTaken) comp2TotalTaken++;
                if (comp2IsPresent) comp2TotalPresent++;
                if (comp2IsPass) comp2TotalPass++;
                if (comp2IsFail) comp2TotalFail++;
                if (comp2IsCredit) comp2TotalCredit++;
                if (comp2IsGpsCounted) {
                    comp2TotalPoint += comp2Point;
                    comp2CountedSubjects++;
                }
            }

            // [COMMENT SYNTAX] SURGICAL EDIT START: Logik Trajektori E3 vs E2
            let diffStatus2 = { type: 'NONE', label: '-', val: 0 };
            
            // Baseline untuk perbandingan E3 ialah E2, jika tiada E2, guna E1
            let baseMark = compIsTaken ? compMark : mark;
            let baseGrade = compIsTaken ? compGrade : grade;
            let baseIsTaken = compIsTaken || isTaken;

            if (comp2IsTaken && baseIsTaken) {
                if (studentAchievementIsAbsentGrade(baseGrade) && studentAchievementIsAbsentGrade(comp2Grade)) diffStatus2 = { type: 'SAME', label: '-', val: 0 };
                else if (studentAchievementIsAbsentGrade(baseGrade) && !studentAchievementIsAbsentGrade(comp2Grade)) diffStatus2 = { type: 'UP', label: '▲ HDR', val: 1 };
                else if (!studentAchievementIsAbsentGrade(baseGrade) && studentAchievementIsAbsentGrade(comp2Grade)) diffStatus2 = { type: 'DOWN', label: '▼ TH', val: -1 };
                else {
                    const vBase = parseFloat(baseMark);
                    const v3 = parseFloat(comp2Mark);
                    if (!isNaN(vBase) && !isNaN(v3)) {
                        const diff2 = v3 - vBase; // E3 - Base
                        if (diff2 > 0) diffStatus2 = { type: 'UP', label: `▲ +${diff2}`, val: diff2 };
                        else if (diff2 < 0) diffStatus2 = { type: 'DOWN', label: `▼ ${Math.abs(diff2)}`, val: diff2 };
                        else diffStatus2 = { type: 'SAME', label: '-', val: 0 };
                    } else if (baseGrade !== comp2Grade) {
                         const pBase = GRED_POINTS[baseGrade];
                         const p3 = GRED_POINTS[comp2Grade];
                         if (pBase !== undefined && p3 !== undefined) {
                             const diff2 = pBase - p3; // Point rendah lebih baik (Base - E3)
                             if (diff2 > 0) diffStatus2 = { type: 'UP', label: `▲`, val: diff2 };
                             else if (diff2 < 0) diffStatus2 = { type: 'DOWN', label: `▼`, val: diff2 };
                             else diffStatus2 = { type: 'SAME', label: '-', val: 0 };
                         }
                    }
                }
            } else if (comp2IsTaken && !baseIsTaken) {
                diffStatus2 = { type: 'NEW', label: 'BARU', val: 0 };
            } else if (!comp2IsTaken && baseIsTaken) {
                diffStatus2 = { type: 'DROP', label: 'GUGUR', val: 0 };
            }
            // [COMMENT SYNTAX] SURGICAL EDIT END

            return {
                kod: subjectCode,
                nama: studentAchievementGetSubjectName(subjectCode),
                markah: mark,
                gred: grade,
                point,
                isTaken,
                isPresent,
                isPass,
                isFail,
                isCredit,
                isGpsCounted,
                display: isTaken ? `${mark || '-'} (${grade || '-'})` : '-',
                
                compMark,
                compGrade,
                compIsTaken,
                compIsPresent,
                compIsPass,
                compIsFail,
                compIsCredit,
                diffStatus,
                compDisplay: compIsTaken ? `${compMark || '-'} (${compGrade || '-'})` : '-',
                
                comp2Mark,
                comp2Grade,
                comp2IsTaken,
                comp2IsPresent,
                comp2IsPass,
                comp2IsFail,
                comp2IsCredit,
                diffStatus2,
                comp2Display: comp2IsTaken ? `${comp2Mark || '-'} (${comp2Grade || '-'})` : '-'
            };
        });

        const gBM = studentAchievementGetSubjectGrade(marks, 'BM');
        const gSEJ = studentAchievementGetSubjectGrade(marks, 'SEJ');
        const isLMS = studentAchievementIsPassingGrade(gBM) && studentAchievementIsPassingGrade(gSEJ);
        const gps = countedSubjects > 0 ? totalPoint / countedSubjects : 0;
        const issueText = studentAchievementBuildIssueText(subjectResults);
        const achievementText = studentAchievementBuildAchievementText(subjectResults);

        // [COMMENT SYNTAX] SURGICAL EDIT START: Logik GPS Trajektori E2 vs E1
        let comparison = null;
        if (compMarks) {
            const compGBM = studentAchievementGetSubjectGrade(compMarks, 'BM');
            const compGSEJ = studentAchievementGetSubjectGrade(compMarks, 'SEJ');
            const compIsLMS = studentAchievementIsPassingGrade(compGBM) && studentAchievementIsPassingGrade(compGSEJ);
            const compGps = compCountedSubjects > 0 ? compTotalPoint / compCountedSubjects : 0;
            
            let gpsImprovement = 'NONE';
            let gpsDiffText = '-';
            let finalGpsDiff = 0;
            
            if (compCountedSubjects > 0 && countedSubjects > 0) {
                const gpsDiff = compGps - gps; // E2 - E1 (Nilai Negatif = GPS Turun = UP)
                finalGpsDiff = gpsDiff;
                if (gpsDiff < 0) { gpsImprovement = 'UP'; gpsDiffText = `▲ ${Math.abs(gpsDiff).toFixed(2)}`; }
                else if (gpsDiff > 0) { gpsImprovement = 'DOWN'; gpsDiffText = `▼ ${Math.abs(gpsDiff).toFixed(2)}`; }
                else { gpsImprovement = 'SAME'; gpsDiffText = '-'; }
            }

            comparison = {
                totalTaken: compTotalTaken,
                totalPresent: compTotalPresent,
                totalPass: compTotalPass,
                totalFail: compTotalFail,
                totalCredit: compTotalCredit,
                gps: compGps,
                gpsText: compCountedSubjects > 0 ? compGps.toFixed(2) : '-',
                gpsDiff: Math.abs(finalGpsDiff).toFixed(2),
                gpsImprovement,
                gpsDiffText,
                lmsStatus: compIsLMS ? 'LMS' : 'TLMS'
            };
        }
        // [COMMENT SYNTAX] SURGICAL EDIT END

        // [COMMENT SYNTAX] SURGICAL EDIT START: Logik GPS Trajektori E3 vs E2
        let comparison2 = null;
        if (compMarks2) {
            const comp2GBM = studentAchievementGetSubjectGrade(compMarks2, 'BM');
            const comp2GSEJ = studentAchievementGetSubjectGrade(compMarks2, 'SEJ');
            const comp2IsLMS = studentAchievementIsPassingGrade(comp2GBM) && studentAchievementIsPassingGrade(comp2GSEJ);
            const comp2Gps = comp2CountedSubjects > 0 ? comp2TotalPoint / comp2CountedSubjects : 0;
            
            let gpsImprovement2 = 'NONE';
            let gpsDiffText2 = '-';
            let finalGpsDiff2 = 0;
            
            let baseGps = compCountedSubjects > 0 ? compGps : gps;
            let baseCount = compCountedSubjects > 0 ? compCountedSubjects : countedSubjects;

            if (comp2CountedSubjects > 0 && baseCount > 0) {
                const gpsDiff2 = comp2Gps - baseGps; // E3 - Base
                finalGpsDiff2 = gpsDiff2;
                if (gpsDiff2 < 0) { gpsImprovement2 = 'UP'; gpsDiffText2 = `▲ ${Math.abs(gpsDiff2).toFixed(2)}`; }
                else if (gpsDiff2 > 0) { gpsImprovement2 = 'DOWN'; gpsDiffText2 = `▼ ${Math.abs(gpsDiff2).toFixed(2)}`; }
                else { gpsImprovement2 = 'SAME'; gpsDiffText2 = '-'; }
            }

            comparison2 = {
                totalTaken: comp2TotalTaken,
                totalPresent: comp2TotalPresent,
                totalPass: comp2TotalPass,
                totalFail: comp2TotalFail,
                totalCredit: comp2TotalCredit,
                gps: comp2Gps,
                gpsText: comp2CountedSubjects > 0 ? comp2Gps.toFixed(2) : '-',
                gpsDiff: Math.abs(finalGpsDiff2).toFixed(2),
                gpsImprovement: gpsImprovement2,
                gpsDiffText: gpsDiffText2,
                lmsStatus: comp2IsLMS ? 'LMS' : 'TLMS'
            };
        }
        // [COMMENT SYNTAX] SURGICAL EDIT END

        return {
            bil: index + 1,
            id: student.id || '',
            id_individu: student.id_individu || '',
            no_kp: student.no_kp || '',
            nama_murid: student.nama_murid || '',
            kod_sekolah: student.kod_sekolah || '',
            nama_sekolah: student.nama_sekolah || '',
            tingkatan: student.tingkatan || '',
            kelas: student.kelas || '',
            jantina: student.jantina || '',
            agama: student.agama || '',
            kaum: student.kaum || '',
            tahun: student.tahun || '',
            sesi_persekolahan: student.sesi_persekolahan || '',
            nama_peperiksaan: student.nama_peperiksaan || '',
            subjects: subjectResults,
            totalTaken,
            totalPresent,
            totalPass,
            totalFail,
            totalCredit,
            totalPoint,
            countedSubjects,
            gps,
            gpsText: countedSubjects > 0 ? gps.toFixed(2) : '-',
            lmsStatus: isLMS ? 'LMS' : 'TLMS',
            bmGrade: gBM || '-',
            sejGrade: gSEJ || '-',
            issueText,
            achievementText,
            comparison,
            comparison2 // [SURGICAL EDIT] Data E3
        };
    });

    rows.sort((a, b) => {
        const kelasCompare = (a.kelas || '').localeCompare(b.kelas || '', 'ms-MY');
        if (kelasCompare !== 0) return kelasCompare;
        return (a.nama_murid || '').localeCompare(b.nama_murid || '', 'ms-MY');
    });

    rows.forEach((row, index) => {
        row.bil = index + 1;
    });

    const summary = rows.reduce((acc, row) => {
        acc.totalStudents++;
        acc.totalLMS += row.lmsStatus === 'LMS' ? 1 : 0;
        acc.totalTLMS += row.lmsStatus === 'TLMS' ? 1 : 0;
        acc.totalSubjectTaken += row.totalTaken;
        acc.totalSubjectPresent += row.totalPresent;
        acc.totalPass += row.totalPass;
        acc.totalFail += row.totalFail;
        acc.totalCredit += row.totalCredit;
        acc.totalPoint += row.totalPoint;
        acc.totalCountedSubjects += row.countedSubjects;
        return acc;
    }, {
        totalStudents: 0,
        totalLMS: 0,
        totalTLMS: 0,
        totalSubjectTaken: 0,
        totalSubjectPresent: 0,
        totalPass: 0,
        totalFail: 0,
        totalCredit: 0,
        totalPoint: 0,
        totalCountedSubjects: 0
    });

    summary.lmsPercent = summary.totalStudents > 0 ? (summary.totalLMS / summary.totalStudents) * 100 : 0;
    summary.tlmsPercent = summary.totalStudents > 0 ? (summary.totalTLMS / summary.totalStudents) * 100 : 0;
    summary.gps = summary.totalCountedSubjects > 0 ? summary.totalPoint / summary.totalCountedSubjects : 0;
    summary.gpsText = summary.totalCountedSubjects > 0 ? summary.gps.toFixed(2) : '-';
    summary.lmsPercentText = `${summary.lmsPercent.toFixed(2)}%`;
    summary.tlmsPercentText = `${summary.tlmsPercent.toFixed(2)}%`;

    return {
        subjects: subjectCodes.map(subjectCode => ({
            kod: subjectCode,
            nama: studentAchievementGetSubjectName(subjectCode)
        })),
        rows,
        summary
    };
}

export function getStudentAchievementExportRows(studentAchievementData, isCompare = false) {
    const data = studentAchievementData || {};
    const subjects = Array.isArray(data.subjects) ? data.subjects : [];
    const rows = Array.isArray(data.rows) ? data.rows : [];

    return rows.map(row => {
        const item = {
            Bil: row.bil,
            'ID Individu': row.id_individu,
            'No KP': row.no_kp,
            'Nama Murid': row.nama_murid,
            Kelas: row.kelas,
            Jantina: row.jantina,
            Kaum: row.kaum
        };

        if (isCompare) {
            item['Subjek E1'] = row.totalTaken;
            item['Subjek E2'] = row.comparison ? row.comparison.totalTaken : '-';
            if (row.comparison2) item['Subjek E3'] = row.comparison2.totalTaken; // [SURGICAL EDIT]

            item['Lulus E1'] = row.totalPass;
            item['Lulus E2'] = row.comparison ? row.comparison.totalPass : '-';
            if (row.comparison2) item['Lulus E3'] = row.comparison2.totalPass; // [SURGICAL EDIT]

            item['LMS E1'] = row.lmsStatus;
            item['LMS E2'] = row.comparison ? row.comparison.lmsStatus : '-';
            if (row.comparison2) item['LMS E3'] = row.comparison2.lmsStatus; // [SURGICAL EDIT]

            item['GPS E1'] = row.gpsText;
            item['GPS E2'] = row.comparison ? row.comparison.gpsText : '-';
            if (row.comparison2) item['GPS E3'] = row.comparison2.gpsText; // [SURGICAL EDIT]

            // [COMMENT SYNTAX] SURGICAL EDIT START: Label Eksport Trajektori
            item['Beza GPS (E2-E1)'] = row.comparison && row.comparison.gpsImprovement !== 'NONE'
                ? (row.comparison.gpsImprovement === 'UP' ? `+${row.comparison.gpsDiff}` : (row.comparison.gpsImprovement === 'DOWN' ? `-${row.comparison.gpsDiff}` : '0.00'))
                : '-';
                
            if (row.comparison2) {
                item['Beza GPS (E3-E2)'] = row.comparison2.gpsImprovement !== 'NONE'
                    ? (row.comparison2.gpsImprovement === 'UP' ? `+${row.comparison2.gpsDiff}` : (row.comparison2.gpsImprovement === 'DOWN' ? `-${row.comparison2.gpsDiff}` : '0.00'))
                    : '-';
            }
            // [COMMENT SYNTAX] SURGICAL EDIT END
        } else {
            item['Bil Subjek'] = row.totalTaken;
            item['Bil Lulus'] = row.totalPass;
            item['Bil Gagal'] = row.totalFail;
            item['Bil Kredit'] = row.totalCredit;
            item['GPS'] = row.gpsText;
            item['LMS'] = row.lmsStatus;
            item['Isu'] = row.issueText;
        }

        subjects.forEach(subject => {
            const subjectResult = row.subjects.find(result => result.kod === subject.kod);
            if (isCompare) {
                item[`${subject.kod} E1`] = subjectResult ? subjectResult.display : '-';
                item[`${subject.kod} E2`] = subjectResult ? subjectResult.compDisplay : '-';
                if (row.comparison2) item[`${subject.kod} E3`] = subjectResult ? subjectResult.comp2Display : '-'; // [SURGICAL EDIT]
                
                // [COMMENT SYNTAX] SURGICAL EDIT START: Label Eksport Subjek Trajektori
                item[`${subject.kod} Beza (E2-E1)`] = subjectResult ? subjectResult.diffStatus.label : '-';
                if (row.comparison2) item[`${subject.kod} Beza (E3-E2)`] = subjectResult ? subjectResult.diffStatus2.label : '-';
                // [COMMENT SYNTAX] SURGICAL EDIT END
            } else {
                item[subject.kod] = subjectResult ? subjectResult.markah || '-' : '-';
                item[`G${subject.kod}`] = subjectResult ? subjectResult.gred || '-' : '-';
            }
        });

        item['Ringkasan Pencapaian'] = row.achievementText;
        return item;
    });
}

export function isSpecificSchoolSelected(schoolValue) {
    const normalized = studentAchievementNormalizeValue(schoolValue).toUpperCase();
    return normalized !== '' && normalized !== 'SEMUA';
}