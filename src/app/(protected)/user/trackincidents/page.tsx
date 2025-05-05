"use client";
import React, { useEffect, useState } from 'react';
import { getCookie } from "../../../../hooks/cookies";
import { getCurrUserIncidentsData, getITUserIncidentsData, getCurrGroupIncidentsData, setAssignedToTicket, getCurrUserId } from '../../../../hooks/db.js';
type Incident = {
  title: string,
  description: string,
  incident_id: number,
  incident_status: string,
  incident_report_date: string,
  incidentType?: string,
  submitter_id: number,
  assigned_to_id:number, 
  docId:string 
}[];

type Order = {
  title: number,
  incident_status: number,
  incident_report_date: number,
  reporter_id: number
};

const MainPage: React.FC = () => {
  const [uid, setUid] = useState("");
  const [incidents, setIncidents] = useState<Incident>([]);
  const [groupRequirements, setGroupRequirements] = useState<Incident>([]);
  const [order, setOrder] = useState<Order>({
    'title': 0,
    'incident_status': 0,
    'incident_report_date': 0,
    'reporter_id': 0
  });
  const [date, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [curr_id, setCurrId] = useState();
  const [isITSupport, setIsITSupport] = useState(false);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState("all"); // "all", "sent", or "received"
  const [roleChecked, setRoleChecked] = useState(false);// Wait for role to be determined
  const [groupChecked, setGroupChecked] = useState("all");// Wait for role to be determined

  const [formData, setFormData] = useState({
    title: "",
    incident_report_date: ""
  });

   // Check user role when component mounts
  useEffect(() => {
    const fetch = async (): Promise<void> => {    
      const roleCookie = await getCookie("role");
      setIsITSupport(roleCookie?.value === "IT");
      setRoleChecked(true); // Set roleChecked to true after checking role
      
    }
    fetch();
    }, []);
  

  const handleFetchAll = async (): Promise<void> => {
    const user_id = await getCurrUserId();
    setCurrId(user_id);
    if (isITSupport) {
      // IT users get both sent and received incidents
      const incidentsData = await getITUserIncidentsData();
      if (incidentsData && incidentsData.length > 0) {
        setUid("a");
        const tasks = incidentsData.map((u) => {
          return {
            title: (u as any)[0]["title"],
            description: (u as any)[0]["description"],
            incident_id: (u as any)[0]["incident_id"],
            incident_report_date: ((u as any)[0]["incident_report_date"].toDate().getFullYear()).toString() + '-'
              + ((u as any)[0]["incident_report_date"].toDate().getMonth() + 1).toString().padStart(2, "0") + '-'
              + ((u as any)[0]["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
            incident_status: (u as any)[0]["incident_status"],
            incidentType: (u as any)[0]["incidentType"],
            submitter_id: (u as any)[0]["reporter_id"],
            assigned_to_id:(u as any)[0]["assigned_to_id"],
            docId: (u as any)[1],
          };
        });
        setIncidents(tasks);
      } else {
        console.log("No incidents retrieved for IT user");
        setIncidents([]);
      }
    } else {
      const incidentsData = await getCurrUserIncidentsData();
      if (incidentsData && incidentsData.length > 0) {
        setUid("a");
        const tasks = incidentsData.map((u) => {
          return {
            title: (u as any)[0]["title"],
            description: (u as any)[0]["description"],
            incident_id: (u as any)[0]["incident_id"],
            incident_report_date: ((u as any)[0]["incident_report_date"].toDate().getFullYear()).toString() + '-'
              + ((u as any)[0]["incident_report_date"].toDate().getMonth() + 1).toString().padStart(2, "0") + '-'
              + ((u as any)[0]["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
            incident_status: (u as any)[0]["incident_status"],
            submitter_id: (u as any)[0]["reporter_id"],
            assigned_to_id:(u as any)[0]["assigned_to_id"],
            docId: (u as any)[1],
          };
        });
        setIncidents(tasks);
      } else {
        console.log("nothing retrieved :(");
      }
    }
  };


    const handleFetchGroupRequirements = async () =>{
      const requirementsData = await getCurrGroupIncidentsData();
        if(requirementsData) {
          setUid("a");
          const tasks = requirementsData.map((u) => {
            return {  
              title: (u as any)[0]["title"],
              submitter_id: (u as any)[0]["reporter_id"],
              incident_id: (u as any)[0]["incident_id"],
              assigned_to_id:(u as any)[0]["assigned_to_id"],
              incident_report_date: ((u as any)[0]["incident_report_date"].toDate().getFullYear()).toString()+'-'
              +((u as any)[0]["incident_report_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
              + ((u as any)[0]["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
              incident_status: (u as any)[0]["incident_status"],
              docId: (u as any)[1],
              incidentType: "sent", // Since this is the current user's data, it's always "sent"
              description: (u as any)[0]["description"]
            }
          }); 
          setGroupRequirements(tasks);
  
        } else {
          console.log("nothing retrieved :(");
          setGroupRequirements([]);
        }
    }
  

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

  const filteredIncidents = incidents.filter((incident) => {
    if (isITSupport && incidentTypeFilter !== "all") {
      if (incidentTypeFilter === "sent" && incident.incidentType !== "sent") return false;
      if (incidentTypeFilter === "received" && incident.incidentType !== "received") return false;
    }

    const matchesTitle = formData.title === "" || incident.title.toLowerCase().includes(formData.title.toLowerCase());
    const matchesStatus = status === "" || String(incident.incident_status) === String(status);
    const matchesDate = date === "" && endDate === "" || compareDates(date, incident.incident_report_date, endDate);
      
    return matchesTitle && matchesStatus && matchesDate;
  });

  // Define status priority order
  const statusOrder: Record<string, number> = {
    "Escalated": 1,
    "In Progress": 2,
    "Assigned": 3,
    "Sent": 4,
    "Resolved": 5
  };

   // Filtered data
   const filteredGroupIncidents = groupRequirements.filter((u) => {
    // Filter by requirement type if it's an admin or IT support
    if ((isITSupport) && incidentTypeFilter !== "all") {
      if (incidentTypeFilter === "sent" && u.incidentType !== "sent") return false;
      if (incidentTypeFilter === "received" && u.incidentType !== "received") return false;
    }
    
    // Filter by status
    const matchesStatus = status === "" || String(u.incident_status) === String(status);
    // Filter by process type
    //const matchesProcessType = process_type === "" || String(u.process_type) === String(process_type);process_type
    // Filter by date range
    const matchesDate = date === "" && endDate === "" || compareDates(date, u.incident_report_date, endDate);
    return matchesStatus && matchesDate; //&& matchesProcessType;
  });
  

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    // If statuses are the same, use other sorting criteria
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

  // Group incidents by status
  const groupedIncidents = (groupChecked === "group_status") ? 
    sortedIncidents.reduce<Record<string, any[]>>((groups, incident) => {
      const status = incident.incident_status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(incident);
      return groups;
    }, {}) : 
    {};

  // Order the status groups by priority
  const orderedStatusGroups = (groupChecked === "group_status") ? 
    Object.keys(groupedIncidents).sort((a, b) => {
      return (statusOrder[a] || 999) - (statusOrder[b] || 999);
    }) : 
    [];

    const together = [...filteredIncidents, ...filteredGroupIncidents].filter(
      (obj, index, self) =>
        index === self.findIndex((o) => o.incident_id === obj.incident_id)
    );
    console.log(together);

    const sortedGroupRequirements = together.sort((a, b) => {
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
  
  
    // Group incidents by status
    const groupedReqs = (groupChecked === "group_group" )? 
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
  const orderedGroups = (groupChecked === "group_group" ) ? 
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


  const handleIncident = async (incident_id: number) => {
    localStorage.setItem("incident_id", incident_id.toString());
    window.location.href = "trackincidents/incidentinfo";
  };


  const successBox = (): boolean => {
    const confirmUpdate = confirm("Confirm changes?");
    return(confirmUpdate);
    }

  const handleClaim = async(assignedCurrent: number, ticketDocID:string, reporterID: number) => {    
    const curr_id = await getCurrUserId();
  if(curr_id === assignedCurrent)
    return 0;
  else{
    if(curr_id === reporterID)
    {
      alert("A reporter can not be assigned its own ticket.");
    }
    else{
    try {  
      const confirmation = successBox();
      if(confirmation === true)
      {
      
        const response = await setAssignedToTicket(curr_id, ticketDocID, "Incident");
        if(response === 0)
        {
          alert("Information Updated!");
          window.location.href = "/user/trackincidents";
          return
        } 
        else
          alert("An error occurred.");
      }
      else
          alert("No change was made.");
      //handleFetchAll();
    }
    catch (err) {
        console.error("Error updating information:", err);
    }
  }
  }
  window.location.reload();
  }


  const handleSort = (col: keyof Order) => {
    setOrder((o) => {
      const newOrder: Order = { title: 0, incident_report_date: 0, incident_status: 0, reporter_id: 0 };
      if (o[col] >= 0)
        newOrder[col] = -1;
      else
        newOrder[col] = 1;
      return newOrder;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
 
  const getPageTitle = () => {
    if (isITSupport) {
      if (incidentTypeFilter === "all") return "All Incidents";
      if (incidentTypeFilter === "sent") return "My Reported Incidents";
      if (incidentTypeFilter === "received") return "Incidents Assigned to Me";
    }
    return "My Incidents";
  };

  // Helper function to get a background color for each status group
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Escalated": return "bg-red-50";
      case "In Progress": return "bg-blue-50";
      case "Assigned": return "bg-yellow-50";
      case "Sent": return "bg-gray-50";
      case "Resolved": return "bg-green-50";
      default: return "bg-white";
    }
  };

  if (!roleChecked) return <div className="text-black p-4">Loading...</div>; //  Prevent render until role is known

  return (
    <div>
      <div key="1" className="text-black p-4">
        <h1 className="text-[2rem] font-bold">{getPageTitle()}</h1>
      </div>
      <div key="2">
      <form>
          <fieldset>
            <legend className="text-black font-semibold text-lg mb-4">Filter Incidents</legend>
            
            {/* IT Support specific filters - only show for IT role */}
            {isITSupport && (
              <div className="mb-4">
                <label className="block text-black mb-2">Incident Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="incidentType"
                      value="all"
                      checked={incidentTypeFilter === "all"}
                      onChange={() => setIncidentTypeFilter("all")}
                      className="mr-2"
                    />
                    <span className="text-black">All Incidents</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="incidentType"
                      value="sent"
                      checked={incidentTypeFilter === "sent"}
                      onChange={() => setIncidentTypeFilter("sent")}
                      className="mr-2"
                    />
                    <span className="text-black">Incidents I Reported</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="incidentType"
                      value="received"
                      checked={incidentTypeFilter === "received"}
                      onChange={() => setIncidentTypeFilter("received")}
                      className="mr-2"
                    />
                    <span className="text-black">Incidents Assigned to Me</span>
                  </label>
                </div>
              </div>
            )}

            {/* IT Support specific filters - only show for IT role */}
            {isITSupport && (
              <div className="mb-4">
                <label className="block text-black mb-2">Incident Grouping</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="groupChecked"
                      value="all"
                      checked={groupChecked === "all"}
                      onChange={() => setGroupChecked("all")}
                      className="mr-2"
                    />
                    <span className="text-black">All Incidents</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="groupChecked"
                      value="group_status"
                      checked={groupChecked === "group_status"}
                      onChange={() => setGroupChecked("group_status")}
                      className="mr-2"
                    />
                    <span className="text-black">Group by status</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="groupChecked"
                      value="group_group"
                      checked={groupChecked === "group_group"}
                      onChange={() => setGroupChecked("group_group")}
                      className="mr-2"
                    />
                    <span className="text-black">Incident Assigned to my Group(s)</span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Horizontal filter layout with consistent sizing */}
            <div className="flex items-end space-x-8 ml-2">
              <div>
                <label htmlFor="title" className="block mb-2">
                  <span className="text-black">Search for Title</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  onChange={handleChange}
                  value={formData.title}
                  className="text-black border rounded px-4 py-2 w-64"
                />
              </div>
              
              <div>
                <label htmlFor="incident_status" className="block mb-2">
                  <span className="text-black">Search for Incident Status</span>
                </label>
                <select
                  id="incident_status"
                  className="text-black border rounded px-4 py-2 w-64 h-10"
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
              
              <div>
                <label htmlFor="start_date" className="block mb-2">
                  <span className="text-black">Initial Date</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  className="text-black border rounded px-4 py-2 w-64"
                  value={date}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="end_date" className="block mb-2">
                  <span className="text-black">End Date</span>
                </label>
                <input
                  type="date"
                  id="end_date"
                  className="text-black border rounded px-4 py-2 w-64"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Grouping toggle 
            <div className="mt-4 ml-2">
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={groupByStatus}
                  onChange={() => setGroupByStatus(!groupByStatus)}
                  className="mr-2"
                />
                <span>Group incidents by status</span>
              </label>
            </div>
             Grouping toggle 
            <div className="mt-4 ml-2">
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={groupByGroup}
                  onChange={() => setGroupByGroup(!groupByGroup)}
                  className="mr-2"
                />
                <span>Show Incidents Assigned to my Group(s)</span>
              </label>
            </div>*/}
        </fieldset> 
        </form>
      </div>
      
      <main className="overflow-x-auto bg-white shadow-md rounded-lg p-6 mt-8">
        {groupChecked === "group_group" ? (
          // Grouped display
          <div>
            {orderedGroups.length > 0 ? (
              orderedGroups.map(statusGroup => (
                <div key={statusGroup} className="mb-6">
                  <h3 className={`text-lg font-bold p-2 ${getGroupColor(statusGroup)} rounded-t-lg border-b border-gray-300 text-black`}>
                    {statusGroup} ({groupedReqs[statusGroup].length})
                  </h3>
                  
                  <table className={`min-w-full text-black ${getGroupColor(statusGroup)}`}>
                    <thead>
                      <tr>
                        
                        <th className="px-4 py-2 text-left">
                          Type</th>
                          <th className="px-4 py-2 text-left">Incident ID</th>
                        <th className="px-4 py-2 text-left">
                          Report Date
                          <button onClick={() => handleSort("incident_report_date")} className="px-4 py-2 text-left">
                            <span>{order["incident_report_date"] >= 0 ? '>' : '<'}</span>
                          </button>
                        </th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Submitter ID</th>
                        {statusGroup === "Group" && <th className="px-4 py-2 text-left">Claim</th>}
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedReqs[statusGroup].map((u, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          {isITSupport && (
                            <td className="px-4 py-2">
                              {u.incidentType === "received" ? "Assigned to me" : "Sent"}
                            </td>
                          )}

                        <td className="px-4 py-2">{u.incident_id}</td>
                        <td className="px-4 py-2">{String(u.incident_report_date)}</td>
                        <td className="px-4 py-2">{u.incident_status}</td>
                        <td className="px-4 py-2">{u.submitter_id}</td>
                        {statusGroup === "Group" &&<td className="px-4 py-2">
                    {u.submitter_id === curr_id ? <button
                                    onClick={() => handleClaim(u.assigned_to_id, u.docId, u.submitter_id)}
                                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    type="button"
                                    disabled={true}
                                  >
                                    Claim
                                  </button> :  <button
                                    onClick={() => handleClaim(u.assigned_to_id, u.docId, u.submitter_id)}
                                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    type="button"
                                  >
                                    Claim
                                  </button>}

                                </td>}
                        <td className="px-4 py-2">
                                <button
                                onClick={() => handleIncident(u.incident_id)}
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

        ) : groupChecked === "group_status" ? (
          // Grouped display
          <div>
            {orderedStatusGroups.length > 0 ? (
              orderedStatusGroups.map(statusGroup => (
                <div key={statusGroup} className="mb-6">
                  <h3 className={`text-lg font-bold p-2 ${getStatusColor(statusGroup)} rounded-t-lg border-b border-gray-300 text-black`}>
                    {statusGroup} ({groupedIncidents[statusGroup].length})
                  </h3>
                  
                  <table className={`min-w-full text-black ${getStatusColor(statusGroup)}`}>
                    <thead>
                      <tr>
                        {isITSupport && <th className="px-4 py-2 text-left">Type</th>}
                        <th className="px-4 py-2 text-left">
                          Title
                          <button onClick={() => handleSort("title")} className="px-4 py-2 text-left">
                            <span>{order["title"] >= 0 ? '>' : '<'}</span>
                          </button>
                        </th>
                        <th className="px-4 py-2 text-left">
                          Report Date
                          <button onClick={() => handleSort("incident_report_date")} className="px-4 py-2 text-left">
                            <span>{order["incident_report_date"] >= 0 ? '>' : '<'}</span>
                          </button>
                        </th>
                        <th className="px-4 py-2 text-left">Incident ID</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedIncidents[statusGroup].map((incident, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          {isITSupport && (
                            <td className="px-4 py-2">
                              {incident.incidentType === "received" ? "Assigned to me" : "Reported by me"}
                            </td>
                          )}
                          <td className="px-4 py-2">{incident.title}</td>
                          <td className="px-4 py-2">{String(incident.incident_report_date)}</td>
                          <td className="px-4 py-2">{incident.incident_id}</td>
                          <td className="px-4 py-2">{incident.description}</td>

                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleIncident(incident.incident_id)}
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
          // Non-grouped display (original table)
          <table className="min-w-full text-black">
            <thead>
              <tr>
                {isITSupport && <th className="px-4 py-2 text-left">Type</th>}
                <th className="px-4 py-2 text-left">
                  Title
                  <button onClick={() => handleSort("title")} className="px-4 py-2 text-left">
                    <span>{order["title"] >= 0 ? '>' : '<'}</span>
                  </button>
                </th>
                <th className="px-4 py-2 text-left">
                  Report Date
                  <button onClick={() => handleSort("incident_report_date")} className="px-4 py-2 text-left">
                    <span>{order["incident_report_date"] >= 0 ? '>' : '<'}</span>
                  </button>
                </th>
                <th className="px-4 py-2 text-left">
                  Status
                  <button onClick={() => handleSort("incident_status")} className="px-4 py-2 text-left">
                    <span>{order["incident_status"] >= 0 ? '>' : '<'}</span>
                  </button>
                </th>
                <th className="px-4 py-2 text-left">Incident ID</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedIncidents.length > 0 ? (
                sortedIncidents.map((incident, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    {isITSupport && (
                      <td className="px-4 py-2">
                        {incident.incidentType === "received" ? "Assigned to me" : "Reported by me"}
                      </td>
                    )}
                    <td className="px-4 py-2">{incident.title}</td>
                    <td className="px-4 py-2">{String(incident.incident_report_date)}</td>
                    <td className="px-4 py-2">{incident.incident_status}</td>
                    <td className="px-4 py-2">{incident.incident_id}</td>
                    <td className="px-4 py-2">{incident.description}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleIncident(incident.incident_id)}
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
                  <td colSpan={isITSupport ? 7 : 6} className="px-4 py-4 text-center text-black">
                    No incidents found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default MainPage;