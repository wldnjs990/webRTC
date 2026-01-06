/**
 * Prisma Client 초기화
 * Singleton 패턴으로 전역에서 하나의 인스턴스만 사용
 */

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

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
  // pool : postgre와 연결을 미리 생성해둠(기본 10개 생성)
  // 매번 쿼리를 요청할때 DB와 연결하는데(0.5초 걸린다 가정)
  // pool은 미리 연결을 만들어둬서 바로 연결됨(0.001초 걸린다 가정)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // prisma 클라이언트에 설정해줄 postgre 언어 통역사
  // 이게 없으면 prisma엔진이 직접 postgre 언어를 해석하면서 속도가 오래 걸림
  // 근데 PrismaPg는 통역을 담당해주는 라이브러리로서 훨씬 빠르게 db의 언어를 해석해줌
  // 그래서 훨씬 빨라짐(그리고 prisma7 부턴 adapter 설정이 필수로 바뀌었음)
  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"] // 개발: 모든 로그
        : ["error"], // 프로덕션: 에러만
  });

  // Graceful shutdown 시 연결 종료
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  return prisma;
}

// 개발 환경에서 Hot Reload 대응
if (process.env.NODE_ENV !== "production") {
  if (!global.__prisma) {
    global.__prisma = getPrismaClient();
  }
  prisma = global.__prisma;
} else {
  prisma = getPrismaClient();
}

module.exports = prisma;
