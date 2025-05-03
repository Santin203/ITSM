"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getFlowithId, 
  getIncidentwithId, 
  getCurrUserData, 
  updateIncidentStatus,
  getUsersDataDic,
  updateIncidentState,
  escalateIncident,
  getAllGroups,
  getUserDatawithId
} from '../../../../../hooks/db.js'
import { auth } from '../../../../../firebaseConfig.js';
import { updateWorkflowManager } from '../../../../../hooks/db.js';
import { getCookie } from "../../../../../hooks/cookies";

type User = {
  name:string,
  last_name_1:string,
}[];  


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
  assigned_to_id:number,
  root_cause:string,
  organization:string,
  department:string,
  section:string,
  user_details:string,
  incident_resolution_date:string,
  additional_details:string
}[]; 

type Workflow = {
  description:string,
  incident_id:number,
  incident_status:string,
  order:number,
  reporter_id:number,
  time_of_incident:string,
  manager_id:number
}[];  

// Available incident states
const INCIDENT_STATES = [
  "Sent",
  "Assigned",
  "Solving",
  "Escalated",
  "Resolved"
];

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
  
  // State for escalation & state management 
  const [activeTab, setActiveTab] = useState<string>("state");
  const [selectedEscalationUser, setSelectedEscalationUser] = useState<any>(null); //
  const [escalationComment, setEscalationComment] = useState("");
  const [isEscalating, setIsEscalating] = useState(false); //
  const [escalationSuccess, setEscalationSuccess] = useState(false);
  const [isGroupSelected, setIsGroupSelected] = useState(false);
  const [escalationTargets, setEscalationTargets] = useState<any[]>([]); //track the selected escalation target
  const [selectedState, setSelectedState] = useState<string>(""); //Scalation commentss
  const [isChangingState, setIsChangingState] = useState(false);
  const [stateChangeSuccess, setStateChangeSuccess] = useState(false);
  const [managerData, setmanagerData] = useState<User>([]);
  const [reporterData, setreporterData] = useState<User>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [reporter, setReporter] = useState("");

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
          const roleCookie = await getCookie("role");
          if (userData && roleCookie?.value === "IT") {
            setIsITSupport(true);
            
            // Check if the current incident is assigned to this IT user
            if (incidents.length > 0) {
              const incident = incidents[0];
              if (incident.assigned_to_id === userData.id) {
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

  useEffect(() => {
    const fetchEscalationTargets = async () => {
      if (!isITSupport) return;
      
      try {
        // Get current user's data to identify and exclude them
        const currentUserData = await getCurrUserData();
        const currentUserId = currentUserData?.id;
        
        // Fetch all users from Firebase
        const allUsers = await getUsersDataDic();
        const usersList = allUsers
          .map((userTuple: any) => {
            const userData = userTuple[0];
            // Create a full name using available name fields
            const firstName = userData.name || '';
            const lastName1 = userData.last_name_1 || '';
            
            // Format name as "First Last" 
            let displayName = firstName;
            if (lastName1) displayName += ' ' + lastName1;
            
            // If no name is available, use ID as fallback
            if (!displayName.trim()) displayName = `User ${userData.id}`;
            
            return {
              id: userData.id,
              displayName: displayName,
              email: userData.email || ''
            };
          })
          // Filter out the current user
          .filter(user => user.id !== currentUserId);
        
        setEscalationTargets(usersList);
      } catch (error) {
        console.error("Error fetching escalation targets:", error);
      }
    };
    
    fetchEscalationTargets();
  }, [isITSupport]);
  
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
            assigned_to_id:(u as any)["assigned_to_id"],
            root_cause:(u as any)["root_cause"],
            organization:(u as any)["organization"],
            department:(u as any)["department"],
            section:(u as any)["section"],
            incident_resolution_date:((u as any)["incident_resolution_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)["incident_resolution_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["incident_resolution_date"].toDate().getDate()).toString().padStart(2, "0"),
            additional_details:(u as any)["additional_details"],
            user_details:(u as any)["user_details"]
            }
           }); 
           
        setIncidents(tasks);
        
        // Initialize selected state with current incident status if it exists
        if (tasks.length > 0) {
          setSelectedState(tasks[0].incident_status || "");
        }
        const subs = await getUserDatawithId(Number((tasks as any)[0]["assigned_to_id"]));
        if(subs && subs.length > 0)
        {
          console.log(subs)
          const user = subs.map((u) => {
            return {  //return data compatible with data types specified in the tasks variable 
              name: (u as any)["name"] ,
              last_name_1: (u as any)["last_name_1"],
              }
            }); 
            setmanagerData(user);
            setAssignedTo(subs[0].name + " "+ subs[0].last_name_1)
          }
        else
          console.log("nothing retrieved 3 :(");

        const reporter = await getUserDatawithId(Number((tasks as any)[0]["reporter_id"]));
        if(reporter)
        {
            console.log(reporter)
            const user = reporter.map((u) => {
              return {  //return data compatible with data types specified in the tasks variable 
                name: (u as any)["name"] ,
                last_name_1: (u as any)["last_name_1"],
                }
              }); 
              setreporterData(user);
              setReporter(reporter[0].name + " "+ reporter[0].last_name_1)
            }
          else
            console.log("nothing retrieved 3 :(");


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
            order: (u as any)["order"],
            manager_id: (u as any)["manager_id"]
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
      // Update the incident's status to "Resolved"
      const result = await updateIncidentStatus(incidentId, "Resolved", resolutionDetails);
  
      if (result === 0) {
        setUpdateSuccess(true);
        setShowResolutionForm(false);
        setResolutionDetails("");
  
        // Also update the workflow manager_id
        const itId = incidents[0]?.assigned_to_id;
        
        if (itId) {
          await updateWorkflowManager(incidentId, itId);
        }
  
        // Refresh data
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
  
  // Check if incident can be resolved (not already resolved)
  const canResolveIncident = () => {
    if (!incidents.length) return false;
    
    const incident = incidents[0];
    return isITSupport && 
           isAssignedToMe && 
           incident.incident_status !== "Resolved";
  };
  
  // Handle escalation selection change
  const handleEscalationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const targetValue = e.target.value;
  const userId = parseInt(targetValue);
  setSelectedEscalationUser(userId);
};
  
  // Handle escalation comment change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEscalationComment(e.target.value);
  };

  // Handle resolution comment change
  const handleResolutionCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResolutionDetails(e.target.value);
  };
  
  // Handle state change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
  };
  
  // Handle state change submission
  const handleChangeState = async () => {
    if (!selectedState) {
      alert("Please select a state.");
      return;
    }
    
    setIsChangingState(true);
    
    try {
      // Get current user ID
      let currentUserId;
      if (currUser) {
        // If we have a current user, use their data
        const userData = await getUsersDataDic();
        const currentUserData = userData.find((u: any) => 
          u[1] === currUser.uid
        );
        
        if (currentUserData && currentUserData[0] && 
            typeof currentUserData[0] === 'object' && 
            'id' in currentUserData[0]) {
          currentUserId = currentUserData[0].id;
        } else {
          // Fallback to user UID
          currentUserId = currUser.uid;
        }
      } else {
        // Fallback to a default ID
        currentUserId = incidents[0]?.reporter_id || 1;
      }
      
      // Get incident ID
      const incidentId = incidents[0]?.incident_id;
      
      if (!incidentId) {
        throw new Error("No incident ID found");
      }
      
      console.log("Updating incident state:", {
        incidentId,
        newState: selectedState,
        updatedBy: currentUserId
      });
      
      // Call the Firebase function to update the state
      const success = await updateIncidentState(
        incidentId,
        selectedState,
        currentUserId
      );
      
      if (success) {
        setIsChangingState(false);
        setStateChangeSuccess(true);
        
        // Update local incident state for UI feedback
        if (incidents.length > 0) {
          const updatedIncidents = [...incidents];
          updatedIncidents[0].incident_status = selectedState;
          setIncidents(updatedIncidents);
        }
        
        // Refresh workflow data to show new entry
        await handleFetchFlow();
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setStateChangeSuccess(false);
        }, 3000);
      } else {
        throw new Error("Failed to update incident state");
      }
    } catch (error) {
      console.error("Error changing state:", error);
      setIsChangingState(false);
      alert("Failed to change incident state. Please try again.");
    }
  };
  
  // Handle escalation submission
  const handleEscalateIncident = async () => {
    if (selectedEscalationUser === null) {
      alert("Please select a person or group to escalate to.");
      return;
    }
    
    if (!escalationComment.trim()) {
      alert("Please provide details about why you are escalating this incident.");
      return;
    }
    
    setIsEscalating(true);
    
    try {
      // Get current user ID
      let currentUserId;
      if (currUser) {
        // If we have a current user, use their data
        const userData = await getUsersDataDic();
        const currentUserData = userData.find((u: any) => 
          u[1] === currUser.uid
        );
        
        if (currentUserData && currentUserData[0] && 
            typeof currentUserData[0] === 'object' && 
            'id' in currentUserData[0]) {
          currentUserId = currentUserData[0].id;
        } else {
          // Fallback to user UID
          currentUserId = currUser.uid;
        }
      } else {
        // Fallback to a default ID
        currentUserId = incidents[0]?.reporter_id || 1;
      }
      
      // Get incident ID
      const incidentId = incidents[0]?.incident_id;
      
      if (!incidentId) {
        throw new Error("No incident ID found");
      }
      
      console.log("Escalating incident:", {
        incidentId,
        targetId: selectedEscalationUser,
        comment: escalationComment,
        updatedBy: currentUserId,
        isGroup: isGroupSelected
      });
      
      // Call the Firebase function to escalate the incident
      const success = await escalateIncident(
        incidentId,
        selectedEscalationUser,
        escalationComment,
        currentUserId,
      );
      
      if (success) {
        setIsEscalating(false);
        setEscalationSuccess(true);
        
        // Automatically set state to "Escalated"
        setSelectedState("Escalated");
        
        // Update local incident state for UI feedback
        if (incidents.length > 0) {
          const updatedIncidents = [...incidents];
          updatedIncidents[0].incident_status = "Escalated";
          setIncidents(updatedIncidents);
        }
        
        // Refresh workflow data to show new entry
        await handleFetchFlow();
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setEscalationSuccess(false);
        }, 3000);
        window.location.href = "/user/trackincidents";
      } else {
        throw new Error("Failed to escalate incident");
      }
    } catch (error) {
      console.error("Error escalating incident:", error);
      setIsEscalating(false);
      alert("Failed to escalate incident. Please try again.");
    }
  };

  return(
    <div style={{ display: "flex", flexDirection: "column"}} className="text-black">
        {/* Main Content */}
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color:"navy", textAlign: "center" }}>
          Major Incident Details
          </h2>
        </div>
      
      {/* Unified Incident Management Section */}
      {isITSupport && isAssignedToMe && (
        <div className="px-4 pb-4 mb-4 border-b border-gray-200">
          <h3 className="text-xl font-bold mb-3">Incident Management</h3>
          
          {/* Simple tab navigation */}
          <div className="flex mb-4 border-b">
            <button 
              className={`py-2 px-4 ${activeTab === 'state' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('state')}
            >
              Change State
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'escalate' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('escalate')}
            >
              Escalate Incident
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'resolve' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('resolve')}
            >
              Resolve
            </button>
          </div>
          
          {/* State change form */}
          {activeTab === 'state' && (
            <div className="mb-4">
              <div className="mb-4">
                <label htmlFor="stateSelect" className="block mb-2 font-medium">
                  Select new state:
                </label>
                <select
                  id="stateSelect"
                  className="w-64 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ maxWidth: "250px" }}
                  onChange={handleStateChange}
                  value={selectedState}
                  disabled={isChangingState}
                >
                  <option value="">-- Select state --</option>
                  {INCIDENT_STATES.map((state, index) => (
                    <option key={index} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleChangeState}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400"
                disabled={!selectedState || isChangingState}
              >
                {isChangingState ? "Updating..." : "Update State"}
              </button>
              
              {/* Success message */}
              {stateChangeSuccess && (
                <div className="mt-3 p-2 bg-green-100 text-green-700 rounded-md">
                  Incident state successfully updated!
                </div>
              )}
            </div>
          )}
          
          {/* Escalation form */}
          {activeTab === 'escalate' && (
            <div>
              <div className="mb-4">
                <label htmlFor="escalationSelect" className="block mb-2 font-medium">
                  Select user to escalate to:
                </label>
                <select
                  id="escalationSelect"
                  className="w-full md:w-1/3 lg:w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleEscalationChange}
                  value={selectedEscalationUser || ""}
                  disabled={isEscalating}
                >
                  <option value="">-- Select user --</option>
                  {escalationTargets.map(user => (
                    <option key={`user_${user.id}`} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="escalationComment" className="block mb-2 font-medium">
                  Escalation details:
                </label>
                <textarea
                  id="escalationComment"
                  className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Provide details about why you are escalating this incident..."
                  onChange={handleCommentChange}
                  value={escalationComment}
                  disabled={isEscalating}
                ></textarea>
              </div>
              
              <button
                onClick={handleEscalateIncident}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400"
                disabled={selectedEscalationUser === null || !escalationComment.trim() || isEscalating}
              >
                {isEscalating ? "Escalating..." : "Escalate Incident"}
              </button>
              
              {/* Success message */}
              {escalationSuccess && (
                <div className="mt-3 p-2 bg-green-100 text-green-700 rounded-md">
                  Incident successfully escalated!
                </div>
              )}
            </div>
          )}

          {/* Resolve tab */}
          {activeTab === 'resolve' && (
            <div>
              <div className="mb-4">
                <label htmlFor="resolutionComment" className="block mb-2 font-medium">
                  Resolution details:
                </label>
                <textarea
                  id="resolutionComment"
                  className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Provide details about how this incident was resolved..."
                  onChange={handleResolutionCommentChange}
                  value={resolutionDetails}
                  disabled={isUpdating}
                ></textarea>
              </div>
              
              <button
                onClick={handleResolveIncident}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:bg-gray-400"
                disabled={!resolutionDetails.trim() || isUpdating}
              >
                {isUpdating ? "Resolving..." : "Resolve Incident"}
              </button>
              
              {/* Success message */}
              {updateSuccess && (
                <div className="mt-3 p-2 bg-green-100 text-green-700 rounded-md">
                  Incident successfully resolved!
                </div>
              )}
            </div>
          )}
        </div>
      )}
  
    
    {incidents.map((u, index) => (
      <div key={index}>
         <b>Incident Ticket Number:</b> {u.incident_id}
            <table
            style={{ width: "75%", maxWidth: "900px", borderCollapse: "collapse", marginTop: "20px", marginLeft: "0" }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    width: "200px", // First column takes less space
                    fontWeight: "bold",
                  }}
                >
                  Organization:
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                {u.organization}
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
                Department:
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.department}
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
                Section:
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.section}
              </td>
            </tr>
            </tbody>
            </table>
    </div>
    ))}
            
    
    {incidents.map((u, index) => (
            <div key='1'
          > 
      <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>Incident Details</h3>
      <table
        style={{ width: "75%", maxWidth: "900px", borderCollapse: "collapse", marginTop: "20px", marginLeft: "0" }}
      >
        <tbody>
          <tr key={index}>
              <td
                style={{
                  padding: "20px",
                  border: "1px solid #ccc",
                  width: "200px", // First column takes less space
                  fontWeight: "bold",
                }}
              >
                User Details
              </td>
              <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                  }}
                >
                {u.user_details}
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
                Reported by
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {reporter}
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
                Incident Description
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.description}
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
                Business Impact
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.business_impact}
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
                Root Cause
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.root_cause}
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
                Incident Status
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.incident_status}
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
                How Was the Incident Logged?
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.incident_logged}
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
                Incident Manager/IT
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {assignedTo}
              </td>
            </tr>
        </tbody>
      </table>
      
    <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>
      Incident Date and Time
    </h3>
    <table
      style={{ width: "75%", maxWidth: "900px", borderCollapse: "collapse", marginTop: "10px", marginLeft: "0" }}
    >
      <tbody>
      <tr>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  width: "200px",  // Increase the width
                  fontWeight: "bold",
                  whiteSpace: "nowrap", // Prevent wrapping
                }}
              >
              Incident Start Date
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.incident_start_date}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  width: "250px",  // Increase the width
                  fontWeight: "bold",
                  whiteSpace: "nowrap", // Prevent wrapping
                }}
              >
              Incident Reported Date
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.incident_report_date}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  width: "250px",  // Increase the width
                  fontWeight: "bold",
                  whiteSpace: "nowrap", // Prevent wrapping
                }}
              >
              Incident Resolution Date
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                {u.incident_resolution_date.substring(0,4) === "1900" && "N/A"}
                {u.incident_resolution_date.substring(0,4) !== "1900" && u.incident_resolution_date}
              </td>
            </tr>
        </tbody>
      </table>
      {/* Incident Details Description */}
      {u.additional_details !== "" && (
      <h3 style={{ marginTop: "20px", fontWeight: "bold" }}>
        Incident Additional Details
      </h3>
    )}
    <table
     style={{ width: "75%", maxWidth: "900px", borderCollapse: "collapse", marginTop: "10px", marginLeft: "0" }}
    >
      <tbody>
        <tr>
          <td style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                }}>
            {u.additional_details}
          </td>
        </tr>
      </tbody>
    </table>
      </div>
    ))}

    {/* Workflow Section - Just adjusted width to match form boxes */}
    <div style={{ fontFamily: "Arial, sans-serif", width: "75%", maxWidth: "900px", marginLeft: "0" }}>
      <h2 style={{ fontSize: "30px", fontWeight: "bold", textAlign: "center", marginTop: "20px", marginBottom: "20px" }}>
        Workflow
      </h2>
    </div>

    <div style={{ width: "75%", maxWidth: "900px", marginLeft: "0" }}>
      {flows.length > 0 ? (
        flows.map((u, index) => (
          <ul key={index} className="border-t-4 border-gray-200 dark:border-gray-700">
            <p><li className="px-4 py-2"><b>Time of Advance:</b> {u.time_of_incident}</li></p>
            <li className="px-4 py-2"><b>Description:</b> {u.description}</li>
            <li className="px-4 py-2"><b>Progress Made By:</b> {u.manager_id}</li>
            <li className="px-4 py-2"><b>Current Status:</b> {u.incident_status}</li>
            <li className="px-4 py-2"><b>Reporter ID:</b> {u.reporter_id}</li>
          </ul>
        ))
      ) : (
        <ul className="border-t border-black-200 dark:border-black-700">
          <li className="px-4 py-2">No records available.</li>
        </ul>
      )}
    </div>

    <p className="mb-4" style={{ width: "75%", maxWidth: "900px", marginLeft: "0", marginTop: "20px" }}> 
      <button
        onClick={()=>handleRouter()}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        type="button"
      >
        Back
      </button>
    </p>
  </div>
  );
}

export default MainPage;