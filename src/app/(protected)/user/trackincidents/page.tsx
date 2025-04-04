"use client";
import React, { useEffect, useState } from 'react';
import { getCookie } from "../../../../hooks/cookies";
import { getCurrUserIncidentsData, getITUserIncidentsData } from '../../../../hooks/db.js';
type Incident = {
  title: string,
  description: string,
  incident_id: number,
  incident_status: string,
  incident_report_date: string,
  incidentType?: string  
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
  const [order, setOrder] = useState<Order>({
    'title': 0,
    'incident_status': 0,
    'incident_report_date': 0,
    'reporter_id': 0
  });
  const [date, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [isITSupport, setIsITSupport] = useState(false);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState("all"); // "all", "sent", or "received"
  const [roleChecked, setRoleChecked] = useState(false);// Wait for role to be determined

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
            incidentType: (u as any)[0]["incidentType"]
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
          };
        });
        setIncidents(tasks);
      } else {
        console.log("nothing retrieved :(");
      }
    }
  };

  useEffect(() => {
    const fetch = async (): Promise<void> => {
      await handleFetchAll();
    };

    if (uid === "") {
      fetch();
    }
  });

  const compareDates = (d1:string, d2:string, d3:string) => {
    return(d1 <= d2 && d2 <= d3);
  }
console.log(status);
  const filteredIncidents = incidents.filter((incident) => {
    if (isITSupport && incidentTypeFilter !== "all") {
      if (incidentTypeFilter === "sent" && incident.incidentType !== "sent") return false;
      if (incidentTypeFilter === "received" && incident.incidentType !== "received") return false;
    }

    const matchesTitle = formData.title === "" || incident.title.toLowerCase().includes(formData.title.toLowerCase());
    const matchesStatus = status === "" || String(incident.incident_status) === String(status);
    const matchesDate = date === "" && endDate === "" || compareDates(date, incident.incident_report_date, endDate) //&& incident.incident_report_date =<= endDate;
      

    return matchesTitle && matchesStatus && matchesDate;
  });


  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
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


  const handleIncident = async (incident_id: number) => {
    localStorage.setItem("incident_id", incident_id.toString());
    window.location.href = "trackincidents/incidentinfo";
  };


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
                <label className="block text-black mb-2">Incident Type:</label>
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
            
            <div className="flex space-x-4 mt-2">
              <div>
                <label htmlFor="title" className="block mb-2">
                  <p className="text-black mt-2">Search for Title:</p>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  onChange={handleChange}
                  value={formData.title}
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
                />
              </div>
              </div>
              
              <div>
              <label htmlFor="incident_status" className="block mb-2">
              <p className="text-black mt-2">Search for Incident Status:</p>
              </label>
                <select
                  className="text-black border rounded px-4 py-2 mb-4 w-medium"
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
            
            
            <div className="flex space-x-4 mt-2">
                <div>
                  <label className="block text dark:text-gray-700 mt-2">Initial Date</label>
                  <input
                    type="date"
                    className="text-black border rounded px-4 py-2 mb-4 w-medium"
                    value={date}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                <label className="block text dark:text-gray-700 mt-2">End Date</label>
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
              {isITSupport && (
                <th className="px-4 py-2 text-left">Type</th>
              )}
              <th className="px-4 py-2 text-left">Title
                <button
                  onClick={() => handleSort("title")}
                  className="px-4 py-2 text-left"
                >
                  <span>{order["title"] >= 0 ? '>' : '<'}</span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">Report Date
                <button
                  onClick={() => handleSort("incident_report_date")}
                  className="px-4 py-2 text-left"
                >
                  <span>{order["incident_report_date"] >= 0 ? '>' : '<'}</span>
                </button>
              </th>
              <th className="px-4 py-2 text-left">Status
                <button
                  onClick={() => handleSort("incident_status")}
                  className="px-4 py-2 text-left"
                >
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
                <tr 
                  key={index} 
                  className={`border-t border-gray-200` //${
                    // isITSupport && incident.incidentType === "received" 
                      // ? "bg-blue-50" 
                      // : ""
                  }//`}
                >
                  {/* Type column only for IT users */}
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
                <td colSpan={isITSupport ? 7 : 6} className="px-4 py-4 text-center text-gray-500">
                  No incidents found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default MainPage;