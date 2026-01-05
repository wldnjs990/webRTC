import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomeHeader() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!roomId.trim()) {
      alert("방 ID를 입력해주세요");
      return;
    }
    navigate(`/video-chat?room=${roomId}&mode=create`);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert("방 ID를 입력해주세요");
      return;
    }
    navigate(`/video-chat?room=${roomId}&mode=join`);
  };

  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        WebRTC 화상채팅
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: "18px",
          marginBottom: "40px",
        }}
      >
        실시간 P2P 화상 통화 서비스
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="방 ID 입력 (예: my-room)"
          onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
          style={{
            padding: "15px 20px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "10px",
            minWidth: "300px",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#2196F3";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
          }}
        />
        <button
          onClick={handleCreateRoom}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#45a049";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4CAF50";
          }}
        >
          🏠 방 만들기
        </button>
        <button
          onClick={handleJoinRoom}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1976D2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2196F3";
          }}
        >
          🚪 방 입장
        </button>
      </div>
    </div>
  );
}
