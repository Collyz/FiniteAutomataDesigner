"use client";

import { login } from "../../login/actions"; // server actions
import { useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      // Prevent default and run server action manually to ensure session cookies are synced
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setSuccessMessage(null); // Clear previous success messages
        setIsLoading(true);
        
        const form = e.currentTarget;
        const formData = new FormData(form);
        const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-action");

        try {

            const result = await login(formData);
            
            if (result?.error) {
              // Display error and clear form
              setError(result.error);
              form.reset();
              setIsLoading(false);
              return;
            }
            
            // Success - redirect to home
            window.location.href = "/";
          
          
        } catch (err) {
          // Handle unexpected errors
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
          form.reset();
          setIsLoading(false);
        }
      }}
    >
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {/* Error message display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success message display */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      <div className="flex space-x-4 mt-4">
        <button
          type="submit"
          data-action="login"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gray-600 text-white rounded hover:bg-black hover:shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>

      </div>
    </form>
  );
}
