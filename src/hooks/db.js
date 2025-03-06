import { getAuth, sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "../firebaseConfig";

const auth = getAuth();
const db = getFirestore(app);

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