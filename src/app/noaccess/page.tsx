"use client";

/* ----- Login page ----- */

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
export default function Noaccess() {
    const { logout } = useAuth();
    const router = useRouter();
 const handleLogout = async () => {
    await logout();
    router.push("/");
  };
  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-80">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
              You Have No Access To The Web Application!
        </h2>
        <div className="text-center">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md mt-4"
                >
                    Back
                </button>
              </div>
      </div>
    </div>
  );
}
