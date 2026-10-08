import { Insurance, Profile, ScheduleRow, VaccineInfo } from "../types";

export const N_HEXA =
  "Program beralih bertahap ke heksavalen (DPT-HB-Hib + IPV); heksavalen swasta ±Rp900 rb–1,3 jt/dosis.";
export const N_PCV =
  "Jadwal program: 2, 3, 12 bln. Jadwal IDAI (beli sendiri): 2, 4, 6 bln + booster 12–15 bln. Contoh harga PCV di Prodia ±Rp1,0–1,46 jt.";

export const SEED_SCHEDULE: ScheduleRow[] = [
  { id: "r01", tahun: 1, usia: "<24 jam", bln: 0, vaksin: "Hepatitis B (HB-0)", ref: "hepb", status: "Wajib", gratis: "Ya", masuk: true, min: 150000, max: 250000, catatan: "Beri <24 jam setelah lahir." },
  { id: "r02", tahun: 1, usia: "0–1 bln", bln: 0, vaksin: "BCG", ref: "bcg", status: "Wajib", gratis: "Ya", masuk: true, min: 150000, max: 300000, catatan: "Benjolan kecil di lengan setelah BCG itu normal." },
  { id: "r03", tahun: 1, usia: "0–1 bln", bln: 1, vaksin: "Polio tetes 1 (bOPV)", ref: "polio", status: "Wajib", gratis: "Ya", masuk: true, min: 100000, max: 200000, catatan: "" },
  { id: "r04", tahun: 1, usia: "2 bln", bln: 2, vaksin: "DPT-HB-Hib 1 (pentavalen)", ref: "dpt", status: "Wajib", gratis: "Ya", masuk: true, min: 250000, max: 450000, catatan: N_HEXA },
  { id: "r05", tahun: 1, usia: "2 bln", bln: 2, vaksin: "Polio tetes 2", ref: "polio", status: "Wajib", gratis: "Ya", masuk: true, min: 100000, max: 200000, catatan: "" },
  { id: "r06", tahun: 1, usia: "2 bln", bln: 2, vaksin: "PCV 1", ref: "pcv", status: "Wajib", gratis: "Ya", masuk: true, min: 900000, max: 1500000, catatan: N_PCV },
  { id: "r07", tahun: 1, usia: "2 bln", bln: 2, vaksin: "Rotavirus 1", ref: "rota", status: "Wajib", gratis: "Ya", masuk: true, min: 400000, max: 900000, catatan: "Tetes oral; jumlah dosis tergantung merek." },
  { id: "r08", tahun: 1, usia: "3 bln", bln: 3, vaksin: "DPT-HB-Hib 2 (pentavalen)", ref: "dpt", status: "Wajib", gratis: "Ya", masuk: true, min: 250000, max: 450000, catatan: "" },
  { id: "r09", tahun: 1, usia: "3 bln", bln: 3, vaksin: "Polio tetes 3", ref: "polio", status: "Wajib", gratis: "Ya", masuk: true, min: 100000, max: 200000, catatan: "" },
  { id: "r10", tahun: 1, usia: "3 bln", bln: 3, vaksin: "PCV 2", ref: "pcv", status: "Wajib", gratis: "Ya", masuk: true, min: 900000, max: 1500000, catatan: "" },
  { id: "r11", tahun: 1, usia: "3 bln", bln: 3, vaksin: "Rotavirus 2", ref: "rota", status: "Wajib", gratis: "Ya", masuk: true, min: 400000, max: 900000, catatan: "" },
  { id: "r12", tahun: 1, usia: "4 bln", bln: 4, vaksin: "DPT-HB-Hib 3 (pentavalen)", ref: "dpt", status: "Wajib", gratis: "Ya", masuk: true, min: 250000, max: 450000, catatan: "" },
  { id: "r13", tahun: 1, usia: "4 bln", bln: 4, vaksin: "Polio tetes 4 + IPV 1", ref: "polio", status: "Wajib", gratis: "Ya", masuk: true, min: 350000, max: 650000, catatan: "" },
  { id: "r14", tahun: 1, usia: "4 bln", bln: 4, vaksin: "Rotavirus 3", ref: "rota", status: "Wajib", gratis: "Ya", masuk: true, min: 400000, max: 900000, catatan: "Dosis ke-3 tergantung merek vaksin." },
  { id: "r15", tahun: 1, usia: "6 bln", bln: 6, vaksin: "Influenza dosis 1", ref: "flu", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 450000, catatan: "Mulai usia 6 bln; anjuran IDAI." },
  { id: "r16", tahun: 1, usia: "7 bln", bln: 7, vaksin: "Influenza dosis 2", ref: "flu", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 450000, catatan: "Jarak ±4 minggu dari dosis 1." },
  { id: "r17", tahun: 1, usia: "9 bln", bln: 9, vaksin: "Campak-Rubela (MR) 1", ref: "mr", status: "Wajib", gratis: "Ya", masuk: true, min: 250000, max: 400000, catatan: "" },
  { id: "r18", tahun: 1, usia: "9 bln", bln: 9, vaksin: "IPV 2", ref: "ipv", status: "Wajib", gratis: "Ya", masuk: true, min: 250000, max: 450000, catatan: "" },
  { id: "r19", tahun: 1, usia: "12 bln", bln: 12, vaksin: "PCV 3 (booster)", ref: "pcv", status: "Wajib", gratis: "Ya", masuk: true, min: 900000, max: 1500000, catatan: "" },
  { id: "r20", tahun: 2, usia: "12 bln", bln: 12, vaksin: "Varisela 1", ref: "varisela", status: "Pilihan", gratis: "Tidak", masuk: true, min: 600000, max: 900000, catatan: "Cacar air." },
  { id: "r21", tahun: 2, usia: "12 bln", bln: 12, vaksin: "Hepatitis A 1", ref: "hepa", status: "Pilihan", gratis: "Tidak", masuk: true, min: 450000, max: 700000, catatan: "" },
  { id: "r22", tahun: 2, usia: "12 bln", bln: 12, vaksin: "Japanese Encephalitis (JE)", ref: "je", status: "Kondisional", gratis: "Tidak", masuk: false, min: 400000, max: 600000, catatan: "Hanya daerah endemis. Ubah 'Masuk total?' ke Ya jika perlu." },
  { id: "r23", tahun: 2, usia: "15 bln", bln: 15, vaksin: "MMR (alternatif MR)", ref: "mmr", status: "Pilihan", gratis: "Tidak", masuk: false, min: 350000, max: 500000, catatan: "Opsional; bukan tambahan jika MR sudah diberikan." },
  { id: "r24", tahun: 2, usia: "15–18 bln", bln: 15, vaksin: "Varisela 2", ref: "varisela", status: "Pilihan", gratis: "Tidak", masuk: true, min: 600000, max: 900000, catatan: "" },
  { id: "r25", tahun: 2, usia: "18 bln", bln: 18, vaksin: "DPT-HB-Hib booster (pentavalen)", ref: "dpt", status: "Wajib", gratis: "Ya", masuk: true, min: 250000, max: 450000, catatan: N_HEXA },
  { id: "r26", tahun: 2, usia: "18 bln", bln: 18, vaksin: "Campak-Rubela (MR) 2", ref: "mr", status: "Wajib", gratis: "Ya", masuk: true, min: 250000, max: 400000, catatan: "" },
  { id: "r27", tahun: 2, usia: "18–24 bln", bln: 18, vaksin: "Hepatitis A 2", ref: "hepa", status: "Pilihan", gratis: "Tidak", masuk: true, min: 450000, max: 700000, catatan: "Jarak 6–12 bln dari dosis 1." },
  { id: "r28", tahun: 2, usia: "Tiap tahun", bln: 12, vaksin: "Influenza tahunan", ref: "flu", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 450000, catatan: "" },
  { id: "r29", tahun: 3, usia: "24 bln", bln: 24, vaksin: "Tifoid", ref: "tifoid", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 400000, catatan: "Mulai usia 2 tahun; ulang tiap 3 tahun." },
  { id: "r30", tahun: 3, usia: "Tiap tahun", bln: 24, vaksin: "Influenza tahunan", ref: "flu", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 450000, catatan: "" },
  { id: "r31", tahun: 3, usia: "≥24 bln", bln: 24, vaksin: "Meningokokus", ref: "mening", status: "Kondisional", gratis: "Tidak", masuk: false, min: 900000, max: 1200000, catatan: "Misal syarat haji/umrah atau rekomendasi dokter." },
  { id: "r32", tahun: 4, usia: "Tiap tahun", bln: 36, vaksin: "Influenza tahunan", ref: "flu", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 450000, catatan: "" },
  { id: "r33", tahun: 5, usia: "Tiap tahun", bln: 48, vaksin: "Influenza tahunan", ref: "flu", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 450000, catatan: "" },
  { id: "r34", tahun: 5, usia: "60 bln", bln: 60, vaksin: "Tifoid ulang", ref: "tifoid", status: "Pilihan", gratis: "Tidak", masuk: true, min: 250000, max: 400000, catatan: "Ulang tiap 3 tahun." },
  { id: "r35", tahun: 5, usia: "5–6 thn", bln: 60, vaksin: "Booster DPT/polio", ref: "dpt", status: "Pilihan", gratis: "Sebagian", masuk: true, min: 400000, max: 900000, catatan: "Versi program diberikan di SD lewat program sekolah." }
];

export const SEED_VACCINE_INFO: VaccineInfo[] = [
  {
    id: "hepb",
    nama: "Hepatitis B (HB-0)",
    melindungi: "Infeksi hati oleh virus hepatitis B",
    penting: "Bayi yang tertular saat lahir berisiko jadi pengidap kronis, lalu sirosis atau kanker hati. Harus diberikan <24 jam setelah lahir.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Nyeri ringan, kemerahan, atau sedikit bengkak di lokasi suntikan paha. Terkadang muncul demam ringan yang membaik dalam 1–2 hari."
  },
  {
    id: "bcg",
    nama: "BCG",
    melindungi: "TBC berat (meningitis TB, TB paru berat)",
    penting: "Melindungi terutama dari bentuk TB yang berat pada anak.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Setelah 2–6 minggu, muncul benjolan kecil kemerahan yang bernanah di bekas suntikan lengan, lalu pecah dan meninggalkan bekas luka parut (scar). Ini normal dan tanda respon kekebalan tubuh baik. Jangan ditekan atau diberi obat oles."
  },
  {
    id: "polio",
    nama: "Polio tetes (bOPV)",
    melindungi: "Polio (lumpuh layuh)",
    penting: "Membangun kekebalan di saluran cerna.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Sangat jarang memicu reaksi. Sebagian kecil bayi mungkin sedikit rewel atau buang air besar lebih cair sementara."
  },
  {
    id: "ipv",
    nama: "Polio suntik (IPV)",
    melindungi: "Polio",
    penting: "Penguat kekebalan, melengkapi polio tetes.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Nyeri, kemerahan, atau pegal ringan di area paha bekas suntikan. Jarang sekali memicu demam tinggi."
  },
  {
    id: "dpt",
    nama: "DPT-HB-Hib / Heksavalen",
    melindungi: "Difteri, batuk rejan, tetanus, hepatitis B, Hib (meningitis/pneumonia); heksavalen ditambah polio",
    penting: "Satu suntikan untuk banyak penyakit. Heksavalen mengurangi jumlah suntikan; peralihan program bertahap.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Demam (bisa cukup tinggi pada jenis pentavalen/seluler), rewel, nyeri, bengkak, dan kemerahan di paha selama 1–3 hari. Pada vaksin heksavalen/aselular (swasta), risiko demam umumnya jauh lebih rendah."
  },
  {
    id: "pcv",
    nama: "PCV",
    melindungi: "Bakteri pneumokokus (pneumonia, meningitis, infeksi telinga, sepsis)",
    penting: "Pneumonia termasuk penyebab utama kematian balita.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Demam ringan hingga sedang, bayi lebih rewel dari biasanya, nafsu makan sedikit berkurang sementara, serta nyeri dan bengkak kemerahan di lokasi suntikan."
  },
  {
    id: "rota",
    nama: "Rotavirus",
    melindungi: "Diare berat akibat rotavirus",
    penting: "Mencegah dehidrasi berat dan rawat inap pada bayi. Diberikan lewat tetes oral.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Terkadang memicu diare ringan, muntah ringan, atau perut sedikit kembung sementara dalam beberapa hari setelah vaksin diteteskan ke mulut."
  },
  {
    id: "mr",
    nama: "Campak-Rubela (MR)",
    melindungi: "Campak dan rubella",
    penting: "Campak sangat menular. Rubella berbahaya bagi janin jika anak kelak tertular saat hamil.",
    status: "Wajib",
    gratisProgram: "Ya",
    efekSamping: "Demam ringan atau ruam kemerahan halus yang baru muncul 5–12 hari setelah imunisasi, berlangsung 1–2 hari. Terkadang disertai sedikit batuk atau pilek ringan."
  },
  {
    id: "flu",
    nama: "Influenza",
    melindungi: "Flu berat dan komplikasinya",
    penting: "Tidak selalu mencegah tertular, tapi menurunkan risiko gejala berat. IDAI menganjurkan sejak usia 6 bulan, diulang tiap tahun.",
    status: "Pilihan",
    gratisProgram: "Tidak",
    efekSamping: "Nyeri, bengkak kemerahan di bekas suntikan, demam ringan, pegal atau bayi rewel selama 1–2 hari."
  },
  {
    id: "varisela",
    nama: "Varisela",
    melindungi: "Cacar air",
    penting: "Mencegah cacar air dan komplikasi (infeksi kulit, radang paru).",
    status: "Pilihan",
    gratisProgram: "Tidak",
    efekSamping: "Nyeri dan kemerahan di bekas suntikan. Sekitar 1–2 minggu kemudian, sebagian kecil anak dapat mengalami demam ringan atau timbul bintik merah mirip cacar (biasanya kurang dari 10 bintik)."
  },
  {
    id: "hepa",
    nama: "Hepatitis A",
    melindungi: "Infeksi hati akibat makanan/minuman terkontaminasi",
    penting: "Relevan karena penularannya lewat makanan dan air.",
    status: "Pilihan",
    gratisProgram: "Tidak",
    efekSamping: "Nyeri ringan atau rasa pegal di area suntikan, demam sumeng-sumeng, dan nafsu makan agak menurun selama 1–2 hari."
  },
  {
    id: "mmr",
    nama: "MMR",
    melindungi: "Campak, gondongan, rubella",
    penting: "Alternatif MR yang juga mencakup gondongan; bukan tambahan jika MR sudah diberikan.",
    status: "Pilihan",
    gratisProgram: "Tidak",
    efekSamping: "Demam ringan dan ruam kemerahan mirip campak sekitar 6–12 hari pasca imunisasi. Sangat jarang dapat terjadi pembengkakan ringan kelenjar liur di leher."
  },
  {
    id: "tifoid",
    nama: "Tifoid",
    melindungi: "Demam tifoid (tifus)",
    penting: "Dianjurkan mulai usia 2 tahun, ulang tiap 3 tahun.",
    status: "Pilihan",
    gratisProgram: "Tidak",
    efekSamping: "Nyeri atau bengkak ringan di tempat suntikan, demam ringan, sakit kepala pada anak balita, atau lesu sementara."
  },
  {
    id: "je",
    nama: "Japanese Encephalitis (JE)",
    melindungi: "Radang otak akibat virus JE",
    penting: "Hanya untuk daerah endemis.",
    status: "Kondisional",
    gratisProgram: "Tidak",
    efekSamping: "Nyeri, kemerahan, dan bengkak ringan di area suntikan; demam ringan dan sakit kepala ringan dapat timbul dalam 24–48 jam."
  },
  {
    id: "mening",
    nama: "Meningokokus",
    melindungi: "Meningitis meningokokus",
    penting: "Kondisional, misalnya syarat haji/umrah atau rekomendasi dokter.",
    status: "Kondisional",
    gratisProgram: "Tidak",
    efekSamping: "Nyeri tekan dan kemerahan di tempat suntikan, demam ringan, serta rasa lelah atau rewel selama 1–2 hari."
  }
];

export const VACCINE_GENERAL_NOTE =
  "Efek samping umum hampir semua vaksin: demam ringan, rewel, nyeri/bengkak di bekas suntikan.";

export const DEFAULT_INSURANCE: Insurance = {
  namaProduk: "",
  limitPerTahun: {
    1: 1500000,
    2: 4000000,
    3: 1500000,
    4: 1000000,
    5: 2000000
  },
  masaTungguBulan: 0,
  mekanisme: "",
  vaksinDikecualikan: "",
  catatan: "",
  checklist: [false, false, false, false]
};

export const CHECKLIST_ITEMS = [
  "Ada benefit imunisasi rawat jalan dan berapa limit tahunannya?",
  "Apakah vaksin non-program dikecualikan?",
  "Cashless atau reimburse, ada masa tunggu bayi baru lahir?",
  "Apakah biaya konsultasi dokter anak saat imunisasi ditanggung?"
];

export const ASSUMPTIONS_AND_NOTES = [
  {
    topik: "Status",
    keterangan:
      "Wajib = imunisasi program pemerintah (gratis). Pilihan = anjuran IDAI, berbayar. Kondisional = hanya untuk situasi/daerah tertentu."
  },
  {
    topik: "Program gratis",
    keterangan:
      "Kemenkes menetapkan 14 vaksin imunisasi dasar rutin (termasuk HPV, PCV, Rotavirus) yang tersedia gratis di posyandu, puskesmas, dan faskes BPJS. BPJS tidak membayar vaksin pilihan."
  },
  {
    topik: "Jadwal program",
    keterangan:
      "PCV 2, 3, 12 bln; heksavalen 2, 3, 4 bln tanpa mengubah jadwal rutin; rotavirus ikut kunjungan 2–4 bln. Ketersediaan bisa berbeda antar Puskesmas; konfirmasi dulu."
  },
  {
    topik: "Biaya",
    keterangan:
      "Semua biaya adalah ESTIMASI KASAR harga swasta per dosis (perkiraan, bukan harga resmi). Satu-satunya data harga bersumber: PCV di Prodia ±Rp1,0–1,46 jt/dosis dan paket vaksin 0–6 bln di satu RS Jakarta Rp8.599.000 (belum tentu mewakili harga lain)."
  },
  {
    topik: "Biaya belum termasuk",
    keterangan:
      "Konsultasi dokter, meningokokus, JE, MMR (kondisional/opsional; bisa dimasukkan lewat kolom 'Masuk total?' di sheet Jadwal)."
  },
  {
    topik: "Heksavalen",
    keterangan:
      "Baris DPT-HB-Hib dihitung dengan harga pentavalen. Jika memilih heksavalen swasta (±Rp0,9–1,3 jt/dosis), ganti nilai min/maks di tab Jadwal atau gunakan Skenario Heksavalen di tab Biaya."
  },
  {
    topik: "Dengue",
    keterangan:
      "Vaksin dengue umumnya diindikasikan mulai sekitar 6 tahun ke atas, jadi di luar rentang 0–5 tahun. Konfirmasi ke dokter anak."
  },
  {
    topik: "Disclaimer",
    keterangan:
      "Ini bukan nasihat medis. Konsultasikan jadwal dengan dokter anak/Puskesmas. Harga hanya estimasi."
  }
];

export const OFFICIAL_SOURCES = [
  {
    nama: "Kompas.tv: Daftar dan Jadwal 14 Imunisasi Dasar Gratis",
    url: "https://www.kompas.tv/info-publik/625082/lengkap-ini-daftar-dan-jadwal-14-imunisasi-dasar-anak-yang-gratis-dari-pemerintah"
  },
  {
    nama: "Kemenkes: Program Vaksin Rotavirus Nasional",
    url: "https://www.kemkes.go.id/id/warga-batam-bersyukur-ada-vaksin-rotavirus-untuk-anak"
  },
  {
    nama: "Metro TV: Pemerintah Perluas Vaksin Heksavalen",
    url: "https://www.metrotvnews.com/read/NLMC8x9j-pemerintah-perluas-vaksin-heksavalen-untuk-lindungi-anak-dari-6-penyakit"
  },
  {
    nama: "Alodokter: Kisaran Harga Vaksin PCV Anak",
    url: "https://www.alodokter.com/cari-rumah-sakit/pediatri/vaksin-pcv-anak/depok"
  }
];

export const PERMANENT_DISCLAIMER =
  "Ini bukan nasihat medis. Konsultasikan jadwal dengan dokter anak/Puskesmas. Harga hanya estimasi.";

export function createNewProfile(id: string, panggilan: string, tanggalLahir: string, catatan = ""): Profile {
  return {
    id,
    panggilan,
    tanggalLahir,
    catatan,
    schedule: JSON.parse(JSON.stringify(SEED_SCHEDULE)),
    records: [],
    insurance: JSON.parse(JSON.stringify(DEFAULT_INSURANCE))
  };
}

export function createSampleProfile(): Profile {
  // Born 6 months ago from current reference date
  const now = new Date();
  const sampleBirthDate = new Date(now.getFullYear(), now.getMonth() - 6, 15);
  const birthStr = sampleBirthDate.toISOString().split("T")[0];

  const profile = createNewProfile("sample-1", "GrowBang", birthStr, "Profil contoh (lahir 6 bulan lalu)");
  
  // Mark a few initial vaccines as given to make the sample lively
  profile.records = [
    { rowId: "r01", diberikan: true, tanggalDiberikan: birthStr, tempat: "Rumah Sakit", biayaAktual: 0, catatan: "Diberikan beberapa jam setelah lahir" },
    { rowId: "r02", diberikan: true, tanggalDiberikan: birthStr, tempat: "Rumah Sakit", biayaAktual: 0 },
    { rowId: "r03", diberikan: true, tanggalDiberikan: new Date(now.getFullYear(), now.getMonth() - 5, 15).toISOString().split("T")[0], tempat: "Puskesmas", biayaAktual: 0 },
    { rowId: "r04", diberikan: true, tanggalDiberikan: new Date(now.getFullYear(), now.getMonth() - 4, 15).toISOString().split("T")[0], tempat: "Puskesmas", biayaAktual: 0 },
    { rowId: "r05", diberikan: true, tanggalDiberikan: new Date(now.getFullYear(), now.getMonth() - 4, 15).toISOString().split("T")[0], tempat: "Puskesmas", biayaAktual: 0 },
    { rowId: "r06", diberikan: true, tanggalDiberikan: new Date(now.getFullYear(), now.getMonth() - 4, 15).toISOString().split("T")[0], tempat: "Klinik", biayaAktual: 950000, ditanggungAsuransi: true, nominalKlaim: 950000, statusKlaim: "Disetujui" },
    { rowId: "r07", diberikan: true, tanggalDiberikan: new Date(now.getFullYear(), now.getMonth() - 4, 15).toISOString().split("T")[0], tempat: "Puskesmas", biayaAktual: 0 },
  ];

  return profile;
}
