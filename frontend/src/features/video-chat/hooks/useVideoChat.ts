import useLocalStream from "@/features/video-chat/hooks/useLocalStream"
import useWebRTC from "@/features/video-chat/hooks/useWebRTC"
import useRoom from "@/hooks/useRoom"
import { useEffect } from "react"

const useVideoChat = ()=>{
  // useLocalStream 훅 사용 => 클라이언트 미디어 통제권 가져오기(화상캠 켜기, 음소거, 화면 제어, 카메라 반전)
  const {
    // 상태
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    error : socketError,
    isLoading : isSocketLoading,

    // 액션
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    switchCamera
  } = useLocalStream()

  // useWebRTC 훅 사용 => 클라이언트 offer 전송 함수 가져오기
  const {
    // 상태
    remoteStreams,

    // 액션
    sendOffer,
  } = useWebRTC(localStream)

  // useRoom 훅 사용 => 소캣 활성화 + 방 생성 / 참여 / 퇴장 함수 가져오기
  const {
    // 상태
    roomId,
    error : roomError,
    isLoading : isRoomLoading,
    isConnected,
    existingUsers,
    newUser,

    // 액션
    createRoom,
    joinRoom,
    leaveRoom,
  } = useRoom()

  // 방 입장 시 기존 참여자들에게 offer 전송
  useEffect(() => {
    if (existingUsers.length > 0 && localStream) {
      console.log(`📤 기존 참여자 ${existingUsers.length}명에게 Offer 전송`)
      existingUsers.forEach(userId => {
        sendOffer(userId)
      })
    }
  }, [existingUsers, localStream, sendOffer])

  // 새 사용자 입장 시 offer 전송
  useEffect(() => {
    if (newUser && localStream) {
      console.log(`📤 새 참여자 ${newUser}에게 Offer 전송`)
      sendOffer(newUser)
    }
  }, [newUser, localStream, sendOffer])

  return {
    // -------------------------
    // useLocalStream
    // -------------------------

    // 상태
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    socketError,
    isSocketLoading,

    // 액션
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    switchCamera,

    // -------------------------
    // useWebRTC
    // -------------------------

    // 상태
    remoteStreams,

    // 액션
    sendOffer,

    // -------------------------
    // useRoom
    // -------------------------

    // 상태
    roomId,
    error : roomError,
    isLoading : isRoomLoading,
    isConnected,

    // 액션
    createRoom,
    joinRoom,
    leaveRoom,
  }
}

export default useVideoChat