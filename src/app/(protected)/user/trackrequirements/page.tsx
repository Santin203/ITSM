"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { getCurrUserRequirementsData} from '../../../../hooks/db.js'
import { auth } from '../../../../firebaseConfig.js';

type Requirement = {
  submitter_id:number,
  process_type:string,
  requirement_submit_date:string,
  requirement_id:number
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
    const requirementsData = await getCurrUserRequirementsData();
    if(requirementsData)
    {
    setUid("a");
    const tasks = requirementsData.map((u) => {
      return {  //return data compatible with data types specified in the tasks variable 
          submitter_id: (u as any)[0]["submitter_id"],
          requirement_id: (u as any)[0]["requirement_id"],
          requirement_submit_date: ((u as any)[0]["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
          +((u as any)[0]["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
          + ((u as any)[0]["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
          process_type: (u as any)[0]["process_type"],
          docId: (u as any)[1]
          }
         }); 
         setRequirements(tasks);
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
  const filteredUsers = requirements.filter((u) =>
        (status === "" || String(u.process_type) === String(status)) &&
        (date === "" && endDate === "" || compareDates(date, u.requirement_submit_date, endDate)) //&& u.incident_report_date <= endDate)
      );
  

  // Ordenación dinámica
  const sortedRequirements = [...filteredUsers].sort((a, b) => {
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


        return (
    <div>
      <div key="1" className="text-black p-4">
        <h1 className="text-[2rem] font-bold">My Requirements</h1>
      </div>
      <div key="2">
      <form>
          <fieldset>
          
            <legend className="text-black dark:text-gray-200 font-semibold text-lg mb-4">Filter Requirements</legend>
              
              <div>
              <label htmlFor="incident_status" className="block mb-2">
              <p className="text-black dark:text-gray-200 mt-2">Search for Requirement Process</p>
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
                  <label className="block text dark:text-gray-700 mt-2">Start Date:</label>
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
      <main className="overflow-x-auto bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
      <table className="min-w-full text-gray-800 dark:text-gray-200">
      <thead>
            <tr>
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
            </tr>
          </thead>
        <tbody>
            {sortedRequirements.map((u, index) => (
              <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{u.requirement_id}</td>
                <td className="px-4 py-2">{String(u.requirement_submit_date)}</td>
                <td className="px-4 py-2">{u.process_type}</td>
                <td className="px-4 py-2">{u.submitter_id}</td>
                <td className="px-4 py-2">
                <button
                  onClick={()=>handleRequirement(u.requirement_id)}
                
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
