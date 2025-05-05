"use client";
import React, { useEffect, useState } from 'react';
import { getCookie } from '../../../hooks/cookies';
import { getUnassignedRequirementsData, getUnassignedIncidentsData, 
  getUserDatawithId, setAssignedToTicket, getITAdminsData, getAllGroups, getCurrUserId } from '../../../hooks/db.js';
type Requirement = {
  reporter_id:number,
  report_date:string,
  id:number,
  assigned_to_id?:number,
  status:string,
  ticketType:string,
  reporter_name:string,
  docID:string
}[];


type Group = {
  name:string,
  id:number
}[];

type Order = {
  reporter_id:number,
  requirement_submit_date:number,
  requirement_id:number,
  requirement_status:number,
  ticketType:number,
  reporter_name:number
};  

type User = {
  id:number,
  name:string,
  last_name_1:string
}[]; 



const MainPage: React.FC = () => {

  const [uid, setUid] = useState("");
  const [requirements, setRequirements] = useState<Requirement>([]);
  const [groups, setGroups] = useState<Group>([]);
  const [order, setOrder] = useState<Order>({
    requirement_id: 0, requirement_submit_date: 0, requirement_status: 0, reporter_id: 0, ticketType: 0, reporter_name:0});
  const [date, setStartDate] = useState("");
  const [assignableUsers, setAssignableUsers] = useState<User>([]);
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isITSupport, setIsITSupport] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false); // Wait for role to be determined
  const [formData, setFormData] = useState({
    Reporter: ""
  });
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

  


  const handleFetchRequirements = async (): Promise<Requirement> => { 
    const requirementsData = await getUnassignedRequirementsData();
      if(requirementsData && requirementsData.length > 0) {
        setUid("a");
        const tasks = requirementsData.map((u) => {
          return {
            id: (u as any)[0]["requirement_id"],
            report_date: ((u as any)[0]["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)[0]["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)[0]["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            status: (u as any)[0]["requirement_status"],
            reporter_id: (u as any)[0]["submitter_id"],
            ticketType: "Requirement",
            docID: (u as any)[1]
          };
        });

      const ticket_requirements = await Promise.all(tasks.map(async (u) => {
        const fullName = await getFullName(u.reporter_id);
          return {
            ...u,
            reporter_name: fullName ?? "Unknown"
          };
        }));

        return(ticket_requirements);
      
    } 
    else 
    {
      console.log("No unassigned requirements retrieved for Admin/IT user");
      return([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFetchGroups = async()=>
      {
        const groups = await getAllGroups();
          if(groups && groups.length > 0) {
            const gs = groups.map((u) => {
              return {
                id: (u as any)["id"],
                name: (u as any)["name"]
              };
            });
  

            setGroups(gs);
            
          } else {
            console.log("No groups retrieved.");
            setGroups([]);
          }
      }
    
   

  const handleFetchIncidents = async(): Promise<Requirement>=>
  {
    const incidentsData = await getUnassignedIncidentsData();
      if(incidentsData && incidentsData.length > 0) {
        setUid("a");
        const tasks2 = incidentsData.map((u) => {
          return {
            id: (u as any)[0]["incident_id"],
            report_date: ((u as any)[0]["incident_report_date"].toDate().getFullYear()).toString() + '-'
              + ((u as any)[0]["incident_report_date"].toDate().getMonth() + 1).toString().padStart(2, "0") + '-'
              + ((u as any)[0]["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
            status: (u as any)[0]["incident_status"],
            Type: (u as any)[0]["incidentType"],
            reporter_id:(u as any)[0]["reporter_id"],
            ticketType: "Incident",
            docID:(u as any)[1]
          };
        });

        const ticket_incidents = await Promise.all(tasks2.map(async (u) => {
          const fullName = await getFullName(u.reporter_id);
          return {
            ...u,
            reporter_name: fullName ?? "Unknown"
          };
        }));
        return(ticket_incidents);
        
      } else {
        
        console.log("No unassigned incidents retrieved for Admin/IT user");
        return([]);
      }
  }

  const handleFetchITAdmins = async (): Promise<void> => 
  { 
    const data = await getITAdminsData();
      if(data && data.length > 0) 
      {
        const itadmins = data.map((u) => 
        {
          return {
            id: (u as any)[0]["id"],
            name: (u as any)[0]["name"],
            last_name_1: (u as any)[0]["last_name_1"],
            docID: (u as any)[1]
          };
        });
        
        
        setAssignableUsers(itadmins);
      }
      else
      {
        setAssignableUsers([]);
      }
  }

  

  useEffect(() => {
    const fetch = async(): Promise<void> => {
      if (roleChecked) {
        const inc = await handleFetchIncidents();
        const req =  await handleFetchRequirements();

        if(inc && inc.length > 0)
        {
          if(req && req.length >0)
          {
            setRequirements([...req, ...inc]);
          }
          else
          {
            setRequirements(inc);
          }
        }
        else
        {
          if(req && req.length >0)
            {
              setRequirements(req);
            }
            else
            {
              setRequirements([]);
        }

        }
      }
      await handleFetchGroups();
      await handleFetchITAdmins();
      
      
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
    // Filter by status
    const matchesStatus = status === "" || String(u.status) === String(status);status

    // Filter by reporter
    const matchesReporter = formData["Reporter"] === "" || String(u.reporter_name).toLowerCase().includes(formData["Reporter"].toLowerCase());

    // Filter by process type
    const matchesTicketType = ticketType === "" || String(u.ticketType) === String(ticketType);ticketType;
    
    // Filter by date range
    const matchesDate = date === "" && endDate === "" || compareDates(date, u.report_date, endDate);
    
    return matchesStatus && matchesDate && matchesTicketType && matchesReporter;
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

  const handleTicket = async (ticket_id:number, ticketType:string) =>{
    if(ticketType === 'Requirement')
    {
      localStorage.setItem("requirement_id", ticket_id.toString());
      window.location.href = "trackrequirements/requirementinfo";
    }
    else if(ticketType === 'Incident')
    {
      localStorage.setItem("incident_id", ticket_id.toString());
      window.location.href = "user/trackincidents/incidentinfo";
    }
  }

  const getFullName = async (user_id:number) =>{
    const subs = await getUserDatawithId(user_id);
    if(subs && subs.length > 0)
    {
      return(subs[0].name.toString() + " "+ subs[0].last_name_1.toString())
    }
    else
      console.log("nothing retrieved 3 :(");
  }

  // Alternar orden y resetear las demás columnas
  const handleSort = (col: keyof Order) => {
    setOrder((o) => {
      const newOrder: Order = { requirement_id: 0, requirement_submit_date: 0, requirement_status: 0, reporter_id: 0, ticketType: 0, reporter_name:0 };
      if(o[col] >= 0)
        newOrder[col] = -1;
      else
        newOrder[col] = 1
      return newOrder;
    });
  };

const successBox = (): boolean => {
    const confirmUpdate = confirm("Confirm changes?");
    return(confirmUpdate);
    }

const handleChangeAssignedTo = async(assignedID: number, assignedCurrent: number, ticketDocID:string, ticketType:string, reporterID: number) => {    
if(assignedID === assignedCurrent)
  return 0;
else{
  if(assignedID === reporterID)
  {
    alert("A reporter can not be assigned its own ticket.");
  }
  else{
  try {  
    const confirmation = successBox();
    if(confirmation === true)
    {
    
      const response = await setAssignedToTicket(assignedID, ticketDocID, ticketType);
      if(response === 0)
      {
        alert("Information Updated!");
        window.location.href = "/assigntickets";
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


  // Get the appropriate page title based on filter selection
  const getPageTitle = () => {
    /*if (isAdmin || isITSupport) {
      if (requirementTypeFilter === "all") return "All Unassigned Tickets";
      if (requirementTypeFilter === "sent") return "My Requirements";
      if (requirementTypeFilter === "received") return "Tickets Assigned to Me";
    }*/
    return "Unassigned Tickets";
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
          
          <legend className="text-black font-semibold text-lg mb-4">Filter Tickets</legend>
              <div>

              <label htmlFor="ticketType" className="block mb-2">
              <p className="text-black mt-2">Search for Ticket Type</p>
              </label>
              
                {/* <select
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                >
                  <option defaultChecked value="">All</option>
                  <option value="Incident">Incident</option>
                  <option value="Requirement">Requirement</option>
                </select> */}

                <div className="flex space-x-8 mb-2">
                  <label className="flex items-center">
                      <input
                        type="radio"
                        name="ticketType"
                        value="all"
                        checked={ticketType === ""}
                        onChange={() => setTicketType("")}
                        className="mr-2"
                      />
                      <span className="text-black">All</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="incidentType"
                        value="sent"
                        checked={ticketType === "Incident"}
                        onChange={() => setTicketType("Incident")}
                        className="mr-2"
                      />
                      <span className="text-black">Incidents</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="incidentType"
                        value="received"
                        checked={ticketType === "Requirement"}
                        onChange={() => setTicketType("Requirement")}
                        className="mr-2"
                      />
                      <span className="text-black">Requirements</span>
                    </label>
                  </div>
              </div>
              
              <div className="flex items-end space-x-10 ml-2">
              <div>
                  <label htmlFor="Reporter" className="block mb-2">
                    <span className="text-black">Search for Reporter:</span>
                  </label>
                  <input
                    type="text"
                    id="Reporter"
                    name="Reporter"
                    onChange={handleChange}
                    value={formData.Reporter}
                    className="text-black border rounded px-4 py-2 mb-4 w-medium h-11"
                  />
              </div>
              <div>
                <label htmlFor="requirement_status" className="block mb-2">
                <p className="text-black mt-2">Search for Status:</p>
                </label>
                  <select
                    className="text-black border rounded px-4 py-2 mb-4 w-medium h-11"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option defaultChecked value="">All</option>
                    <option value="Sent">Sent</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                  </select>
              </div>
            
                <div>
                  <label className="block text-black mt-2 mb-2">Start Date:</label>
                  <input
                    type="date"
                    className="text-black border rounded px-4 py-2 mb-4 w-medium"
                    value={date}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                <label className="block text-black mt-2 mb-2">End Date:</label>
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
      <div>
      <table className="min-w-full text-gray-800">
      <thead>
            <tr>
              {/* Type column only for Admin/IT users */}
              <th className="px-4 py-2 text-left">Ticket ID</th>
              <th className="px-4 py-2 text-left">Reported Date<button
                            onClick={() => handleSort("requirement_submit_date")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["requirement_submit_date"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Status<button
                            onClick={() => handleSort("requirement_status")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["requirement_status"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Reporter
              <button
                onClick={() => handleSort("reporter_name")}
                className="px-4 py-2 text-left"
                >
                <span>{order["reporter_name"] >= 0 ? '>' : '<'}</span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">Ticket Type<button
                onClick={() => handleSort("ticketType")}
                className="px-4 py-2 text-left"
                >
                <span>{order["requirement_status"] >= 0 ? '>' : '<'}</span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">Assign Ticket</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
        <tbody>
            {sortedRequirements.length > 0 ? (
              sortedRequirements.map((u, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="px-4 py-2">{u.id}</td>
                  <td className="px-4 py-2">{String(u.report_date)}</td>
                  <td className="px-4 py-2">{u.status}</td>
                  <td className="px-4 py-2">{u.reporter_name}</td>
                  <td className="px-4 py-2">{u.ticketType}</td>

                <td className="px-4 py-2">
                  
                <select name="assigner" id="assigner"
                  onChange={(e) => handleChangeAssignedTo(Number(e.target.value), -1, u.docID, u.ticketType, u.reporter_id)}>
                  <optgroup label="Select Group to Assign Ticket">
                  {groups.length > 0 ? (
                  groups.map((v, index) => (
                    v.id === -1 ? <option defaultChecked key={index} value={v.id}>{v.name}</option>:
                     <option key={index} value={v.id}>{v.name}</option>))) : "No groups to show." }
                   </optgroup>
                  <optgroup label="Select Whom to Assign Ticket">
                    {assignableUsers.map((v,index)=>(
                      v.id !== u.reporter_id &&
                      <option key={index} value={Number(v.id)}>{v.name +" "+ v.last_name_1}</option>
                    ))}
                  </optgroup>
                  
                </select>
                </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleTicket(u.id, u.ticketType)}
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
    </div>
    </main>
  </div>




  );
}

export default MainPage;
