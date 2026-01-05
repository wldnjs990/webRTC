const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const prisma = require("./lib/db");

const app = express();
const server = http.createServer(app);

// Socket.io 설정 (CORS 포함)
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  // 연결 설정
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB 제한
});

// 방 관리
const rooms = new Map();

// ===== 유틸리티 함수 =====

/**
 * roomId 유효성 검증
 * @param {string} roomId - 검증할 방 ID
 * @throws {Error} 유효하지 않은 경우 에러
 */
function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== "string") {
    throw new Error("유효하지 않은 방 ID");
  }
  if (roomId.length > 100) {
    throw new Error("방 ID가 너무 깁니다 (최대 100자)");
  }
}

/**
 * SDP 데이터 크기 검증
 * @param {Object} sdpData - 검증할 SDP 데이터 (offer 또는 answer)
 * @param {string} type - 데이터 타입 ("Offer" 또는 "Answer")
 * @throws {Error} 크기가 초과된 경우 에러
 */
function validateSdpSize(sdpData, type) {
  if (JSON.stringify(sdpData).length > 100000) {
    throw new Error(`${type} 데이터가 너무 큽니다`);
  }
}

/**
 * Callback 함수 검증
 * @param {Function} callback - 검증할 콜백
 * @param {string} eventName - 이벤트 이름 (로깅용)
 * @returns {boolean} 유효한 콜백인지 여부
 */
function validateCallback(callback, eventName) {
  if (!callback || typeof callback !== "function") {
    console.error(`❌ ${eventName}: 콜백이 필요합니다`);
    return false;
  }
  return true;
}

// 서버가 클라이언트로부터 JSON 데이터를 받을 수 있게 해주는 미들웨어
// express 프레임워크가 클라이언트 body값을 파싱하는 용도
app.use(express.json());

// 헬스 체크 엔드포인트
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    activeConnections: io.engine.clientsCount,
    activeRooms: rooms.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 활성 방 목록 조회
app.get("/rooms", async (req, res) => {
  try {
    // DB에서 활성 방 조회 (closedAt이 null인 방)
    const activeRooms = await prisma.room.findMany({
      where: {
        closedAt: null,
      },
      include: {
        participants: {
          where: {
            leftAt: null, // 현재 참가 중인 사용자만
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const roomList = activeRooms.map(room => ({
      id: room.id,
      name: room.name,
      userCount: room.participants.length,
      createdAt: room.createdAt,
    }));

    res.json({ rooms: roomList });
  } catch (error) {
    console.error('[에러] 방 목록 조회 실패:', error.message);
    res.status(500).json({ error: '방 목록을 가져올 수 없습니다.' });
  }
});

// Socket.io 연결 처리
io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] 새 연결: ${socket.id}`);

  // 1. 방 생성
  socket.on("create-room", async (roomId, callback) => {
    // 콜백 필수 검증
    if (!validateCallback(callback, "create-room")) {
      return;
    }

    try {
      // 입력 검증
      validateRoomId(roomId);

      // 이미 존재하는 방인지 확인 (메모리)
      if (rooms.has(roomId)) {
        throw new Error("이미 존재하는 방입니다");
      }

      // DB에 방 생성
      const room = await prisma.room.create({
        data: {
          id: roomId,
          participants: {
            create: {
              socketId: socket.id,
            }
          }
        },
        include: {
          participants: true
        }
      });

      // 메모리에도 저장 (빠른 조회용)
      rooms.set(roomId, {
        id: roomId,
        users: new Set([socket.id]),
        createdAt: room.createdAt.toISOString(),
      });

      // 소켓 설정
      socket.join(roomId);
      socket.currentRoom = roomId;

      console.log(`[방 생성] ${roomId} by ${socket.id} (DB 저장 완료)`);

      callback({ success: true, roomId });
    } catch (error) {
      console.error(`[에러] 방 생성 실패:`, error.message);
      callback({ success: false, error: error.message });
    }
  });

  // 2. 방 입장
  socket.on("join-room", async (roomId, callback) => {
    // 콜백 필수 검증
    if (!validateCallback(callback, "join-room")) {
      return;
    }

    try {
      // 입력 검증
      validateRoomId(roomId);

      // 방 존재 확인
      if (!rooms.has(roomId)) {
        throw new Error("존재하지 않는 방입니다");
      }

      const room = rooms.get(roomId);

      // 입장한 사용자에게 전달할 기존 참여자 목록 (본인 제외)
      const existingUsers = Array.from(room.users);

      // DB에 참가자 기록
      await prisma.roomParticipant.create({
        data: {
          roomId,
          socketId: socket.id,
        }
      });

      // 메모리 업데이트
      socket.join(roomId);
      socket.currentRoom = roomId;
      room.users.add(socket.id);

      console.log(
        `[방 입장] ${socket.id} → ${roomId} (총 ${room.users.size}명) (DB 저장 완료)`
      );

      // 기존 참여자들에게 새 사용자 입장 알림
      socket.to(roomId).emit("user-joined", {
        userId: socket.id,
        timestamp: new Date().toISOString(),
      });

      callback({
        success: true,
        roomId,
        existingUsers,
      });
    } catch (error) {
      console.error(`[에러] 방 입장 실패:`, error.message);
      callback({ success: false, error: error.message });
    }
  });

  // 3. Offer 중계
  socket.on("offer", (data) => {
    try {
      // 데이터 검증
      if (!data || !data.target || !data.offer) {
        throw new Error("유효하지 않은 Offer 데이터");
      }

      // SDP 크기 제한 (DoS 방지)
      validateSdpSize(data.offer, "Offer");

      console.log(`[Offer] ${socket.id} → ${data.target}`);

      // 대상에게 Offer 전달 (1:1 시그널링)
      socket.to(data.target).emit("offer", {
        offer: data.offer,
        from: socket.id,
      });
    } catch (error) {
      console.error(`[에러] Offer 전송 실패:`, error.message);
      socket.emit("error", {
        type: "offer-error",
        message: error.message
      });
    }
  });

  // 4. Answer 중계
  socket.on("answer", (data) => {
    try {
      // 데이터 검증
      if (!data || !data.target || !data.answer) {
        throw new Error("유효하지 않은 Answer 데이터");
      }

      // SDP 크기 제한 (DoS 방지)
      validateSdpSize(data.answer, "Answer");

      console.log(`[Answer] ${socket.id} → ${data.target}`);

      // 대상에게 Answer 전달 (1:1 시그널링)
      socket.to(data.target).emit("answer", {
        answer: data.answer,
        from: socket.id,
      });
    } catch (error) {
      console.error(`[에러] Answer 전송 실패:`, error.message);
      socket.emit("error", {
        type: "answer-error",
        message: error.message
      });
    }
  });

  // 5. ICE Candidate 중계
  socket.on("ice-candidate", (data) => {
    try {
      // 데이터 검증
      if (!data || !data.target || !data.candidate) {
        throw new Error("유효하지 않은 ICE Candidate");
      }

      console.log(`[ICE] ${socket.id} → ${data.target}`);

      // 대상에게 ICE Candidate 전달 (1:1 시그널링)
      socket.to(data.target).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    } catch (error) {
      console.error(`[에러] ICE Candidate 전송 실패:`, error.message);
      socket.emit("error", {
        type: "ice-error",
        message: error.message
      });
    }
  });

  // 6. 방 나가기
  socket.on("leave-room", () => {
    leaveCurrentRoom(socket);
  });

  // 7. 연결 해제
  socket.on("disconnect", (reason) => {
    console.log(
      `[${new Date().toISOString()}] 연결 해제: ${socket.id} (이유: ${reason})`
    );
    leaveCurrentRoom(socket);
  });

  // 8. 에러 처리
  socket.on("error", (error) => {
    console.error(`[소켓 에러] ${socket.id}:`, error);
  });
});

// 방 나가기 공통 로직
async function leaveCurrentRoom(socket) {
  if (socket.currentRoom) {
    const room = rooms.get(socket.currentRoom);

    if (room) {
      // DB에 퇴장 시각 기록
      try {
        await prisma.roomParticipant.updateMany({
          where: {
            roomId: socket.currentRoom,
            socketId: socket.id,
            leftAt: null, // 아직 퇴장하지 않은 참가 기록만
          },
          data: {
            leftAt: new Date(),
          }
        });
      } catch (error) {
        console.error(`[에러] DB 퇴장 기록 실패:`, error.message);
      }

      // 메모리에서 사용자 제거
      room.users.delete(socket.id);

      console.log(
        `[방 퇴장] ${socket.id} ← ${socket.currentRoom} (남은 인원: ${room.users.size}명)`
      );

      // 다른 사용자들에게 알림
      socket.to(socket.currentRoom).emit("user-left", {
        userId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // 방이 비었으면 삭제 (메모리 + DB)
      if (room.users.size === 0) {
        try {
          // DB에 방 종료 시각 기록
          await prisma.room.update({
            where: { id: socket.currentRoom },
            data: { closedAt: new Date() }
          });
        } catch (error) {
          console.error(`[에러] DB 방 종료 기록 실패:`, error.message);
        }

        rooms.delete(socket.currentRoom);
        console.log(`[방 삭제] ${socket.currentRoom} (비어있음)`);
      }
    }

    socket.leave(socket.currentRoom);
    socket.currentRoom = null;
  }
}

// 서버 시작
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
========================================
  WebRTC 시그널링 서버 실행 중
========================================
  포트: ${PORT}
  클라이언트 URL: ${process.env.CLIENT_URL || "http://localhost:5173" || "http://localhost:5174"}
  시작 시간: ${new Date().toISOString()}
========================================
  `);
});

// 주기적 상태 로깅 (1분마다)
setInterval(() => {
  console.log(`
[상태] 활성 연결: ${io.engine.clientsCount} | 활성 방: ${rooms.size}
  `);
}, 60000);

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("\n서버 종료 신호 받음 (SIGTERM)");

  // 모든 클라이언트에게 알림
  io.emit("server-shutdown", {
    message: "서버가 점검 중입니다. 잠시 후 다시 연결해주세요.",
  });

  // 5초 후 서버 종료
  setTimeout(() => {
    server.close(() => {
      console.log("서버 종료 완료");
      process.exit(0);
    });
  }, 5000);
});

process.on("SIGINT", () => {
  console.log("\n서버 종료 신호 받음 (SIGINT)");

  io.emit("server-shutdown", {
    message: "서버가 종료됩니다.",
  });

  setTimeout(() => {
    server.close(() => {
      console.log("서버 종료 완료");
      process.exit(0);
    });
  }, 2000);
});

// 처리되지 않은 에러 캐치
process.on("uncaughtException", (error) => {
  console.error("처리되지 않은 예외:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("처리되지 않은 Promise 거부:", reason);
});
