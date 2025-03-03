import pool from "../db.js";

// Create users table if not exists
const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      clerkId VARCHAR(100) NOT NULL
    );
  `;
  await pool.query(query);
};

createUserTable();

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0];
};


export const createUser = async (name, email, clerkId) => {
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, clerkId) VALUES ($1, $2, $3) RETURNING *",
    [name, email, clerkId]
  );
  return rows[0];
};
