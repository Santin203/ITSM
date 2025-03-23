"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllIncidents, getCurrUserData } from '../../../../hooks/db.js';
import { DocumentData } from "firebase/firestore";

export default function IncidentEntryPage() {
  const router = useRouter();
  const [incidentNumber, setIncidentNumber] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [reportedDateTime, setReportedDateTime] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    const fetchAndGenerateIncidentNumber = async () => {
      try {
      const rawIncidents: (string | DocumentData)[][] = await getAllIncidents();
      const incidents: { incident_id: number; incident_report_date: { seconds: number; nanoseconds: number } }[] = rawIncidents
        .flat()
        .filter((item): item is { incident_id: number; incident_report_date: { seconds: number; nanoseconds: number } } => 
        typeof item === "object" && 
        item !== null && 
        "incident_id" in item && 
        "incident_report_date" in item &&
        typeof item.incident_report_date === "object" &&
        "seconds" in item.incident_report_date &&
        "nanoseconds" in item.incident_report_date
        );
      if (incidents && incidents.length > 0) {
        // Sort incidents by incident_report_date
        incidents.sort((a, b) => 
        a.incident_report_date.seconds - b.incident_report_date.seconds ||
        a.incident_report_date.nanoseconds - b.incident_report_date.nanoseconds
        );

        const lastIncident = incidents[incidents.length - 1];
        const lastIncidentNumber = lastIncident.incident_id;
        setIncidentNumber(`INC-${lastIncidentNumber + 1}`);
      } else {
        setIncidentNumber("INC-1");
      }
      } catch (error) {
      console.error("Error fetching incidents:", error);
      setIncidentNumber("INC-1");
      }
    };

    const fetchOrganizationDetails = async () => {
      try {
      const userData = await getCurrUserData();
      if (userData) {
        // Set organization, department, and section if they exist in userData
        if (userData.organization) {
        setOrganization(userData.organization);
        }
        if (userData.department) {
        setDepartment(userData.department);
        }
        if (userData.section) {
        setSection(userData.section);
        }
      }
      } catch (error) {
      console.error("Error fetching organization details:", error);
      }
    };



    const fetchUserData = async () => {
      try {
      const userData = await getCurrUserData();
      //console.log("User data:", userData);
      if (userData) {

        if (userData.name && userData.last_name_1 && userData.last_name_2) {
        setReportedBy(`${userData.name} ${userData.last_name_1} ${userData.last_name_2}`);
        }
      }
      } catch (error) {
      console.error("Error fetching user data:", error);
      }
    };

    const currentDateTime = new Date().toLocaleString("sv-SE", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hour12: false,
    }).replace(" ", "T").slice(0, 16); // Format as "YYYY-MM-DDTHH:mm"
    setReportedDateTime(currentDateTime);

    fetchAndGenerateIncidentNumber();
    fetchOrganizationDetails();
    fetchUserData();
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
            {label === "Organization" ? (
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                style={{ width: "100%" }}
              />
            ) : label === "Department" ? (
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: "100%" }}
              />
            ) : label === "Section" ? (
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{ width: "100%" }}
              />
            ) : (
              <input type="text" style={{ width: "100%" }} />
            )}
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
                  {label === "Reported By" ? (
                    <input
                      type="text"
                      value={reportedBy}
                      readOnly
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <input type="text" style={{ width: "100%" }} />
                  )}
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
                  {label === "Incident Reported Date and Time" ? (
                    <input
                      type="datetime-local"
                      style={{ width: "100%" }}
                      value={label === "Incident Reported Date and Time" ? reportedDateTime : undefined}
                      readOnly={label === "Incident Reported Date and Time"}
                    />
                  ) : (
                    <input type="datetime-local" style={{ width: "100%" }} />
                  )}
                  
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