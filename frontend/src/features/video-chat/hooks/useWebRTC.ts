import useSocket from "@/hooks/useSocket"
import { useEffect, useRef, useState } from "react"

interface OfferData {
  offer: RTCSessionDescriptionInit
  from: string
}

interface AnswerData {
  answer: RTCSessionDescriptionInit
  from: string
}

interface IceCandidateData {
  candidate: RTCIceCandidateInit
  from: string
}

// ICE STUN 서버 설정 (모듈 레벨에서 한 번만 정의)
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

const useWebRTC = (localStream: MediaStream | null) => {
  // 각 peer마다 별도의 PeerConnection 관리 (userId -> RTCPeerConnection)
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  // 원격 스트림 데이터(나 말고 참가자들 미디어 데이터)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream> | null>(new Map())

  // 싱글톤 socket 사용
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket.current) return

    // cleanup에서 사용할 변수를 미리 캡처
    const currentSocket = socket.current
    const currentPeerConnections = peerConnections.current

    // ===== Socket 이벤트 리스너 =====

    // 1. Offer 수신 (상대방이 나에게 연결 요청)
    const handleOffer = async (data: OfferData) => {
      if (!socket.current) return

      try {
        console.log(`📥 Offer 수신 from ${data.from}`)

        // 해당 사용자를 위한 PeerConnection 생성
        const pc = new RTCPeerConnection(configuration)
        peerConnections.current.set(data.from, pc)

        // offer 전달할때 본인 localStream track(미디어 스트림 데이터) 추가
        if (localStream) {
          localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream)  // 모든 트랙 + 두 번째 인자!
          })
        }

        // 상대방 pc에 트랙이 추가도거나 변경되었을때 내 pc에서 발동하는 이벤트 
        pc.ontrack = (event) => {
          // 상대방의 스트림 데이터를 내 클라이언트 저장소에 추가
          setRemoteStreams(prev => new Map(prev).set(data.from, event.streams[0]))
        }

        // ICE Candidate 이벤트 핸들러 설정(ice 경로 탐색시 자동 실행됨)
        pc.onicecandidate = (event:RTCPeerConnectionIceEvent) => {
          // ice 이벤트 객체에 ice경로 후보(candidate)가 있고, socket이 연결되어있는지 체크
          if (event.candidate && socket.current) {
            // 서버에 ice 후보 발견했다는 이벤트 발송
            socket.current.emit('ice-candidate', {
              target: data.from,
              candidate: event.candidate
            })
          }
        }

        // 연결 상태 변경 이벤트 핸들러 설정(이것도 자동실행)
        pc.onconnectionstatechange = () => {
          console.log(`🔌 [${data.from}] 연결 상태:`, pc.connectionState)

          // 연결 종료 시 정리
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            peerConnections.current.delete(data.from)
            pc.close()
          }
        }

        // 원격 SDP 설정
        await pc.setRemoteDescription(data.offer)

        // Answer 생성 및 전송
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        socket.current.emit('answer', {
          target: data.from,
          answer
        })

        console.log(`📤 Answer 전송 to ${data.from}`)
      } catch (error) {
        console.error('❌ Offer 처리 실패:', error)
      }
    }

    // 2. Answer 수신 (내가 보낸 Offer에 대한 응답)
    const handleAnswer = async (data: AnswerData) => {
      try {
        console.log(`📥 Answer 수신 from ${data.from}`)

        const pc = peerConnections.current.get(data.from)
        if (!pc) {
          console.error(`❌ PeerConnection을 찾을 수 없음: ${data.from}`)
          return
        }

        await pc.setRemoteDescription(data.answer)
        console.log(`✅ Answer 설정 완료: ${data.from}`)
      } catch (error) {
        console.error('❌ Answer 처리 실패:', error)
      }
    }

    // 3. ICE Candidate 수신
    const handleIceCandidate = async (data: IceCandidateData) => {
      try {
        console.log(`📥 ICE Candidate 수신 from ${data.from}`)

        const pc = peerConnections.current.get(data.from)
        if (!pc) {
          console.error(`❌ PeerConnection을 찾을 수 없음: ${data.from}`)
          return
        }

        await pc.addIceCandidate(data.candidate)
      } catch (error) {
        console.error('❌ ICE Candidate 추가 실패:', error)
      }
    }

    // 4. 사용자 퇴장 처리
    const handleUserLeft = (data: { userId: string }) => {
      console.log(`👋 사용자 퇴장: ${data.userId}`)

      const pc = peerConnections.current.get(data.userId)
      if (pc) {
        pc.close()
        peerConnections.current.delete(data.userId)
      }
    }

    // 이벤트 리스너 등록
    socket.current.on('offer', handleOffer)
    socket.current.on('answer', handleAnswer)
    socket.current.on('ice-candidate', handleIceCandidate)
    socket.current.on('user-left', handleUserLeft)

    // 클린업
    return () => {
      currentSocket.off('offer', handleOffer)
      currentSocket.off('answer', handleAnswer)
      currentSocket.off('ice-candidate', handleIceCandidate)
      currentSocket.off('user-left', handleUserLeft)

      // 모든 PeerConnection 종료
      currentPeerConnections.forEach((pc) => pc.close())
      currentPeerConnections.clear()
    }
  }, [socket, localStream])


  // Offer 전송 함수 (특정 사용자에게 1:1 연결 요청)
  const sendOffer = async (targetUserId: string) => {
    if (!socket.current) {
      console.error('❌ Socket이 연결되지 않았습니다.')
      return
    }

    try {
      // 해당 사용자를 위한 새 PeerConnection 생성
      const pc = new RTCPeerConnection(configuration)
      // 해당 사용자에게 전달해줄 내 localStream 트랙 데이터(내 화면 데이터) 담아주기
      if(localStream){
       localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
        console.log(`📤 ${track.kind} 트랙 추가`)
       })
      }

      peerConnections.current.set(targetUserId, pc)

      // 상대방 pc에 트랙이 추가되거나 변경되었을때 내 pc에서 발동하는 이벤트
      pc.ontrack = (event) => {
        console.log(`📥 트랙 수신: ${event.track.kind} from ${targetUserId}`)
        // 상대방의 스트림 데이터를 내 클라이언트 저장소에 추가
        setRemoteStreams(prev => new Map(prev).set(targetUserId, event.streams[0]))
      }

      // ICE Candidate 이벤트 핸들러
      pc.onicecandidate = (event) => {
        if (event.candidate && socket.current) {
          socket.current.emit('ice-candidate', {
            target: targetUserId,
            candidate: event.candidate
          })
        }
      }

      // 연결 상태 변경 리스너
      pc.onconnectionstatechange = () => {
        console.log(`🔌 [${targetUserId}] 연결 상태:`, pc.connectionState)

        // 연결 종료 시 정리
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          peerConnections.current.delete(targetUserId)
          pc.close()
        }
      }

      // Offer 생성 (이 PC만의 고유한 offer)
      const offer = await pc.createOffer()
      // setLocalDescription : 본인의 미디어 스팩을 확정짓는 메서드
      
      await pc.setLocalDescription(offer)

      // 특정 사용자에게 1:1 전송
      socket.current.emit('offer', { target: targetUserId, offer })
      console.log(`📤 Offer 전송 to ${targetUserId}`)
    } catch (error) {
      console.error('❌ Offer 전송 실패:', error)
    }
  }

  return {
    sendOffer,
    // 상대방 스트림 데이터
    remoteStreams,
    // peerConnections는 내부에서만 관리 (외부 노출 불필요)
  }
}

export default useWebRTC