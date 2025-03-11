"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {getFlowithId, getIncidentwithId} from '../../../../../hooks/db.js'
import { auth } from '../../../../../firebaseConfig.js';

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
}[]; 

type Workflow = {
  description:string,
  incident_id:number,
  incident_status:string,
  order:number,
  reporter_id:number,
  time_of_incident:string
}[];  


const MainPage: React.FC = () => {

  const [uid, setUid] = useState("");
  const [incidents, setIncidents] = useState<Incident>([]);
  const [flows, setFlows] = useState<Workflow>([]);
  const [flagflow, setFlagFlow] = useState("");
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
      const incidentsData = await getIncidentwithId(Number(localStorage.getItem("incident_id")));
      if(incidentsData)
      {
        setUid("a");
        const tasks = incidentsData.map((u) => {
          return {  //return data compatible with data types specified in the tasks variable 
            title: (u as any)["title"] ,
            description: (u as any)["description"],
            reporter_id: (u as any)["reporter_id"],
            incident_id: (u as any)["incident_id"],
            incident_report_date: ((u as any)["incident_report_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)["incident_report_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
            incident_status: (u as any)["incident_status"],
  
            incident_start_date:((u as any)["incident_start_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)["incident_report_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["incident_report_date"].toDate().getDate()).toString().padStart(2, "0"),
            business_impact:(u as any)["business_impact"],
            incident_logged:(u as any)["incident_logged"],
            it_id:(u as any)["it_id"],
            root_cause:(u as any)["root_cause"],
            stakeholder_details:(u as any)["stakeholder_details"]
            }
           }); 
           
           setIncidents(tasks);
        }
        else
          console.log("nothing retrieved :(");
    }

    const handleFetchFlow = async (): Promise<void> => { 
      const flows = await getFlowithId(Number(localStorage.getItem("incident_id")));
      if(flows)
      {
        setFlagFlow("a");
        const tasks = flows.map((u) => {
          return {  //return data compatible with data types specified in the tasks variable 
            description: (u as any)["description"],
            reporter_id: (u as any)["reporter_id"],
            incident_id: (u as any)["incident_id"],
            time_of_incident: ((u as any)["time_of_incident"].toDate().getFullYear()).toString()+'-'
            +((u as any)["time_of_incident"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["time_of_incident"].toDate().getDate()).toString().padStart(2, "0"),
            incident_status: (u as any)["incident_status"],
            order: (u as any)["order"]
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

  const handleRouter = () => {
    localStorage.clear();
    router.back();
  }

        return(
    <div>
      <div className="text-black p-4">
        <h1 className="text-[2rem] font-bold">Incident Details</h1>
      </div>
      {incidents.map((u, index) => (
              <ul key={index} className="text-black bgborder-t border-gray-200 ">
                <li className="px-4 py-2"><b>Title:</b> {u.title}</li>
                <li className="px-4 py-2"><b>Description:</b> {u.description}</li>
                <li className="px-4 py-2"><b>Incident ID: </b> {u.incident_id}</li>
                <li className="px-4 py-2"> <b>Reporter ID:</b> {u.reporter_id}</li>
                <li className="px-4 py-2"><b>IT ID:</b> {u.it_id}</li>
                <li className="px-4 py-2"><b>Incident Report Date:</b> {u.incident_report_date}</li>
                <li className="px-4 py-2"><b>Incident Start Date:</b> {u.incident_start_date}</li>
                <li className="px-4 py-2"><b>Incident Status: </b>{u.incident_status}</li>
                <li className="px-4 py-2"><b>Business Impact: </b> {u.business_impact}</li>
                <li className="px-4 py-2"><b>Incident Logged:</b> {u.incident_logged}</li>
                <li className="px-4 py-2"><b>Root Cause: </b>{u.root_cause}</li>
                <li className="px-4 py-2"><b>Stakeholder Details:</b> {u.stakeholder_details}</li>
        </ul> ))}

      <div className="text-black p-4">
        <h1 className="text-[2rem] font-bold">Workflow</h1>
        {flows.length > 0 && flows.map((u, index) => (
              <ul key={index} className="border-t border-gray-200 ">
                <li className="px-4 py-2"><b>Order:</b> {u.order}</li>
                <li className="px-4 py-2"><b>Description:</b> {u.description}</li>
                <li className="px-4 py-2"><b>Incident ID:</b> {u.incident_id}</li>
                <li className="px-4 py-2"><b>Incident Status:</b> {u.incident_status}</li>
                <li className="px-4 py-2"><b>Reporter ID:</b> {u.reporter_id}</li>
                <li className="px-4 py-2"><b>Time of Incident:</b> {u.time_of_incident}</li>
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
