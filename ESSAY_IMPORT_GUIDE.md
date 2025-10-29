# Panduan Impor Soal Essay

## Format Soal Essay

Format markdown untuk soal essay:

```markdown
# Soal Essay

# Judul Soal 1

Pernyataan soal dengan beberapa paragraf.

Bisa mengandung LaTeX inline $E = mc^2$ dan display:

$$\int_0^1 x^2 dx = \frac{1}{3}$$

Bisa juga gambar:

![Caption](./path/to/image.png)

Masih bagian pernyataan soal.

### Subsoal 1

Isi subsoal pertama.

Bisa juga LaTeX dan gambar di sini.

### Subsoal 2

Isi subsoal kedua.

# Judul Soal 2

Pernyataan soal kedua...

### Subsoal A

Isi subsoal A.
```

## Struktur

1. **`# Soal Essay`** - Judul set soal (opsional, akan diabaikan)

2. **`# Judul Soal`** - Menandai awal soal
   - Seluruh konten hingga `###` atau `#` berikutnya adalah pernyataan soal
   - Dapat berisi: paragraf, LaTeX, gambar, tabel

3. **`### Subsoal`** - Menandai subsoal
   - Konten hingga `###` atau `#` berikutnya
   - Dapat memiliki beberapa subsoal per soal

## Cara Import

### Via Admin UI (akan ditambahkan)

1. Buka halaman edit kursus
2. Scroll ke bagian "Soal Essay"
3. Upload file `.md`
4. Klik "Impor"

### Via API

```bash
curl -X POST http://localhost:3000/api/admin/essay/import \
  -F "file=@soal-essay.md" \
  -F "courseId=1" \
  -F "title=Soal Essay Bab 1"
```

## API Endpoint

**POST** `/api/admin/essay/import`

**Parameters:**
- `file` (File): File markdown dengan soal essay
- `courseId` (Number): ID kursus
- `title` (String, optional): Judul untuk soal essay

**Response:**
```json
{
  "success": true,
  "message": "Berhasil mengimpor 2 soal essay",
  "quiz": {
    "id": 1,
    "title": "Soal Essay Bab 1",
    "problemCount": 2
  },
  "problems": [
    {
      "title": "Judul Soal 1",
      "subproblemCount": 2,
      "imageCount": 1
    }
  ]
}
```

## Fitur

✅ Parsing otomatis soal dan subsoal  
✅ Ekstraksi gambar  
✅ Preservasi LaTeX  
✅ Preservasi formatting markdown  
✅ Support multiple problems dalam satu file  

