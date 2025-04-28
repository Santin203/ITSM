import { confirmPasswordReset, sendPasswordResetEmail, signOut, getAuth, onAuthStateChanged } from "firebase/auth";
import {collection, doc, getDoc, getDocs, getFirestore, query,where, writeBatch, updateDoc , addDoc, setDoc, arrayUnion} from "firebase/firestore";
import { app, auth, db } from "../firebaseConfig";
import { deleteCookie } from "../hooks/cookies";
import { type } from "os";


// Get a new write batch

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export function sendResetEmail(email) {
  sendPasswordResetEmail(auth, email)
  .then(() => {
    // Password reset email sent!
    console.log("email sent");
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorCode, errorMessage);
  });
}

export async function getEmails() {
    const usersCol = collection(db, "Users");
    const usersSnapshot = await getDocs(usersCol);
    const emails = usersSnapshot.docs.map(doc => doc.data()["email"]);
    return emails;
  }

export async function getUsersData() {
    const usersCol = collection(db, "Users");
    const usersSnapshot = await getDocs(usersCol);
    const usersData = usersSnapshot.docs.map(doc => doc.data());
    return usersData;
  }

  export async function getAdminsData() {
    const usersRef = collection(db, "Users");
    const usersCol = query(usersRef, where("rol", "!=", "No access"));
    const usersSnapshot = await getDocs(usersCol);
    const usersData = usersSnapshot.docs.map(doc => [doc.data(), doc.id]);
    return usersData;
  };


export async function getUsersDataDic() {
    const usersCol = collection(db, "Users");
    const usersSnapshot = await getDocs(usersCol);
    const usersDataDic = usersSnapshot.docs.map(doc => [doc.data(), doc.id]);
    return usersDataDic;
}

export async function setUserRole(newRole, userDocID) {
  try{
    const batch = writeBatch(db);
    const docRef = doc(db, "Users", String(userDocID));
    batch.update(docRef, {"rol": newRole});
    await batch.commit();
    return(0);
  }
  catch
  {
    return(1);
  }
}

export function resetPassword(code, newPassword) {
  confirmPasswordReset(auth, code, newPassword)
    .then(() => {
      // Password reset email sent!
      console.log("password reset successful");
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
  }

export async function logout() {
  deleteCookie("loggedin");
  deleteCookie("mfaed");
  deleteCookie("role");
  await signOut(auth);
}

export async function getCurrUserData() 
{
  const currUser = auth.currentUser;
  if (currUser) {
    const docRef = doc(db, "Users", currUser.uid);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    if(data)
    {
      return data;
    }
  }
}

export async function getUserDatawithId(id) 
{
  const incidentsRef = collection(db, "Users");
  const usersIncidentsCol = query(incidentsRef, where("id", "==", Number(id)));
  const incidentFlowsSnapshot = await getDocs(usersIncidentsCol);
  const flowsData = incidentFlowsSnapshot.docs.map(doc => doc.data());
  if(flowsData)
  {
    return flowsData;
  }
}

export async function getCurrUserIncidentsData() 
{
  const currUser = auth.currentUser;
  if (currUser) {
    const uid = currUser.uid;
    const docRef = doc(db, "Users", uid);
    const docSnap = await getDoc(docRef);
    
    const data = docSnap.data();
    if(data)
    {
      const usersData = data["id"];
      const incidentsRef = collection(db, "Incidents");
      const usersIncidentsCol = query(incidentsRef, where("reporter_id", "==", Number(usersData)));
      const usersIncidentsSnapshot = await getDocs(usersIncidentsCol);
      const incidentsData = usersIncidentsSnapshot.docs.map(doc => [doc.data(), doc.id]);
      if(incidentsData)
      {
        return incidentsData;
      }
    } 
  }
}

export async function getIncidentwithId(i_id)
{
  const incidentsRef = collection(db, "Incidents");
  const usersIncidentsCol = query(incidentsRef, where("incident_id", "==", i_id));
  const usersIncidentsSnapshot = await getDocs(usersIncidentsCol);
  const incidentsData = usersIncidentsSnapshot.docs.map(doc => doc.data());
  if(incidentsData)
  {
    return incidentsData;
  }
}

export async function getFlowithId(i_id)
{
  const incidentsRef = collection(db, "Workflow");
  const usersIncidentsCol = query(incidentsRef, where("incident_id", "==", i_id));
  const incidentFlowsSnapshot = await getDocs(usersIncidentsCol);
  const flowsData = incidentFlowsSnapshot.docs.map(doc => doc.data());
  if(flowsData)
  {
    return flowsData;
  }
}

export async function getITUserIncidentsData() 
{
  const currUser = auth.currentUser;
  if (currUser) {
    const uid = currUser.uid;
    const docRef = doc(db, "Users", uid);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    if(data) {
      const userId = data["id"];
      const incidentsRef = collection(db, "Incidents");
      
      // Get incidents where user is the reporter (sent incidents)
      const sentIncidentsQuery = query(incidentsRef, where("reporter_id", "==", Number(userId)));
      const sentIncidentsSnapshot = await getDocs(sentIncidentsQuery);
      const sentIncidentsData = sentIncidentsSnapshot.docs.map(doc => {
        return [
          { ...doc.data(), incidentType: "sent" }, // Add a flag to identify sent incidents
          doc.id
        ];
      });
      
      // Get incidents where user is the IT support (received incidents)
      const receivedIncidentsQuery = query(incidentsRef, where("assigned_to_id", "==", Number(userId)));
      const receivedIncidentsSnapshot = await getDocs(receivedIncidentsQuery);
      const receivedIncidentsData = receivedIncidentsSnapshot.docs.map(doc => {
        return [
          { ...doc.data(), incidentType: "received" }, // Add a flag to identify received incidents
          doc.id
        ];
      });
      
      // Combine both sets of incidents
      const allIncidentsData = [...sentIncidentsData, ...receivedIncidentsData];
      
      if(allIncidentsData.length > 0) {
        return allIncidentsData;
      }
    } 
  }
  return [];
}

export async function updateIncidentStatus(incidentId, newStatus, resolutionDetails = '') {
  try {
    const batch = writeBatch(db);
    
    // First we need to get the document ID using the incident_id field
    const incidentsRef = collection(db, "Incidents");
    const incidentQuery = query(incidentsRef, where("incident_id", "==", Number(incidentId)));
    const incidentSnapshot = await getDocs(incidentQuery);
    
    if (incidentSnapshot.empty) {
      console.error("No incident found with ID:", incidentId);
      return 1;
    }
    
    // Get the first matching document (should be only one)
    const incidentDoc = incidentSnapshot.docs[0];
    const incidentDocId = incidentDoc.id;
    const incidentData = incidentDoc.data();
    
    // Create current timestamp for the resolution date
    const currentTime = new Date();
    
    // Update the incident status and incident_resolution_date if status is "Resolved"
    const docRef = doc(db, "Incidents", incidentDocId);
    if (newStatus === "Resolved") {
      batch.update(docRef, {
        "incident_status": newStatus,
        "incident_resolution_date": currentTime,
        "resolution_details": resolutionDetails || '' // Store resolution details in the incident
      });
    } else {
      batch.update(docRef, {"incident_status": newStatus});
    }
    
    // Also add an entry to the workflow collection to track this status change
    const workflowRef = collection(db, "Workflow");
    const currUser = auth.currentUser;
    
    if (currUser) {
      // Get the current user's data to get their ID
      const userDocRef = doc(db, "Users", currUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      
      if (userData) {
        // Get the highest order number for this incident's workflow
        const workflowQuery = query(workflowRef, where("incident_id", "==", Number(incidentId)));
        const workflowSnapshot = await getDocs(workflowQuery);
        let maxOrder = 0;
        
        workflowSnapshot.forEach((doc) => {
          const order = doc.data().order || 0;
          if (order > maxOrder) {
            maxOrder = order;
          }
        });
        
        // Create a new workflow entry
        const newWorkflowRef = doc(workflowRef);
        
        // Add resolution details to the description if provided
        let description = `Status changed to: ${newStatus}`;
        if (newStatus === "Resolved") {
          description += `. (Resolution date: ${currentTime.toLocaleString()}).`;
          
          // Include resolution details in the workflow
          if (resolutionDetails && resolutionDetails.trim() !== '') {
            description += `\nResolution details: ${resolutionDetails}`;
          }
        }
        
        batch.set(newWorkflowRef, {
          description: description,
          incident_id: Number(incidentId),
          incident_status: newStatus,
          order: maxOrder + 1,
          reporter_id: Number(userData.id),
          time_of_incident: currentTime,
          manager_id: Number(incidentData.assigned_to_id)
        });
      }
    }
    
    // Commit all the changes
    await batch.commit();
    return 0; // Success
  } catch (error) {
    console.error("Error updating incident status:", error);
    return 1; // Error
  }
}

// Function to update incident state 
export async function updateIncidentState(incidentId, newState, updatedBy) {
  try {
    const batch = writeBatch(db);
    
    // Find the incident document
    const incidentsRef = collection(db, "Incidents");
    const q = query(incidentsRef, where("incident_id", "==", Number(incidentId)));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No incident found with ID:", incidentId);
      return false;
    }
    
    // Get the document reference and update it
    const incidentDoc = querySnapshot.docs[0];
    const incidentRef = doc(db, "Incidents", incidentDoc.id);
    
    batch.update(incidentRef, {
      incident_status: newState,
      last_updated_by: String(updatedBy),
      last_updated_at: new Date()
    });
    
    // Add a workflow entry documenting the state change
    const workflowRef = doc(collection(db, "Workflow"));
    batch.set(workflowRef, {
      incident_id: Number(incidentId),
      description: `State changed to ${newState}`,
      reporter_id: Number(updatedBy),
      time_of_incident: new Date(),
      incident_status: newState,
      order: Date.now() // Simple ordering mechanism
    });
    
    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error updating incident state:", error);
    return false;
  }
}

// Function to get all groups (added from new version)
export async function getAllGroups() {
  try {
    const groupsCol = collection(db, "Groups");
    const groupsSnapshot = await getDocs(groupsCol);
    const groupsData = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isGroup: true
    }));
    return groupsData;
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
}

// Function to escalate incident to a user
export async function escalateIncident(incidentId, targetId, comment, updatedBy) {
  try {
    const batch = writeBatch(db);
    
    // Find the incident document
    const incidentsRef = collection(db, "Incidents");
    const q = query(incidentsRef, where("incident_id", "==", Number(incidentId)));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No incident found with ID:", incidentId);
      return false;
    }
    
    // Get the document reference
    const incidentDoc = querySnapshot.docs[0];
    const incidentRef = doc(db, "Incidents", incidentDoc.id);
    
    // Update the incident document - now using assigned_to_id (a number)
    batch.update(incidentRef, {
      assigned_to_id: Number(targetId), // Update assigned_to_id as a number
      incident_status: "Escalated",
      last_updated_by: String(updatedBy),
      last_updated_at: new Date(),
      escalation_comment: comment
    });
    
    // Add a workflow entry documenting the escalation
    const workflowRef = doc(collection(db, "Workflow"));
    batch.set(workflowRef, {
      incident_id: Number(incidentId),
      description: `Escalated to User: ${targetId}: ${comment}`,
      reporter_id: Number(updatedBy),
      time_of_incident: new Date(),
      incident_status: "Escalated",
      order: Date.now(), // Simple ordering mechanism
      manager_id: Number(updatedBy)
    });
    
    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error escalating incident:", error);
    return false;
  }
}

// Function to escalate requirement to a user
export async function escalateRequirement(requirementId, targetId, comment, updatedBy) {
  try {
    const batch = writeBatch(db);
    
    // Find the requirement document
    const requirementsRef = collection(db, "Requirements");
    const q = query(requirementsRef, where("requirement_id", "==", Number(requirementId)));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No requirement found with ID:", requirementId);
      return false;
    }
    
    // Get the document reference
    const requirementDoc = querySnapshot.docs[0];
    const requirementRef = doc(db, "Requirements", requirementDoc.id);
    const currentTime = new Date();

    //Get name from the targetId
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("id", "==", Number(targetId)));
    const userSnapshot = await getDocs(userQuery);

    let targetName = "Unknown User";
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      targetName = `${userData.name} ${userData.last_name_1}`;
    }


    
    // Update the requirement document
    batch.update(requirementRef, {
      assigned_to_id: Number(targetId), // Update assigned_to_id as a number
      requirement_status: "Escalated",
      last_updated_by: String(updatedBy),
      last_updated_at: new Date(),
      escalation_comment: comment
    });
    
    // Add a workflow entry documenting the escalation
    const workflowRef = doc(collection(db, "Requirement_Workflow"));
    batch.set(workflowRef, {
      requirement_id: Number(requirementId),
      brief_description: `Requirement escalated to ${targetName} with the following comment: ${comment}`,
      submitter_id: Number(updatedBy),
      time_of_update: currentTime,
      requirement_status: "Escalated",
      order: Date.now(), // Simple ordering mechanism
      manager_id: Number(updatedBy)
    });
    
    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error escalating requirement:", error);
    return false;
  }
}

// Function to get incidents assigned to current user
export async function getAssignedIncidents() {
  const currUser = auth.currentUser;
  if (currUser) {
    try {
      // Get user data to find user ID
      const docRef = doc(db, "Users", currUser.uid);
      const docSnap = await getDoc(docRef);
      const userData = docSnap.data();
      
      if (!userData) {
        console.error("No user data found");
        return [];
      }
      
      const userId = String(userData.id);
      
      // Query incidents where the user is in the assigned_to array
      const incidentsRef = collection(db, "Incidents");
      const q = query(incidentsRef, where("assigned_to", "array-contains", userId));
      const querySnapshot = await getDocs(q);
      
      const incidentsData = querySnapshot.docs.map(doc => [doc.data(), doc.id]);
      return incidentsData;
    } catch (error) {
      console.error("Error getting assigned incidents:", error);
      return [];
    }
  }
  return [];
}

export async function getRequirementFlowithId(i_id)
{
  const incidentsRef = collection(db, "Requirement_Workflow");
  const usersIncidentsCol = query(incidentsRef, where("requirement_id", "==", i_id));
  const incidentFlowsSnapshot = await getDocs(usersIncidentsCol);
  const flowsData = incidentFlowsSnapshot.docs.map(doc => doc.data());
  if(flowsData)
  {
    return flowsData;
  }
}

export async function getCurrUserRequirementsData() 
{
  const currUser = auth.currentUser;
  if (currUser) {
    const uid = currUser.uid;
    const docRef = doc(db, "Users", uid);
    const docSnap = await getDoc(docRef);
    
    const data = docSnap.data();
    if(data)
    {
      const usersData = docSnap.data()["id"];

      const requirementsRef = collection(db, "Requirements");
      const usersRequirementsCol = query(requirementsRef, where("submitter_id", "==", Number(usersData)));
      const usersRequirementsSnapshot = await getDocs(usersRequirementsCol);
      const requirementsData = usersRequirementsSnapshot.docs.map(doc => [doc.data(), doc.id]);
      if(requirementsData)
      {
        return requirementsData;
      }
    } 
  }
}

export async function getRequirementwithId(i_id)
{
  const requirementsRef = collection(db, "Requirements");
  const usersRequirementsCol = query(requirementsRef, where("requirement_id", "==", i_id));
  const usersRequirementsSnapshot = await getDocs(usersRequirementsCol);
  const requirementsData = usersRequirementsSnapshot.docs.map(doc => doc.data());
  if(requirementsData)
  {
    return requirementsData;
  }
}

export async function getStakeholderswithId(i_id)
{
  const requirementsRef = collection(db, "Stakeholders");
  const usersRequirementsCol = query(requirementsRef, where("requirement_id", "==", i_id));
  const usersRequirementsSnapshot = await getDocs(usersRequirementsCol);
  const requirementsData = usersRequirementsSnapshot.docs.map(doc => doc.data());
  if(requirementsData)
  {
    return requirementsData;
  }
}

export async function getAllIncidents() {
  const incidentsRef = collection(db, "Incidents");
  const incidentsSnapshot = await getDocs(incidentsRef);
  const incidentsData = incidentsSnapshot.docs.map(doc => [doc.data(), doc.id]);
  return incidentsData;
}


// Set manager_id in the latest step (highest order) of the flow
export const updateWorkflowManager = async (incident_id, manager_id) => {
  const q = query(
    collection(db, "workflow"),
    where("incident_id", "==", Number(incident_id))
  );
  const snapshot = await getDocs(q);

  let latestDoc = null;
  let latestOrder = -1;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.order > latestOrder) {
      latestOrder = data.order;
      latestDoc = docSnap;
    }
  });

  if (latestDoc) {
    await updateDoc(doc(db, "workflow", latestDoc.id), {
      manager_id: manager_id
    });
    console.log("Workflow updated with manager_id");
  } else {
    console.warn("No workflow steps found for this incident.");
  }
};

export async function getITUserRequirementsData() 
{
  const currUser = auth.currentUser;
  if (currUser) {
    const uid = currUser.uid;
    const docRef = doc(db, "Users", uid);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    if(data) {
      const userId = data["id"];
      const requirementsRef = collection(db, "Requirements");
      
      // Get requirements where user is the submitter (sent requirements)
      const sentRequirementsQuery = query(requirementsRef, where("submitter_id", "==", Number(userId)));
      const sentRequirementsSnapshot = await getDocs(sentRequirementsQuery);
      const sentRequirementsData = sentRequirementsSnapshot.docs.map(doc => {
        const requirementData = doc.data();
        return [
          { ...requirementData, requirementType: "sent" },
          doc.id
        ];
      });
      
      // Get requirements where user is assigned (received requirements)
      const receivedRequirementsQuery = query(requirementsRef, where("assigned_to_id", "==", Number(userId)));
      const receivedRequirementsSnapshot = await getDocs(receivedRequirementsQuery);
      const receivedRequirementsData = receivedRequirementsSnapshot.docs.map(doc => {
        const requirementData = doc.data();
        return [
          { ...requirementData, requirementType: "received" },
          doc.id
        ];
      });
      
      // Combine both sets of requirements
      const allRequirementsData = [...sentRequirementsData, ...receivedRequirementsData];
      
      if(allRequirementsData.length > 0) {
        return allRequirementsData;
      }
    } 
  }
  return [];
}

export async function updateRequirementStatus(requirementId, newStatus, resolutionDetails = '') {
  try {
    const batch = writeBatch(db);
    const requirementsRef = collection(db, "Requirements");
    const requirementQuery = query(requirementsRef, where("requirement_id", "==", Number(requirementId)));
    const requirementSnapshot = await getDocs(requirementQuery);

    if (requirementSnapshot.empty) {
      console.error("No requirement found with ID:", requirementId);
      return 0;
    }

    const requirementDoc = requirementSnapshot.docs[0];
    const requirementDocId = requirementDoc.id;
    const requirementData = requirementDoc.data();
    const currentTime = new Date();

    const docRef = doc(db, "Requirements", requirementDocId);
    if (newStatus === "Resolved") {
      batch.update(docRef, {
        requirement_status: newStatus,
        resolution_date: currentTime,
        resolution_details: resolutionDetails || ''
      });
    } else {
      batch.update(docRef, { requirement_status: newStatus });
    }

    const workflowRef = collection(db, "Requirement_Workflow");
    const currUser = auth.currentUser;

    if (currUser) {
      const userDocRef = doc(db, "Users", currUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      if (userData) {
        const workflowQuery = query(workflowRef, where("requirement_id", "==", Number(requirementId)));
        const workflowSnapshot = await getDocs(workflowQuery);
        let maxOrder = 0;

        workflowSnapshot.forEach((doc) => {
          const order = doc.data().order || 0;
          if (order > maxOrder) {
            maxOrder = order;
          }
        });

        const newWorkflowRef = doc(workflowRef);
        let description = `Status changed to: ${newStatus}`;
        if (newStatus === "Resolved") {
          description += `. (Resolution date: ${currentTime.toLocaleString()}).`;
          if (resolutionDetails && resolutionDetails.trim() !== '') {
            description += `\nResolution details: ${resolutionDetails}`;
          }
        }

        batch.set(newWorkflowRef, {
          brief_description: description,
          requirement_id: Number(requirementId),
          requirement_status: newStatus,
          order: maxOrder + 1,
          submitter_id: Number(userData.id),
          time_of_update: currentTime,
          manager_id: Number(requirementData.assigned_to_id)
        });
      }
    }

    await batch.commit();
    return 0;
  } catch (error) {
    console.error("Error updating requirement status:", error);
    return 1;
  }
}



export async function getAllRequirements() {
  const incidentsRef = collection(db, "Requirements");
  const incidentsSnapshot = await getDocs(incidentsRef);
  const incidentsData = incidentsSnapshot.docs.map(doc => [doc.data(), doc.id]);
  return incidentsData;
}


export async function addIncidents(i) {
  // Add a new document with a generated id.
  const docRef = await addDoc(collection(db, "Incidents"), {
  additional_details: i.additional_details,
  business_impact: i.business_impact,
  department: i.department,
  description: i.description,
  incident_id: i.incident_id,
  incident_logged: i.incident_logged,

  incident_report_date: i.incident_report_date,
  incident_resolution_date: i.incident_resolution_date,
  incident_start_date: i.incident_start_date,
  incident_status:i.incident_status,
  assigned_to_id: i.assigned_to_id,
  organization: i.organization,
  reporter_id:i.reporter_id,
  root_cause: i.root_cause,
  section:i.section,
  title:i.title,
  user_details:i.user_details
  });


  console.log("Document written with ID: ", docRef.id);
  return (0);
}


export async function addRequirement(i) {
  // Add a new document with a generated id.
  const docRef = await addDoc(collection(db, "Requirements"), {
    assigned_to_id:i.assigned_to_id,
    requirement_status:i.requirement_status,
    brief_description:i.brief_description,
    contact_email:i.contact_email,
    contact_first_name:i.contact_first_name,
    contact_information:i.contact_information,
    contact_last_name:i.contact_last_name,
    contact_phone:i.contact_phone,
    contact_role:i.contact_role,
    data_requirement:i.data_requirement,
    dependencies:i.dependencies,
    detailed_description:i.detailed_description,
    exist_workarounds:i.exist_workarounds,
    process_type:i.process_type,
    request_goals:i.request_goals,
    requirement_id:i.requirement_id,
    requirement_submit_date: i.requirement_submit_date,
    submitter_id: i.submitter_id,
    supporting_documents:i.supporting_documents,
    workarounds_description:i.workarounds_description  
  });


  console.log("Document written with ID: ", docRef.id);
  return (0);
}

export async function addStakeholder(i) {
  // Add a new document with a generated id.
  const docRef = await addDoc(collection(db, "Stakeholders"), {
    email:i.stake_email,
    first_name: i.stake_first_name,
    last_name:i.stake_last_name,
    phone:i.stake_phone,
    requirement_id:i.stake_requirement_id,
    role:i.stake_role
  });

  console.log("Document written with ID: ", docRef.id);
  return (0);
}

export async function newGroup(id, name, members) {
  const idstring = String(id);
  await setDoc(doc(db, "Groups", idstring), {
    id : id,
    name: name,
    members: members
  });

  for(const memberID of members)
  {
    addGroupToUser(memberID, id);
  }
  return (0);
}

export async function addGroupToUser(firebaseid, groupid)
{
  const userRef = doc(db, "Users", firebaseid);
  await updateDoc(userRef, {
    groups: arrayUnion(groupid)
  });
}