import mysql from 'mysql2/promise';

// Chỉ dùng để đọc đối chiếu sau thao tác trên giao diện. Tạo / dọn dữ liệu đi qua API.
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!process.env.E2E_DB_HOST || !process.env.E2E_DB_NAME || !process.env.E2E_DB_USER) {
    throw new Error('Chưa cấu hình kết nối DB (E2E_DB_HOST, E2E_DB_NAME, E2E_DB_USER trong .env.e2e)');
  }
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.E2E_DB_HOST,
      port: Number(process.env.E2E_DB_PORT ?? 3306),
      database: process.env.E2E_DB_NAME,
      user: process.env.E2E_DB_USER,
      password: process.env.E2E_DB_PASSWORD,
      connectionLimit: 2,
    });
  }
  return pool;
}

export async function dbSelect<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!/^\s*select\b/i.test(sql)) {
    throw new Error('support/db.ts chỉ cho phép câu SELECT');
  }
  const [rows] = await getPool().query(sql, params);
  return rows as T[];
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
