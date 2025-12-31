import PrivatePage from "@/pages/PrivatePage";
import type { RouteObject } from "react-router";

export const privateRoutes:RouteObject[] = [
  {
    path: '/private',
    element: <PrivatePage/>,
    loader: async ()=>{}
  }
]