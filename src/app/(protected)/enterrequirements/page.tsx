"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentData, Timestamp } from "firebase/firestore";
import { getAllRequirements, getCurrUserData, addRequirement, addStakeholder } from '../../../hooks/db.js';

type Stakeholder = {
  stake_email:string,
  stake_first_name:string,
  stake_requirement_id:number,
  stake_last_name:string,
  stake_phone:string,
  stake_role:string
}[];

export default function IncidentEntryPage() {
  const router = useRouter();
  const [incidentNumber, setIncidentNumber] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [user_id, setID] = useState("");
  const [user_email, setEmail] = useState("");
  const [user_rol, setRole] = useState("");
  const [user_cel1, setCel1] = useState("");
  const [reportTS, setTimestamp] = useState<Timestamp>();
  const [requirementNumber, setRequirementNumber] = useState(0);
  const [process_type, setProcessType] = useState("");
  const [exist_workarounds, setWorks] = useState("");
  const [reportedDateTime, setReportedDateTime] = useState("");
  const [formData, setFormData] = useState({
      brief_description:"",
      contact_email:"",
      contact_first_name:"",
      contact_information:"",
      contact_last_name:"",
      contact_middle_initial:"",
      contact_phone:"",
      contact_role:"",
      data_requirement:"",
      dependencies:"",
      detailed_description:"",
      exist_workarounds:"",
      process_type:"",
      request_goals:"",
      requirement_submit_date:"",
      submitter_id:"",
      supporting_documents:"",
      workarounds_description:""
    });
    const [inputs, setInputs] = useState<Stakeholder>([]);
    const [statuss, setStatus] = useState("Sent");
  

  useEffect(() => {
    const fetchAndGenerateIncidentNumber = async () => {
      try {
        const rawIncidents: (string | DocumentData)[][] = await getAllRequirements();
        const requirements: { requirement_id: number; requirement_submit_date: { seconds: number; nanoseconds: number } }[] = rawIncidents
          .flat()
          .filter((item): item is { requirement_id: number; requirement_submit_date: { seconds: number; nanoseconds: number } } => 
          typeof item === "object" && 
          item !== null && 
          "requirement_id" in item && 
          "requirement_submit_date" in item &&
          typeof item.requirement_submit_date === "object" &&
          "seconds" in item.requirement_submit_date &&
          "nanoseconds" in item.requirement_submit_date
          );
        if (requirements && requirements.length > 0) {
          // Sort incidents by incident_report_date
          requirements.sort((a, b) => 
          a.requirement_submit_date.seconds - b.requirement_submit_date.seconds ||
          a.requirement_submit_date.nanoseconds - b.requirement_submit_date.nanoseconds
          );

          const lastIncident = requirements[requirements.length - 1];
          const lastIncidentNumber = lastIncident.requirement_id;
          setIncidentNumber(`REQ-${lastIncidentNumber + 1}`);
          setRequirementNumber(lastIncidentNumber+1);
          
        } else {
          setIncidentNumber("REQ-1");
          setRequirementNumber(1);
        }
      } catch (error) {
      console.error("Error fetching incidents:", error);
      setIncidentNumber("REQ-1");
      setRequirementNumber(1);

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
        if(userData.email)
          setEmail(userData.email);
        if(userData.rol)
          setRole(userData.rol[0]);
        if(userData.cel_1)
          setCel1(userData.cel_1);
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
    
    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit =  async (e: React.FormEvent) => {
            e.preventDefault();
  
            try{
              const response = await addRequirement({
              assigned_to_id:-1,
              requirement_status:statuss,
              brief_description:formData.brief_description,
              contact_email:formData.contact_email,
              contact_first_name:formData.contact_first_name,
              contact_information:formData.contact_information,
              contact_last_name:formData.contact_last_name,
              contact_phone:formData.contact_phone,
              contact_role:formData.contact_role,
              data_requirement:formData.data_requirement,
              dependencies:formData.dependencies,
              detailed_description:formData.detailed_description,
              exist_workarounds:exist_workarounds,
              process_type:process_type,
              request_goals:formData.request_goals,
              requirement_id:requirementNumber,
              requirement_submit_date: reportTS,
              submitter_id: user_id,
              supporting_documents:formData.supporting_documents,
              workarounds_description:formData.workarounds_description
            })

            console.log(response)
            if(response === 0)
            {
              console.log("Success")
              alert("Requirement Submitted!");
              window.location.href = "/trackrequirements";
            } 
            else
            {
              alert("hhh An error occurred.");
              console.log("here")
            }

            inputs.map((u) => (
              addStakeholder(u)
            ));
          }
          catch(err){

            alert("hh An error occurred.");
            console.log(err)
          }
  
        };

  
    const handleChange2 = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const values = [...inputs];
        const { name, value } = e.target;
      
        if (name === "stake_last_name") values[index].stake_last_name = value;
        else if (name === "stake_first_name") values[index].stake_first_name = value;
        else if (name === "stake_email") values[index].stake_email = value;
        else if (name === "stake_phone") values[index].stake_phone = value;
        else if (name === "stake_role") values[index].stake_role = value;
        else return;
      
        setInputs(values);
      };
  
    const handleAdd = () => {
      setInputs([...inputs, {
        stake_email:"",
        stake_first_name:"",
        stake_requirement_id:requirementNumber,
        stake_last_name:"",
        stake_phone:"",
        stake_role:""}]);
    };
  
    const handleRemove = (index: number) => {
      if (inputs.length > 1) {
        const values = [...inputs];
        values.splice(index, 1);
        setInputs(values);
      }
    };
  

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
          <div style={{ display: "flex", flexDirection: "column"}} className="text-black">
          {/* Main Content */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color:"navy", textAlign: "center" }}>
            Information Technology Investment Request (ITIR) Form
            </h2>
          </div>
          <div
          style={{
            marginTop: "20px",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          Requirement Ticket No: {incidentNumber}
        </div>
          
      <table>
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
                    First Name, Last Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                {reportedBy}
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
                  Role or Position
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                > 
                  {user_rol}
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
                  Phone Number and Extension
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                {user_cel1}
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
                  Email
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                  {user_email}
                </td>
                
              </tr>
              </tbody>
              </table>
        
        <div>
          
          <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Brief Description of the Requirement</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  <input
                  type="text"
                  id="brief_description"
                  name="brief_description"
                  onChange={handleChange}
                  value={formData.brief_description}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Detailed Description of the Requirement</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  <input
                  type="text"
                  id="detailed_description"
                  name="detailed_description"
                  onChange={handleChange}
                  value={formData.detailed_description}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                  </td>
                </tr>
              </tbody>
              </table>
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Current Status </h1>
              <input
                type="text"
                id="statuss"
                name="statuss"
                value={statuss}
                className="text-black border rounded px-4 py-2 mb-4 w-medium"
                style={{ width: "100%" }}
                readOnly
              />
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Is this request a New Business Process or Enhancement to an existing Process?</h1>
              <select
                    id="process_type"
                    name="process_type"
                    required
                    value={process_type}
                    onChange={(e) => setProcessType(e.target.value)}
                    className="dark:text-black border rounded px-3 py-2 mb-4 w-full"
                  >
                    <option value="" disabled>Select Type</option>
                    <option value ="New">New</option>
                    <option value="Enhancement">Enhancement</option>
                  </select>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Do any workarounds exist currently?</h1>
              <select
                    id="exist_workarounds"
                    name="exist_workarounds"
                    required
                    value={exist_workarounds}
                    onChange={(e) => setWorks(e.target.value)}
                    className="dark:text-black border rounded px-3 py-2 mb-4 w-full"
                  >
                    <option value="" disabled>Exist Workarounds</option>
                    <option value = "Yes">Yes</option>
                    <option value="No">No</option>
              </select>
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> If you have selected ‘Yes’ for the above previous question then please describe workaround(s) in the box provided below:</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  <input
                  type="text"
                  id="workarounds_description"
                  name="workarounds_description"
                  onChange={handleChange}
                  value={formData.workarounds_description}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                />
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Business Goals or Objectives of the Request</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                    <input
                    type="text"
                    id="request_goals"
                    name="request_goals"
                    onChange={handleChange}
                    value={formData.request_goals}
                    className="text-black border rounded px-4 py-2 mb-4 w-medium"
                    style={{ width: "100%" }}
                    required
                  />
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Reporting or Data Requirements</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  <input
                  type="text"
                  id="data_requirement"
                  name="data_requirement"
                  onChange={handleChange}
                  value={formData.data_requirement}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> List Dependencies (if any)</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  <input
                  type="text"
                  id="dependencies"
                  name="dependencies"
                  onChange={handleChange}
                  value={formData.dependencies}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                />
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> List Stakeholders</h1>
              {inputs.map((input, index) => (
        <div key={index}>
          <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
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
                    First Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                    <input
                  type="text"
                  id="stake_first_name"
                  name="stake_first_name"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  onChange={(event) => handleChange2(index, event)}
                  value = {input.stake_first_name}
                 
                  
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
                    Last Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                    <input
                  type="text"
                  id="stake_last_name"
                  name="stake_last_name"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  onChange={(event) => handleChange2(index, event)}
                  value={input.stake_last_name}
                  
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
                  Role or Position
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                > 
                  <input
                  type="text"
                  id="stake_role"
                  name="stake_role"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  onChange={(event) => handleChange2(index, event)}
                  value = {input.stake_role}
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
                  Phone Number
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                <input
                  type="text"
                  id="stake_phone"
                  name="stake_phone"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  onChange={(event) => handleChange2(index, event)}
                  value = {input.stake_phone}
                  
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
                  Email Address
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                  <input
                  type="text"
                  id="stake_email"
                  name="stake_email"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  onChange={(event) => handleChange2(index, event)}
                  value = {input.stake_email}
                  
                />
                </td>
                
              </tr>
              </tbody>
              </table>

        
          {inputs.length > 1 && (
            <button type='button' onClick={() => handleRemove(index)}
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
            Remove Stakeholder
          </button>
          )}
        </div>
      ))}
      <button type='button' onClick={handleAdd}
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
          Add Stakeholder
        </button>
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Contact Information for the Business Administrator (Functional Unit Manager)</h1>
              <table
              
               style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
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
                    First Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                <input
                  type="text"
                  id="contact_first_name"
                  name="contact_first_name"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  onChange={handleChange}
                  value={formData.contact_first_name}
                  required
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
                    Last Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                <input
                  type="text"
                  id="contact_last_name"
                  name="contact_last_name"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  onChange={handleChange}
                  value={formData.contact_last_name}
                  required
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
                  Role or Position
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                > 
                  <input
                  type="text"
                  id="contact_role"
                  name="contact_role"
                  onChange={handleChange}
                  value={formData.contact_role}
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
                    width: "200px", // First column takes less space
                    fontWeight: "bold",
                  }}
                >
                  Phone Number and Extension
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                <input
                  type="text"
                  id="contact_phone"
                  name="contact_phone"
                  onChange={handleChange}
                  value={formData.contact_phone}
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
                    width: "200px", // First column takes less space
                    fontWeight: "bold",
                  }}
                >
                  Email Address
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                >
                  <input
                  type="text"
                  id="contact_email"
                  name="contact_email"
                  onChange={handleChange}
                  value={formData.contact_email}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                </td>
                
              </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}>Communication Strategy</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  <input
                  type="text"
                  id="contact_information"
                  name="contact_information"
                  onChange={handleChange}
                  value={formData.contact_information}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  style={{ width: "100%" }}
                  required
                />
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}>Supporting_documents</h1>
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  
                  </td>
                </tr>
              </tbody>
              </table>
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Requirement Submit Date: {reportedDateTime}</h1>
              </div>

    
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
    </fieldset>
    </form>
  );
}