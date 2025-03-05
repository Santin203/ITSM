"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, user, logout } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const userCredential = await login(email, password);

      if (userCredential) {
        localStorage.setItem("emailForMFA", email);
        router.push("/mfa");
      } else {
        throw new Error("User authentication failed.");
      }
    } catch (error) {
      console.error("Login failed:", error);
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
            <div className="mb-5">
              <label htmlFor="email" className="block mb-2 text-gray-700 font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                required
              />
            </div>
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
                className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
            >
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
