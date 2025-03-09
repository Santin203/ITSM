"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { getAdminsData} from '../../../../hooks/db.js'



type User = {
  name:string,
  lastname:string,
  rol:string,
  id:number,
  docId:string
}[];       //define the task type

type Order = {
  name:number,
  lastname:number,
  rol:number,
  id:number
};  


const MainPage: React.FC = () => {
  const [users, setUsers] = useState<User>([]);
  const [order, setOrder] = useState<Order>({'name':0,'lastname': 0,'rol': 0,'id':0});
  const [formData, setFormData] = useState({
    name: "",
    last:"",
    rol:"",
    id:"",
  });
  

  const handleFetchAll = async (): Promise<void> => {    
      const usersData = await getAdminsData();
      const tasks = usersData.map((u) => {
        return {  //return data compatible with data types specified in the tasks variable 
            name: (u as any)[0]["name"],
            lastname: (u as any)[0]["last_name_1"],
            rol: (u as any)[0]["rol"],
            id: (u as any)[0]["id"],
            docId: (u as any)[1]
            }
           }); 
           setUsers(tasks);
        }
      
  console.log((users as any)["docId"]);
  // Filtered data
  const filteredUsers = users.filter((u) =>
        (formData.name === "" || u.name == formData.name) &&
        (formData.id === "" || u.id == Number(formData.id)) &&
        (formData.last === "" || u.lastname == formData.last) &&
        (formData.rol === "" || u.rol == formData.rol)
      );
       

  // Ordenación dinámica
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    for (const col in order) {
      if (order[col as keyof Order] !== 0) {
        if (typeof (a as any)[col] === "string" && typeof (b as any)[col] == "string") {
          return order[col as keyof Order] * ((a as any)[col].toLowerCase() > (b as any)[col].toLowerCase() ? 1 : -1);
        } else {
          return order[col as keyof Order] * ((a as any)[col] > (b as any)[col] ? 1 : -1);
        }
      }
    }
    return 0;
  });

  // Alternar orden y resetear las demás columnas
  const handleSort = (col: keyof Order) => {
    setOrder((o) => {
      const newOrder: Order = { name: 0, lastname: 0, rol: 0, id: 0 };
      if(o[col] >= 0)
        newOrder[col] = -1;
      else
        newOrder[col] = 1
      return newOrder;
    });
    console.log(order);
  };
        
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };

  useEffect(() => {
      if(formData.name === "" && formData.id === "" && formData.last === "" && formData.rol === ""
        && order["name"] === 0 && order["rol"] === 0 && order["lastname"] === 0 && order["id"] === 0){handleFetchAll();}
      }
  ,[]);

        return (
    <div>
      <div className="text-black p-4">
        <h1 className="text-[2rem] font-bold">View Users</h1>
      </div>
      <div>
      <form>
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
            <label htmlFor="rol" className="block mb-2">
            <p className="text-black dark:text-gray-200 mt-2">Search for Role:</p>
            </label>
            <input
              type="text"
              id="rol"
              name="rol"
              onChange={handleChange}
              value={formData.rol}
              className="text-black border rounded px-4 py-2 mb-4 w-medium"
            />
            </div>
            </div>
        </fieldset> 
        </form>
  
      </div>
      <main className="overflow-x-auto bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
      <table className="min-w-full text-gray-800 dark:text-gray-200">
      <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name<button
                            onClick={() => handleSort("name")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["name"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Last Name<button
                            onClick={() => handleSort("lastname")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["lastname"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">ID<button
                            onClick={() => handleSort("id")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["id"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
              <th className="px-4 py-2 text-left">Rol<button
                            onClick={() => handleSort("rol")}
                            className="px-4 py-2 text-left"
                            >
                            <span>{order["rol"] >= 0 ? '>' : '<'}</span>
                            </button>
              </th>
            </tr>
          </thead>
        <tbody>
            {sortedUsers.map((u, index) => (
              <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.lastname}</td>
                <td className="px-4 py-2">{u.id}</td>
                <td className="px-4 py-2">{u.rol}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
  </div>
  );
}

export default MainPage;