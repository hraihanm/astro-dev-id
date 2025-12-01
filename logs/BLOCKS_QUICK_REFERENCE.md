# Blocks System - Quick Reference

## Using Static Blocks in Markdown

### Definition Block
```markdown
<div class="definition-block">
  <div class="definition-header">📘 Definisi 2.1: Luminositas</div>
  <div class="definition-content">
    Luminositas adalah total energi yang dipancarkan oleh bintang per satuan waktu.
  </div>
</div>
```

### Theorem Block
```markdown
<div class="theorem-block">
  <div class="theorem-header">⚡ Teorema: Persamaan Stefan-Boltzmann</div>
  <div class="theorem-content">
    $$L = 4\pi R^2 \sigma T^4$$
  </div>
</div>
```

### Example Block
```markdown
<div class="example-block">
  <div class="example-header">📝 Contoh 2.3</div>
  <div class="example-problem">
    Hitung luminositas bintang dengan radius $R = 7 \times 10^8$ m dan suhu $T = 6000$ K.
  </div>
  <details>
    <summary>Lihat Solusi</summary>
    <div class="example-solution">
      Menggunakan persamaan Stefan-Boltzmann:
      $$L = 4\pi R^2 \sigma T^4$$
      ...
    </div>
  </details>
</div>
```

### Note Block
```markdown
<div class="note-block note-info">
  <div class="note-header">ℹ️ Informasi</div>
  <div>Catatan penting tentang konsep ini...</div>
</div>

<div class="note-block note-warning">
  <div class="note-header">⚠️ Peringatan</div>
  <div>Perhatikan hal ini...</div>
</div>

<div class="note-block note-tip">
  <div class="note-header">💡 Tips</div>
  <div>Tips untuk memahami konsep...</div>
</div>
```

## Adding Interactive Blocks (via API)

### Quiz Block
```json
{
  "blocks": "[{\"id\":\"block-0\",\"type\":\"quiz\",\"quizId\":5,\"position\":0}]"
}
```

### Simulation Block
```json
{
  "blocks": "[{\"id\":\"block-1\",\"type\":\"simulation\",\"sourceUrl\":\"https://phet.colorado.edu/sims/html/...\",\"position\":500}]"
}
```

## API Endpoints

### Get Block Progress
```bash
GET /api/blocks/progress?chapterId=1
```

### Update Block Progress
```bash
POST /api/blocks/progress
Content-Type: application/json

{
  "chapterId": 1,
  "blockId": "block-0",
  "blockType": "quiz",
  "completed": true,
  "score": 85.5,
  "data": {"answers": [...]}
}
```

## Migration

After pulling changes, run:
```bash
npx prisma migrate dev
npx prisma generate
```

## Next Steps

1. **Test static blocks**: Add HTML blocks to existing markdown content
2. **Test interactive blocks**: Create chapters with blocks JSON
3. **Build editor UI**: Add block insertion interface in chapter editor (future)

