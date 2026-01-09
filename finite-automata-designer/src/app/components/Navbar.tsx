"use client";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export default function Navbar() {

  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    // Supabase auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  return (
    <nav className="w-full bg-gray-700 text-white px-8 py-4 flex items-center justify-between shadow">
      <div className="text-2xl font-bold tracking-wide">
        <Link href="/">Finite Automata Designer</Link>
      </div>
      <div className="flex items-center space-x-4">
        {/* Note: you cannot use normal if-statements inside the return method lol, so use conditional operator */}
        {user ? (
          <>
            <span className="hidden sm:inline">{user.email}</span>
            <Link
              href="/profile"
              className="px-5 py-2 bg-blue-500 hover:bg-blue-700 rounded transition"
            >
              Profile
            </Link>

            {/* Proper logout with UI refresh and redirect */}
            <button
              className="px-5 py-2 bg-red-500 hover:bg-red-700 rounded transition"
              onClick={async () => {
                await supabase.auth.signOut();
                router.refresh(); // Forces UI update
                router.push('/login'); // Redirect to login page
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="px-5 py-2 bg-blue-500 hover:bg-blue-700 rounded transition"
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}
