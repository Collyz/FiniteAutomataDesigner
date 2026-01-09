"use client";
import { signinWithGoogle } from "@/lib/actions";
import React from "react";

const GoogleOAuthForm = () => {
  return (
    <form className="flex justify-center">
      <button
        type="submit"
        formAction={signinWithGoogle}
        className="
          flex items-center gap-3
          px-6 py-3
          bg-white text-gray-700
          border border-gray-300
          rounded-lg
          shadow-sm
          hover:shadow-md hover:bg-gray-50
          transition
        "
      >
        {/* Google Logo */}
        <img
          src="/google.svg"
          alt="Google logo"
          className="w-5 h-5"
        />

        <span className="text-sm font-medium">
          Sign in with Google
        </span>
      </button>
    </form>
  );
};

export default GoogleOAuthForm;
