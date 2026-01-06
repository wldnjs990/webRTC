-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_participants" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "socketId" VARCHAR(100) NOT NULL,
    "userId" VARCHAR(100),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "room_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signaling_logs" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "from" VARCHAR(100) NOT NULL,
    "to" VARCHAR(100),
    "eventType" VARCHAR(50) NOT NULL,
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signaling_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_stats" (
    "id" TEXT NOT NULL,
    "socketId" VARCHAR(100) NOT NULL,
    "roomId" VARCHAR(100),
    "connectionState" VARCHAR(50),
    "iceState" VARCHAR(50),
    "duration" INTEGER,
    "bytesReceived" BIGINT,
    "bytesSent" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rooms_createdAt_idx" ON "rooms"("createdAt");

-- CreateIndex
CREATE INDEX "room_participants_roomId_idx" ON "room_participants"("roomId");

-- CreateIndex
CREATE INDEX "room_participants_socketId_idx" ON "room_participants"("socketId");

-- CreateIndex
CREATE INDEX "room_participants_joinedAt_idx" ON "room_participants"("joinedAt");

-- CreateIndex
CREATE INDEX "signaling_logs_roomId_idx" ON "signaling_logs"("roomId");

-- CreateIndex
CREATE INDEX "signaling_logs_eventType_idx" ON "signaling_logs"("eventType");

-- CreateIndex
CREATE INDEX "signaling_logs_timestamp_idx" ON "signaling_logs"("timestamp");

-- CreateIndex
CREATE INDEX "session_stats_socketId_idx" ON "session_stats"("socketId");

-- CreateIndex
CREATE INDEX "session_stats_roomId_idx" ON "session_stats"("roomId");

-- CreateIndex
CREATE INDEX "session_stats_createdAt_idx" ON "session_stats"("createdAt");

-- AddForeignKey
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signaling_logs" ADD CONSTRAINT "signaling_logs_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
