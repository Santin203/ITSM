import { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState(null); 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  //original login function written by Richard
 /*const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };*/

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      //console.error("Login failed:", error.message);
      throw error; // Rethrow the error so handleLogin functioncan catch it 
    }
};

  const logout = async () => {
    await signOut(auth);
  };

  return { user, login, logout };
}
