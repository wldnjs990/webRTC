/**
 * Prisma Client 초기화
 * Singleton 패턴으로 전역에서 하나의 인스턴스만 사용
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// Prisma Client 인스턴스
let prisma;

/**
 * Prisma Client 싱글톤 인스턴스 가져오기
 * 개발 환경에서는 Hot Reload 시 재연결 방지
 */
function getPrismaClient() {
  if (prisma) {
    return prisma;
  }

  // Prisma 7 방식: PostgreSQL adapter 사용
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error'] // 개발: 모든 로그
      : ['error'], // 프로덕션: 에러만
  });

  // Graceful shutdown 시 연결 종료
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  return prisma;
}

// 개발 환경에서 Hot Reload 대응
if (process.env.NODE_ENV !== 'production') {
  if (!global.__prisma) {
    global.__prisma = getPrismaClient();
  }
  prisma = global.__prisma;
} else {
  prisma = getPrismaClient();
}

module.exports = prisma;
