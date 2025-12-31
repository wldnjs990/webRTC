import { router } from '@/router/router'
import '@/styles/index.css'
import { RouterProvider } from 'react-router'

export default function App() {
  return (
    <RouterProvider router={router}/>
  )
}
