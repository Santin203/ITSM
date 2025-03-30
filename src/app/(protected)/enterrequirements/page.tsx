"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function IncidentEntryPage() {
  const router = useRouter();
  const [incidentNumber, setIncidentNumber] = useState("");

  // Generate incident number on load
  useEffect(() => {
    const generateIncidentNumber = () => {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setIncidentNumber(`INC-${randomNum}`);
    };
    generateIncidentNumber();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column"}} className="text-black">
      {/* Main Content */}
      <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center" }}>
          Major Incident Report
        </h2>

        {/* Organization Details */}
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
        >
          <tbody>
            {["Organization", "Department", "Section"].map((label, index) => (
              <tr key={index}>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "200px", // First column takes less space
                    fontWeight: "bold",
                  }}
                >
                  {label}:
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                  <input type="text" style={{ width: "100%" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Incident Ticket Number */}
        <div
          style={{
            marginTop: "20px",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          Incident Ticket No.: {incidentNumber}
        </div>

        {/* Incident Details */}
        <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>Incident Details</h3>
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}
        >
          <tbody>
            {[
              "User Details",
              "Reported By",
              "Incident Description",
              "Business Impact",
              "Root Cause",
              "Incident Status",
              "How was the incident logged?",
              "Incident Manager",
            ].map((label, index) => (
              <tr key={index}>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  {label}:
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                  <input type="text" style={{ width: "100%" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Incident Date & Time */}
        <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>
          Incident Date and Time
        </h3>
        <table
          style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}
        >
          <tbody>
            {[
              "Incident Start Date and Time",
              "Incident Reported Date and Time",
              "Incident Resolution Date and Time",
            ].map((label, index) => (
              <tr key={index}>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  {label}:
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                  <input type="datetime-local" style={{ width: "100%" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Incident Details Description */}
        <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>Incident Details</h3>
        <textarea
          style={{
            width: "100%",
            height: "100px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
          placeholder="Enter incident details..."
        ></textarea>

        {/* Submit Button */}
        <button
          style={{
            marginTop: "20px",
            background: "#4F46E5",
            color: "white",
            padding: "10px 20px",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}