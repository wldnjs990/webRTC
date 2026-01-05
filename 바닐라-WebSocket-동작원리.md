# 바닐라 WebSocket 동작 원리 상세 가이드

## 핵심 개념: WebSocket은 1:1 통신!

**중요**: WebSocket은 기본적으로 **모든 유저에게 데이터를 뿌리지 않습니다!**

---

## 기본 동작 방식

### 서버 측 구조

```javascript
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 3000 })

// 클라이언트가 연결되면
wss.on('connection', (ws) => {
  // ws = 이 특정 클라이언트와의 1:1 연결

  console.log('새 연결')

  ws.on('message', (message) => {
    console.log('받음:', message)

    // 이 클라이언트에게만 응답
    ws.send('Echo: ' + message)
  })
})
```

### 시각화: 3명 연결 시

```
서버 메모리 구조:

wss.clients = Set {
  ws_A,  ← A와의 연결
  ws_B,  ← B와의 연결
  ws_C   ← C와의 연결
}

각 웹소켓은 독립적!
```

### A가 메시지 전송 시

```
[A 클라이언트]
  ws.send("Hello")
      ↓
  [네트워크]
      ↓
[서버]
  ws_A.on('message', (msg) => {
    console.log(msg)  // "Hello"

    // ✅ A에게만 응답
    ws_A.send("Got it")
  })
      ↓
  [네트워크]
      ↓
[A 클라이언트]
  받음: "Got it"

[B 클라이언트]
  ❌ 아무것도 받지 않음

[C 클라이언트]
  ❌ 아무것도 받지 않음
```

**결론**: 기본적으로 격리되어 있음! (트래픽 낭비 없음)

---

## 직접 구현해야 하는 것들

### 1. 브로드캐스트 (모든 유저에게 전송)

```javascript
// ==========================================
// 목표: A가 보낸 메시지를 모두에게 전송
// ==========================================

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // 직접 구현: 모든 클라이언트에게 전송
    wss.clients.forEach(client => {
      // 연결된 상태인지 확인
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })
})
```

#### 동작

```
[A] send("Hi")
    ↓
[서버]
    forEach(ws_A, ws_B, ws_C)
    ↓         ↓         ↓
   [A]       [B]       [C]
  "Hi"      "Hi"      "Hi"

✅ 모두 받음 (A 자신도 받음!)
```

### 2. 본인 제외 브로드캐스트

```javascript
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // 직접 구현: 보낸 사람 제외하고 전송
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })
})
```

#### 동작

```
[A] send("Hi")
    ↓
[서버]
    forEach(ws_A, ws_B, ws_C)
      ✗       ↓         ↓
            [B]       [C]
           "Hi"      "Hi"

✅ B, C만 받음 (A 제외)
```

### 3. 방(Room) 시스템

```javascript
// ==========================================
// 직접 구현: 방 관리
// ==========================================

const rooms = new Map()  // roomId → Set<ws>

wss.on('connection', (ws) => {
  // 방 입장
  ws.on('message', (message) => {
    const data = JSON.parse(message)

    if (data.type === 'join-room') {
      const { roomId } = data

      // 방이 없으면 생성
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set())
      }

      // 방에 추가
      rooms.get(roomId).add(ws)
      ws.currentRoom = roomId  // 나중을 위해 저장

      ws.send(JSON.stringify({
        type: 'joined',
        roomId
      }))
    }

    // 방에 메시지 전송
    if (data.type === 'chat') {
      const { roomId, message } = data
      const room = rooms.get(roomId)

      if (room) {
        // 같은 방 사람들에게만 전송
        room.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'chat',
              message: message
            }))
          }
        })
      }
    }
  })

  // 연결 해제 시 방에서 제거
  ws.on('close', () => {
    if (ws.currentRoom) {
      const room = rooms.get(ws.currentRoom)
      if (room) {
        room.delete(ws)
        if (room.size === 0) {
          rooms.delete(ws.currentRoom)
        }
      }
    }
  })
})
```

#### 동작

```
메모리 구조:

rooms = Map {
  'room1' → Set { ws_A, ws_B },
  'room2' → Set { ws_C }
}

[A] (room1) send({ type: 'chat', message: 'Hi' })
    ↓
[서버]
    room1.forEach(ws_A, ws_B)
      ✗       ↓
            [B]  "Hi"

[C] (room2)
    ❌ 받지 않음 (다른 방)

✅ 같은 방 사람들에게만 전송!
트래픽 낭비 없음!
```

### 4. 이벤트 기반 시스템

```javascript
// ==========================================
// 직접 구현: 이벤트 라우팅
// ==========================================

wss.on('connection', (ws) => {
  ws.on('message', (rawMessage) => {
    // 1. 파싱 (직접)
    let data
    try {
      data = JSON.parse(rawMessage)
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    // 2. type으로 분기 (직접)
    switch(data.type) {
      case 'join-room':
        handleJoinRoom(ws, data)
        break

      case 'leave-room':
        handleLeaveRoom(ws, data)
        break

      case 'chat':
        handleChat(ws, data)
        break

      case 'offer':
        handleOffer(ws, data)
        break

      case 'answer':
        handleAnswer(ws, data)
        break

      default:
        ws.send(JSON.stringify({
          error: 'Unknown message type'
        }))
    }
  })
})

function handleJoinRoom(ws, data) {
  // 처리 로직
}

function handleChat(ws, data) {
  // 처리 로직
}

// ... 나머지 핸들러들
```

### 5. 콜백 시스템

```javascript
// ==========================================
// 직접 구현: 요청-응답 패턴
// ==========================================

// 서버
wss.on('connection', (ws) => {
  ws.on('message', (rawMessage) => {
    const data = JSON.parse(rawMessage)

    if (data.type === 'join-room') {
      const { roomId, messageId } = data

      // 처리...
      const success = joinRoom(ws, roomId)

      // 응답 전송 (같은 messageId 포함)
      ws.send(JSON.stringify({
        type: 'callback',
        messageId: messageId,  // ← 요청의 ID
        data: { success }
      }))
    }
  })
})

// 클라이언트
const callbacks = new Map()
let messageIdCounter = 0

function emit(type, data, callback) {
  const messageId = messageIdCounter++

  // 콜백 등록
  callbacks.set(messageId, callback)

  // 전송
  ws.send(JSON.stringify({
    type: type,
    messageId: messageId,
    ...data
  }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)

  if (data.type === 'callback') {
    // 콜백 찾기
    const callback = callbacks.get(data.messageId)
    if (callback) {
      callback(data.data)
      callbacks.delete(data.messageId)
    }
  }
}

// 사용
emit('join-room', { roomId: 'room1' }, (response) => {
  console.log('응답:', response)  // { success: true }
})
```

---

## 트래픽 분석

### 시나리오: 100명 중 방이 여러 개

```
사용자 100명

room1: A, B, C (3명)
room2: D, E (2명)
room3: F, G, H, I (4명)
... (나머지)
```

### ❌ 잘못된 구현 (모두에게 전송)

```javascript
ws.on('message', (message) => {
  // 모든 클라이언트에게 전송
  wss.clients.forEach(client => {
    client.send(message)
  })
})
```

**트래픽**:
```
A가 메시지 1개 전송 (1KB)
  ↓
100명에게 전송
  ↓
총 트래픽: 100KB

100명이 각각 10개씩 전송
  ↓
총 트래픽: 100KB × 10 × 100 = 100MB
❌ 엄청난 낭비!
```

### ✅ 올바른 구현 (방 시스템)

```javascript
ws.on('message', (rawMessage) => {
  const data = JSON.parse(rawMessage)

  if (data.type === 'chat') {
    const { roomId, message } = data
    const room = rooms.get(roomId)

    // 같은 방 사람들에게만 전송
    if (room) {
      room.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data))
        }
      })
    }
  }
})
```

**트래픽**:
```
A (room1)가 메시지 1개 전송 (1KB)
  ↓
room1의 2명(B, C)에게만 전송
  ↓
총 트래픽: 2KB

room1 3명이 각각 10개씩 전송
  ↓
총 트래픽: 2KB × 10 × 3 = 60KB
✅ 효율적!
```

---

## 바닐라 WebSocket의 범위 정리

### ✅ 제공되는 것 (ws 라이브러리 기준)

1. **WebSocket 서버 생성**
```javascript
const wss = new WebSocket.Server({ port: 3000 })
```

2. **연결 관리**
```javascript
wss.on('connection', (ws) => {})
```

3. **1:1 메시지 송수신**
```javascript
ws.send(data)
ws.on('message', (data) => {})
```

4. **연결된 클라이언트 목록**
```javascript
wss.clients  // Set
```

5. **연결 상태**
```javascript
ws.readyState
```

6. **이벤트 리스너**
```javascript
ws.on('open', () => {})
ws.on('message', (data) => {})
ws.on('close', () => {})
ws.on('error', (error) => {})
```

### ❌ 제공되지 않는 것 (직접 구현 필요)

1. **방(Room) 시스템**
   - 코드량: ~50줄
   - `Map<roomId, Set<ws>>` 직접 관리

2. **브로드캐스트**
   - 코드량: ~10줄
   - `forEach` 직접 구현

3. **이벤트 기반 시스템**
   - 코드량: ~100줄
   - `type` 필드로 분기, 핸들러 매핑

4. **콜백**
   - 코드량: ~150줄
   - `messageId` 생성, `Map` 관리

5. **자동 재연결**
   - 코드량: ~100줄
   - exponential backoff 로직

6. **Heartbeat/Ping-Pong**
   - 코드량: ~50줄
   - 타이머로 주기적 체크

7. **JSON 자동 파싱**
   - 코드량: 모든 곳에 추가
   - `JSON.parse` / `JSON.stringify`

8. **에러 처리**
   - 코드량: ~80줄
   - try-catch everywhere

**총합**: ~600-800줄

---

## Socket.IO vs 바닐라 WebSocket

### 제공 기능 비교표

| 기능 | 바닐라 WebSocket | Socket.IO |
|------|-----------------|-----------|
| 1:1 통신 | ✅ 제공 | ✅ 제공 |
| 브로드캐스트 | ❌ 직접 구현 (~10줄) | ✅ `socket.broadcast.emit()` |
| 방 시스템 | ❌ 직접 구현 (~50줄) | ✅ `socket.join()` |
| 이벤트 | ❌ 직접 구현 (~100줄) | ✅ `socket.on('event')` |
| 콜백 | ❌ 직접 구현 (~150줄) | ✅ `emit('event', data, callback)` |
| 재연결 | ❌ 직접 구현 (~100줄) | ✅ 자동 |
| JSON 파싱 | ❌ 직접 작성 | ✅ 자동 |

### 코드 비교: 같은 방 사람들에게 메시지 전송

#### 바닐라 WebSocket

```javascript
// 80줄+
const rooms = new Map()

wss.on('connection', (ws) => {
  ws.on('message', (rawMessage) => {
    let data
    try {
      data = JSON.parse(rawMessage)
    } catch (error) {
      return
    }

    if (data.type === 'chat') {
      const { roomId, message } = data
      const room = rooms.get(roomId)

      if (room) {
        room.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'chat',
              message: message
            }))
          }
        })
      }
    }
  })
})
```

#### Socket.IO

```javascript
// 3줄
socket.on('chat', ({ roomId, message }) => {
  socket.to(roomId).emit('chat', { message })
})
```

---

## 정리

### Q1: "바닐라 WebSocket은 모든 유저에게 데이터를 뿌린다?"

**답**: ❌ **아닙니다!**

- 기본적으로 **1:1 통신**만 제공
- 브로드캐스트는 **직접 구현** 필요
- 트래픽 낭비 없음 (올바르게 구현하면)

### Q2: "특정 유저에게만 보내려면?"

**답**: ✅ **가능합니다!** (직접 구현)

```javascript
// 방법 1: 특정 ws에게만 전송
ws_A.send(data)  // A에게만

// 방법 2: 방 시스템 구현
const room = rooms.get('room1')
room.forEach(ws => ws.send(data))  // room1 사람들에게만
```

### Q3: "바닐라 WebSocket이 제공하는 것은?"

**답**:
- ✅ 1:1 양방향 통신
- ✅ 연결 관리
- ✅ 클라이언트 목록
- ❌ 방 시스템 (직접 구현)
- ❌ 브로드캐스트 (직접 구현)
- ❌ 이벤트 (직접 구현)
- ❌ 콜백 (직접 구현)

### Q4: "트래픽 걱정은?"

**답**: ✅ **괜찮습니다!**

방 시스템을 올바르게 구현하면:
- 같은 방 사람들에게만 전송
- 불필요한 트래픽 없음
- Socket.IO와 동일한 효율

차이점:
- Socket.IO: 자동 제공
- 바닐라: 직접 구현 (~50줄)

---

**결론**:

바닐라 WebSocket은:
- **1:1 통신**을 제공하는 저수준 API
- **모든 유저에게 뿌리지 않음** (기본 격리)
- 방 시스템 등은 **직접 구현** 필요
- 올바르게 구현하면 **트래픽 효율 동일**
- 하지만 **코드량 2-3배** 증가

Socket.IO는:
- 위의 모든 기능을 **자동 제공**
- **개발 속도 3-4배** 빠름
- 검증된 구현으로 **버그 적음**
