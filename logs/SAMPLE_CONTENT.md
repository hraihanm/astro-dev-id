# Sample Chapter Content

This file shows examples of how to write content for your courses using Markdown and LaTeX.

## Basic Markdown

### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
```

### Text Formatting

```markdown
**Bold text**
*Italic text*
***Bold and italic***
`Code inline`
```

### Lists

```markdown
- Bullet point 1
- Bullet point 2
  - Nested point

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3
```

## LaTeX Examples

### Inline Math

Use single dollar signs for inline math:

```markdown
The equation $E = mc^2$ shows the relationship between energy and mass.

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.
```

### Display Math

Use double dollar signs for centered equations:

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### Common Math Symbols

```markdown
Greek letters: $\alpha$, $\beta$, $\gamma$, $\Delta$, $\Omega$

Fractions: $\frac{a}{b}$, $\frac{x^2 + y^2}{z}$

Square roots: $\sqrt{x}$, $\sqrt[3]{x}$

Superscripts: $x^2$, $e^{i\pi}$

Subscripts: $x_i$, $a_1$

Summation: $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

Integration: $\int_0^1 x^2 dx$

Matrices: $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$
```

## Complete Example: Algebra Chapter

```markdown
# Introduction to Quadratic Equations

## What is a Quadratic Equation?

A quadratic equation is an equation of the form:

$$
ax^2 + bx + c = 0
$$

where $a \neq 0$.

## The Quadratic Formula

The solutions to a quadratic equation can be found using the quadratic formula:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### Example 1

Solve the equation $x^2 - 5x + 6 = 0$.

**Solution:**

Here, $a = 1$, $b = -5$, and $c = 6$.

Using the quadratic formula:

$$
x = \frac{-(-5) \pm \sqrt{(-5)^2 - 4(1)(6)}}{2(1)}
$$

$$
x = \frac{5 \pm \sqrt{25 - 24}}{2}
$$

$$
x = \frac{5 \pm 1}{2}
$$

Therefore, $x = 3$ or $x = 2$.

## Practice Problems

1. Solve: $x^2 + 3x - 10 = 0$
2. Solve: $2x^2 - 7x + 3 = 0$
3. Solve: $x^2 - 4 = 0$

## Key Takeaways

- Quadratic equations have the form $ax^2 + bx + c = 0$
- The quadratic formula always works for solving quadratic equations
- The discriminant $b^2 - 4ac$ determines the nature of solutions:
  - If $b^2 - 4ac > 0$: two distinct real solutions
  - If $b^2 - 4ac = 0$: one repeated real solution
  - If $b^2 - 4ac < 0$: two complex solutions
```

## Physics Example

```markdown
# Newton's Laws of Motion

## First Law (Law of Inertia)

An object at rest stays at rest, and an object in motion stays in motion with the same velocity, unless acted upon by an external force.

Mathematically: If $\sum \vec{F} = 0$, then $\vec{v} = \text{constant}$

## Second Law

The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass:

$$
\vec{F} = m\vec{a}
$$

where:
- $\vec{F}$ is the net force (in Newtons)
- $m$ is the mass (in kilograms)
- $\vec{a}$ is the acceleration (in m/s²)

### Example

A 10 kg object experiences a force of 50 N. What is its acceleration?

**Solution:**

Using $F = ma$:

$$
a = \frac{F}{m} = \frac{50 \text{ N}}{10 \text{ kg}} = 5 \text{ m/s}^2
$$

## Third Law (Action-Reaction)

For every action, there is an equal and opposite reaction:

$$
\vec{F}_{12} = -\vec{F}_{21}
$$
```

## Chemistry Example

```markdown
# Chemical Equations

## Balancing Chemical Equations

The law of conservation of mass states that matter cannot be created or destroyed in a chemical reaction.

### Example: Combustion of Methane

$$
\ce{CH4 + 2O2 -> CO2 + 2H2O}
$$

### Stoichiometry

The number of moles is calculated using:

$$
n = \frac{m}{M}
$$

where:
- $n$ = number of moles
- $m$ = mass (in grams)
- $M$ = molar mass (in g/mol)
```

## Tips for Writing Course Content

1. **Start Simple**: Begin with basic concepts before moving to complex topics
2. **Use Examples**: Provide worked examples for every concept
3. **Include Practice**: Add practice problems at the end of each section
4. **Visualize**: Describe diagrams or include ASCII art where possible
5. **Review**: End each chapter with key takeaways

## Formatting Best Practices

- Use headings to organize content hierarchically
- Keep paragraphs short and focused
- Use lists for multiple related points
- Highlight important formulas with display math ($$)
- Use inline math ($) for variables in text
- Add blank lines between sections for readability

---

Copy and paste any of these examples into your chapter content to get started!

