"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from '../../../../hooks/cookies';
import { getRequirementwithId, getRequirementFlowithId, getCurrUserData, getStakeholderswithId, getUserDatawithId} from '../../../../hooks/db.js'
import { auth } from '../../../../firebaseConfig.js';
import { userInfo } from 'os';
import { updateRequirementStatus } from '../../../../hooks/db.js'

type User = {
  rol:string,
  id:number,
  name:string,
  last_name_1:string,
  cel_1:string,
  email:string
}[];  


type Requirement = {
  submitter_id:number,
  brief_description:string,
  detailed_description:string,
  requirement_id:number,
  process_type:string,
  requirement_submit_date:string,
  contact_information:string,
  contact_email:string,
  contact_first_name:string,
  contact_last_name:string,
  contact_middle_initial:string,
  contact_phone:string,
  contact_role:string,
  data_requirement:string,
  dependencies:string,
  exist_workarounds:string,
  request_goals:string,
  workarounds_description:string,
  supporting_documents:string // temporary
  assigned_to_id: number,
  requirement_status:string
}[]; 

type Workflow = {
  brief_description:string,
  requirement_id:number,
  process_type:string,
  order:number,
  submitter_id:number,
  time_of_update:string,
  manager_id:number
}[];  

type Stakeholder = {
  email:string,
  first_name: string,
  last_name:string,
  phone:string,
  requirement_id:number,
  role:string
}[];

const MainPage: React.FC = () => {

  const [uid, setUid] = useState("");
  const [requirements, setRequirements] = useState<Requirement>([]);
  const [stakesholders, setStakeholders] = useState<Stakeholder>([]);
  const [flows, setFlows] = useState<Workflow>([]);
  const [flagflow, setFlagFlow] = useState("");
  const [uDatafromDb, setUdata] = useState<User>([]);
  const router = useRouter();
  const [currUser, setCurrUser] = useState(auth.currentUser); // Start with initial auth state
  const [isITSupport, setIsITSupport] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Added for resolution functionality:
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log("Auth state changed:", user);
        setCurrUser(user); // Update state when user logs in/out
      });
  
      return () => unsubscribe(); // Cleanup the listener
    }, []);
 
  
  const handleFetchAll = async (): Promise<void> => { 
      const requirementsData = await getRequirementwithId(Number(localStorage.getItem("requirement_id")));
      if(requirementsData)
      {
        setUid("a");
        const tasks = requirementsData.map((u) => {
          return {  //return data compatible with data types specified in the tasks variable 
            detailed_description: (u as any)["detailed_description"] ,
            brief_description: (u as any)["brief_description"],
            submitter_id: (u as any)["submitter_id"],
            requirement_id: (u as any)["requirement_id"],
            requirement_submit_date: ((u as any)["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            process_type: (u as any)["process_type"],
            contact_information:(u as any)["contact_information"],
            contact_first_name:(u as any)["contact_first_name"],
            contact_last_name:(u as any)["contact_last_name"],
            contact_middle_initial:(u as any)["contact_middle_initial"],
            contact_email:(u as any)["contact_email"],
            contact_role:(u as any)["contact_role"],
            contact_phone:(u as any)["contact_phone"],
            data_requirement:(u as any)["data_requirement"],
            dependencies:(u as any)["dependencies"],
            organization:(u as any)["organization"],
            assigned_to_id: (u as any)["assigned_to_id"],
            exist_workarounds:(u as any)["exist_workarounds"],
            request_goals:(u as any)["request_goals"],
            workarounds_description:(u as any)["workarounds_description"],
            supporting_documents:(u as any)["supporting_documents"],
            requirement_status:(u as any)["requirement_status"]
            }
           }); 
           
           setRequirements(tasks);
           const subs = await getUserDatawithId(Number((tasks as any)[0]["submitter_id"]));
            if(subs)
            {
              console.log(subs)
              const user = subs.map((u) => {
                return {  //return data compatible with data types specified in the tasks variable 
                  name: (u as any)["name"] ,
                  last_name_1: (u as any)["last_name_1"],
                  rol: (u as any)["rol"][0], 
                  cel_1: (u as any)["cel_1"],
                  email: (u as any)["email"],
                  id: (u as any)["id"]
                  }
                }); 
                
                setUdata(user);
              }
            else
              console.log("nothing retrieved 3 :(");
      }
    

      const stakesData = await getStakeholderswithId(Number(localStorage.getItem("requirement_id")));
          if(stakesData)
          {
            const stakes = stakesData.map((u) => {
              return {  //return data compatible with data types specified in the tasks variable 
                email: (u as any)["email"] ,
                first_name: (u as any)["first_name"],
                last_name: (u as any)["last_name"],
                phone: (u as any)["phone"],
                requirement_id: (u as any)["requirement_id"],
                role: (u as any)["role"]
                }
               }); 
               
               setStakeholders(stakes);
            }
            else
              console.log("nothing retrieved 3 :(");

          
    }

    const handleFetchFlow = async (): Promise<void> => { 
      const flows = await getRequirementFlowithId(Number(localStorage.getItem("requirement_id")));
      if(flows)
      {
        setFlagFlow("a");
        const tasks = flows.map((u) => {
          return {  //return data compatible with data types specified in the tasks variable 
            brief_description: (u as any)["brief_description"],
            submitter_id: (u as any)["submitter_id"],
            requirement_id: (u as any)["requirement_id"],
            time_of_update: ((u as any)["time_of_update"].toDate().getFullYear()).toString()+'-'
            +((u as any)["time_of_update"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["time_of_update"].toDate().getDate()).toString().padStart(2, "0"),
            process_type: (u as any)["process_type"],
            order: (u as any)["order"],
            manager_id: (u as any)["manager_id"]
            }
           }); 
           tasks.sort((a, b) => b.order - a.order); //workflow was not displayed sorted
           setFlows(tasks);
        }
        else
          console.log("nothing retrieved :(");
    }

    useEffect(() => 
    {
      const fetch = async(): Promise<void>=>{
        await handleFetchAll(); 
      }
      if(uid === "")
        fetch();
    });

    // Check user role when component mounts
    useEffect(() => {
      
      const fetch = async (): Promise<void> => {   
        const roleCookie = await getCookie("role"); 
        
        if (uDatafromDb.length > 0 && requirements.length > 0) {
          const user = uDatafromDb[0];
          const requirement = requirements[0];
    
          
          setIsAdmin(roleCookie?.value === "Admin");
          setIsITSupport(roleCookie?.value === "IT");
          
          if (requirement.assigned_to_id === user.id && (roleCookie?.value === "Admin" || roleCookie?.value === "IT")) 
            {
            setIsAssignedToMe(true);
          }
        }
        
      }
  
      fetch();
      }, [uDatafromDb,requirements]);

    /*useEffect(() => {
      if (uDatafromDb.length > 0 && requirements.length > 0) {
        const user = uDatafromDb[0];
        const requirement = requirements[0];
    
        if (user.rol === "IT") {
          setIsITSupport(true);
          if (requirement.assigned_to_id === user.id) {
            setIsAssignedToMe(true);
          }
        }
      }
    }, [uDatafromDb, requirements]);*/

    useEffect(() => 
      {
        const fetch = async(): Promise<void>=>{
          await handleFetchFlow();  
        }
        if(flagflow === "")
          fetch();
      });

  const handleRouter = () => {
    localStorage.clear();
    router.back();
  }

  const handleResolveRequirement = async () => {
    if (!currUser || !isITSupport || !isAssignedToMe || !isAdmin) return;
  
    const requirementId = localStorage.getItem("requirement_id");
    if (!requirementId || !resolutionDetails.trim()) {
      alert("Please provide resolution details.");
      return;
    }
  
    const confirmResolve = window.confirm("Mark this requirement as resolved?");
    if (!confirmResolve) return;
  
    setIsUpdating(true);
    try {
      const result = await updateRequirementStatus(requirementId, "Resolved", resolutionDetails);
      if (result === 0) {
        setUpdateSuccess(true);
        setShowResolutionForm(false);
        setResolutionDetails("");
        await handleFetchAll();
        await handleFetchFlow();
      } else {
        setUpdateSuccess(false);
      }
    } catch (error) {
      console.error("Error resolving requirement:", error);
      setUpdateSuccess(false);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateSuccess(null), 3000);
    }
  };

        return(
      <div style={{ display: "flex", flexDirection: "column"}} className="text-black">
          {/* Main Content */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color:"navy", textAlign: "center" }}>
            Information Technology Investment Request (ITIR) Form
            </h2>
          </div>
          <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Reporter Information</h1> 
    {
      
      uDatafromDb.map((u, index) => (
      <table
      
              key=
              {index} style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
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
                    First Name, Last Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                 {u.name} {u.last_name_1}
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
                  {u.rol}
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
                {u.cel_1}  
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
                  {u.email}
                </td>
                
              </tr>
              </tbody>
              </table>
      ))}

      {requirements.map((u, index) => (
        
        <div key={index}>
          
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
                  {u.brief_description}
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
                  {u.detailed_description}
                  </td>
                </tr>
              </tbody>
              </table>
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Current Status</h1>
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
                  {u.requirement_status}
                  </td>
                </tr>
              </tbody>
              </table>
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Is this request a new Business Process or Enhancement to an existing Process?</h1>
              <p>R/ {u.process_type}.</p>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Do any workarounds exist currently?</h1>
              {u.exist_workarounds === "No" && <p>R/ No.</p>}
              {u.exist_workarounds === "Yes" && <p>R/ Yes.</p>}
              {u.exist_workarounds !== "Yes" && u.exist_workarounds !== "No" && <p>R/ Not applicable.</p>}
      
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> If you have selected ‘Yes’ for the above question (Q2) then please describe workaround(s) in the box provided below:</h1>
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
                  {u.workarounds_description === "" && "N/A"}
                  {u.workarounds_description !== "" && u.workarounds_description}
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
                  {u.request_goals}
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
                  {u.data_requirement}
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
                  {u.dependencies}
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> List Stakeholders</h1>
              {stakesholders.map((k, index2) => (
                <div key={index2}>
              
              <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
              <tr>
                  <td
                    style={{
                      padding: "40px",
                      border: "1px solid #ccc",
                      width: "300px", // First column takes less space
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
                 {k.first_name} {k.last_name}
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
                  {k.role}
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
                {k.phone}  
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
                  {k.email}
                </td>
                
              </tr>
              </tbody>
              </table>
              </div>
              ))}

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Contact Information for the Business Administrator (Functional Unit Manager)</h1>
              <table
              key=
              {index} style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "40px",
                      border: "1px solid #ccc",
                      width: "300px", // First column takes less space
                      fontWeight: "bold",
                    }}
                  >
                    First Name, Last Name, Middle Initial
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                 {u.contact_first_name} {u.contact_last_name}
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
                  {u.contact_role}
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
                {u.contact_phone}  
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
                  {u.contact_email}
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
                  {u.contact_information}
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
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Requirement Submit Date: {u.requirement_submit_date}</h1>
              </div>
              ))}

       
      <div style={{ display: "flex", flexDirection: "column"}} className="text-black">
          {/* Main Content */}
          <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ fontSize: "30px", fontWeight: "bold", textAlign: "center" }}>
              Workflow
            </h2>
      </div>
        {flows.length > 0 && flows.map((u, index) => (
              <ul key={index} className="border-t-4 border-gray-200 dark:border-gray-700">
                <p><li className="px-4 py-2"><b>Time of Advance:</b> {u.time_of_update}</li></p>
                <li className="px-4 py-2"><b>Description:</b> {u.brief_description}</li>
                <li className="px-4 py-2"><b>Progress Made By:</b> {u.manager_id}</li>
                <li className="px-4 py-2"><b>Current Status:</b> {u.process_type}</li>
                <li className="px-4 py-2"><b>Reporter ID:</b> {u.submitter_id}</li>

              </ul> 
           ))}
          {flows.length === 0 && 
            <ul className="border-t border-black-200 dark:border-black-700">
              <li className="px-4 py-2">No records available. </li>
            </ul> 
        }
      </div>

      {(isAdmin || isITSupport) && isAssignedToMe && requirements[0]?.process_type !== "Resolved" && (
      <div className="mt-4">
        {updateSuccess !== null && (
          <div className={`mx-4 p-3 rounded ${updateSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {updateSuccess ? "Requirement successfully marked as resolved!" : "Failed to update status."}
          </div>
        )}
        {!showResolutionForm ? (
          <button
            onClick={() => setShowResolutionForm(true)}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Resolve Requirement
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <label htmlFor="resolution-details" className="block text-black font-medium mb-2">
              Resolution Details
            </label>
            <textarea
              id="resolution-details"
              value={resolutionDetails}
              onChange={(e) => setResolutionDetails(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-3">
              <button
                onClick={() => setShowResolutionForm(false)}
                className="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveRequirement}
                disabled={isUpdating || !resolutionDetails.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Submit & Resolve"}
              </button>
            </div>
          </div>
        )}
      </div>
    )}

          <div className="mt-4">
            <button
            onClick={()=>handleRouter()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            type="button"
            >
            Back
            </button>
          </div>
  </div>
  );
}

export default MainPage;
