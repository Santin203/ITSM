import { confirmPasswordReset, sendPasswordResetEmail, signOut, getAuth, onAuthStateChanged } from "firebase/auth";
import {collection, doc, getDoc, getDocs, getFirestore, query,where, writeBatch } from "firebase/firestore";
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
    batch.update(docRef, {"rol": String(newRole)});
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
      const receivedIncidentsQuery = query(incidentsRef, where("it_id", "==", Number(userId)));
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
          description += ` (Resolution date: ${currentTime.toLocaleString()})`;
          
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
          time_of_incident: currentTime
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