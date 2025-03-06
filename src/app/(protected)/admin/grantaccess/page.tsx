"use client";
import React from 'react';
import { useState, useEffect } from "react";
import {getUsersData} from '../../../../hooks/db.js'


type User = {
  name:string,
  lastname:string,
  rol:string,
  id:number
}[];       //define the task type



const MainPage: React.FC = () => {
  const [users, setUsers] = useState<User>([])
  const [formData, setFormData] = useState({
    name: "",
    id:"",
    last:""
  });

  const handleFetchAll = async (): Promise<void> => {    
    const usersData = await getUsersData();
    const tasks = usersData.map((u) => {
      return {  //return data compatible with data types specified in the tasks variable 
          name: u["name"],
          lastname: u["last_name_1"],
          rol: u["rol"],
          id: u["id"]
          }
         }); 
         setUsers(tasks);
      }
  
       // Filtered data
      const filteredUsers = users.filter((u) =>
        (formData.name === "" || u.name == formData.name) &&
        (formData.id === "" || u.id == Number(formData.id)) &&
        (formData.last === "" || u.lastname == formData.last)
      );
    
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };
    
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUsers(filteredUsers); 
      };

    useEffect(() => {
      if(formData.name === "" && formData.id === "" && formData.last === ""){handleFetchAll();}});

  return (
    <div>
      <div className="text-black p-4">
        <h1 className="text-[2rem] font-bold">Grant Access</h1>
      </div>
      <div>
      <form onSubmit={handleSubmit}>
          <fieldset>
          
            <legend className="text-black dark:text-gray-200 font-semibold text-lg mb-4">Filter Users</legend>
            <div className="flex space-x-4 mt-2"> 
            <div>
            <label htmlFor="name" className="block mb-2">
            <p className="text-black dark:text-gray-200 mt-2">Search for Name:</p>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              onChange={handleChange}
              value={formData.name}
              className="text-black border rounded px-4 py-2 mb-4 w-medium"
            />
            </div>
            <div>
            <label htmlFor="id" className="block mb-2">
            <p className="text-black dark:text-gray-200 mt-2">Search for ID:</p>
            </label>
            <input
              type="text"
              id="id"
              name="id"
              onChange={handleChange}
              value={formData.id}
              className="text-black border rounded px-4 py-2 mb-4 w-medium"
            />
            </div>
            <div>
            <label htmlFor="last" className="block mb-2">
            <p className="text-black dark:text-gray-200 mt-2">Search for Last Name:</p>
            </label>
            <input
              type="text"
              id="last"
              name="last"
              onChange={handleChange}
              value={formData.last}
              className="text-black border rounded px-4 py-2 mb-4 w-medium"
            />
            </div>
            </div>
            <a href="/admin/grantaccess">
            <input
              type="submit"
              value="Submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            />
            </a>
        </fieldset> 
        </form>
  
      </div>
      <main className="overflow-x-auto bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
      <table className="min-w-full text-gray-800 dark:text-gray-200">
      <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Last Name</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-left">ID</th>
            </tr>
          </thead>
        <tbody>
            {users.map((u, index) => (
              <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.lastname}</td>
                <td className="px-4 py-2">{u.rol}</td>
                <td className="px-4 py-2">{u.id}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
  </div>
  );
};

export default MainPage;