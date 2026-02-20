// ==========================================
// EDARS V3.0 - ANALYTICS MODULE
// Modul ini mengandungi logik pengiraan statistik tulen.
// Bebas daripada manipulasi DOM (Pure Logic).
// ==========================================

import { GRED_POINTS, SUBJEK_KECUALI, NAMA_SUBJEK, COMPONENT_MAP } from './config.js';
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
// 5. COMPARISON LOGIC (PERBANDINGAN E1 vs E2)
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

export function calculateComparisonGeneral(list1, list2) {
    const stats1 = getDistrictSimpleStats(list1);
    const stats2 = getDistrictSimpleStats(list2);
    const districtStats = { ex1: stats1, ex2: stats2 };

    // 1. Proses Sekolah
    const schoolMap = {};
    const processSchools = (list, key) => {
        list.forEach(s => {
            if (!schoolMap[s.nama_sekolah]) {
                schoolMap[s.nama_sekolah] = { 
                    name: s.nama_sekolah, code: s.kod_sekolah, 
                    ex1: { pt: 0, ct: 0, gps: 0, calonCount: 0, lmsCount: 0 }, 
                    ex2: { pt: 0, ct: 0, gps: 0, calonCount: 0, lmsCount: 0 } 
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
                            ex2: { pt: 0, ct: 0, lulus: 0, ambil: 0 } 
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

    // GARBAGE COLLECTOR
    Object.keys(subMap).forEach(kod => {
        const sub = subMap[kod];
        if (sub.ex1.ambil === 0 && sub.ex2.ambil === 0) {
            delete subMap[kod];
        } else if (sub.ex1.ct === 0 && sub.ex2.ct === 0) {
            delete subMap[kod];
        }
    });

    return { schoolMap, subMap, districtStats };
}

// -----------------------------------------------------------
// NEW: ADVANCED COMPARISON LOGIC (MATRIKS GABUNGAN)
// -----------------------------------------------------------
export function calculateComparisonComponent(list1, list2, compCode) {
    const targetSubjects = COMPONENT_MAP[compCode] || [];
    
    const stats1 = getDistrictSimpleStats(list1, true, targetSubjects);
    const stats2 = getDistrictSimpleStats(list2, true, targetSubjects);
    const districtStats = { ex1: stats1, ex2: stats2, isComponent: true };

    const matrix1 = generateMatrixData(list1, targetSubjects, null, null, null);
    const matrix2 = generateMatrixData(list2, targetSubjects, null, null, null);

    let comparisonMatrix = {};
    const allSubjects = new Set([...Object.keys(matrix1), ...Object.keys(matrix2)]);
    
    allSubjects.forEach(kod => {
        comparisonMatrix[kod] = {};
        const schools1 = matrix1[kod] || {};
        const schools2 = matrix2[kod] || {};
        const allSchools = new Set([...Object.keys(schools1), ...Object.keys(schools2)]);

        allSchools.forEach(schName => {
            const d1 = schools1[schName]; 
            const d2 = schools2[schName]; 
            const baseInfo = d1 || d2;
            
            comparisonMatrix[kod][schName] = {
                name: schName,
                code: baseInfo.code,
                e1: d1 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0 },
                e2: d2 || { daftar:0, hadir:0, cemerlang:0, kepujian:0, kredit:0, point:0, lulus:0 }
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
                    ex2: { pt: 0, ct: 0, gpk: 0, calon: 0 } 
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
                                ex2: { pt: 0, ct: 0, lulus: 0, ambil: 0 } 
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

    // GARBAGE COLLECTOR
    Object.keys(subMap).forEach(kod => {
        const sub = subMap[kod];
        if (sub.ex1.ambil === 0 && sub.ex2.ambil === 0) {
            delete subMap[kod];
            if (comparisonMatrix[kod]) delete comparisonMatrix[kod];
        } else if (sub.ex1.ct === 0 && sub.ex2.ct === 0) {
            delete subMap[kod];
            if (comparisonMatrix[kod]) delete comparisonMatrix[kod];
        }
    });

    Object.keys(comparisonMatrix).forEach(kod => {
        if (!subMap[kod]) delete comparisonMatrix[kod];
    });

    return { schoolMap, subMap, districtStats, comparisonMatrix };
}