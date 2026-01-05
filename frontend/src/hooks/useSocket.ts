import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

// ===== 싱글톤 패턴: 모듈 레벨 변수 =====
// 앱 전체에서 단 하나의 소켓 인스턴스만 생성 및 공유
let socketInstance: Socket | null = null
let connectionCount = 0  // 현재 소켓을 사용 중인 컴포넌트/훅 개수

const useSocket = () => {
  // 각 컴포넌트의 ref (모두 같은 socketInstance를 가리킴)
  const socket = useRef<Socket | null>(null)
  // UI 상태 변경용 트리거 (컴포넌트마다 독립적)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // ===== 싱글톤: 소켓이 없을 때만 생성 =====
    if (!socketInstance) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      console.log('🔌 새 소켓 인스턴스 생성:', API_URL)
      socketInstance = io(API_URL, {
        // 재연결 설정
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      // 전역 이벤트 리스너 (한 번만 등록)
      socketInstance.on('connect', () => {
        console.log('✅ 소켓 연결 완료:', socketInstance?.id)
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ 소켓 연결 해제:', reason)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('⚠️ 소켓 연결 실패:', error.message)
      })
    }

    // 현재 컴포넌트의 ref에 싱글톤 인스턴스 할당
    socket.current = socketInstance
    connectionCount++
    console.log(`📊 소켓 사용 중인 컴포넌트: ${connectionCount}개`)

    // 연결 상태 동기화 (컴포넌트별 독립 상태)
    setIsConnected(socketInstance.connected)

    // 컴포넌트별 이벤트 리스너 (상태 동기화용)
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)

    // ===== 클린업 =====
    return () => {
      connectionCount--
      console.log(`📊 소켓 사용 중인 컴포넌트: ${connectionCount}개`)

      // 컴포넌트별 이벤트 리스너 제거
      socketInstance?.off('connect', handleConnect)
      socketInstance?.off('disconnect', handleDisconnect)

      // ===== 싱글톤: 모든 컴포넌트가 언마운트되면 소켓 종료 =====
      if (connectionCount === 0 && socketInstance) {
        console.log('🔌 소켓 완전 종료 (모든 컴포넌트 언마운트)')
        socketInstance.close()
        socketInstance = null
      }

      socket.current = null
    }
  }, [])

  return { socket, isConnected }
}

export default useSocket