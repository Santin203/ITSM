"use client";
import React, { useEffect, useState } from "react";
import { getAllGroups, getUserDatawithDocId } from "../../../../hooks/db";

type Group = {
    id: number;
    name: string;
    members: string[]; // still doc IDs internally
};

type DisplayGroup = {
    id: number;
    name: string;
    memberNames: string[];
};

const ViewGroupsPage: React.FC = () => {
    const [groups, setGroups] = useState<DisplayGroup[]>([]);
    const [formData, setFormData] = useState({ name: "", memberName: "" });

    const fetchGroups = async () => {
        const groupsData = await getAllGroups();
      
        const groupPromises = groupsData.map(async (group: any) => {
            // get group members' names 
            const memberNameResults = await Promise.all(
                group.members.map(async (memberDocId: string) => {
                    const userData = await getUserDatawithDocId(memberDocId);
                    return userData && userData.name && userData.last_name_1
                    ? `${userData.name} ${userData.last_name_1}`
                    : null;
                })
            );
      
            const memberNames = memberNameResults.filter(Boolean) as string[];
      
            return {
                id: group.id,
                name: group.name,
                memberNames,
            };
        });
      
        const finalGroups = await Promise.all(groupPromises);
        setGroups(finalGroups);
    };
      

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const filteredGroups = groups.filter((group) =>
        (formData.name === "" || group.name.toLowerCase().includes(formData.name.toLowerCase())) &&
        (formData.memberName === "" || group.memberNames.some(member =>
            member.toLowerCase().includes(formData.memberName.toLowerCase())
        ))
    );

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <div className="p-6 text-black">
            <h1 className="text-2xl font-bold mb-4">View Groups</h1>

            <div className="mb-4">
                <form>
                    <fieldset>
                        <legend className="text-black font-semibold text-lg mb-2">Filter Groups</legend>
                        <div className="flex space-x-4 mt-2">
                            <div>
                                <label htmlFor="name" className="block mb-2 text-black">Search by Group Name:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    onChange={handleChange}
                                    value={formData.name}
                                    className="text-black border rounded px-4 py-2 w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="memberName" className="block mb-2 text-black">Search by Member Name:</label>
                                <input
                                    type="text"
                                    id="memberName"
                                    name="memberName"
                                    onChange={handleChange}
                                    value={formData.memberName}
                                    className="text-black border rounded px-4 py-2 w-full"
                                />
                            </div>
                        </div>
                    </fieldset>
                </form>
            </div>

            <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left">Group Name</th>
                            <th className="px-4 py-2 text-left">Group ID</th>
                            <th className="px-4 py-2 text-left">Number of Members</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGroups.map((group, index) => (
                        <React.Fragment key={index}>
                            <tr className="border-t">
                                <td className="px-4 py-2">{group.name}</td>
                                <td className="px-4 py-2">{group.id}</td>
                                <td className="px-4 py-2">{group.memberNames?.length ?? 0}</td>
                            </tr>
                            <tr className="border-b">
                                <td colSpan={3} className="px-4 py-2 text-sm text-gray-600">
                                    Members: {group.memberNames.join(", ")}
                                </td>
                            </tr>
                        </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
  );
};

export default ViewGroupsPage;
