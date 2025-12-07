import Database from "better-sqlite3"

const db = new Database("./prisma/dev.db")

const tables = db
  .prepare(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
  )
  .all()

console.log("Tables:")
for (const t of tables) {
  console.log("-", t.name)
}

db.close()
