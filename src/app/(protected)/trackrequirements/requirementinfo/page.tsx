"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import { auth } from '../../../../firebaseConfig.js';
import { getCookie } from '../../../../hooks/cookies';
import { escalateRequirement, getCurrUserData, getRequirementFlowithId, getRequirementwithId, getStakeholderswithId, getUserDatawithId, getUsersDataDic, updateRequirementStatus } from '../../../../hooks/db.js';

type User = {
  rol:string,
  id:number,
  name:string,
  last_name_1:string,
  cel_1:string,
  email:string
}[];  


type Requirement = {
  submitter_id:number,
  brief_description:string,
  detailed_description:string,
  requirement_id:number,
  process_type:string,
  requirement_submit_date:string,
  contact_information:string,
  contact_email:string,
  contact_first_name:string,
  contact_last_name:string,
  contact_middle_initial:string,
  contact_phone:string,
  contact_role:string,
  data_requirement:string,
  dependencies:string,
  exist_workarounds:string,
  request_goals:string,
  workarounds_description:string,
  supporting_documents:string // temporary
  assigned_to_id: number,
  requirement_status:string
}[]; 

type Workflow = {
  brief_description:string,
  requirement_id:number,
  process_type:string,
  order:number,
  submitter_id:number,
  time_of_update:string,
  manager_id:number,
}[];  

type Stakeholder = {
  email:string,
  first_name: string,
  last_name:string,
  phone:string,
  requirement_id:number,
  role:string
}[];

const REQUIREMENT_STATES = [
  "Sent",
  "Assigned",
  "Solving",
  "Escalated",
  "Resolved"
];

const MainPage: React.FC = () => {

  const [uid, setUid] = useState("");
  const [requirements, setRequirements] = useState<Requirement>([]);
  const [stakesholders, setStakeholders] = useState<Stakeholder>([]);
  const [flows, setFlows] = useState<Workflow>([]);
  const [flagflow, setFlagFlow] = useState("");
  const [uDatafromDb, setUdata] = useState<User>([]);
  const router = useRouter();
  const [currUser, setCurrUser] = useState(auth.currentUser); // Start with initial auth state
  const [isITSupport, setIsITSupport] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Added for resolution functionality:
  const [isRoleChecked, setIsRoleChecked] = useState(false);
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [showResolutionForm, setShowResolutionForm] = useState(false);

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
  
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log("Auth state changed:", user);
        setCurrUser(user); // Update state when user logs in/out
      });
  
      return () => unsubscribe(); // Cleanup the listener
    }, []);
    
    // Check if user is IT support and if the incident is assigned to them
    useEffect(() => {
      const checkUserRole = async () => {
        try {
          if (currUser) {
            const userData = await getCurrUserData();
            const roleCookie = await getCookie("role");
            if (userData) {
              setIsAdmin(roleCookie?.value === "Admin");
              setIsITSupport(roleCookie?.value === "IT"); 
              
              // Check if the current requirement is assigned to this IT user
              if (requirements.length > 0) {
                const requirement = requirements[0];
                if (requirement.assigned_to_id === userData.id) {
                  setIsAssignedToMe(true);
                }
              }
            }
          }
        } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
            setIsRoleChecked(true);
          }
      };

      if (!isRoleChecked && requirements.length > 0) {
        checkUserRole();
      }
    }, [currUser, requirements, isRoleChecked]);

    useEffect(() => {
      const fetchEscalationTargets = async () => {
        if (!isITSupport && !isAdmin ) return;
        
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
    }, [isITSupport, isAdmin]);



  const handleFetchAll = async (): Promise<void> => { 
      const requirementsData = await getRequirementwithId(Number(localStorage.getItem("requirement_id")));
      if(requirementsData)
      {
        setUid("a");
        const tasks = requirementsData.map((u) => {
          return {  //return data compatible with data types specified in the tasks variable 
            detailed_description: (u as any)["detailed_description"] ,
            brief_description: (u as any)["brief_description"],
            submitter_id: (u as any)["submitter_id"],
            requirement_id: (u as any)["requirement_id"],
            requirement_submit_date: ((u as any)["requirement_submit_date"].toDate().getFullYear()).toString()+'-'
            +((u as any)["requirement_submit_date"].toDate().getMonth()+1).toString().padStart(2, "0") + '-'
            + ((u as any)["requirement_submit_date"].toDate().getDate()).toString().padStart(2, "0"),
            process_type: (u as any)["process_type"],
            contact_information:(u as any)["contact_information"],
            contact_first_name:(u as any)["contact_first_name"],
            contact_last_name:(u as any)["contact_last_name"],
            contact_middle_initial:(u as any)["contact_middle_initial"],
            contact_email:(u as any)["contact_email"],
            contact_role:(u as any)["contact_role"],
            contact_phone:(u as any)["contact_phone"],
            data_requirement:(u as any)["data_requirement"],
            dependencies:(u as any)["dependencies"],
            organization:(u as any)["organization"],
            assigned_to_id: (u as any)["assigned_to_id"],
            exist_workarounds:(u as any)["exist_workarounds"],
            request_goals:(u as any)["request_goals"],
            workarounds_description:(u as any)["workarounds_description"],
            supporting_documents:(u as any)["supporting_documents"],
            requirement_status:(u as any)["requirement_status"]
            }
           }); 
           
           setRequirements(tasks);
           if (tasks.length > 0) {
            setSelectedState(tasks[0].requirement_status || "");
          }
           const subs = await getUserDatawithId(Number((tasks as any)[0]["submitter_id"]));
            if(subs)
            {
              console.log(subs)
              const user = subs.map((u) => {
                return {  //return data compatible with data types specified in the tasks variable 
                  name: (u as any)["name"] ,
                  last_name_1: (u as any)["last_name_1"],
                  rol: (u as any)["rol"][0], 
                  cel_1: (u as any)["cel_1"],
                  email: (u as any)["email"],
                  id: (u as any)["id"]
                  }
                }); 
                
                setUdata(user);
              }
            else
              console.log("nothing retrieved 3 :(");
      }
    

      const stakesData = await getStakeholderswithId(Number(localStorage.getItem("requirement_id")));
          if(stakesData)
          {
            const stakes = stakesData.map((u) => {
              return {  //return data compatible with data types specified in the tasks variable 
                email: (u as any)["email"] ,
                first_name: (u as any)["first_name"],
                last_name: (u as any)["last_name"],
                phone: (u as any)["phone"],
                requirement_id: (u as any)["requirement_id"],
                role: (u as any)["role"]
                }
               }); 
               
               setStakeholders(stakes);
            }
            else
              console.log("nothing retrieved 3 :(");

          
    }

    const handleFetchFlow = async (): Promise<void> => { 
      const flows = await getRequirementFlowithId(Number(localStorage.getItem("requirement_id")));
      if(flows)
      {
        setFlagFlow("a");
        const tasks = flows.map((u) => {
          return {  //return data compatible with data types specified in the tasks variable 
            brief_description: (u as any)["brief_description"],
            submitter_id: (u as any)["submitter_id"],
            requirement_id: (u as any)["requirement_id"],
            time_of_update: (u as any)["time_of_update"] && typeof (u as any)["time_of_update"].toDate === 'function'
              ? ((u as any)["time_of_update"].toDate().getFullYear()).toString() + '-'
                + ((u as any)["time_of_update"].toDate().getMonth() + 1).toString().padStart(2, "0") + '-'
                + ((u as any)["time_of_update"].toDate().getDate()).toString().padStart(2, "0")
              : "Invalid Date",
            process_type: (u as any)["process_type"],
            order: (u as any)["order"],
            manager_id: (u as any)["manager_id"]
            }
           }); 
           tasks.sort((a, b) => b.order - a.order); //workflow was not displayed sorted
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

  const handleResolveRequirement = async () => {
    if (!currUser || (!isITSupport && !isAdmin) || !isAssignedToMe) return;
    
    const requirementId = localStorage.getItem("requirement_id");
    if (!requirementId || !resolutionDetails.trim()) {
      alert("Please provide resolution details.");
      return;
    }
  
    const confirmResolve = window.confirm("Mark this requirement as resolved?");
    if (!confirmResolve) return;
  
    setIsUpdating(true);
    try {
      const result = await updateRequirementStatus(requirementId, "Resolved", resolutionDetails);
      if (result === 0) {
        setUpdateSuccess(true);
        setActiveTab("state"); // Switch to state tab after resolving
        
        // Update local requirement state for UI feedback
        if (requirements.length > 0) {
          const updatedRequirements = [...requirements];
          updatedRequirements[0].requirement_status = "Resolved";
          setRequirements(updatedRequirements);
        }
        
        // Reset form and refresh data
        setResolutionDetails("");
        await handleFetchAll();
        await handleFetchFlow();
      } else {
        setUpdateSuccess(false);
      }
    } catch (error) {
      console.error("Error resolving requirement:", error);
      setUpdateSuccess(false);
    } finally {
      setIsUpdating(false);
      setTimeout(() => {
        setUpdateSuccess(null);
      }, 3000);
    }
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
  
  // Handle state change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
  };

  // Handle resolution comment change
  const handleResolutionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResolutionDetails(e.target.value);
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
          currentUserId = requirements[0]?.submitter_id || 1;
        }
        
        // Get incident ID
        const incidentId = requirements[0]?.requirement_id;
        
        if (!incidentId) {
          throw new Error("No requirement ID found");
        }
        
        console.log("Updating requirement state:", {
          incidentId,
          newState: selectedState,
          updatedBy: currentUserId
        });
        
        // Call the Firebase function to update the state
        const success = await updateRequirementStatus(
          incidentId,
          selectedState,
          currentUserId
        ).catch((error) => {
          console.error("Error in updateRequirementStatus:", error);
          return false; // Ensure a falsy value is returned on failure
        });
        
        if (success === 0) {
          setIsChangingState(false);
          setStateChangeSuccess(true);
          
          // Update local incident state for UI feedback
          if (requirements.length > 0) {
            const updatedIncidents = [...requirements];
            updatedIncidents[0].requirement_status = selectedState;
            setRequirements(updatedIncidents);
          }
          
          // Refresh workflow data to show new entry
          await handleFetchFlow();
          
          // Reset success message after 3 seconds
          setTimeout(() => {
            setStateChangeSuccess(false);
          }, 5000);
        } else {
          throw new Error("Failed to update requirement state");
        }
      } catch (error) {
        console.error("Error changing state:", error);
        setIsChangingState(false);
        alert("Failed to change requirement state. Please try again.");
      }
    };
    
    // Handle escalation submission
    const handleEscalateRequirement = async () => {
      if (selectedEscalationUser === null) {
        alert("Please select a person or group to escalate to.");
        return;
      }
      
      if (!escalationComment.trim()) {
        alert("Please provide details about why you are escalating this requirement.");
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
          currentUserId = requirements[0]?.submitter_id || 1;
        }
        
        // Get requirements ID
        const requirementId = requirements[0]?.requirement_id;
        
        if (!requirementId) {
          throw new Error("No incident ID found");
        }
        
        console.log("Escalating incident:", {
          requirementId,
          targetId: selectedEscalationUser,
          comment: escalationComment,
          updatedBy: currentUserId,
          isGroup: isGroupSelected
        });
        
        // Call the Firebase function to escalate the incident
        const success = await escalateRequirement(
          requirementId,
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
          if (requirements.length > 0) {
            const updatedRequirements = [...requirements];
            updatedRequirements[0].requirement_status = "Escalated";
            setRequirements(updatedRequirements);
          }
          
          // Refresh workflow data to show new entry
          await handleFetchFlow();
          
          // Reset success message after 3 seconds
          setTimeout(() => {
            setEscalationSuccess(false);
          }, 3000);
          window.location.href = "/trackrequirements";
        } else {
          throw new Error("Failed to escalate requirement");
        }
      } catch (error) {
        console.error("Error escalating requirement:", error);
        setIsEscalating(false);
        alert("Failed to escalate requirement. Please try again.");
      }
    };

        return(
      <div style={{ display: "flex", flexDirection: "column", marginLeft: "40px" }} className="text-black">
          {/* Main Content */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color:"navy", textAlign: "center" }}>
            Information Technology Investment Request (ITIR) Form
            </h2>
          </div>

          {/* Unified Incident Management Section */}
        {(isAdmin || isITSupport) && isAssignedToMe && (
          <div className="px-4 pb-4 mb-4 border-b border-gray-200">
            <h3 className="text-xl font-bold mb-3">Requirement Management</h3>
            
            {/* Tab navigation with added Resolve tab */}
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
                Escalate Requirement
              </button>
              {requirements[0]?.requirement_status !== "Resolved" && (
                <button 
                  className={`py-2 px-4 ${activeTab === 'resolve' ? 'border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('resolve')}
                >
                  Resolve Requirement
                </button>
              )}
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
                    className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleStateChange}
                    value={selectedState}
                    disabled={isChangingState}
                  >
                    <option value="">-- Select state --</option>
                    {REQUIREMENT_STATES.map((state, index) => (
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
                    Requirement state successfully updated!
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
                    className="w-full md:w-1/2 lg:w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Provide details about why you are escalating this requirement..."
                    onChange={handleCommentChange}
                    value={escalationComment}
                    disabled={isEscalating}
                  ></textarea>
                </div>
                
                <button
                  onClick={handleEscalateRequirement}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400"
                  disabled={selectedEscalationUser === null || !escalationComment.trim() || isEscalating}
                >
                  {isEscalating ? "Escalating..." : "Escalate Requirement"}
                </button>
                
                {/* Success message */}
                {escalationSuccess && (
                  <div className="mt-3 p-2 bg-green-100 text-green-700 rounded-md">
                    Requirement successfully escalated!
                  </div>
                )}
              </div>
            )}

            {/* Resolve Requirement form */}
            {activeTab === 'resolve' && requirements[0]?.requirement_status !== "Resolved" && (
              <div>
                <div className="mb-4">
                  <label htmlFor="resolution-details" className="block mb-2 font-medium">
                    Resolution Details:
                  </label>
                  <textarea
                    id="resolution-details"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Provide details about how this requirement was resolved..."
                    value={resolutionDetails}
                    onChange={handleResolutionChange}
                    disabled={isUpdating}
                  ></textarea>
                </div>
                
                <button
                  onClick={handleResolveRequirement}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:bg-gray-400"
                  disabled={!resolutionDetails.trim() || isUpdating}
                >
                  {isUpdating ? "Resolving..." : "Resolve Requirement"}
                </button>
                
                {/* Success message */}
                {updateSuccess !== null && (
                  <div className="mt-3 p-2 bg-green-100 text-green-700 rounded-md">
                    {updateSuccess ? "Requirement successfully marked as resolved!" : "Failed to resolve requirement."}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


          <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Reporter Information</h1> 
    {
      
      uDatafromDb.map((u, index) => (
      <table
      
              key=
              {index} style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      border: "1px solid #ccc",
                      width: "140px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    First Name, Last Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "400px",
                    }}
                  >
                 {u.name} {u.last_name_1}
                  </td>
                </tr>
                <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Role or Position
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                > 
                  {u.rol}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Phone Number and Extension
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                >
                {u.cel_1}  
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Email Address
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                >
                  {u.email}
                </td>
                
              </tr>
              </tbody>
              </table>
      ))}

      {requirements.map((u, index) => (
        
        <div key={index}>
          
          <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Brief Description of the Requirement</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.brief_description}
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Detailed Description of the Requirement</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.detailed_description}
                  </td>
                </tr>
              </tbody>
              </table>
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Current Status</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.requirement_status}
                  </td>
                </tr>
              </tbody>
              </table>
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Is this request a new Business Process or Enhancement to an existing Process?</h1>
              <p>R/ {u.process_type}.</p>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Do any workarounds exist currently?</h1>
              {u.exist_workarounds === "No" && <p>R/ No.</p>}
              {u.exist_workarounds === "Yes" && <p>R/ Yes.</p>}
              {u.exist_workarounds !== "Yes" && u.exist_workarounds !== "No" && <p>R/ Not applicable.</p>}
      
              
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> If you have selected 'Yes' for question (Q2), describe workaround(s):</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.workarounds_description === "" && "N/A"}
                  {u.workarounds_description !== "" && u.workarounds_description}
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Business Goals or Objectives of the Request</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.request_goals}
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Reporting or Data Requirements</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.data_requirement}
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> List Dependencies (if any)</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.dependencies}
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> List Stakeholders</h1>
              {stakesholders.map((k, index2) => (
                <div key={index2}>
              
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
              <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      border: "1px solid #ccc",
                      width: "140px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    First Name, Last Name
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "400px",
                    }}
                  >
                 {k.first_name} {k.last_name}
                  </td>
                </tr>
                <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Role or Position
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                > 
                  {k.role}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Phone Number
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                >
                {k.phone}  
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Email Address
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                >
                  {k.email}
                </td>
                
              </tr>
              </tbody>
              </table>
              </div>
              ))}

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Contact Information for the Business Administrator (Functional Unit Manager)</h1>
              <table
              key=
              {index} style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px 15px",
                      border: "1px solid #ccc",
                      width: "140px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    First Name, Last Name, Middle Initial
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "400px",
                    }}
                  >
                 {u.contact_first_name} {u.contact_last_name}
                  </td>
                </tr>
                <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Role or Position
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                > 
                  {u.contact_role}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Phone Number and Extension
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                >
                {u.contact_phone}  
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "10px 15px",
                    border: "1px solid #ccc",
                    width: "140px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  Email Address
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    width: "400px",
                  }}
                >
                  {u.contact_email}
                </td>
                
              </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}>Communication Strategy</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  {u.contact_information}
                  </td>
                </tr>
              </tbody>
              </table>

              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}>Supporting_documents</h1>
              <table
              style={{ width: "80%", maxWidth: "700px", borderCollapse: "collapse", marginTop: "20px" }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  >
                  
                  </td>
                </tr>
              </tbody>
              </table>
              <h1 style={{ marginTop: "20px", fontWeight: "bold" }}> Requirement Submit Date: {u.requirement_submit_date}</h1>
              </div>
              ))}

       
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "700px", width: "80%", marginLeft: "0" }} className="text-black">
          {/* Main Content */}
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "30px", marginBottom: "20px" }}>
              Workflow
            </h1>
          </div>
          
          {flows.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {flows.map((u, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-t-2 border-gray-200">
                      <td style={{ padding: "10px 15px", fontWeight: "bold" }}>Time of Advance:</td>
                      <td style={{ padding: "10px" }}>{u.time_of_update}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 15px", fontWeight: "bold" }}>Description:</td>
                      <td style={{ padding: "10px" }}>{u.brief_description}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 15px", fontWeight: "bold" }}>Progress Made By:</td>
                      <td style={{ padding: "10px" }}>{u.manager_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 15px", fontWeight: "bold" }}>Current Status:</td>
                      <td style={{ padding: "10px" }}>{u.process_type}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 15px", fontWeight: "bold" }}>Reporter ID:</td>
                      <td style={{ padding: "10px" }}>{u.submitter_id}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="border-t border-gray-200 py-4 px-2">
              No records available.
            </div>
          )}
      </div>

          <div className="mt-4" style={{ width: "80%", maxWidth: "700px" }}>
            <button
            onClick={()=>handleRouter()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            type="button"
            >
            Back
            </button>
          </div>
  </div>
  );
}

export default MainPage;