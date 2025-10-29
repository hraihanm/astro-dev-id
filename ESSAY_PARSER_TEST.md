# Essay Parser Test

## Test Case: Your Example

```markdown
# Soal Essay

# Sebuah sistem planet mengelilingi bintang $\tau$ Ceti yang bermassa $0,78\ M_{\odot}$.

Planet $c$ bergerak pada orbit melingkar dengan jari-jari $0,195\ AU$.

Planet $e$ bergerak pada bidang dan arah orbit yang sama, dengan orbit elips yang memiliki sumbu

![undefined](./media/media/image1.png)

semi-mayor $a = 0,538\ AU$ dan eksentrisitas $e = 0,18$.

$$\int_{a}^{b}{\frac{1}{ax + \sin x}dx} = \sum_{i = 1}^{\infty}\pi$$

Pada suatu saat terjadi konjungsi superior planet $e$ terhadap pengamat di planet $c$.

Tentukan:

### Fase planet $c$ ketika diamati dari planet $e$. Anda bisa gunakan persamaan

$$ f = \frac{1}{2} *(1 + \cos \theta)$$

Persamaan ini mungkin berguna.

### Fase planet $e$ ketika diamati dari planet $c$, sepuluh hari setelah konjungsi superior tersebut.
```

## Expected Output

**Problem 1:**
- Title: "Sebuah sistem planet mengelilingi bintang $\tau$ Ceti yang bermassa $0,78\ M_{\odot}$."
- Problem Statement: Everything from after the title until first `###`
  - Includes: paragraphs, images, LaTeX
- Subproblem 1:
  - Title: "Fase planet $c$ ketika diamati dari planet $e$. Anda bisa gunakan persamaan"
  - Content: The equation and "Persamaan ini mungkin berguna."
- Subproblem 2:
  - Title: "Fase planet $e$ ketika diamati dari planet $c$, sepuluh hari setelah konjungsi superior tersebut."
  - Content: (empty or whatever comes after)

## Parser Features

✅ Skips `# Soal Essay` (set title)  
✅ Parses `# Problem Title` (problems)  
✅ Extracts problem statement (everything until `###` or next `#`)  
✅ Parses `### Subproblem` (subproblems)  
✅ Preserves LaTeX (inline `$...$` and display `$$...$$`)  
✅ Extracts images `![...](path)`  
✅ Handles multiple paragraphs  

## Usage

```typescript
import { parseEssayProblems } from './lib/parsers/essay-problem';

const content = `...your markdown...`;
const problems = parseEssayProblems(content);

problems.forEach(problem => {
  console.log('Title:', problem.title);
  console.log('Statement:', problem.problemStatement);
  console.log('Images:', problem.images);
  problem.subproblems.forEach(sub => {
    console.log('  Subproblem:', sub.title);
    console.log('  Content:', sub.content);
  });
});
```

