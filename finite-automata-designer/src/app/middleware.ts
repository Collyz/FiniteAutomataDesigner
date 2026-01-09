import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
 
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
 
// This defines which routes will be able to access the DB
export const config = {
  matcher: ["/profile", "/login"],
}