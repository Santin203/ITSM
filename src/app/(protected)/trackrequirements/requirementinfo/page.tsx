"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRequirementwithId, getRequirementFlowithId, getCurrUserData} from '../../../../hooks/db.js'
import { auth } from '../../../../firebaseConfig.js';
import { userInfo } from 'os';

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
  communication_strategy:string,
  contact_email:string,
  contact_first_name:string,
  contact_last_name:string,
  contact_middle_initial:string,
  contact_phone:string,
  contact_role:string,
  data_requirement:string,
  dependencies:string,
  exist_workarounds:boolean,
  request_goals:string,
  workarounds_description:string,
  supporting_documents:string // temporary
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

const MainPage: React.FC = () => {

  const [uid, setUid] = useState("");
  const [requirements, setRequirements] = useState<Requirement>([]);
  const [flows, setFlows] = useState<Workflow>([]);
  const [flagflow, setFlagFlow] = useState("");
  const [uDatafromDb, setUdata] = useState<User>([]);
  const router = useRouter();
  const [currUser, setCurrUser] = useState(auth.currentUser); // Start with initial auth state
  
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
            communication_strategy:(u as any)["communication_strategy"],
            contact_first_name:(u as any)["contact_first_name"],
            contact_last_name:(u as any)["contact_last_name"],
            contact_middle_initial:(u as any)["contact_middle_initial"],
            contact_email:(u as any)["contact_email"],
            contact_role:(u as any)["contact_role"],
            contact_phone:(u as any)["contact_phone"],
            data_requirement:(u as any)["data_requirement"],
            dependencies:(u as any)["dependencies"],
            organization:(u as any)["organization"],
            exist_workarounds:(u as any)["exist_workarounds"],
            request_goals:(u as any)["request_goals"],
            workarounds_description:(u as any)["workarounds_description"],
            supporting_documents:(u as any)["supporting_documents"]
            }
           }); 
           
           setRequirements(tasks);
        }
        else
          console.log("nothing retrieved :(");

        const userData = await getCurrUserData();
        if(userData)
        {
          const udata = {  //return data compatible with data types specified in the tasks variable 
              name: (userData as any)["name"] ,
              last_name_1: (userData as any)["last_name_1"],
              rol: (userData as any)["rol"],
              cel_1: (userData as any)["cel_1"],
              email: (userData as any)["email"],
              id: (userData as any)["id"]
            }
            setUdata([udata]);
        }
        else
          console.log("nothing retrieved 2 :(");
        
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

    useEffect(() => 
      {
        const fetch = async(): Promise<void>=>{
          await handleFetchFlow();  
        }
        if(flagflow === "")
          fetch();
      });

      console.log(requirements)
  const handleRouter = () => {
    localStorage.clear();
    router.back();
  }

        return(
      <div style={{ display: "flex", flexDirection: "column"}} className="text-black">
          {/* Main Content */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color:"navy", textAlign: "center" }}>
            Information Technology Investment Request (ITIR) Form
            </h2>
          </div>
          
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
      <h2>Please fill out as many sections as you can.</h2>
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
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Is this request a new Business Process or Enhancement to an existing Process?</h1>
              <p>R/ {u.process_type}.</p>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Do any workarounds exist currently?</h1>
              {u.exist_workarounds === false && <p>R/ No.</p>}
              {u.exist_workarounds === true && <p>R/ Yes.</p>}
              {u.exist_workarounds !== true && u.exist_workarounds !== false && <p>R/ Not applicable.</p>}
      
              
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
                  {u.communication_strategy}
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

          <button
          onClick={()=>handleRouter()}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          type="button"
          >
          Back
          </button>
  </div>
  );
}

export default MainPage;
