import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { deleteCookie } from "../hooks/cookies";

export function useAuth() {
  const [user, setUser] = useState(null); 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      //console.error("Login failed:", error.message);
      throw error; // Rethrow the error so handleLogin functioncan catch it 
    }
};

  const logout = async () => {
    await deleteCookie("loggedin");
    await deleteCookie("mfaed");
    await deleteCookie("role");
    await signOut(auth);
  };

  return { user, login, logout };
}
