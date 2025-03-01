"use client";

import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-80">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          MFA
        </h2>
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
