"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrUserData } from '../../hooks/db';
import { auth } from '../../firebaseConfig';
import { createCookie } from "../../hooks/cookies";
import { sendEmail } from "@/hooks/emails";

export default function Login() {
  const [deliveryMethod, setDeliveryMethod] = useState("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [otpInvalid, setOtpInvalid] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const userEmail = auth.currentUser?.email
    if (userEmail) {
      setEmail(userEmail);
    }

    if (typeof window !== "undefined" && window.location.search.includes("oobCode")) {
      const params = new URLSearchParams(window.location.search);
      const otpLink = window.location.href;
      handleVerifyOtp(otpLink, params.get("email"));
    }

    const fetch = async (): Promise<void> => {    
      const data = await getCurrUserData();
      if(data)
      {
          setIsAdmin(data["rol"] == "admin");
      }
    }
    fetch();
  });

  const handleSendOtp = async () => {
    if (!email) {
      setOtpError(true);
      return;
    }
    setOtpError(false);

    // Sending the OTP to the backend (this will trigger your Redis-backed OTP generation)
    const response = await sendOtpEmail(email);
    console.log(response);
    if (response.success) {
      setOtpSent(true);
      // Store email in localStorage for later verification
      // localStorage.setItem("emailForMFA", email);
    } else {
      setOtpError(true);
    }
  };

  interface OtpResponse {
    success: boolean;
    message: string;
  }

  const handleVerifyOtp = async (otp: string, email: string | null) => {
    if (!email) {
      setOtpError(true);
      return;
    }
    setOtpError(false)
    const response = await verifyOtpEmail(email, otp);
    console.log(response);
    if (response && response.message === "OTP verified successfully") {
      await createCookie("mfaed", "true");
      await sendEmail(email, "Login Successful", "Login successful! Welcome to ITSM!");
      if(isAdmin)
      {
        router.push("/admin");
      }
      else
      {
        router.push("/user");
      }
      
    } else {
      setOtpInvalid(true);
    }
  };

  // Function to call the backend API to send the OTP
  const sendOtpEmail = async (email: string): Promise<OtpResponse> => {
    try {
      const res = await fetch("/api/generateOTP", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      console.log("res: " ,res);
      const data = await res.json();
      
      return data;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return { success: false, message: "Error sending OTP" };
    }
  };

  // Function to verify OTP by calling the backend API
  const verifyOtpEmail = async (email: string, otp: string): Promise<OtpResponse> => {
    try {
      const res = await fetch("/api/verifyOTP", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return { success: false, message: "Error verifying OTP" };
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-300">
      <div className="bg-white p-10 rounded-lg shadow-xl w-96">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">
          MFA Verification
        </h2>

        {!otpSent ? (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Delivery Method</label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-700">
                  <input
                  type="radio"
                  value="email"
                  checked={deliveryMethod === "email"}
                  onChange={() => setDeliveryMethod("email")}
                  className="mr-2"
                  />
                  Email: {email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => {
                  return gp2 + "*".repeat(gp3.length);
                  })}
                </label>
              </div>
            </div>


            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
            >
              Send Verification Code
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mt-2">
              Check your email for the OTP link.
            </p>
            <div className="mt-4">
              <label className="block text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={`w-full p-2 border rounded-lg text-gray-700 ${otpInvalid ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {otpInvalid && (
              <p className="text-red-500 text-sm mt-2">Invalid OTP. Please try again.</p>
            )}
            <button
              type="button"
              onClick={() => handleVerifyOtp(otp, email)}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md mt-4"
            >
              Verify OTP
            </button>
          </>
        )}

        {otpError && (
          <p className="text-red-500 text-sm mt-2">Error sending OTP. Please try again.</p>
        )}

      </div>
    </div>
  );
}
