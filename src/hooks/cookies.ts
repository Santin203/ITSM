"use server"
import { cookies } from "next/headers";

export async function createCookie(name: string, value: string) {
  if (value === "") return;
  
  const cookieStore = await cookies();
  cookieStore.set({
    name: name,
    value: value,
  });
}

export async function deleteCookie(name: string) {
  if (name === "") return;
  
  const cookieStore = await cookies();
  cookieStore.delete(name);
}