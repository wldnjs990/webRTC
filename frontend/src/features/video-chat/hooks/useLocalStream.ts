import { useEffect, useRef, useState } from "react"

const useLocalStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 스트림 ref (cleanup용)
  const streamRef = useRef<MediaStream | null>(null)

  // 카메라/마이크 시작
  const startMedia = async (constraints?: MediaStreamConstraints) => {
    setIsLoading(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }
      )

      streamRef.current = stream
      setLocalStream(stream)
      setIsVideoEnabled(true)
      setIsAudioEnabled(true)

      console.log('📹 미디어 스트림 시작')
      console.log('비디오 트랙:', stream.getVideoTracks().length)
      console.log('오디오 트랙:', stream.getAudioTracks().length)

      return stream
    } catch (err) {
      let errorMessage = '미디어 접근 실패'

      if (err instanceof Error) {
        // 에러 타입별 메시지
        if (err.name === 'NotAllowedError') {
          errorMessage = '카메라/마이크 권한이 거부되었습니다'
        } else if (err.name === 'NotFoundError') {
          errorMessage = '카메라 또는 마이크를 찾을 수 없습니다'
        } else if (err.name === 'NotReadableError') {
          errorMessage = '카메라/마이크가 이미 사용 중입니다'
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
      console.error('❌ 미디어 시작 실패:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 카메라/마이크 정지
  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log(`🛑 ${track.kind} 트랙 정지`)
      })

      streamRef.current = null
      setLocalStream(null)
      setIsVideoEnabled(false)
      setIsAudioEnabled(false)

      console.log('🛑 미디어 스트림 정지')
    }
  }

  // 비디오 토글
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
        console.log(`📹 비디오: ${videoTrack.enabled ? 'ON' : 'OFF'}`)
      }
    }
  }

  // 오디오 토글
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
        console.log(`🎤 오디오: ${audioTrack.enabled ? 'ON' : 'OFF'}`)
      }
    }
  }

  // 카메라 전환 (전면/후면)
  const switchCamera = async () => {
    if (!localStream) return

    const videoTrack = localStream.getVideoTracks()[0]
    if (!videoTrack) return

    // 현재 카메라 방향 확인
    const settings = videoTrack.getSettings()
    const currentFacingMode = settings.facingMode || 'user'

    // 반대 방향으로 전환
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'

    try {
      // 기존 스트림 정지
      stopMedia()

      // 새 카메라로 시작
      await startMedia({
        video: { facingMode: newFacingMode },
        audio: true
      })

      console.log(`📹 카메라 전환: ${newFacingMode}`)
    } catch (err) {
      console.error('❌ 카메라 전환 실패:', err)
      setError('카메라 전환에 실패했습니다')
    }
  }

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        console.log('🧹 컴포넌트 언마운트: 미디어 스트림 정리')
      }
    }
  }, [])

  return {
    // 상태
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    error,
    isLoading,

    // 액션
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    switchCamera
  }
}

export default useLocalStream
