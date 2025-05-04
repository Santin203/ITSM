"use client";
import React, { useEffect, useState } from 'react';
import { getCookie } from '../../../hooks/cookies';
import { getCurrUserRequirementsData, getITUserRequirementsData, getCurrGroupRequirementsData } from '../../../hooks/db.js';
type Requirement = {
  submitter_id:number,
  requirement_submit_date:string,
  requirement_id:number,
  requirementType?:string, 
  assigned_to_id?:number, 
  requirement_status:string,
  process_type:string
}[];

type Order = {
  submitter_id:number,
  requirement_submit_date:number,
  requirement_id:number,
  requirement_status:number,
  process_type:number
};  

const MainPage: React.FC = () => {
  const [uid, setUid] = useState("");
  const [requirements, setRequirements] = useState<Requirement>([]);
  const [groupRequirements, setGroupRequirements] = useState<Requirement>([]);
  const [order, setOrder] = useState<Order>({requirement_id: 0, requirement_submit_date: 0, requirement_status: 0, submitter_id: 0, process_type: 0});
  const [date, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [process_type, setProcessType] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isITSupport, setIsITSupport] = useState(false);
  const [requirementTypeFilter, setRequirementTypeFilter] = useState("all"); // "all", "sent", "received"
  const [roleChecked, setRoleChecked] = useState(false); // Wait for role to be determined
  const [groupByGroup, setGroupByGroup] = useState(true); // New state for grouping

  // Check user role when component mounts
  useEffect(() => {
    const fetch = async (): Promise<void> => {    
      const roleCookie = await getCookie("role");
      setIsAdmin(roleCookie?.value === "Admin");
      setIsITSupport(roleCookie?.value === "IT");
      setRoleChecked(true); // Set roleChecked to true after checking role
    }
    fetch();
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
            assigned_to_id:(u as any)[0]["assigned_to_id"],
            requirement_submit_date: ((u as any)[0]["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)[0]["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)[0]["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            requirement_status: (u as any)[0]["requirement_status"],
            docId: (u as any)[1],
            requirementType: (u as any)[0]["requirementType"], // Preserve the requirementType
            process_type: (u as any)[0]["process_type"]
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
            assigned_to_id:(u as any)[0]["assigned_to_id"],
            requirement_submit_date: ((u as any)[0]["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)[0]["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)[0]["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            requirement_status: (u as any)[0]["requirement_status"],
            docId: (u as any)[1],
            requirementType: "sent", // Since this is the current user's data, it's always "sent"
            process_type: (u as any)[0]["process_type"]
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
        await handleFetchGroupRequirements();
      }
    }

    if (uid === "") {
      fetch();
    }
  });

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
    const matchesStatus = status === "" || String(u.requirement_status) === String(status);

    // Filter by process type
    const matchesProcessType = process_type === "" || String(u.process_type) === String(process_type);process_type
    // Filter by date range
    const matchesDate = date === "" && endDate === "" || compareDates(date, u.requirement_submit_date, endDate);
    return matchesStatus && matchesDate && matchesProcessType;
  });

  // Filtered data
  const filteredGroupRequirements = groupRequirements.filter((u) => {
    // Filter by requirement type if it's an admin or IT support
    if ((isAdmin || isITSupport) && requirementTypeFilter !== "all") {
      if (requirementTypeFilter === "sent" && u.requirementType !== "sent") return false;
      if (requirementTypeFilter === "received" && u.requirementType !== "received") return false;
    }
    
    // Filter by status
    const matchesStatus = status === "" || String(u.requirement_status) === String(status);status
    // Filter by process type
    const matchesProcessType = process_type === "" || String(u.process_type) === String(process_type);process_type
    // Filter by date range
    const matchesDate = date === "" && endDate === "" || compareDates(date, u.requirement_submit_date, endDate);
    return matchesStatus && matchesDate && matchesProcessType;
  });
  
  // Ordenación dinámica
  const sortedRequirements = [...filteredRequirements].sort((a, b) => {
    for (const col in order) {
      if (order[col as keyof Order] !== 0) {
        if (typeof (a as any)[col] === "string" && typeof (b as any)[col] === "string") {
          return order[col as keyof Order] * ((a as any)[col].toLowerCase() > (b as any)[col].toLowerCase() ? 1 : -1);
        } else {
          return order[col as keyof Order] * ((a as any)[col] > (b as any)[col] ? 1 : -1);
        }
      }
    }
    return 0;
  });


  //console.log("f",groupRequirements)
  // Ordenación dinámica
  const sortedGroupRequirements = [...filteredRequirements, ...filteredGroupRequirements].sort((a, b) => {
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

  const handleFetchGroupRequirements = async () =>{
    const requirementsData = await getCurrGroupRequirementsData();
      if(requirementsData) {
        setUid("a");
        const tasks = requirementsData.map((u) => {
          return {  
            submitter_id: (u as any)[0]["submitter_id"],
            requirement_id: (u as any)[0]["requirement_id"],
            assigned_to_id:(u as any)[0]["assigned_to_id"],
            requirement_submit_date: ((u as any)[0]["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)[0]["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)[0]["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            requirement_status: (u as any)[0]["requirement_status"],
            docId: (u as any)[1],
            requirementType: "sent", // Since this is the current user's data, it's always "sent"
            process_type: (u as any)[0]["process_type"]
          }
        }); 
        setGroupRequirements(tasks);

      } else {
        console.log("nothing retrieved :(");
        setGroupRequirements([]);
      }
  }

  const handleRequirement = async (requirement_id:number) =>{
    localStorage.setItem("requirement_id", requirement_id.toString());
    window.location.href = "trackrequirements/requirementinfo";
  }
  
  // Alternar orden y resetear las demás columnas
  const handleSort = (col: keyof Order) => {
    setOrder((o) => {
      const newOrder: Order = { requirement_id: 0, requirement_submit_date: 0, requirement_status: 0, submitter_id: 0, process_type: 0 };
      if(o[col] >= 0)
        newOrder[col] = -1;
      else
        newOrder[col] = 1
      return newOrder;
    });
  };

  // Get the appropriate page title based on filter selection
  const getPageTitle = () => 
  {
    if (isAdmin || isITSupport) {
      if (requirementTypeFilter === "all") return "All Requirements";
      if (requirementTypeFilter === "sent") return "My Requirements";
      if (requirementTypeFilter === "received") return "Requirements Assigned to Me";
    }
    return "My Requirements";
  };

   // Define status priority order
   const statusOrder: Record<string, number> = 
   {
    "Group": 0,
    "Personal": 1
  };

  //console.log(sortedGroupRequirements)

    // Group incidents by status
    const groupedReqs = groupByGroup ? 
    sortedGroupRequirements.reduce<Record<string, any[]>>((groups, requirement) => {
      const group = (Number(requirement.assigned_to_id) < -1) ? "Group" : "Personal";
      if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(requirement);
        return groups;
      }, {}) : 
    {};

    // Order the status groups by priority
  const orderedStatusGroups = groupByGroup ? 
  Object.keys(groupedReqs).sort((a, b) => {
    return (statusOrder[a] || 999) - (statusOrder[b] || 999);
  }) : 
  [];

  //console.log(orderedStatusGroups);

     // Helper function to get a background color for each status group
  const getGroupColor = (status: string) => {
    switch (status) {
      case 'Personal': return "bg-white";
      case 'Group': return "bg-blue-50";
      default: return "bg-white";
    }
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
            
            {/* Horizontally aligned filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Requirement Type Filter - Only for Admin and IT users */}
              {(isAdmin || isITSupport) && (
                <div className="w-full">
                  <label htmlFor="requirementType" className="block text-black mb-2">Requirement Type:</label>
                  <select
                    id="requirementType"
                    className="w-full text-black border rounded px-4 py-2 h-10"
                    value={requirementTypeFilter}
                    onChange={(e) => setRequirementTypeFilter(e.target.value)}
                  >
                    <option value="all">All Requirements</option>
                    <option value="sent">Requirements I Submitted</option>
                    <option value="received">Requirements Assigned to Me</option>
                  </select>
                </div>
              )}
              
              {/* Process Type Filter */}
              <div className="w-full">
                <label htmlFor="requirement_process" className="block text-black mb-2">Requirement Process:</label>
                <select
                  id="requirement_process"
                  className="w-full text-black border rounded px-4 py-2 h-10"
                  value={process_type}
                  onChange={(e) => setProcessType(e.target.value)}
                >
                  <option value="">Not sure</option>
                  <option value="New">New</option>
                  <option value="Enhanced">Enhanced</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full">
                <label htmlFor="requirement_status" className="block text-black mb-2">Requirement Status:</label>
                <select
                  id="requirement_status"
                  className="w-full text-black border rounded px-4 py-2 h-10"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Sent">Sent</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              
              {/* Start Date Filter */}
              <div className="w-full">
                <label htmlFor="start_date" className="block text-black mb-2">Start Date:</label>
                <input
                  id="start_date"
                  type="date"
                  className="w-full text-black border rounded px-4 py-2 h-10"
                  value={date}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              {/* End Date Filter */}
              <div className="w-full">
                <label htmlFor="end_date" className="block text-black mb-2">End Date:</label>
                <input
                  id="end_date"
                  type="date"
                  className="w-full text-black border rounded px-4 py-2 h-10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              </div>


            {/* Grouping toggle */}
            <div className="mt-4 ml-2">
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={groupByGroup}
                  onChange={() => setGroupByGroup(!groupByGroup)}
                  className="mr-2"
                />
                <span>Show Requirements Assigned to my Group(s)</span>
              </label>
            </div>
        </fieldset> 
        </form>
      </div>
      
      <main className="overflow-x-auto bg-white shadow-md rounded-lg p-6">
        {groupByGroup ? (
          // Grouped display
          <div>
            {orderedStatusGroups.length > 0 ? (
              orderedStatusGroups.map(statusGroup => (
                <div key={statusGroup} className="mb-6">
                  <h3 className={`text-lg font-bold p-2 ${getGroupColor(statusGroup)} rounded-t-lg border-b border-gray-300 text-black`}>
                    {statusGroup} ({groupedReqs[statusGroup].length})
                  </h3>
                  
                  <table className={`min-w-full text-black ${getGroupColor(statusGroup)}`}>
                    <thead>
                      <tr>
                        
                        <th className="px-4 py-2 text-left">
                          Type</th>
                          <th className="px-4 py-2 text-left">Requirement ID</th>
                        <th className="px-4 py-2 text-left">
                          Report Date
                          <button onClick={() => handleSort("requirement_submit_date")} className="px-4 py-2 text-left">
                            <span>{order["requirement_submit_date"] >= 0 ? '>' : '<'}</span>
                          </button>
                        </th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Submitter ID</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedReqs[statusGroup].map((u, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          {isITSupport && (
                            <td className="px-4 py-2">
                              {u.requirementType === "received" ? "Assigned to me" : "Sent"}
                            </td>
                          )}

                  <td className="px-4 py-2">{u.requirement_id}</td>
                  <td className="px-4 py-2">{String(u.requirement_submit_date)}</td>
                  <td className="px-4 py-2">{u.requirement_status}</td>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <div className="text-center text-black py-8">
                No incidents found matching your criteria
              </div>
            )}
          </div>

        ) : (
      <table className="min-w-full text-gray-800">
      <thead>
            <tr>
              {/* Type column only for Admin/IT users */}
              {(isAdmin || isITSupport) && (
                <th className="px-4 py-2 text-left">Type</th>
              )}
              <th className="px-4 py-2 text-left">Requirement ID</th>
              <th className="px-4 py-2 text-left">
                Submit Date
                <button
                  onClick={() => handleSort("requirement_submit_date")}
                  className="px-4 py-2 text-left"
                >
                  <span>{order["requirement_submit_date"] >= 0 ? '>' : '<'}</span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">
                Status
                <button
                  onClick={() => handleSort("requirement_status")}
                  className="px-4 py-2 text-left"
                >
                  <span>{order["requirement_status"] >= 0 ? '>' : '<'}</span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">
                Process Type
                <button
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
                  <td className="px-4 py-2">{u.requirement_status}</td>
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
                <td colSpan={(isAdmin || isITSupport) ? 7 : 6} className="px-4 py-4 text-center text-gray-500">
                  No requirements found matching your criteria
                </td>
              </tr>
        )}
      
        </tbody>
      </table>
    )}
    </main>
    </div>
    );
  }
export default MainPage;