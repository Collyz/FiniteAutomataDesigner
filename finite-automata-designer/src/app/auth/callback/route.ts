// import { NextResponse } from 'next/server'
// // The client you created from the Server-Side Auth instructions
// import { createClient } from '@/lib/supabase/server'
// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url)
//   const code = searchParams.get('code')
//   // if "next" is in param, use it as the redirect URL
//   let next = searchParams.get('next') ?? '/'
//   if (!next.startsWith('/')) {
//     // if "next" is not a relative URL, use the default
//     next = '/'
//   }
//   if (code) {
//     const supabase = await createClient()
//     const { error } = await supabase.auth.exchangeCodeForSession(code)
//     if (!error) {
//       const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
//       const isLocalEnv = process.env.NODE_ENV === 'development'
//       if (isLocalEnv) {
//         // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
//         return NextResponse.redirect(`${origin}${next}`)
//       } else if (forwardedHost) {
//         return NextResponse.redirect(`https://${forwardedHost}${next}`)
//       } else {
//         return NextResponse.redirect(`${origin}${next}`)
//       }
//     }
//   }
//   // return the user to an error page with instructions
//   return NextResponse.redirect(`${origin}/auth/auth-code-error`)
// }

// https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501 

// import { NextResponse } from "next/server";
// import {createClient} from "@/lib/supabase/server";

// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url);

//   // Extract auth code and optional redirect path
//   const code = searchParams.get("code");
//   const next = searchParams.get("next") ?? "/";

//   if (code) {
//     const supabase = await createClient();

//     // Exchange the auth code for a session
//     const { error } = await supabase.auth.exchangeCodeForSession(code);

//     if (!error) {
//       // Redirect to the intended path or fallback to homepage
//       return NextResponse.redirect(`${origin}${next}`);
//     }
//   }

//   // Redirect to error page if code is missing or exchange fails
//   return NextResponse.redirect(`${origin}/auth/auth-code-error`);
// }

// Note from 1/2/2026: I am not sure if the comments above are safe to remove yet.
// They may come in handy for debugging later. So for now, I'm just leaving them here.

import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient()

    // NOTE: gonna be honest, I have no idea what the code below is for. It's from
    // the summer when I was still implementing Supabase for the first time.
    // I'm writing this on 11/29/2025 and I have no idea what this code was for.
    // I'm not sure if it's needed or not, but I'm not going to remove it for now,
    // so I'm just gonna comment it out for now.

    // const { data: {user}} = await supabase.auth.getUser()

    // if(user){
    //   const { data: existingUser } = await supabase
    //   .from('auth.users')
    //   .select('id')
    //   .eq('email', user.email)
    //   .single()
    //   if(existingUser){
        
    //   }
    // }

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}