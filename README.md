# Website Keputusan Peperiksaan KAFA Akhir Tahun 2026

Website ini disambungkan secara langsung dengan Google Sheets berikut:

https://docs.google.com/spreadsheets/d/1VnfBYa3NifAQ-R3L-UbxxuGeqP49Fd8db0CpIQ-AvEU/edit

## Ciri-ciri Baru (Kemaskini)

- Logo rasmi Sekolah Kebangsaan Paloh Hinai telah ditambah
- Sokongan untuk **Tahun 5** (sila cipta tab baru dalam Google Sheet dan ganti `PLACEHOLDER_GID` dalam `app.js` dengan GID sebenar)
- Butang **Kongsi Kelas** dan **Kongsi Slip** (boleh kongsi ke WhatsApp, Telegram, dll. atau salin pautan)
- Pautan terus: `?kelas=Tahun%201` atau `?kelas=Tahun%201&nama=NAMA%20PELAJAR`
- Tandatangan Ibu Bapa / Penjaga telah ditambah pada slip individu

## Cara Tambah Tahun 5

1. Dalam Google Sheet, buat tab baru bernama "Tahun 5"
2. Salin format yang sama seperti tahun lain
3. Buka tab tersebut, lihat URL, salin nombor selepas `gid=`
4. Dalam fail `app.js`, cari `PLACEHOLDER_GID` dan ganti dengan nombor GID tersebut
5. Upload semula `app.js` ke GitHub

## Cara Menggunakan

1. Pastikan Google Sheet dikongsi sebagai **"Anyone with the link can view"** (Sesiapa yang ada pautan boleh melihat).
2. Buka fail `index.html` menggunakan pelayan web (bukan double-click terus).
   - Cara mudah: Letakkan fail di dalam folder, kemudian jalankan `python -m http.server` di dalam folder tersebut, kemudian buka `http://localhost:8000`
   - Atau upload ke hosting percuma seperti Netlify, GitHub Pages, Vercel, atau Cloudflare Pages.

## Struktur Fail

- `index.html` — Halaman utama
- `styles.css` — Gaya reka bentuk
- `app.js` — Logik pengambilan data dan paparan

## Nota untuk Admin

Sebarang perubahan pada Google Sheet (tambah pelajar, ubah markah, dll.) akan dipaparkan secara automatik di website selepas pengguna menekan butang **"Muat Semula Data"** atau memuat semula halaman.

---

Dibangunkan untuk KAFA Sekolah Kebangsaan Paloh Hinai.