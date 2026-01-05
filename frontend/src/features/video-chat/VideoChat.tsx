import useVideoChat from "@/features/video-chat/hooks/useVideoChat"
import { useEffect, useRef, useState } from "react"

export default function VideoChat() {
  const {
    // 상태
    localStream,
    remoteStreams,
    isVideoEnabled,
    isAudioEnabled,
    roomId,
    isConnected,

    // 액션
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useVideoChat()

  // 사용자(로컬) 비디오 객체
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [inputRoomId, setInputRoomId] = useState('')

  // 로컬 스트림 연결
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>WebRTC 화상채팅</h1>

      {/* 연결 상태 */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <p>소켓 연결: {isConnected ? '✅ 연결됨' : '❌ 연결 안됨'}</p>
        <p>현재 방: {roomId || '없음'}</p>
      </div>

      {/* 방 입장/생성 */}
      {!roomId && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>방 입장/생성</h3>
          <input
            type="text"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value)}
            placeholder="방 ID 입력"
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
          <button
            onClick={() => createRoom(inputRoomId)}
            disabled={!inputRoomId || !isConnected}
            style={{ padding: '8px 16px', marginRight: '10px' }}
          >
            방 생성
          </button>
          <button
            onClick={() => joinRoom(inputRoomId)}
            disabled={!inputRoomId || !isConnected}
            style={{ padding: '8px 16px' }}
          >
            방 입장
          </button>
        </div>
      )}

      {/* 방에 입장한 경우 */}
      {roomId && (
        <>
          {/* 미디어 컨트롤 */}
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>미디어 컨트롤</h3>
            {!localStream ? (
              <button onClick={() => startMedia()} style={{ padding: '10px 20px' }}>
                📹 카메라/마이크 시작
              </button>
            ) : (
              <div>
                <button
                  onClick={toggleVideo}
                  style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: isVideoEnabled ? '#4CAF50' : '#f44336', color: 'white' }}
                >
                  {isVideoEnabled ? '📹 비디오 ON' : '📹 비디오 OFF'}
                </button>
                <button
                  onClick={toggleAudio}
                  style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: isAudioEnabled ? '#4CAF50' : '#f44336', color: 'white' }}
                >
                  {isAudioEnabled ? '🎤 오디오 ON' : '🎤 오디오 OFF'}
                </button>
                <button
                  onClick={stopMedia}
                  style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white' }}
                >
                  ⏹️ 스트림 정지
                </button>
              </div>
            )}
          </div>

          {/* 방 나가기 */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={leaveRoom}
              style={{ padding: '10px 20px', backgroundColor: '#ff9800', color: 'white' }}
            >
              🚪 방 나가기
            </button>
          </div>

          {/* 비디오 그리드 */}
          <div>
            <h3>참여자 ({(remoteStreams?.size || 0) + (localStream ? 1 : 0)}명)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {/* 내 화면 */}
              {localStream && (
                <div style={{ border: '2px solid #4CAF50', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: 'auto', backgroundColor: 'black' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px'
                  }}>
                    나 (You)
                  </div>
                </div>
              )}

              {/* 상대방 화면들 */}
              {remoteStreams && Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                <RemoteVideo key={userId} userId={userId} stream={stream} />
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}

// 원격 비디오 컴포넌트
function RemoteVideo({ userId, stream }: { userId: string; stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div style={{ border: '2px solid #2196F3', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: 'auto', backgroundColor: 'black' }}
      />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        {userId.substring(0, 8)}...
      </div>
    </div>
  )
}
