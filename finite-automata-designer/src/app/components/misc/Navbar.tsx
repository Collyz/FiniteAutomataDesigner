"use client";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { clearAllEditorSessions } from "@/lib/editorSession";

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
      (event, session) => {
        setUser(session?.user ?? null);

        // Wipe any "resume last project" state so the next person to sign
        // in on this tab doesn't land in the previous user's project.
        // Handles sign-out from any source (this button, another tab,
        // session expiry), not just the click below.
        if (event === "SIGNED_OUT") {
          clearAllEditorSessions();
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  return (
    <nav className="w-full bg-gray-700 text-white px-8 py-4 flex items-center justify-between shadow">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-2xl font-bold tracking-wide">
          Finite State Machine Designer
        </Link>
        <Link
          href="https://github.com/Collyz/FiniteAutomataDesigner"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
          className="opacity-70 hover:opacity-100 transition"
        >
          <Image
            src="/github.svg"
            alt="GitHub logo"
            width={28}
            height={28}
            className="h-7 w-7"
          />
        </Link>
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
