import NotFoundPage from "@/pages/NotFoundPage";
import { privateRoutes } from "@/router/privateRoutes";
import { publicRoutes } from "@/router/publicRoutes";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  ...publicRoutes,
  ...privateRoutes,
  { path: '*', element: <NotFoundPage /> }
])