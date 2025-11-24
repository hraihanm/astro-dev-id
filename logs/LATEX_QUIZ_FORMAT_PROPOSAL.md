# LaTeX-Based Quiz Format Proposal

## Your Current Situation

You have Indonesian-format questions like:
```
%ModelSoal-PGK%
Persamaan garis yang sesuai untuk data di dalam tabel ini adalah
[table with data]
%OPTK1_A_3% $$x = (3 \times 10^6)y^{-1}$$
%OPTK2_A_3% $x = (3 \times 10^{-6})x^{-1}$   
%OPTK3_A_3% $y = (3 \times 10^6)x^{-1}$   
%OPTK4_A_3% $y = (3 \times 10^{-6})x^{-1}$   
%OPTK5_A_3% $y = (3 \times 10^6)x^{-2}$   
%doc%
```

**Question:** Can we use LaTeX for a cleaner, professional format?

**Answer:** Yes! LaTeX has the `exam` class specifically for this purpose.

---

## Proposed LaTeX Format

### Example 1: Basic Multiple Choice

```latex
\begin{question}
  Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

  \begin{tabular}{|c|c|}
  \hline
  Panjang gelombang (nm) & Temperatur (K) \\
  \hline
  2897,77 & 1000 \\
  1931,85 & 1500 \\
  \hline
  \end{tabular}

  \begin{choices}
    \CorrectChoice $x = (3 \times 10^6)y^{-1}$
    \choice $x = (3 \times 10^{-6})x^{-1}$
    \choice $y = (3 \times 10^6)x^{-1}$
    \choice $y = (3 \times 10^{-6})x^{-1}$
    \choice $y = (3 \times 10^6)x^{-2}$
  \end{choices}
\end{question}
```

### Example 2: With Images

```latex
\begin{question}
  Untuk bintang A pada gambar, jejarinya adalah 900 jejari Matahari. 
  Modulus jarak bintang A adalah (diketahui jejari Matahari = $6.96 \times 10^{10}$ cm, 
  1 radian = 206 265 detik busur, 1 parseks = $3.086 \times 10^{18}$ cm)

  \includegraphics[width=0.5\textwidth]{_page_1_Figure_7.jpeg}

  \begin{choices}
    \choice 16,6
    \CorrectChoice 20,9
    \choice 11,6
    \choice 6,6
    \choice 15,9
  \end{choices}
\end{question}
```

### Example 3: Complex Questions with Tables

```latex
\begin{question}
  Seorang pengamat menghitung panjang siang hari di lokasi dia berada. 
  Ternyata di hari itu, panjang siang tercatat lebih dari 12 jam. 

  Jika panjang siang bisa dihitung dengan rumus
  \[
  \cos H = -\tan\phi\tan\delta_{\odot}
  \]
  dengan $\phi$ = lintang pengamat, $\delta_{\odot}$ = deklinasi Matahari, 
  H = sudut jam Matahari saat di horizon, dan 2H adalah panjang siang, 
  maka apa yang bisa disimpulkan terkait lokasi dan waktu pengamatan?

  \begin{choices}
    \choice Pengamat berada di Bumi belahan utara, dan waktu pengamatan antara 21 Maret – 23 September
    \choice Pengamat berada di Bumi belahan utara, dan waktu pengamatan antara 23 September – 21 Maret
    \CorrectChoice Pengamat berada di Bumi belahan selatan, dan waktu pengamatan antara 21 Maret – 23 September
    \choice Pengamat berada di Bumi belahan selatan, dan waktu pengamatan antara 23 September – 21 Maret
    \choice Pengamat berada di ekuator, atau waktu pengamatan tanggal 21 Maret atau 23 September
  \end{choices}
\end{question}
```

---

## Why LaTeX for Quizzes?

### Advantages

1. **Professional Standards**: Used by universities worldwide
2. **Rich Formatting**: Tables, math, images all integrated
3. **Clean Syntax**: No custom markers
4. **Publishing Quality**: Can generate PDF directly
5. **Version Control Friendly**: Plain text, works with Git

### LaTeX Can Handle:

✅ Multiple choice questions  
✅ Math notation (inline `$...$` and display `\[...\]`)  
✅ Tables and tabular data  
✅ Images  
✅ Multiple correct answers  
✅ Text answers  
✅ Numeric answers with tolerances  
✅ Custom styling per question  
✅ Points/difficulty metadata  

---

## Two-Step Conversion Strategy

### Step 1: Convert Indonesian → LaTeX

Create parser: `indonesian-to-latex.ts`

```typescript
// Convert your format to LaTeX
function convertToLatex(indonesianContent: string): string {
  // Parse %ModelSoal-PGK% blocks
  // Convert to \begin{question}...\end{question}
  // Map %OPTK1-5% to \choice/\CorrectChoice
  // Preserve LaTeX math
  // Preserve tables
  // Handle images
}
```

**Input:** Your Indonesian format file  
**Output:** Clean LaTeX `.tex` file

### Step 2: Parse LaTeX → System JSON

Create parser: `latex-to-json.ts`

```typescript
// Parse LaTeX exam format to your system
function parseLatexExam(texContent: string): QuizQuestion[] {
  // Extract questions
  // Find correct answers (\CorrectChoice)
  // Extract LaTeX math
  // Extract tables
  // Return JSON compatible with your system
}
```

**Input:** `.tex` file  
**Output:** JSON compatible with your Astro site

---

## Alternative: Markdown + LaTeX Hybrid

Since your site already renders Markdown + LaTeX, consider this format:

```markdown
### Question 1

Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

| Panjang gelombang (nm) | Temperatur (K) |
|------------------------|----------------|
| 2897,77                | 1000           |
| 1931,85                | 1500           |

**Options:**
- [ ] $x = (3 \times 10^{-6})x^{-1}$
- [x] $x = (3 \times 10^6)y^{-1}$ ✓ Correct
- [ ] $y = (3 \times 10^6)x^{-1}$
- [ ] $y = (3 \times 10^{-6})x^{-1}$
- [ ] $y = (3 \times 10^6)x^{-2}$

---

### Question 2

![Figure](_page_1_Figure_7.jpeg)

Untuk bintang A pada gambar, jejarinya adalah 900 jejari Matahari...

**Options:**
- [ ] 16,6
- [x] 20,9 ✓ Correct
- [ ] 11,6
- [ ] 6,6
- [ ] 15,9
```

**Advantages:**
- Already works with your existing renderer
- Clean, readable syntax
- Easy to write/edit
- Supports all Markdown features
- Clear correct answer marking with `[x]` and `✓ Correct`

---

## Recommendation

**Option A: Pure LaTeX** (Best for academic publishing)
- Use LaTeX `exam` class
- Professional, widely recognized
- Can generate PDFs
- Requires LaTeX compiler or parser

**Option B: Markdown + LaTeX** (Best for web platform)
- Your site already supports this
- Easy to write and edit
- No compilation needed
- Clean, readable syntax
- Already functional in your system

**Option C: Convert Indonesian → LaTeX → Your System**
- Use Indonesian format as source
- Auto-convert to LaTeX
- Parse LaTeX to system JSON
- Benefits of both worlds

---

## My Recommendation

**Go with Markdown + LaTeX** because:
1. Your system already renders it perfectly
2. No parsing complexity
3. Easy to write questions
4. Can still generate LaTeX for academic purposes
5. Works immediately with your existing code

**Example format:**

```markdown
<!-- quiz:begin -->
# Quiz: Physics Chapter 3

## Q1: Temperature-Wavelength Relationship

Persamaan garis yang sesuai untuk data di dalam tabel ini adalah

| Panjang gelombang (nm) | Temperatur (K) |
|------------------------|----------------|
| 2897,77                | 1000           |
| 1931,85                | 1500           |
| 1448,89                | 2000           |

**Correct Answer: 2**

**Options:**
1. $x = (3 \times 10^{-6})x^{-1}$
2. $x = (3 \times 10^6)y^{-1}$
3. $y = (3 \times 10^6)x^{-1}$
4. $y = (3 \times 10^{-6})x^{-1}$
5. $y = (3 \times 10^6)x^{-2}$

## Q2: Star Radius Calculation

![Figure](../images/figure_7.jpg)

Untuk bintang A pada gambar, jejarinya adalah 900 jejari Matahari...

**Correct Answer: 2**

**Options:**
1. 16,6
2. 20,9
3. 11,6
4. 6,6
5. 15,9

<!-- quiz:end -->
```

**Benefits:**
- Clean, readable
- Uses existing LaTeX renderer
- Easy to parse (simple regex)
- No compilation needed
- Can still export to LaTeX/PDF later

---

## Implementation

Want me to:
1. Create a parser for Indonesian → Markdown format?
2. Build a converter for LaTeX exam class?
3. Implement the Markdown + LaTeX hybrid?

Which would you prefer?

