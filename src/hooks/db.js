import { confirmPasswordReset, sendPasswordResetEmail, signOut, getAuth, onAuthStateChanged } from "firebase/auth";
import {collection, doc, getDoc, getDocs, getFirestore, query,where, writeBatch , addDoc} from "firebase/firestore";
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

