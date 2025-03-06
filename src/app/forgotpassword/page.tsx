"use client";


import { useRouter } from "next/navigation";
import { useState } from "react";
import { getEmails, sendResetEmail, sleep } from "../../hooks/db";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [valid, setValid] = useState(true);
  const emails = getEmails();
  // console.log(emails);

  
  // If email is registered:
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // console.log(email);
    // console.log(valid);

    // Check if the email is registered
    if ((await emails).includes(email)) /*correct format and email is registered */ 
    {
      // send reset link via email and redirect back to login page
      setValid(true);
      sendResetEmail(email);
      alert("Reset link sent to the email: " + email);
      await sleep(1000);
      router.back();
    } 
    else 
    {
      // incorrect email or email format 
      setValid(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-80">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit}>
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
              className={"w-full border " + (valid ? "border-grey-300" : "border-red-500") + " px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"}
              required
            />
            <span className={"text-sm text-red-500 " +(valid ? "hidden":"")}> invalid email </span>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}
