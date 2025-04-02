import { confirmPasswordReset, sendPasswordResetEmail, signOut, getAuth, onAuthStateChanged } from "firebase/auth";
import {collection, doc, getDoc, getDocs, getFirestore, query,where, writeBatch, updateDoc , addDoc} from "firebase/firestore";
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
          manager_id: Number(incidentData.it_id)
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
      return 1;
    }

    const requirementDoc = requirementSnapshot.docs[0];
    const requirementDocId = requirementDoc.id;
    const requirementData = requirementDoc.data();
    const currentTime = new Date();

    const docRef = doc(db, "Requirements", requirementDocId);
    if (newStatus === "Resolved") {
      batch.update(docRef, {
        process_type: newStatus,
        resolution_date: currentTime,
        resolution_details: resolutionDetails || ''
      });
    } else {
      batch.update(docRef, { process_type: newStatus });
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
          process_type: newStatus,
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
  it_id: i.it_id,
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

