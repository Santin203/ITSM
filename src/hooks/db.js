import { collection, getDocs, getFirestore, Firestore } from "firebase/firestore";
import { app } from "../firebaseConfig";

const db = getFirestore(app);

export async function getEmails() {
    const usersCol = collection(db, "Users");
    const usersSnapshot = await getDocs(usersCol);
    const emails = usersSnapshot.docs.map(doc => doc.data()["email"]);
    return emails;
  }
