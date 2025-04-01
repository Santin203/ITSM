"use client";
import React, { useEffect, useState } from 'react';
import { auth } from '../../../firebaseConfig.js';
import { getCurrUserData, getCurrUserRequirementsData, getITUserRequirementsData } from '../../../hooks/db.js';

type Requirement = {
  submitter_id:number,
  process_type:string,
  requirement_submit_date:string,
  requirement_id:number,
  requirementType?:string, 
  assigned_to_id?:number 
}[];

type Order = {
  submitter_id:number,
  process_type:number,
  requirement_submit_date:number,
  requirement_id:number
};  


const MainPage: React.FC = () => {

  const [uid, setUid] = useState("");
  const [requirements, setRequirements] = useState<Requirement>([]);
  const [order, setOrder] = useState<Order>({requirement_id: 0, requirement_submit_date: 0, process_type: 0, submitter_id: 0 });
  const [date, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isITSupport, setIsITSupport] = useState(false);
  const [requirementTypeFilter, setRequirementTypeFilter] = useState("all"); // "all", "sent", "received"
  const [roleChecked, setRoleChecked] = useState(false); // Wait for role to be determined

  const [formData, setFormData] = useState({
    title: "",
    incident_report_date:""
  });
  const [currUser, setCurrUser] = useState(auth.currentUser); // Start with initial auth state

  // Check user role when component mounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed:", user);
      setCurrUser(user); // Update state when user logs in/out
      if (user) {
        const userData = await getCurrUserData();
        if (userData) {
          if (userData.rol === "IT") {
            setIsITSupport(true);
          } else if (userData.rol === "Admin") {
            setIsAdmin(true);
          }
        }
      }
      setRoleChecked(true);
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  
  const handleFetchAll = async (): Promise<void> => { 
    if (isAdmin || isITSupport) {
      // For Admin and IT users, fetch both sent and received requirements
      const requirementsData = await getITUserRequirementsData();
      if(requirementsData && requirementsData.length > 0) {
        setUid("a");
        const tasks = requirementsData.map((u) => {
          return {
            submitter_id: (u as any)[0]["submitter_id"],
            requirement_id: (u as any)[0]["requirement_id"],
            requirement_submit_date: ((u as any)[0]["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)[0]["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)[0]["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            process_type: (u as any)[0]["process_type"],
            docId: (u as any)[1],
            requirementType: (u as any)[0]["requirementType"] // Preserve the requirementType
          };
        });
        setRequirements(tasks);
      } else {
        console.log("No requirements retrieved for Admin/IT user");
        setRequirements([]);
      }
    } else {
      // For regular users, just fetch their submitted requirements
      const requirementsData = await getCurrUserRequirementsData();
      if(requirementsData) {
        setUid("a");
        const tasks = requirementsData.map((u) => {
          return {  
            submitter_id: (u as any)[0]["submitter_id"],
            requirement_id: (u as any)[0]["requirement_id"],
            requirement_submit_date: ((u as any)[0]["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)[0]["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)[0]["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            process_type: (u as any)[0]["process_type"],
            docId: (u as any)[1],
            requirementType: "sent" // Since this is the current user's data, it's always "sent"
          }
        }); 
        setRequirements(tasks);
      } else {
        console.log("nothing retrieved :(");
        setRequirements([]);
      }
    }
  };

 
  useEffect(() => {
    const fetch = async(): Promise<void> => {
      if (roleChecked) {
        await handleFetchAll();
      }
    }

    if (uid === "") {
      fetch();
    }
  }, [roleChecked, uid]);

 
  useEffect(() => {
    if (roleChecked && uid !== "") {
      handleFetchAll();
    }
  }, [isAdmin, isITSupport]);

  const compareDates = (d1:string, d2:string, d3:string) => {
    return(d1 <= d2 && d2 <= d3);
  }

  // Filtered data
  const filteredRequirements = requirements.filter((u) => {
    // Filter by requirement type if it's an admin or IT support
    if ((isAdmin || isITSupport) && requirementTypeFilter !== "all") {
      if (requirementTypeFilter === "sent" && u.requirementType !== "sent") return false;
      if (requirementTypeFilter === "received" && u.requirementType !== "received") return false;
    }
    
    // Filter by status
    const matchesStatus = status === "" || String(u.process_type) === String(status);
    
    // Filter by date range
    const matchesDate = date === "" && endDate === "" || compareDates(date, u.requirement_submit_date, endDate);
    
    return matchesStatus && matchesDate;
  });
  

  // Ordenación dinámica
  const sortedRequirements = [...filteredRequirements].sort((a, b) => {
    for (const col in order) {
      if (order[col as keyof Order] !== 0) {
        if (typeof (a as any)[col] === "string" && typeof (b as any)[col] == "string") {
          return order[col as keyof Order] * ((a as any)[col].toLowerCase() > (b as any)[col].toLowerCase() ? 1 : -1);
        } else {
          return order[col as keyof Order] * ((a as any)[col] > (b as any)[col] ? 1 : -1);
        }
      }
    }
    return 0;
  });

  const handleRequirement = async (requirement_id:number) =>{
    localStorage.setItem("requirement_id", requirement_id.toString());
    window.location.href = "trackrequirements/requirementinfo";
  }
  // Alternar orden y resetear las demás columnas
  const handleSort = (col: keyof Order) => {
    setOrder((o) => {
      const newOrder: Order = { requirement_id: 0, requirement_submit_date: 0, process_type: 0, submitter_id: 0 };
      if(o[col] >= 0)
        newOrder[col] = -1;
      else
        newOrder[col] = 1
      return newOrder;
    });
  };
        
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get the appropriate page title based on filter selection
  const getPageTitle = () => {
    if (isAdmin || isITSupport) {
      if (requirementTypeFilter === "all") return "All Requirements";
      if (requirementTypeFilter === "sent") return "My Requirements";
      if (requirementTypeFilter === "received") return "Requirements Assigned to Me";
    }
    return "My Requirements";
  };

  if (!roleChecked) return <div className="text-black p-4">Loading...</div>; // Prevent render until role is known

  return (
    <div>
      <div key="1" className="text-black p-4">
        <h1 className="text-[2rem] font-bold">{getPageTitle()}</h1>
      </div>
      <div key="2">
      <form>
          <fieldset>
          
          <legend className="text-black font-semibold text-lg mb-4">Filter Requirements</legend>
              
              {/* Requirement Type Filter - Only for Admin and IT users */}
              {(isAdmin || isITSupport) && (
                <div className="mb-4">
                  <label className="block text-black mb-2">Requirement Type:</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="requirementType"
                        value="all"
                        checked={requirementTypeFilter === "all"}
                        onChange={() => setRequirementTypeFilter("all")}
                        className="mr-2"
                      />
                      <span className="text-black">All Requirements</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="requirementType"
                        value="sent"
                        checked={requirementTypeFilter === "sent"}
                        onChange={() => setRequirementTypeFilter("sent")}
                        className="mr-2"
                      />
                      <span className="text-black">Requirements I Submitted</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="requirementType"
                        value="received"
                        checked={requirementTypeFilter === "received"}
                        onChange={() => setRequirementTypeFilter("received")}
                        className="mr-2"
                      />
                      <span className="text-black">Requirements Assigned to Me</span>
                    </label>
                  </div>
                </div>
              )}
              
              <div>
              <label htmlFor="incident_status" className="block mb-2">
              <p className="text-black mt-2">Search for Requirement Process</p>
              </label>
                <select
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option defaultChecked value="">Not sure</option>
                  <option value="New">New</option>
                  <option value="Enhanced">Enhanced</option>
                </select>
              </div>
            
            <div className="flex space-x-4 mt-2">
                <div>
                  <label className="block text-black mt-2">Start Date:</label>
                  <input
                    type="date"
                    className="text-black border rounded px-4 py-2 mb-4 w-medium"
                    value={date}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                <label className="block text-black mt-2">End Date</label>
                <input
                  type="date"
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              </div>
        </fieldset> 
        </form>
  
      </div>
      <main className="overflow-x-auto bg-white shadow-md rounded-lg p-6">
      <table className="min-w-full text-gray-800">
      <thead>
            <tr>
              {/* Type column only for Admin/IT users */}
              {(isAdmin || isITSupport) && (
                <th className="px-4 py-2 text-left">Type</th>
              )}
              <th className="px-4 py-2 text-left">Requirement ID</th>
              <th className="px-4 py-2 text-left">Submit Date<button
                            onClick={() => handleSort("requirement_submit_date")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["requirement_submit_date"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Status<button
                            onClick={() => handleSort("process_type")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["process_type"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Submitter ID</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
        <tbody>
            {sortedRequirements.length > 0 ? (
              sortedRequirements.map((u, index) => (
                <tr key={index} className="border-t border-gray-200">
                  {/* Type column only for Admin/IT users */}
                  {(isAdmin || isITSupport) && (
                    <td className="px-4 py-2">
                      {u.requirementType === "received" ? "Assigned to me" : "Submitted by me"}
                    </td>
                  )}
                  <td className="px-4 py-2">{u.requirement_id}</td>
                  <td className="px-4 py-2">{String(u.requirement_submit_date)}</td>
                  <td className="px-4 py-2">{u.process_type}</td>
                  <td className="px-4 py-2">{u.submitter_id}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRequirement(u.requirement_id)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      type="button"
                    >
                      More
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={(isAdmin || isITSupport) ? 6 : 5} className="px-4 py-4 text-center text-gray-500">
                  No requirements found matching your criteria
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </main>
  </div>
  );
}

export default MainPage;
