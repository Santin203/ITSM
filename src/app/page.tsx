"use client";

/* ----- Login page ----- */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, user, logout } = useAuth();

  // Initialize router
  const router = useRouter(); // --> to be able to redirect to forgot password if needed

  // State for validation (added for handling wrong credentials)
  const [valid, setValid] = useState(true);
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      setValid(true); // Reset validation on success
    } catch (error: any) {
      //console.error("Login failed:", error.message); //doing it like this creates an error pop-up
      console.log("Login failed:", error.message)
      setValid(false);
      
      // Handle Firebase-specific error codes if needed
      //if (error.code !== "auth/invalid-credential") {
      //  alert("An unexpected error occurred. Please try again.");
      //}
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-80">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          ITSM Login
        </h2>

        {user ? (
          <div className="text-center">
            <p className="text-green-500">Logged in as {user?.email}</p>
            <button
              onClick={logout}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md mt-4"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              {/* Email Box */}
              <div className="mb-5">
                <label htmlFor="email" className="block mb-2 text-gray-700 font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email" //makes browser check for @
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full border ${valid ? "border-gray-300" : "border-red-500"} px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black`}
                  required
                />
              </div>

              {/* Password Box */}
              <div className="mb-7">
                <label htmlFor="password" className="block mb-2 text-gray-700 font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full border ${valid ? "border-gray-300" : "border-red-500"} px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black`}
                  required
                />
              </div>

              {/* Error Message */}
              {!valid && (
                <span className="text-sm text-red-500 block mb-3">
                  Invalid email or password
                </span>
              )}

              {/* Forgot Password Hyperlink */}
              <div className="mb-5 text-right">
                <button
                  type="button" // prevents form submission
                  onClick={() => router.push("/forgotpassword")} // redirect to forgotpassword page
                  className="text-blue-500 text-sm hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
              >
                Login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
