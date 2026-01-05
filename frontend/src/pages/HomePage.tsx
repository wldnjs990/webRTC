import HomeHeader from "@/features/home/HomeHeader"
import RoomList from "@/features/home/RoomList"

export default function HomePage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <HomeHeader />
      <RoomList />
    </main>
  )
}
