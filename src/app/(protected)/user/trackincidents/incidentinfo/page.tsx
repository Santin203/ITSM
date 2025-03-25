"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {getFlowithId, getIncidentwithId, getCurrUserData, updateIncidentStatus} from '../../../../../hooks/db.js'
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
  const [isITSupport, setIsITSupport] = useState(false);
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const [isRoleChecked, setIsRoleChecked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const router = useRouter();
  const [currUser, setCurrUser] = useState(auth.currentUser); 
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user);
      setCurrUser(user);
    });

    return () => unsubscribe();
  }, []);
 
  // Check if user is IT support and if the incident is assigned to them
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        if (currUser) {
          const userData = await getCurrUserData();
          if (userData && userData.rol === "IT") {
            setIsITSupport(true);
            
            // Check if the current incident is assigned to this IT user
            if (incidents.length > 0) {
              const incident = incidents[0];
              if (incident.it_id === userData.id) {
                setIsAssignedToMe(true);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setIsRoleChecked(true);
      }
    };
    
    if (!isRoleChecked && incidents.length > 0) {
      checkUserRole();
    }
  }, [currUser, incidents, isRoleChecked]);
  
  const handleFetchAll = async (): Promise<void> => { 
    try {
      const incidentsData = await getIncidentwithId(Number(localStorage.getItem("incident_id")));
      if(incidentsData) {
        setUid("a");
        const tasks = incidentsData.map((u) => {
          return {
            title: (u as any)["title"],
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
          };
        }); 
           
        setIncidents(tasks);
      } else {
        console.log("nothing retrieved :(");
      }
    } catch (error) {
      console.error("Error fetching incident:", error);
    }
  }

  const handleFetchFlow = async (): Promise<void> => { 
    try {
      const flows = await getFlowithId(Number(localStorage.getItem("incident_id")));
      if(flows) {
        setFlagFlow("a");
        const tasks = flows.map((u) => {
          return {
            description: (u as any)["description"],
            reporter_id: (u as any)["reporter_id"],
            incident_id: (u as any)["incident_id"],
            time_of_incident: ((u as any)["time_of_incident"].toDate().getFullYear()).toString()+'-'
            +((u as any)["time_of_incident"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["time_of_incident"].toDate().getDate()).toString().padStart(2, "0"),
            incident_status: (u as any)["incident_status"],
            order: (u as any)["order"]
          };
        }); 
        setFlows(tasks);
      } else {
        console.log("nothing retrieved :(");
      }
    } catch (error) {
      console.error("Error fetching workflow:", error);
    }
  }

  useEffect(() => {
    const fetch = async(): Promise<void> => {
      await handleFetchAll();  
    }
    if(uid === "") {
      fetch();
    }
  }, [uid]);

  useEffect(() => {
    const fetch = async(): Promise<void> => {
      await handleFetchFlow();  
    }
    if(flagflow === "") {
      fetch();
    }
  }, [flagflow]);

  const handleRouter = () => {
    localStorage.clear();
    router.back();
  }

  // Show resolution form
  const handleShowResolutionForm = () => {
    setShowResolutionForm(true);
  };

  // Handle resolving the incident
  const handleResolveIncident = async () => {
    if (!currUser || !isITSupport || !isAssignedToMe) {
      return;
    }
    
    const incidentId = localStorage.getItem("incident_id");
    if (!incidentId) {
      return;
    }
    
    // Check if resolution details were provided
    if (!resolutionDetails.trim()) {
      alert("Please provide resolution details before resolving the incident.");
      return;
    }
    
    const confirmResolve = window.confirm("Are you sure you want to mark this incident as resolved?");
    if (!confirmResolve) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const result = await updateIncidentStatus(incidentId, "Resolved", resolutionDetails);
      if (result === 0) {
        setUpdateSuccess(true);
        setShowResolutionForm(false);
        setResolutionDetails("");
        
        // Refresh the incident data
        await handleFetchAll();
        await handleFetchFlow();
      } else {
        setUpdateSuccess(false);
      }
    } catch (error) {
      console.error("Error resolving incident:", error);
      setUpdateSuccess(false);
    } finally {
      setIsUpdating(false);
      
      // Clear the status message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(null);
      }, 3000);
    }
  };

  // Check if incident can be resolved (not already resolved or completed)
  const canResolveIncident = () => {
    if (!incidents.length) return false;
    
    const incident = incidents[0];
    return isITSupport && 
           isAssignedToMe && 
           incident.incident_status !== "Resolved" && 
           incident.incident_status !== "Completed";
  };

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
        </ul>
      ))}

      {/* Display status update message */}
      {updateSuccess !== null && (
        <div className={`mx-4 p-3 rounded ${updateSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {updateSuccess 
            ? "Incident successfully marked as resolved!" 
            : "Failed to update incident status. Please try again."}
        </div>
      )}

      {/* Resolution form for IT support users */}
      {canResolveIncident() && (
        <div className="px-4 mt-4">
          {!showResolutionForm ? (
            <button
              onClick={handleShowResolutionForm}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-4"
              type="button"
            >
              Resolve Incident
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
                placeholder="Please provide details about how this incident was resolved..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                rows={4}
                required
              />
              <div className="flex justify-end space-x-3 mt-3">
                <button
                  onClick={() => setShowResolutionForm(false)}
                  className="bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveIncident}
                  disabled={isUpdating || !resolutionDetails.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {isUpdating ? "Updating..." : "Submit & Resolve"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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