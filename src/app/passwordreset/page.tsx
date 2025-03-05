"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [match, setMatch] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (password.trim() === "" || confirmPassword.trim() === "") {
      setMatch(false);
      return;
    }
    if (password !== confirmPassword) {
      setMatch(false);
      return;
    }
    setMatch(true);
    setTimeout(() => router.push("/"), 1000); // Redirect to login page after 1 second
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-80">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          Reset Password
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="password" className="block mb-2 text-gray-700 font-medium">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className={`w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 text-black ${submitted && !match ? "border-red-500" : submitted && match ? "border-green-500" : "border-gray-300"}`}
              required
              onPaste={(e) => e.preventDefault()} // Disable paste
            />
          </div>
          <div className="mb-5">
            <label htmlFor="confirm-password" className="block mb-2 text-gray-700 font-medium">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={`w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 text-black ${submitted && !match ? "border-red-500" : submitted && match ? "border-green-500" : "border-gray-300"}`}
              required
              onPaste={(e) => e.preventDefault()} // Disable paste
            />
            {submitted && !match && <span className="text-sm text-red-500">Passwords do not match</span>}
            {submitted && match && <span className="text-sm text-green-500">Password has been successfully updated</span>}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}