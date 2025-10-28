# Complete Markdown Test Document

This is a comprehensive test document to verify all markdown and LaTeX rendering works correctly in your learning portal.

## Headings

### Heading Level 3

#### Heading Level 4

##### Heading Level 5

###### Heading Level 6

---

## Paragraphs and Text Formatting

This is a regular paragraph with **bold text**, *italic text*, and ***bold italic text***. You can also use `inline code` within sentences.

Here's another paragraph with ~~strikethrough text~~ and regular text.

> This is a blockquote. It can span multiple lines and contain formatted text like **bold** and *italic*.

---

## Lists

### Unordered Lists

- First bullet point
- Second bullet point
- Third bullet point with **bold** and *italic*
- Fourth bullet point with `inline code`

### Ordered Lists

1. First numbered item
2. Second numbered item  
3. Third numbered item with **bold** text
4. Fourth numbered item with *italic* text
5. Fifth numbered item with `inline code`

### Nested Unordered Lists

- Level 1 item
  - Level 2 item
  - Level 2 item with **bold**
    - Level 3 item
    - Level 3 item
  - Another level 2 item
- Back to level 1
  - Level 2 again

### Nested Ordered Lists

1. First main item
2. Second main item
   1. First sub-item
   2. Second sub-item
   3. Third sub-item
      1. First sub-sub-item
      2. Second sub-sub-item
3. Third main item
4. Fourth main item

---

## Code

### Inline Code

Use `console.log('Hello World')` in your JavaScript.

### Code Blocks

#### JavaScript

```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
    return name.toUpperCase();
}

greet("World");
```

#### Python

```python
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

result = calculate_sum([1, 2, 3, 4, 5])
print(f"Sum: {result}")
```

#### SQL

```sql
SELECT 
    students.name,
    COUNT(enrollments.id) as course_count
FROM students
LEFT JOIN enrollments ON students.id = enrollments.student_id
GROUP BY students.id, students.name
ORDER BY course_count DESC;
```

---

## Mathematics

### Inline Math

Einstein's famous equation: $E = mc^2$ relates energy to mass.

The quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

Pythagorean theorem: $a^2 + b^2 = c^2$

### Display Math

The integral of a function:

$$
\int_{a}^{b} f(x) \, dx
$$

Complex equation with fractions:

$$
\frac{d}{dx}\left( \frac{x^2 + 1}{x - 1} \right) = \frac{2x(x-1) - (x^2 + 1)}{(x-1)^2}
$$

Matrix representation:

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

Sigma notation for sum:

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

Limit definition:

$$
\lim_{x \to 0} \frac{\sin(x)}{x} = 1
$$

Power series:

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$

Greek letters: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\theta$, $\lambda$, $\mu$, $\pi$, $\sigma$, $\tau$, $\phi$, $\omega$

---

## Tables

### Basic Table

| Name    | Age | City      |
|---------|-----|-----------|
| Alice   | 25  | New York  |
| Bob     | 30  | London    |
| Charlie | 35  | Tokyo     |

### Table with Alignment

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Item 1       | Centered       |       100     |
| Item 2       | Also Centered  |       200     |
| Item 3       | Still Centered |       300     |

### Complex Table

| Feature | Supported | Notes |
|---------|-----------|-------|
| **Bold text** | Yes | Works in cells |
| *Italic text* | Yes | Also works |
| `Code` | Yes | Inline code works |
| Links | Yes | See references |

---

## Links and Images

### Hyperlinks

- [Internal link to Wikipedia](https://www.wikipedia.org/)
- [External link to MDN](https://developer.mozilla.org/)
- [Link with title](https://www.google.com "Google Homepage")

### References

This is text with a [reference link][1]. And here's [another one][2].

[1]: https://www.wikipedia.org/
[2]: https://www.github.com/ "GitHub"

### Images

Reference: ![Alt text for image](https://via.placeholder.com/300x200)
Note: Replace the placeholder URL with actual image paths in your system.

---

## Horizontal Rules

Above is a horizontal rule created with `---`.

---

## Mixed Formatting

Here's a paragraph with **bold text**, *italic text*, `inline code`, and even some math: $f(x) = x^2 + 3x + 2$.

### List with Mixed Formatting

1. **Bold item** in a list
2. *Italic item* with emphasis
3. Item with `inline code`
4. Item with math: $y = mx + b$
5. Item with ***bold italic***

---

## Special Characters

Escaped characters: \*literal asterisk\* and \`literal backtick\`.

Currency: $100, €50, ¥1000.

---

## Mathematics Combined with Text

This section shows how math works within paragraph text. For example, when discussing physics, we might talk about the force equation $F = ma$ where $F$ is force, $m$ is mass, and $a$ is acceleration.

### Physics Examples

Newton's second law states: $F = ma$

For multiple forces: $\sum F = ma$

Kinetic energy: $E_k = \frac{1}{2}mv^2$

Potential energy (gravity): $E_p = mgh$

Conservation of energy: $E_{total} = E_k + E_p = \frac{1}{2}mv^2 + mgh$

### Chemistry

The ideal gas law: $PV = nRT$

Where:
- $P$ is pressure
- $V$ is volume  
- $n$ is number of moles
- $R$ is the gas constant
- $T$ is temperature

---

## Conclusion

This test document includes:

✅ All heading levels (1-6)
✅ Bold, italic, bold italic text
✅ Inline code
✅ Code blocks (multiple languages)
✅ Unordered lists (plain and nested)
✅ Ordered lists (plain and nested)
✅ Mixed list formatting
✅ Blockquotes
✅ Tables (simple and complex)
✅ Links (inline and reference)
✅ Images
✅ Horizontal rules
✅ Inline math ($ ... $)
✅ Display math ($$ ... $$)
✅ Mixed math and text
✅ Special characters

All these features should render correctly in your learning portal's preview and final view!

