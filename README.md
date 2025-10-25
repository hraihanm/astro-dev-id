# My Learning Portal

A modern, self-hostable learning management system built with Astro, featuring LaTeX support for educational content.

## Features

- 📚 **Rich Content**: Create courses with Markdown and LaTeX support for mathematical content
- 🎯 **Interactive Quizzes**: Test student knowledge with built-in quiz system
  - Multiple question types (multiple choice, multiple select, text, numeric)
  - Automatic scoring and detailed feedback
  - Timer functionality
  - LaTeX support in questions
- 👤 **User Profiles**: Personalized learning experience
  - Progress tracking and analytics
  - Achievement system
  - Learning goals and preferences
  - Activity timeline
- 👥 **User Management**: Admin dashboard for managing users and courses
- 🚀 **Easy Hosting**: Deploy to GitHub Pages, Vercel, or self-host
- 📱 **Responsive Design**: Works beautifully on all devices
- 🔐 **Authentication**: Secure user authentication and role-based access

## Tech Stack

- **Frontend**: Astro with Tailwind CSS
- **Backend**: Astro API routes (serverless-ready)
- **Database**: Prisma with SQLite (portable, can be migrated to PostgreSQL)
- **LaTeX Rendering**: KaTeX
- **Markdown**: Marked

## Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd astro-learning-portal
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Initialize the database**

```bash
npm run db:push
```

This will create the SQLite database and tables based on the Prisma schema.

5. **Run the development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Usage

### Creating Your First Admin Account

1. Visit `/auth/signup`
2. Create an account with your email and password
3. Manually update the user role in the database to 'admin':

```bash
npm run db:studio
```

This opens Prisma Studio in your browser where you can edit the user's role to 'admin'.

### Creating Courses

1. Sign in as an admin
2. Navigate to `/admin/courses`
3. Click "Create New Course"
4. Fill in course details and add chapters
5. After creation, you can edit chapter content with Markdown and LaTeX

### LaTeX Syntax

Use standard LaTeX syntax in your content:

**Inline math**: `$E = mc^2$` → $E = mc^2$

**Display math**:
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### Course Structure

Courses are organized as:
- **Course** → Multiple Chapters → Quizzes
- **Chapter** → Contains Markdown/LaTeX content
- **Quiz** → Multiple questions with LaTeX support
  - Automatic scoring
  - Detailed results with answer review
  - Progress tracking

### Quiz System

Create quizzes with multiple question types:
- **Multiple Choice**: Select one correct answer
- **Multiple Select**: Select all correct answers
- **Text Answer**: Free-form text response
- **Numeric Answer**: Numerical response with tolerance

All question types support LaTeX for mathematical notation.

### User Profiles

Each user has a comprehensive profile with:
- Personal information (name, bio)
- Learning statistics (quiz attempts, average score)
- Achievements (unlocked based on performance)
- Recent activity timeline
- Customizable preferences

## Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Option 2: GitHub Pages (Static)

For static deployment, you'll need to pre-render all pages:

```bash
npm run build
```

### Option 3: Self-Hosted

```bash
npm run build
npm run preview
```

Or use Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
```

## Project Structure

```
astro-learning-portal/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── components/            # Reusable Astro components
│   │   ├── Layout.astro
│   │   └── CourseCard.astro
│   ├── lib/                   # Business logic
│   │   ├── db.ts             # Prisma client
│   │   ├── users.ts          # User management
│   │   ├── courses.ts        # Course management
│   │   ├── admin.ts          # Admin functions
│   │   ├── student.ts        # Student functions
│   │   └── latex.ts          # LaTeX rendering
│   ├── pages/                # Routes
│   │   ├── index.astro       # Homepage
│   │   ├── auth/             # Authentication pages
│   │   ├── courses/          # Student course viewer
│   │   ├── admin/            # Admin dashboard
│   │   └── api/              # API routes
│   └── styles/               # Global styles
├── astro.config.mjs          # Astro configuration
├── package.json
└── README.md
```

## Development

### Database Management

**Push schema changes**:
```bash
npm run db:push
```

**Open Prisma Studio**:
```bash
npm run db:studio
```

**Generate Prisma Client** (after schema changes):
```bash
npm run db:generate
```

### Adding New Features

1. Update Prisma schema if needed
2. Run `npm run db:push` to update database
3. Run `npm run db:generate` to regenerate Prisma client
4. Create/update components and pages
5. Test locally
6. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own learning portal!

## Support

For issues and questions, please open an issue on GitHub.

---

**Happy Learning!** 📚✨

