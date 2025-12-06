# AI API Endpoints Documentation

This document describes the API endpoints available for AI agents to interact with the course and chapter editor system.

## Base URL

All endpoints are prefixed with `/api/admin`

## Authentication

Authentication:
- Cookie admin session (role=admin), or
- API key: `x-api-key: <ADMIN_API_KEY>` or `Authorization: Bearer <ADMIN_API_KEY>`
- Per-admin API keys are supported (stored on the user); `ADMIN_API_KEY` is also accepted (or `dev-admin-key` in non-prod when unset).

## Course Endpoints

### List All Courses

**GET** `/api/admin/courses`

Retrieve all courses in the system.

**Query Parameters:**
- `includeChapters` (boolean, optional): Include chapter summaries in response
- `includeQuizzes` (boolean, optional): Include quiz summaries in response

**Response:**
```json
{
  "courses": [
    {
      "id": 1,
      "title": "Introduction to Astronomy",
      "slug": "intro-astronomy",
      "description": "Learn the basics of astronomy",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "creator": {
        "id": 1,
        "email": "admin@example.com"
      },
      "chapters": [...], // if includeChapters=true
      "quizzes": [...] // if includeQuizzes=true
    }
  ],
  "count": 1
}
```

**Example:**
```bash
GET /api/admin/courses?includeChapters=true
```

---

### Get Course by ID

**GET** `/api/admin/courses/[id]`

Retrieve a specific course with all its chapters and quizzes.

**Response:**
```json
{
  "course": {
    "id": 1,
    "title": "Introduction to Astronomy",
    "slug": "intro-astronomy",
    "description": "Learn the basics of astronomy",
    "createdBy": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "chapters": [
      {
        "id": 1,
        "title": "Chapter 1: The Solar System",
        "order": 1,
        "content": "# The Solar System\n\n...",
        "blocks": "[...]",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "quizzes": [
      {
        "id": 1,
        "title": "Solar System Quiz",
        "quizType": "latihan",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "creator": {
      "id": 1,
      "email": "admin@example.com"
    }
  }
}
```

---

### Create Course

**POST** `/api/admin/courses`

Supports JSON (recommended) and form-data (legacy UI). Returns JSON for JSON requests. Slug uniqueness is enforced (409 on conflict).

**Request Body (JSON):**
```json
{
  "title": "Celestial Mechanics",
  "slug": "celestial-mechanics",
  "description": "Advanced course on orbital dynamics, perturbations, and mission design fundamentals.",
  "chapters": ["Foundations"]
}
```

**Request Body (form-data, legacy UI):**
```
title=Celestial Mechanics
slug=celestial-mechanics
description=Advanced course on orbital dynamics, perturbations, and mission design fundamentals.
chapters[]=Foundations
```

**Response (JSON requests):**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": 1,
    "title": "Celestial Mechanics",
    "slug": "celestial-mechanics",
    "description": "Advanced course on orbital dynamics, perturbations, and mission design fundamentals."
  }
}
```

---

### Update Course

**PUT** `/api/admin/courses/[id]`

Update course information.

**Request Body:**
```json
{
  "title": "Updated Course Title",
  "slug": "updated-slug",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "message": "Course updated successfully",
  "course": {
    "id": 1,
    "title": "Updated Course Title",
    "slug": "updated-slug",
    "description": "Updated description"
  }
}
```

---

### Delete Course

**DELETE** `/api/admin/courses/[id]`

Delete a course and all its associated chapters and quizzes.

**Response:**
```json
{
  "message": "Course deleted successfully"
}
```

---

## Chapter Endpoints

### Get Chapter by ID

**GET** `/api/admin/chapters/[id]`

Retrieve a specific chapter with its course and quiz information.

**Response:**
```json
{
  "chapter": {
    "id": 1,
    "courseId": 1,
    "title": "Chapter 1: The Solar System",
    "order": 1,
    "content": "# The Solar System\n\nOur solar system consists of...",
    "blocks": "[{\"id\":\"block-0\",\"type\":\"quiz\",...}]",
    "course": {
      "id": 1,
      "title": "Introduction to Astronomy",
      "slug": "intro-astronomy",
      "description": "Learn the basics of astronomy"
    },
    "quizzes": [
      {
        "id": 1,
        "title": "Solar System Quiz",
        "quizType": "latihan"
      }
    ]
  }
}
```

---

### List Chapters for a Course

**GET** `/api/admin/courses/[id]/chapters`

Retrieve all chapters for a specific course.

**Response:**
```json
{
  "course": {
    "id": 1,
    "title": "Introduction to Astronomy"
  },
  "chapters": [
    {
      "id": 1,
      "title": "Chapter 1: The Solar System",
      "order": 1,
      "content": "# The Solar System\n\n...",
      "blocks": "[...]",
      "quizzes": [...]
    }
  ],
  "count": 1
}
```

---

### Create Chapter

**POST** `/api/admin/chapters`

Create a new chapter for a course.

**Request Body:**
```json
{
  "courseId": 1,
  "title": "Chapter 2: Stars and Galaxies",
  "order": 2,
  "content": "# Stars and Galaxies\n\nContent here..."
}
```

**Response:**
```json
{
  "message": "Chapter created successfully",
  "chapter": {
    "id": 2,
    "courseId": 1,
    "title": "Chapter 2: Stars and Galaxies",
    "order": 2,
    "content": "# Stars and Galaxies\n\nContent here..."
  }
}
```

---

### Update Chapter

**PUT** `/api/admin/chapters/[id]`

Update an existing chapter.

**Request Body:**
```json
{
  "title": "Updated Chapter Title",
  "order": 1,
  "content": "# Updated Content\n\n..."
}
```

**Response:**
```json
{
  "message": "Chapter updated successfully",
  "chapter": {
    "id": 1,
    "title": "Updated Chapter Title",
    "order": 1,
    "content": "# Updated Content\n\n..."
  }
}
```

---

### Delete Chapter

**DELETE** `/api/admin/chapters/[id]`

Delete a chapter. Remaining chapters will be automatically reordered.

**Response:**
```json
{
  "message": "Chapter deleted successfully"
}
```

---

## AI Content Generation Endpoints

### Generate New Chapter

**POST** `/api/admin/courses/[id]/chapters/generate`

Generate a new chapter for a course using AI-generated content. This endpoint is specifically designed for AI agents.

**Request Body:**
```json
{
  "title": "Chapter 3: Black Holes",
  "order": 3,
  "content": "# Black Holes\n\nA black hole is a region of spacetime...",
  "prompt": "Generate educational content about black holes for high school students",
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7,
    "tokens": 1500
  }
}
```

**Response:**
```json
{
  "message": "Chapter generated successfully",
  "chapter": {
    "id": 3,
    "courseId": 1,
    "title": "Chapter 3: Black Holes",
    "order": 3,
    "content": "# Black Holes\n\nA black hole is a region of spacetime...",
    "blocks": "[...]",
    "course": {
      "id": 1,
      "title": "Introduction to Astronomy",
      "slug": "intro-astronomy"
    }
  },
  "metadata": {
    "generatedAt": "2024-01-01T12:00:00.000Z",
    "prompt": "Generate educational content about black holes for high school students",
    "model": "gpt-4",
    "temperature": 0.7,
    "tokens": 1500
  }
}
```

**Notes:**
- If `order` is not provided, the chapter will be appended at the end
- If `order` conflicts with existing chapters, other chapters will be automatically shifted
- Blocks are automatically synced from content markers in the markdown

---

### Regenerate Chapter Content

**POST** `/api/admin/chapters/[id]/generate`

Regenerate or update chapter content using AI-generated content. This endpoint allows AI agents to update existing chapters.

**Request Body:**
```json
{
  "content": "# Updated Black Holes Content\n\nNew content here...",
  "title": "Updated Chapter Title",
  "prompt": "Improve the explanation of black holes with more examples",
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "preserveBlocks": true
}
```

**Response:**
```json
{
  "message": "Chapter content regenerated successfully",
  "chapter": {
    "id": 3,
    "courseId": 1,
    "title": "Updated Chapter Title",
    "order": 3,
    "content": "# Updated Black Holes Content\n\nNew content here...",
    "blocks": "[...]",
    "course": {
      "id": 1,
      "title": "Introduction to Astronomy",
      "slug": "intro-astronomy"
    }
  },
  "metadata": {
    "generatedAt": "2024-01-01T12:30:00.000Z",
    "prompt": "Improve the explanation of black holes with more examples",
    "preserveBlocks": true,
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

**Notes:**
- If `title` is not provided, the existing title is preserved
- `preserveBlocks` (default: `true`) determines whether to preserve existing interactive blocks
- Blocks are automatically synced from content markers in the markdown

---

## Quiz Endpoints

All quiz admin endpoints require admin auth (cookie admin or API key).

### List Quizzes for a Course
**GET** `/api/admin/quiz?courseId=COURSE_ID`

**Response:**
```json
[
  {
    "id": 12,
    "title": "Orbital Elements Quiz",
    "courseId": 5,
    "type": "multiple-choice",
    "questionCount": 10,
    "problemCount": 0,
    "settings": { "timeLimit": 900 },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Quiz
**POST** `/api/admin/quiz/create`

**Request (JSON):**
```json
{
  "courseId": 5,
  "title": "Two-Body Dynamics Quiz",
  "description": "Check fundamentals.",
  "timeLimit": 15,
  "maxAttempts": 3,
  "quizType": "latihan",
  "scoreReleaseMode": "immediate",
  "questions": [ /* question objects */ ]
}
```

**Response:**
```json
{
  "message": "Quiz created successfully",
  "quiz": { "id": 21, "title": "Two-Body Dynamics Quiz" }
}
```

### Update Quiz
**PUT** `/api/admin/quiz/[id]/update`

**Request (JSON):**
```json
{
  "title": "Two-Body Dynamics Quiz (v2)",
  "description": "Updated",
  "timeLimit": 20,
  "quizType": "latihan",
  "attemptLimit": 3,
  "scoreReleaseMode": "immediate",
  "questions": [ /* updated questions */ ]
}
```

**Response:**
```json
{ "message": "Quiz updated successfully", "quiz": { ... } }
```

### Delete Quiz
**DELETE** `/api/admin/quiz/[id]/delete`

**Response:**
```json
{ "message": "Quiz deleted successfully" }
```

---

## Content Format

### Markdown Support

Chapters support standard Markdown syntax:
- Headers (`#`, `##`, `###`)
- Lists (ordered and unordered)
- Links and images
- Code blocks
- Blockquotes
- Tables

### LaTeX Support

Mathematical expressions can be included using LaTeX syntax:
- Inline math: `$E = mc^2$`
- Block math: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`

### Interactive Blocks

Interactive blocks can be embedded in content using special markers:
- `[BLOCK:quiz:1]` - Embed a quiz
- `[BLOCK:simulation:interactive-diagram]` - Embed a simulation
- `[BLOCK:code-editor:javascript]` - Embed a code editor

The blocks are automatically parsed and stored in the `blocks` JSON field.

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (missing required fields, invalid data)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Example AI Workflow

### 1. List all courses
```bash
GET /api/admin/courses
```

### 2. Get course details
```bash
GET /api/admin/courses/1
```

### 3. Generate a new chapter
```bash
POST /api/admin/courses/1/chapters/generate
{
  "title": "Chapter 4: Exoplanets",
  "content": "# Exoplanets\n\nAn exoplanet is a planet outside our solar system...",
  "prompt": "Create educational content about exoplanets"
}
```

### 4. View the generated chapter
```bash
GET /api/admin/chapters/4
```

### 5. Regenerate chapter content
```bash
POST /api/admin/chapters/4/generate
{
  "content": "# Exoplanets (Updated)\n\nImproved content...",
  "prompt": "Add more examples and make it more engaging"
}
```

---

## Notes for AI Agents

1. **Content Generation**: When generating content, ensure it follows educational best practices:
   - Clear structure with headers
   - Appropriate difficulty level for target audience
   - Engaging examples and explanations
   - Proper markdown formatting

2. **Block Preservation**: When regenerating content, consider whether to preserve existing interactive blocks (`preserveBlocks: true`) or start fresh (`preserveBlocks: false`).

3. **Order Management**: Chapter ordering is automatically handled. If you specify an order that conflicts, other chapters will be shifted automatically.

4. **Metadata Tracking**: Use the `metadata` field to track generation parameters, prompts, and other relevant information for future reference.

5. **Error Handling**: Always check response status codes and handle errors gracefully. The API provides detailed error messages to help diagnose issues.
