import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Room {
  id: string
  name: string | null
  userCount: number
  createdAt: string
}

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  // 방 목록 조회
  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/rooms`)

      if (!response.ok) {
        throw new Error('방 목록을 가져올 수 없습니다')
      }

      const data = await response.json()
      setRooms(data.rooms || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      console.error('방 목록 조회 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 방 목록 조회
  useEffect(() => {
    fetchRooms()

    // 10초마다 자동 새로고침
    const interval = setInterval(fetchRooms, 10000)

    return () => clearInterval(interval)
  }, [])

  // 방 입장
  const handleJoinRoom = (roomId: string) => {
    navigate(`/video-chat?room=${roomId}&mode=join`)
  }

  if (isLoading && rooms.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px'
      }}>
        <p>방 목록을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#ffebee',
        borderRadius: '10px',
        color: '#c62828'
      }}>
        <p>⚠️ {error}</p>
        <button
          onClick={fetchRooms}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#c62828',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>활성 방 목록 ({rooms.length})</h2>
        <button
          onClick={fetchRooms}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '새로고침 중...' : '🔄 새로고침'}
        </button>
      </div>

      {rooms.length === 0 ? (
        <div style={{
          padding: '60px 40px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '10px'
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🏠</p>
          <h3 style={{ margin: '0 0 10px 0' }}>활성 방이 없습니다</h3>
          <p style={{ color: '#666', margin: 0 }}>
            새로운 방을 만들어보세요!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2196F3'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onClick={() => handleJoinRoom(room.id)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  wordBreak: 'break-all'
                }}>
                  {room.name || room.id}
                </h3>
                <span style={{
                  backgroundColor: room.userCount > 0 ? '#4CAF50' : '#9E9E9E',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  marginLeft: '10px'
                }}>
                  👥 {room.userCount}
                </span>
              </div>

              <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '15px'
              }}>
                생성: {new Date(room.createdAt).toLocaleString('ko-KR')}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleJoinRoom(room.id)
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976D2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2196F3'
                }}
              >
                입장하기 →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
