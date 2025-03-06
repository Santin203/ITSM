"use client";

/* ----- Login page ----- */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {getUsersData} from '../hooks/db.js'

export default function Login() {
  //const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, user, logout } = useAuth();

  // Initialize router
  const router = useRouter(); // --> to be able to redirect page to forgot password or appropriate main page

  // State for validation (added for handling wrong credentials)
  const [valid, setValid] = useState(true);

  // Track login progress ()
  const [loading, setLoading] = useState(false); 
  
  const handleLogin = async () => {
    /* --- Inner Function Definition --- */
    async function getCurrentUserData(username: string) {
      const usersData = await getUsersData();

      //find user with matching username (=== for strict equality)
      const currentUser = usersData.find(tempUser => tempUser.username === username);

      return currentUser// ? currentUser.email : null; //return email if found
    }

    const currentUserData = await getCurrentUserData(username); // must await because function is async
    const email = currentUserData ? currentUserData.email : null;
    const role = currentUserData ? currentUserData.rol : null;

    if (email === null) {
      setValid(false); // false on failure
    } 
    else {
      setLoading(true); // Start loading state
      try {
        await login(email, password);
        console.log("Successful login")

        // Redirect based on role
        // NOTE: this is a placeholder -> should first redirect to two-factor authentication
        if (role === "Admin") {
          router.push("/admin");
        } 
        else {
          router.push("/main");
        }
      } 
      catch (error: any) {
        console.log("Login failed:", error.message);
        setValid(false); // false on failure
        setLoading(false); // stop loading on error
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-80">
        {loading ? (
          <h2 className="text-2xl font-bold text-center text-gray-800">Logging in...</h2>
        ) : (
          <>
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                {/* Username Box */}
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
                    Invalid username or password
                  </span>
                )}
  
                {/* Forgot Password Hyperlink */}
                <div className="mb-5 text-right">
                  <button
                    type="button"
                    onClick={() => router.push("/forgotpassword")}
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
