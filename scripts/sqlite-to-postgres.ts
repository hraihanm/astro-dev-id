import { PrismaClient } from "@prisma/client"
import Database from "better-sqlite3"

const SQLITE_PATH = "./prisma/dev.db"

const sqliteDb = new Database(SQLITE_PATH, { readonly: true })
const pg = new PrismaClient()

// ---------------- NORMALIZATION ----------------
function normalize(row: any) {
  const out: any = {}

  for (const [key, value] of Object.entries(row)) {

    // Boolean fields (SQLite uses 0/1)
    if (
      (value === 0 || value === 1) &&
      (
        key.startsWith("is") ||
        key.startsWith("has") ||
        key.startsWith("can") ||
        key === "completed" ||
        key === "pinned"
      )
    ) {
      out[key] = Boolean(value)
      continue
    }

    // Dates (epoch ms → Date)
    if (
      typeof value === "number" &&
      value > 1_000_000_000_000 &&
      (
        key.toLowerCase().includes("at") ||
        key.toLowerCase().includes("expires") ||
        key.toLowerCase().includes("verified")
      )
    ) {
      out[key] = new Date(value)
      continue
    }

    out[key] = value
  }

  return out
}

// ---------------- SQLITE TABLE DISCOVERY ----------------
function getTables(): string[] {
  return sqliteDb
    .prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_prisma_%'
    `)
    .all()
    .map((r: any) => r.name)
}

// ---------------- COPY LOGIC ----------------
async function copy(table: string) {
  const modelName = table.charAt(0).toLowerCase() + table.slice(1)
  const model = (pg as any)[modelName]
  if (!model) return

  const rows = sqliteDb.prepare(`SELECT * FROM "${table}"`).all()
  if (!rows.length) return

  console.log(`➡ Migrating ${table} (${rows.length})`)

  for (const row of rows) {
    const data = normalize(row)

    // ✅ If model has ID → use upsert
    if ("id" in data) {
      await model.upsert({
        where: { id: data.id },
        create: data,
        update: data
      })
    } else {
      // ✅ Tables without ID (rare)
      await model.create({
        data
      })
    }
  }
}

// ---------------- MAIN ----------------
async function main() {
  console.log("✅ Connected")

  const tables = getTables()
  console.log("Found tables:", tables)

  // ✅ STRICT FK-SAFE ORDER
  const ORDER = [
    "User",
    "VerificationToken",
    "Profile",
    "Account",
    "Session",
    "PasswordResetToken",

    "Course",
    "Classroom",

    "Chapter",
    "Quiz",

    "ClassroomMembership",
    "ClassroomPost",
    "ClassroomResource",

    "QuizAttempt",
    "BlockProgress",
    "ClassroomComment"
  ]

  for (const table of ORDER) {
    if (tables.includes(table)) {
      await copy(table)
    }
  }

  console.log("✅ Migration complete")
  await pg.$disconnect()
  sqliteDb.close()
}

main().catch(e => {
  console.error("❌ Migration failed:", e)
  process.exit(1)
})
