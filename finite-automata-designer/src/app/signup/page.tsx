import GoogleOAuthForm from "../components/forms/GoogleOAuth";
import SignUpForm from "../components/forms/SignUpForm";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-blue-100 flex flex-col">
      {/* Page title */}
      <h1 className="relative text-4xl font-bold text-center mt-8 text-black">
        <span className="relative z-10 drop-shadow-[0_0_1px_rgba(0,0,0,0.7)]">
          Sign Up
        </span>
        <span className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/30 via-white/10 to-transparent opacity-20 rounded pointer-events-none"></span>
      </h1>

      {/* Centered form */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-8 w-full max-w-md">
          <SignUpForm />

          <p className="mt-3 text-center text-xs text-gray-500">
            If an account already exists for this email, you won’t receive a
            signup email. In that case, you can reset your password instead.
          </p>

          <p className="mt-2 text-center text-sm">
            <Link
              href="/reset"
              className="text-blue-600 font-medium hover:underline"
            >
              Already have an account? Reset your password
            </Link>
          </p>

          {/* Switch to login */}
          <p className="mt-4 text-center text-sm text-gray-700">
            Prefer to log in?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Log in
            </Link>
          </p>

          {/* Divider + Google button */}
          <div className="mt-6 flex flex-col items-center">
            <p className="text-gray-700 mb-3">Or continue with</p>
            <GoogleOAuthForm />
          </div>
        </div>
      </div>
    </main>
  );
}
