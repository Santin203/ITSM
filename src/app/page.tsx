"use client";

import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-80">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          ITSM Login
        </h2>
        <div className="mb-5">
          <label htmlFor="username" className="block mb-2 text-gray-700 font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
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
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
        >
          Login
        </button>
      </div>
    </div>
  );
}
