"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllIncidents, getCurrUserData, addIncidents } from '../../../../hooks/db.js';
import { DocumentData, Timestamp } from "firebase/firestore";

export default function IncidentEntryPage() {
  const router = useRouter();
  const [incidentNumber, setIncidentNumber] = useState("");
  const [incidentID, setIncidentID] = useState(0);
  const [reportedBy, setReportedBy] = useState("");
  const [reportedDateTime, setReportedDateTime] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [startDate, setStartDate] = useState("");
  const [statuss, setStatus] = useState("");
  const [user_id, setID] = useState("");
  const [reportTS, setTimestamp] = useState<Timestamp>();
  const [formData, setFormData] = useState({
    title:"",
    description:"",
    incident_id:"",
    incident_start_date:"",
    business_impact:"",
    incident_logged:"",
    assigned_to_id:"",
    root_cause:"",
    stakeholder_details:"",
    user_details:"",
    incident_resolution_date:Timestamp.fromDate(new Date("10-01-1900:00")),
    additional_details:""
  });

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
        setIncidentID(lastIncidentNumber+1);
      } else {
        setIncidentNumber("INC-1");
      }
      } catch (error) {
      console.error("Error fetching incidents:", error);
      setIncidentNumber("INC-1");
      setIncidentID(1);

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
        if(userData.id)
          setID(userData.id);
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
    setTimestamp(Timestamp.now());

    fetchAndGenerateIncidentNumber();
    fetchOrganizationDetails();
    fetchUserData();
  }, []);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const { name, value } = e.target;
          setFormData((prev) => ({ ...prev, [name]: value }));
        };

  const handleSubmit =  async (e: React.FormEvent) => {
          e.preventDefault();

          try{

          const resoldate = new Date();
          resoldate.setFullYear(1900);
          resoldate.setMonth(1);
          resoldate.setDate(1);

          

         

          const response = await addIncidents({
            additional_details: formData.additional_details,
            business_impact: formData.business_impact,
            department: department,
            description: formData.description,
            incident_id: incidentID,
            incident_logged: formData.incident_logged,
            incident_report_date: reportTS,
            incident_resolution_date: Timestamp.fromDate(resoldate),
            incident_start_date: Timestamp.fromDate(new Date(startDate)),
            incident_status:statuss,
            assigned_to_id: formData.assigned_to_id === "" ? -1 : Number(formData.assigned_to_id),
            organization: organization,
            reporter_id: user_id,
            root_cause: formData.root_cause,
            section:section,
            title:formData.title,
            user_details:formData.user_details
          })
          console.log(response)
          if(response === 0)
          {
            console.log("Success")
            alert("Incident Submitted!");
            window.location.href = "/user/trackincidents";
          }
              
          else
            alert("An error occurred.");
        }
        catch{
          alert("An error occurred.");
        }
      }
      

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
    <div style={{ display: "flex", flexDirection: "column"}} className="text-black">
      {/* Main Content */}
      <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center" }}>
          Major Incident Report
        </h2>
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

        {/* Organization Details */}
        <table
          style={{ width: "75%", maxWidth: "900px", borderCollapse: "collapse", marginTop: "20px", marginLeft: "0" }}
        >
          <tbody>
          <tr>
          <td
            style={{
              padding: "20px",
              border: "1px solid #ccc",
              width: "200px", // First column takes less space
              fontWeight: "bold",
            }}
          >
            Organization
          </td>
          <td
            style={{
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <input
                type="text"
                id="organization"
                name="organization"
                value={organization}
                className="text-black border rounded px-4 py-2 mb-4 w-medium"
                style={{ width: "100%" }}
                readOnly
              />
          </td>
          </tr>
          <tr>
          <td
            style={{
              padding: "20px",
              border: "1px solid #ccc",
              width: "200px", // First column takes less space
              fontWeight: "bold",
            }}
          >
            Department
          </td>
          <td
            style={{
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <input
                type="text"
                id="department"
                name="department"
                value={department}
                className="text-black border rounded px-4 py-2 mb-4 w-medium"
                style={{ width: "100%" }}
                readOnly
              />
          </td>
          </tr>
          <tr>
          <td
            style={{
              padding: "20px",
              border: "1px solid #ccc",
              width: "200px", // First column takes less space
              fontWeight: "bold",
            }}
          >
            Section
          </td>
          <td
            style={{
              padding: "10px",
              border: "1px solid #ccc",
            }}
          >
            <input
                type="text"
                id="section"
                name="section"
                value={section}
                className="text-black border rounded px-4 py-2 mb-4 w-medium"
                style={{ width: "100%" }}
                readOnly
              />
          </td>
          </tr>
          </tbody>
        </table>
        {/* Incident Details */}
        <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>Incident Details</h3>
        <table
          style={{ width: "75%", maxWidth: "900px", borderCollapse: "collapse", marginTop: "10px", marginLeft: "0" }}
        >
          <tbody>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  User Details
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                <input
                type="text"
                id="user_details"
                name="user_details"
                onChange={handleChange}
                value={formData.user_details}
                className="text-black border rounded px-4 py-2 mb-4 w-medium"
                style={{ width: "100%" }}
              />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Reported By
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                  type="text"
                  id="reported_by"
                  name="reported_by"
                  value={reportedBy}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  readOnly
                />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Incident Title
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                  type="text"
                  id="title"
                  name="title"
                  onChange={handleChange}
                  value={formData.title}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Incident Description
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                  type="text"
                  id="description"
                  name="description"
                  onChange={handleChange}
                  value={formData.description}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Business Impact
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                  type="text"
                  id="business_impact"
                  name="business_impact"
                  onChange={handleChange}
                  value={formData.business_impact}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Root Cause
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                  type="text"
                  id="root_cause"
                  name="root_cause"
                  onChange={handleChange}
                  value={formData.root_cause}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Incident Status
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <select
                    id="incident_status"
                    name="incident_status"
                    required
                    value={statuss}
                    onChange={(e) => setStatus(e.target.value)}
                    className="dark:text-black border rounded px-3 py-2 mb-4"
                    style={{ width: "250px", maxWidth: "100%" }}
                  >
                    <option value="" disabled>Select Status</option>
                    <option defaultChecked value ="Sent">Sent</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  How was the incident logged?
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                  type="text"
                  id="incident_logged"
                  name="incident_logged"
                  onChange={handleChange}
                  value={formData.incident_logged}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Incident Manager/IT
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                  type="number"
                  id="it_id"
                  name="it_id"
                  onChange={handleChange}
                  value={formData.assigned_to_id}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "250px", maxWidth: "100%" }}
                />
                </td>
              </tr>
          </tbody>
        </table>

        {/* Incident Date & Time */}
        <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>
          Incident Date and Time
        </h3>
        <table
          style={{ width: "75%", maxWidth: "900px", borderCollapse: "collapse", marginTop: "10px", marginLeft: "0" }}
        >
          <tbody>
            <tr>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Incident Start Date and Time
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                      id = "incident_start_date"
                      type="date"
                      style={{ width: "250px", maxWidth: "100%" }}
                      value={startDate}
                      onChange={(e)=>setStartDate(e.target.value)}
                      required
                    />
                </td>
            </tr>
            <tr>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Incident Reported Date and Time
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                      id = "incident_reported_date"
                      type="datetime-local"
                      style={{ width: "250px", maxWidth: "100%" }}
                      value={reportedDateTime}
                      readOnly
                    />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "250px",  // Increase the width
                    fontWeight: "bold",
                    whiteSpace: "nowrap", // Prevent wrapping
                  }}
                >
                  Incident Resolution Date and Time
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                      id = "incident_resolution_date"
                      type="text"
                      style={{ width: "250px", maxWidth: "100%" }}
                      value="N/A"
                      readOnly
                    />
                </td>
              </tr>
          </tbody>
        </table>

        {/* Incident Details Description */}
        
        <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>Incident Details</h3>
        <textarea
                  id="additional_details"
                  name="additional_details"
                  onChange={handleChange}
                  value={formData.additional_details}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{
                    width: "75%",
                    maxWidth: "900px",
                    height: "200px",
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                />
        <div style={{ width: "75%", maxWidth: "900px", marginLeft: "0" }}>
          <input
                type="submit"
                value="Submit"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              />
        </div>
      </div>
    </div>
    </fieldset>
    </form>
  );
}