// ==========================================
// EDARS V3.0 - CONFIGURATION MODULE
// Modul ini menyimpan semua tetapan statik dan rujukan sistem.
// ==========================================

// 1. KONFIGURASI PANGKALAN DATA (SUPABASE)
// Pastikan URL dan KEY ini adalah yang terkini dan mempunyai akses yang betul.
export const SUPABASE_URL = 'https://app.tech4ag.my'; 
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYzMzczNjQ1LCJleHAiOjIwNzg3MzM2NDV9.vZOedqJzUn01PjwfaQp7VvRzSm4aRMr21QblPDK8AoY';

// 2. SISTEM GRED & MATA (GRED_POINTS)
// Digunakan untuk pengiraan GPMP, GPS, dan GPD.
export const GRED_POINTS = { 
    'A+': 0, 
    'A': 1, 
    'A-': 2, 
    'B+': 3, 
    'B': 4, 
    'C+': 5, 
    'C': 6, 
    'D': 7, 
    'E': 8, 
    'G': 9
};

// 3. SENARAI SUBJEK PENGECUALIAN (SUBJEK_KECUALI)
// Subjek ini TIDAK AKAN diambil kira dalam pengiraan GPS / GPD.
export const SUBJEK_KECUALI = [
    'PJPK', 'BIAK', 'MAK', 'PIAK', 'PMAK', 'BJP', 'BP', 'PPBM'
]; 

// 4. SUSUNAN KEUTAMAAN SUBJEK (SUBJECT_PRIORITY)
// Digunakan untuk menyusun paparan subjek dalam jadual dan checkbox (Teras didahulukan).
export const SUBJECT_PRIORITY = [
    'BM', 'SEJ', 'BI', 'MM', 'SAINS', 'PAI', 'PM', // Teras
    'BIO', 'FIZIK', 'KIMIA', 'MT', // Elektif STEM
    'PQS', 'PSI', 'TI', // Elektif Agama
    'PSV', 'PERNIAGAAN', 'EKO', 'AKAUN' // Elektif Kemanusiaan/Sastera/TVET
];

// 5. PEMETAAN KOD KE NAMA PENUH SUBJEK (NAMA_SUBJEK)
// BERTINDAK SEBAGAI STRICT WHITELIST: Hanya 45 subjek ini sahaja diproses oleh sistem.
export const NAMA_SUBJEK = {
    'ADB': "AL-ADAB WA AL-BALAGHAH", 
    'AKAUN': "PRINSIP PERAKAUNAN",
    'APAKK': "ASUHAN DAN PENDIDIKAN AWAL KANAK-KANAK",
    'AS': "AL-SYARIAH",
    'BA': "BAHASA ARAB", 
    'BC': "BAHASA CINA", 
    'BI': "BAHASA INGGERIS", 
    'BIO': "BIOLOGI", 
    'BJR': "BAHASA JERMAN", 
    'BM': "BAHASA MELAYU", 
    'BT': "BAHASA TAMIL", 
    'EKO': "EKONOMI",
    'FIZIK': "FIZIK", 
    'GEO': "GEOGRAFI", 
    'GKT': "GRAFIK KOMUNIKASI TEKNIKAL", 
    'HD': "HIASAN DALAMAN",
    'KCINA': "KESUSASTERAAN CINA", 
    'KIMIA': "KIMIA", 
    'KMK': "KESUSASTERAAN MELAYU KOMUNIKATIF",
    'KTAMIL': "KESUSASTERAAN TAMIL", 
    'LAM': "AL-LUGHAH AL-'ARABIAH AL-MU'ASIRAH", 
    'LN': "LANDSKAP DAN NURSERI", 
    'MAUTO': "MENSERVIS AUTOMOBIL", 
    'MM': "MATEMATIK", 
    'MT': "MATEMATIK TAMBAHAN", 
    'MUI': "MANAHIJ AL-'ULUM AL-ISLAMIYAH", 
    'PAI': "PENDIDIKAN ISLAM", 
    'PDM': "PRODUKSI MULTIMEDIA", 
    'PERNIAGAAN': "PERNIAGAAN", 
    'PM': "PENDIDIKAN MORAL", 
    'PPBM': "PENYEDIAAN MAKANAN",
    'PPBOT': "PEMBUATAN PERABOT", 
    'PQS': "PENDIDIKAN AL-QURAN DAN AL-SUNNAH", 
    'PRT': "PRODUKSI REKA TANDA", 
    'PSI': "PENDIDIKAN SYARIAH ISLAMIAH", 
    'PSV': "PENDIDIKAN SENI VISUAL", 
    'RC': "REKA CIPTA", 
    'SAINS': "SAINS", 
    'SEJ': "SEJARAH", 
    'SKOM': "SAINS KOMPUTER", 
    'SMOTO': "MENSERVIS MOTORSIKAL", 
    'SRT': "SAINS RUMAH TANGGA", 
    'SSUKAN': "SAINS SUKAN", 
    'TI': "TASAWWUR ISLAM", 
    'UD': "USUL AL-DIN"
};

// 6. PENGELOMPOKAN KPI (COMPONENT_MAP)
// Digunakan untuk filter Laporan Komponen (Analisa Mengikut Bidang).
export const COMPONENT_MAP = {
    'BAHASA': ['BM', 'BI', 'BA', 'BC', 'BT', 'KMK', 'KCINA', 'KTAMIL', 'BJR'],
    'SOSIAL': ['SEJ', 'PM', 'GEO', 'PAI', 'TI', 'SSUKAN', 'PSV'], 
    'STEM': ['MM', 'MT', 'SAINS', 'BIO', 'FIZIK', 'KIMIA'],
    'TVET': [
        'PERNIAGAAN', 'AKAUN', 'EKO', 'SRT', 'RC', 'GKT', 'SKOM', 
        'LN', 'PRT', 'MAUTO', 'PDM', 'SMOTO', 'HD', 'APAKK', 'PPBM', 'PPBOT'
    ],
    'AGAMA': ['ADB', 'AS', 'BA', 'LAM', 'MUI', 'PAI', 'PQS', 'PSI', 'TI', 'UD']
};

// 7. PILIHAN STATIK UI (DROPDOWN OPTIONS)
// Digunakan untuk menjana senarai pada dropdown filter UI secara dinamik.
export const STATIC_OPTIONS = {
    DEMOG: [
        { value: 'ALL', label: 'SEMUA CALON' },
        { value: '', label: '--- MENGIKUT JANTINA ---', disabled: true },
        { value: 'L', label: 'SEMUA LELAKI' },
        { value: 'P', label: 'SEMUA PEREMPUAN' },
        { value: '', label: '--- MELAYU ---', disabled: true },
        { value: 'ALL_M', label: 'SEMUA MELAYU (L+P)' },
        { value: 'L_M', label: 'LELAKI MELAYU SAHAJA' },
        { value: 'P_M', label: 'PEREMPUAN MELAYU SAHAJA' },
        { value: '', label: '--- CINA ---', disabled: true },
        { value: 'ALL_C', label: 'SEMUA CINA (L+P)' },
        { value: 'L_C', label: 'LELAKI CINA SAHAJA' },
        { value: 'P_C', label: 'PEREMPUAN CINA SAHAJA' },
        { value: '', label: '--- INDIA ---', disabled: true },
        { value: 'ALL_I', label: 'SEMUA INDIA (L+P)' },
        { value: 'L_I', label: 'LELAKI INDIA SAHAJA' },
        { value: 'P_I', label: 'PEREMPUAN INDIA SAHAJA' },
        { value: '', label: '--- ORANG ASLI ---', disabled: true },
        { value: 'ALL_OA', label: 'SEMUA ORANG ASLI (L+P)' },
        { value: 'L_OA', label: 'LELAKI ORANG ASLI SAHAJA' },
        { value: 'P_OA', label: 'PEREMPUAN ORANG ASLI SAHAJA' },
        { value: '', label: '--- LAIN-LAIN ---', disabled: true },
        { value: 'ALL_OTH', label: 'SEMUA LAIN-LAIN (L+P)' },
        { value: 'L_OTH', label: 'LELAKI LAIN-LAIN SAHAJA' },
        { value: 'P_OTH', label: 'PEREMPUAN LAIN-LAIN SAHAJA' }
    ],
    COMPONENT: [
        { value: 'NONE', label: 'ANALISA BIASA' },
        { value: 'BAHASA', label: 'BIDANG BAHASA' },
        { value: 'STEM', label: 'BIDANG STEM' },
        { value: 'TVET', label: 'BIDANG TVET' },
        { value: 'SOSIAL', label: 'SAINS SOSIAL' },
        { value: 'AGAMA', label: 'PENGAJIAN ISLAM' }
    ],
    CREDIT_SUBJECT: [
        { value: 'BM', label: 'BAHASA MELAYU (BM)' },
        { value: 'BI', label: 'BAHASA INGGERIS (BI)' },
        { value: 'SEJ', label: 'SEJARAH (SEJ)' },
        { value: 'MM', label: 'MATEMATIK (MM)' },
        { value: 'SAINS', label: 'SAINS (SAINS)' },
        { value: 'PAI_PM', label: 'PENDIDIKAN ISLAM / MORAL (GABUNGAN)' }
    ]
};