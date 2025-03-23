"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { getCurrUserIncidentsData} from '../../../../hooks/db.js'
import { auth } from '../../../../firebaseConfig.js';

type Incident = {
  reporter_id:number,
  title:string,
  description:string,
  incident_id:number,
  incident_status:string,
  incident_report_date:string,
  incident_start_date:string,
  business_impact:string,
  incident_logged:string,
  it_id:number,
  root_cause:string,
  stakeholder_details:string
  docId:number
}[];       //define the task type

type Order = {
  title:number,
  incident_status:number,
  incident_report_date:number,
  reporter_id:number
};  


const MainPage: React.FC = () => {

  const [uid, setUid] = useState("");
  const [incidents, setIncidents] = useState<Incident>([]);
  const [order, setOrder] = useState<Order>({'title':0,'incident_status': 0,'incident_report_date': 0,'reporter_id':0});
  const [date, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    incident_report_date:""
  });
  const [currUser, setCurrUser] = useState(auth.currentUser); // Start with initial auth state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user);
      setCurrUser(user); // Update state when user logs in/out
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  
  const handleFetchAll = async (): Promise<void> => { 
    const incidentsData = await getCurrUserIncidentsData();
    if(incidentsData)
    {
    setUid("a");
    const tasks = incidentsData.map((u) => {
      return {  //return data compatible with data types specified in the tasks variable 
          title: (u as any)[0]["title"] ,
          description: (u as any)[0]["description"],
          reporter_id: (u as any)[0]["reporter_id"],
          incident_id: (u as any)[0]["incident_id"],
          incident_report_date: ((u as any)[0]["incident_report_date"].toDate().getFullYear()).toString()+'-'
          +((u as any)[0]["incident_report_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
          + ((u as any)[0]["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
          incident_status: (u as any)[0]["incident_status"],

          incident_start_date:((u as any)[0]["incident_start_date"].toDate().getFullYear()).toString()+'-'
          +((u as any)[0]["incident_report_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
          + ((u as any)[0]["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
          business_impact:(u as any)[0]["business_impact"],
          incident_logged:(u as any)[0]["incident_logged"],
          it_id:(u as any)[0]["it_id"],
          root_cause:(u as any)[0]["root_cause"],
          stakeholder_details:(u as any)[0]["stakeholder_details"],
          docId: (u as any)[1]
          }
         }); 
         setIncidents(tasks);
      }
      else
      {
        console.log("nothing retrieved :(");
      }
    }
  useEffect(()=> 
  {
    const fetch = async(): Promise<void>=>{
      await handleFetchAll();  
    }

    if(uid === "")
    {
        fetch();
    }
  });

  const compareDates = (d1:string, d2:string, d3:string) => {
    return(d1 <= d2 && d2 <= d3);
  }
console.log(status);
  // Filtered data
  const filteredUsers = incidents.filter((u) =>
        (formData.title === "" || u.title == formData.title) &&
        (status === "" || String(u.incident_status) === String(status)) &&
        (date === "" && endDate === "" || compareDates(date, u.incident_report_date, endDate)) //&& u.incident_report_date <= endDate)
      );
  

  // Ordenación dinámica
  const sortedIncidents = [...filteredUsers].sort((a, b) => {
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

  const handleIncident = async (incident_id:number) =>{
    localStorage.setItem("incident_id", incident_id.toString());
    window.location.href = "trackincidents/incidentinfo";
  }
  // Alternar orden y resetear las demás columnas
  const handleSort = (col: keyof Order) => {
    setOrder((o) => {
      const newOrder: Order = { title: 0, incident_report_date: 0, incident_status: 0, reporter_id: 0 };
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


        return (
    <div>
      <div key="1" className="text-black p-4">
        <h1 className="text-[2rem] font-bold">My Incidents</h1>
      </div>
      <div key="2">
      <form>
          <fieldset>
          
            <legend className="text-black font-semibold text-lg mb-4">Filter Incidents</legend>
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
                  <option value="Escalated">Escalated</option>
                  <option value="Completed">Completed</option>
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
      <main className="overflow-x-auto bg-white shadow-md rounded-lg p-6 ">
      <table className="min-w-full text-gray-800 ">
      <thead>
            <tr>
              <th className="px-4 py-2 text-left">Title<button
                            onClick={() => handleSort("title")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["title"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Report Date<button
                            onClick={() => handleSort("incident_report_date")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["incident_report_date"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Status<button
                            onClick={() => handleSort("incident_status")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["incident_status"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Incident ID</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
        <tbody>
            {sortedIncidents.map((u, index) => (
              <tr key={index} className="border-t border-gray-200 ">
                <td className="px-4 py-2">{u.title}</td>
                <td className="px-4 py-2">{String(u.incident_report_date)}</td>
                <td className="px-4 py-2">{u.incident_status}</td>
                <td className="px-4 py-2">{u.incident_id}</td>
                <td className="px-4 py-2">{u.description}</td>
                <td className="px-4 py-2">
                <button
                  onClick={()=>handleIncident(u.incident_id)}
                
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
    </main>
  </div>
  );
}

export default MainPage;
