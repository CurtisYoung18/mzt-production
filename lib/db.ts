import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  console.error("⚠️  DATABASE_URL environment variable is not set!")
  console.error("Please create a .env.local file with your database connection string.")
}

export const sql = neon(process.env.DATABASE_URL || "")

export async function authenticateUser(account: string, password: string) {
  const result = await sql`
    SELECT id, user_id, name, id_card, phone 
    FROM users 
    WHERE (id_card = ${account} OR phone = ${account}) 
    AND password = ${password}
  `
  return result[0] || null
}

export async function getUserById(userId: string) {
  const result = await sql`
    SELECT id, user_id, name, id_card, phone 
    FROM users 
    WHERE user_id = ${userId}
  `
  return result[0] || null
}
