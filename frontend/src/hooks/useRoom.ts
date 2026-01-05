import useSocket from "@/hooks/useSocket"
import { useEffect, useState } from "react"

// 타입 정의
interface CreateRoomResponse {
  success: boolean
  roomId?: string
  error?: string
}

interface JoinRoomResponse {
  success: boolean
  roomId?: string
  existingUsers?: string[]
  error?: string
}

interface UserJoinedData {
  userId: string
  timestamp: string
}

interface UserLeftData {
  userId: string
  timestamp: string
}

interface RoomClosedData {
  reason: string
  message: string
  timestamp: string
}

const useRoom = () => {
  // 소켓 클라이언트 생성
  const { socket, isConnected } = useSocket()

  const [roomId, setRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [existingUsers, setExistingUsers] = useState<string[]>([])
  const [newUser, setNewUser] = useState<string | null>(null)

  // 방 생성 함수
  const createRoom = (newRoomId: string) => {
    // 연결 상태 확인
    if (!socket.current || !isConnected) {
      setError('소켓이 연결되지 않았습니다')
      return
    }

    // 이미 방에 있는지 확인
    if (roomId) {
      setError('이미 방에 참여 중입니다')
      return
    }

    setIsLoading(true)
    setError(null)

    // 방 생성 (생성과 동시에 자동 입장됨)
    socket.current.emit('create-room', newRoomId, (res: CreateRoomResponse) => {
      setIsLoading(false)

      if (res.success && res.roomId) {
        setRoomId(res.roomId)
        console.log(`✅ 방 생성 성공: ${res.roomId}`)
      } else {
        setError(res.error || '방 생성에 실패했습니다')
        console.error('❌ 방 생성 실패:', res.error)
      }
    })
  }

  // 방 참여 함수
  const joinRoom = (targetRoomId: string) => {
    // 연결 상태 확인
    if (!socket.current || !isConnected) {
      setError('소켓이 연결되지 않았습니다')
      return
    }

    // 이미 방에 있는지 확인
    if (roomId) {
      setError('이미 방에 참여 중입니다')
      return
    }

    setIsLoading(true)
    setError(null)

    // 방 참여
    socket.current.emit('join-room', targetRoomId, (res: JoinRoomResponse) => {
      setIsLoading(false)

      if (res.success && res.roomId) {
        setRoomId(res.roomId)
        console.log(`✅ 방 참여 성공: ${res.roomId}`)
        console.log(`기존 참여자: ${res.existingUsers?.length || 0}명`)
        // 기존 참여자 목록 저장 (이들에게 offer를 보내야 함)
        if (res.existingUsers && res.existingUsers.length > 0) {
          setExistingUsers(res.existingUsers)
        }
      } else {
        setError(res.error || '방 참여에 실패했습니다')
        console.error('❌ 방 참여 실패:', res.error)
      }
    })
  }

  // 방 나가기 함수
  const leaveRoom = () => {
    if (!socket.current || !roomId) return

    socket.current.emit('leave-room')
    setRoomId(null)
    setError(null)
    setExistingUsers([])
    console.log('✅ 방 퇴장')
  }

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!socket.current) return

    // 새로운 사용자 입장
    const handleUserJoined = (data: UserJoinedData) => {
      console.log(`👥 새 사용자 입장: ${data.userId}`)
      setNewUser(data.userId)
    }

    // 사용자 퇴장
    const handleUserLeft = (data: UserLeftData) => {
      console.log(`👋 사용자 퇴장: ${data.userId}`)
      // 상태에서 제거하는 로직은 useWebRTC에서 처리됨
    }

    // ⭐ 방장 퇴장으로 인한 방 강제 종료
    const handleRoomClosed = (data: RoomClosedData) => {
      console.log(`🚪 방 종료: ${data.message}`)
      alert(data.message)

      // 방 상태 초기화
      setRoomId(null)
      setError(null)
      setExistingUsers([])
      setNewUser(null)

      // 홈페이지로 리다이렉션
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }

    socket.current.on('user-joined', handleUserJoined)
    socket.current.on('user-left', handleUserLeft)
    socket.current.on('room-closed', handleRoomClosed)

    return () => {
      socket.current?.off('user-joined', handleUserJoined)
      socket.current?.off('user-left', handleUserLeft)
      socket.current?.off('room-closed', handleRoomClosed)
    }
  }, [socket])

  return {
    // 상태
    roomId,
    error,
    isLoading,
    isConnected,
    existingUsers,  // 방 입장 시 기존 참여자 목록
    newUser,        // 새로 입장한 사용자 ID

    // 액션
    createRoom,
    joinRoom,
    leaveRoom,
  }
}

export default useRoom