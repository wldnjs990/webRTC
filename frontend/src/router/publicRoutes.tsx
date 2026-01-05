import HomePage from "@/pages/HomePage";
import VideoChatPage from "@/pages/VideoChatPage";
import type { RouteObject } from "react-router";

export const publicRoutes:RouteObject[] = [
  {
    path: '/',
    element: <HomePage/>,
    loader: async ()=>{}
  },
  {
    path: '/videoChat',
    element: <VideoChatPage/>,
    loader: async ()=>{}
  }
]