# Black Box Testing Report

## Informasi Pengujian

| Parameter | Nilai |
|-----------|-------|
| Tanggal Pengujian | - |
| Tester | - |
| Environment | Development |
| Versi Aplikasi | v1.0 |
| Browser | Chrome/Firefox/Edge/Safari |

## Ringkasan Hasil

| Total Skenario | Lulus | Gagal | Belum Diuji |
|----------------|-------|-------|-------------|
| 30 | 0 | 0 | 30 |

## Tabel Pengujian

| No | Fitur | Skenario Pengujian | Input | Hasil yang Diharapkan | Hasil Aktual | Status | Bukti | Catatan |
|----|-------|-------------------|-------|---------------------|-------------|--------|-------|--------|
| 1 | Login dengan data benar | Email dan password valid | Email: user@example.com, Password: validpassword | Login berhasil, redirect ke dashboard | - | Belum Diuji | - | - |
| 2 | Login dengan data salah | Email tidak terdaftar | Email: wrong@example.com, Password: anypassword | Pesan error "Email tidak ditemukan" | - | Belum Diuji | - | - |
| 3 | Login dengan password salah | Email valid, password salah | Email: user@example.com, Password: wrongpassword | Pesan error "Password salah" | - | Belum Diuji | - | - |
| 4 | Logout | Klik tombol logout | Klik tombol logout di menu user | Logout berhasil, redirect ke halaman login | - | Belum Diuji | - | - |
| 5 | Pemulihan sesi login | Refresh halaman setelah login | Refresh browser | Sesi tetap login, tetap di dashboard | - | Belum Diuji | - | - |
| 6 | Input komentar manual | Teks komentar valid | Tipe input: "Teks Manual", Teks: "Produk ini sangat bagus" | Teks diproses, hasil sentimen ditampilkan | - | Belum Diuji | - | - |
| 7 | Input komentar kosong | Teks kosong | Tipe input: "Teks Manual", Teks: "" | Pesan error "Teks tidak boleh kosong" | - | Belum Diuji | - | - |
| 8 | Upload file CSV | File CSV valid dengan kolom text dan sentiment | File: dataset.csv dengan format benar | File diupload, data ditampilkan | - | Belum Diuji | - | - |
| 9 | Upload file Excel | File Excel valid dengan kolom text dan sentiment | File: dataset.xlsx dengan format benar | File diupload, data ditampilkan | - | Belum Diuji | - | - |
| 10 | Validasi file tidak sesuai | File bukan CSV/Excel | File: image.png | Pesan error "Format file tidak didukung" | - | Belum Diuji | - | - |
| 11 | Validasi kolom dataset | CSV tanpa kolom text/sentiment | File: invalid.csv (kolom salah) | Pesan error "Kolom text dan sentiment wajib ada" | - | Belum Diuji | - | - |
| 12 | Training model | Dataset valid | Klik tombol "Training Model" | Model training selesai, metrics ditampilkan | - | Belum Diuji | - | - |
| 13 | Prediksi satu komentar | Teks tunggal | Input: "Saya suka produk ini" | Hasil sentimen, confidence, probabilitas ditampilkan | - | Belum Diuji | - | - |
| 14 | Prediksi banyak komentar | Array teks | Input: ["Bagus", "Jelek", "Biasa"] | Hasil sentimen untuk semua teks ditampilkan | - | Belum Diuji | - | - |
| 15 | Menampilkan preprocessing | Teks dengan preprocessing | Input: "SAYA SUKA PRODUK INI!!!" | Teks preprocessing ditampilkan: "saya suka produk ini" | - | Belum Diuji | - | - |
| 16 | Menampilkan hasil TF-IDF | Teks dengan fitur | Input: "produk bagus" | Nilai TF-IDF ditampilkan jika tersedia | - | Belum Diuji | - | - |
| 17 | Menampilkan sentimen | Hasil prediksi | Input: "Produk bagus" | Label: "Positif" ditampilkan | - | Belum Diuji | - | - |
| 18 | Menampilkan confidence | Hasil prediksi | Input: "Produk bagus" | Confidence: 0.85 ditampilkan | - | Belum Diuji | - | - |
| 19 | Menampilkan probabilitas kelas | Hasil prediksi | Input: "Produk bagus" | Prob_positif, prob_netral, prob_negatif ditampilkan | - | Belum Diuji | - | - |
| 20 | Mengambil daftar postingan Meta | Meta API terhubung | Klik "Ambil Postingan" | Daftar postingan ditampilkan dengan thumbnail | - | Belum Diuji | - | - |
| 21 | Mengambil komentar Meta | Media ID valid | Klik "Analisis Komentar" pada postingan | Komentar diambil dan ditampilkan | - | Belum Diuji | - | - |
| 22 | Menangani Meta API gagal | Token tidak valid | Token expired atau invalid | Pesan error jelas ditampilkan | - | Belum Diuji | - | - |
| 23 | Menampilkan dashboard | Setelah analisis | Navigasi ke tab Dashboard | Summary cards dan charts ditampilkan | - | Belum Diuji | - | - |
| 24 | Filter periode | Pilih bulan/tahun | Pilih bulan: Januari, Tahun: 2024 | Data dashboard difilter sesuai periode | - | Belum Diuji | - | - |
| 25 | Filter sentimen | Filter tabel sentimen | Pilih filter: "Positif" | Tabel hanya menampilkan komentar positif | - | Belum Diuji | - | - |
| 26 | Pencarian komentar | Search di tabel | Input: "bagus" | Tabel menampilkan komentar mengandung "bagus" | - | Belum Diuji | - | - |
| 27 | Pagination | Tabel dengan banyak data | Klik halaman 2 | Tabel menampilkan halaman 2 | - | Belum Diuji | - | - |
| 28 | Menyimpan riwayat | Setelah analisis | Analisis selesai | Analisis tersimpan di riwayat | - | Belum Diuji | - | - |
| 29 | Membuka riwayat | Klik riwayat | Klik item riwayat | Detail analisis ditampilkan | - | Belum Diuji | - | - |
| 30 | Menghapus riwayat | Klik tombol hapus | Klik tombol hapus pada riwayat | Riwayat dihapus dari list | - | Belum Diuji | - | - |
| 31 | Membandingkan analisis | Dua periode | Pilih periode 1 dan periode 2 | Perbandingan metrics ditampilkan | - | Belum Diuji | - | - |
| 32 | Export laporan PDF | Klik tombol export | Klik "Export PDF" | File PDF terdownload dengan data aktual | - | Belum Diuji | - | - |

## Catatan Pengujian

### Environment Setup
- [ ] Firebase Auth dikonfigurasi
- [ ] Firebase Firestore dikonfigurasi
- [ ] Meta API token tersedia
- [ ] Backend ML berjalan
- [ ] Dataset training tersedia

### Hasil Pengujian Detail
*(Isi setelah pengujian selesai)*

### Masalah yang Ditemukan
*(Isi setelah pengujian selesai)*

### Rekomendasi Perbaikan
*(Isi setelah pengujian selesai)*

## Cara Mengisi Report

1. Jalankan setiap skenario pengujian secara berurutan
2. Isi "Hasil Aktual" dengan output yang diterima dari sistem
3. Isi "Status" dengan:
   - **Lulus**: Sistem berjalan sesuai harapan
   - **Gagal**: Sistem tidak berjalan sesuai harapan
   - **Belum Diuji**: Skenario belum dijalankan
4. Tambahkan bukti (screenshot, log, atau file output) di folder `testing-evidence/black-box/`
5. Tambahkan catatan jika diperlukan
6. Update ringkasan di bagian atas

## Kriteria Kelulusan

- **Lulus**: Sistem berjalan sesuai dengan "Hasil yang Diharapkan"
- **Gagal**: Sistem tidak berjalan sesuai harapan atau error terjadi
- **Belum Diuji**: Skenario belum dieksekusi

Jangan mengisi status "Lulus" tanpa menjalankan pengujian aktual.
