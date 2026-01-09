"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
      } else {
        setUser(user);
      }

      setLoading(false);
    }

    loadUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-blue-100 py-8 flex justify-center">
      <div className="w-full max-w-3xl px-4 space-y-6">

        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Account Info */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
          <div className="flex items-center space-x-4 mb-6">
            {user?.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile picture"
                className="w-20 h-20 rounded-full border-4 border-gray-200"
              />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {user?.user_metadata?.name || "User"}
              </h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <h2
            className="text-xl font-semibold text-gray-800 mb-4 flex justify-between items-center cursor-pointer select-none"
            onClick={() => setPasswordSectionOpen(!passwordSectionOpen)}
          >
            Change Password
            <span className={`transition-transform ${passwordSectionOpen ? "rotate-180" : ""}`}>▼</span>
          </h2>

          {passwordSectionOpen && (
            <div className="mt-2">
              <p className="text-gray-600 mb-4">
                You’ll be redirected to a secure page to update your password.
              </p>

              <Link
                href="/reset/update-password"
                className="inline-block px-6 py-3 bg-gray-600 text-white rounded
                          hover:bg-black hover:shadow-lg hover:scale-105
                          transition-transform duration-300"
              >
                Go to Update Password
              </Link>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
