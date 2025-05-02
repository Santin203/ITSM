"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, writeBatch, arrayRemove, arrayUnion } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig"; // needed to fetch the group document
import { getUserDatawithDocId, sleep } from "../../../../../hooks/db";
import { getAdminsData } from "../../../../../hooks/db"; // already filters out "No access"
import { sendEmail } from '@/hooks/emails';

const GroupInfoPage: React.FC = () => {
    const router = useRouter();
    const [groupData, setGroupData] = useState<any>(null);
    const [members, setMembers] = useState<{ name: string; id: number; rol: string; email: string, docId: string }[]>([]);
    const [removedDocIds, setRemovedDocIds] = useState<string[]>([]);
    const [addableUsers, setAddableUsers] = useState<any[]>([]); // eligible users not in the group
    const [newMemberDocIds, setNewMemberDocIds] = useState<string[]>([]);
    const [showAddSection, setShowAddSection] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleRouter = () => {
        localStorage.clear();
        router.back();
    }

    const fetchAddableUsers = async () => {
        const allUsers = await getAdminsData() as [any, string][];
        const currentMemberDocIds = groupData.members || [];
        const filtered = allUsers.filter(([userData, docId]) =>
            !currentMemberDocIds.includes(docId) &&
            !newMemberDocIds.includes(docId)
        );
        setAddableUsers(filtered);
    };

    const handleSaveChanges = async () => {
        if (!groupData || (removedDocIds.length === 0 && newMemberDocIds.length === 0)) return;
    
        const batch = writeBatch(db);
        const groupRef = doc(db, "Groups", localStorage.getItem("group_id") || "");
    
        // 1) remove marked members
        let updatedMembers = groupData.members.filter(
            (docId: string) => !removedDocIds.includes(docId)
        );
    
        // 2) add new members
        updatedMembers = [...updatedMembers, ...newMemberDocIds];
    
        // 3) update group with final list
        batch.update(groupRef, { members: updatedMembers });
    
        // 4) remove group from each removed user's list
        removedDocIds.forEach((docId) => {
            const userRef = doc(db, "Users", docId);
            batch.update(userRef, {
                groups: arrayRemove(groupData.id),
            });
        });
    
        // 5) add group to each new user's list
        newMemberDocIds.forEach((docId) => {
            const userRef = doc(db, "Users", docId);
            batch.update(userRef, {
                groups: arrayUnion(groupData.id),
            });
        });
    
        await batch.commit();

        // update group data after commiting
        const updatedGroupData = {
            ...groupData,
            members: updatedMembers
        };
        setGroupData(updatedGroupData);

        // 5.1) send email notifications to newly added users
        for (const docId of newMemberDocIds) {
            const user = members.find((m) => m.docId === docId);
            if (user && user.email) {
            const subject = `You have been added to the group: ${groupData.name}`;
            const body = `Hello ${user.name},\n\nYou have been added to the group "${groupData.name}".`;
            sendEmail(user.email, subject, body); 
            }
        }
        await sleep(1000);
    
        // 6) update UI state
        setMembers((prev) =>
            prev
                .filter((m) => !removedDocIds.includes(m.docId))
                .concat(
                    addableUsers
                        .filter(([_, id]) => newMemberDocIds.includes(id))
                        .map(([user, docId]) => ({
                            name: `${user.name} ${user.last_name_1}`,
                            id: user.id,
                            rol: user.rol[0],
                            email: user.email || "",
                            docId,
                        }))
                )
        );
        
        // reset lists and stop displaying "add member" section
        setRemovedDocIds([]);
        setNewMemberDocIds([]);
        setShowAddSection(false);
    };
    
    
    useEffect(() => {
        const fetchGroup = async () => {
          const groupId = localStorage.getItem("group_id");
          if (!groupId) return;
    
          // fetch the group document
          const docRef = doc(db, "Groups", groupId);
          const docSnap = await getDoc(docRef);
    
          if (!docSnap.exists()) return;
          const group = docSnap.data();
          setGroupData(group);
    
          // fetch member names and other info in parallel
          const memberDataResults = await Promise.all(
            (group.members || []).map(async (memberDocId: string) => {
              const user = await getUserDatawithDocId(memberDocId);
              return user
                ? {
                    name: `${user.name} ${user.last_name_1}`,
                    id: user.id,
                    rol: user.rol[0] || "Unknown",
                    email: user.email || "", 
                    docId: memberDocId
                  }
                : null;
            })
          );          
          setMembers(memberDataResults.filter(Boolean));
        };
    
        fetchGroup();
    }, []);
    
    if (!groupData) {
        return (
        <div className="p-6 text-black">
            <div className="relative">
                <button
                    onClick={handleRouter}
                    className="absolute top-4 right-4 bg-blue-600 text-white text-md font-medium px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    type="button"
                >
                    Back
                </button>
            </div>
            <h1 className="text-2xl font-bold mb-4">Group Information</h1>
            <p>Loading group information...</p>
        </div>
        )
    }

    return(
        <div className="p-6 text-black">
            <div className="relative">
                <button
                    onClick={handleRouter}
                    className="absolute top-4 right-4 bg-blue-600 text-white text-md font-medium px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    type="button"
                >
                    Back
                </button>
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Group Information</h1>
            <p className="mb-2"><strong>Name:</strong> {groupData.name}</p>
            <p className="mb-2"><strong>Group ID:</strong> {groupData.id}</p>
            <p className="mb-2"><strong>Number of Members:</strong> {members.length}</p>

            <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">Group Members</h2>
                    <button
                    onClick={() => {
                        setShowAddSection(true);
                        fetchAddableUsers();
                    }}
                    className="bg-green-600 text-white text-md font-medium px-4 py-2 rounded hover:bg-green-700 transition duration-200"
                    type="button"
                    >
                        + Add Member
                    </button>
                </div>
                <table className="min-w-full bg-white border border-gray-300 rounded-md overflow-hidden">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left px-4 py-2 border-b">Name</th>
                        <th className="text-left px-4 py-2 border-b">Member ID</th>
                        <th className="text-left px-4 py-2 border-b">Role</th>
                        <th className="text-left px-4 py-2 border-b">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                        {members.map((member, idx) => (
                            <tr
                            key={idx}
                            className={`border-t 
                                ${newMemberDocIds.includes(member.docId) ? 'bg-gray-200 opacity-70' : ''} 
                                ${removedDocIds.includes(member.docId) ? 'bg-gray-200 opacity-70 line-through' : ''}`}
                            >
                                <td className="px-4 py-2">{member.name}</td>
                                <td className="px-4 py-2">{member.id}</td>
                                <td className="px-4 py-2">{member.rol}</td>
                                <td className="px-4 py-2">
                                    <button
                                    onClick={() => {
                                        if (newMemberDocIds.includes(member.docId)) {
                                            // prevent removal of new members before save
                                            return;
                                        }
                                        setRemovedDocIds((prev) =>
                                        prev.includes(member.docId)
                                            ? prev.filter((id) => id !== member.docId) // Undo removal
                                            : [...prev, member.docId]                  // Mark as removed
                                        );
                                    }}
                                    className={`text-white text-sm font-medium px-3 py-1 rounded
                                        ${newMemberDocIds.includes(member.docId)
                                          ? "bg-gray-400 cursor-not-allowed"
                                          : removedDocIds.includes(member.docId)
                                            ? "bg-red-300 hover:bg-red-500"
                                            : "bg-red-500 hover:bg-red-700"
                                        }`}                                      
                                    type="button"
                                    >
                                        {removedDocIds.includes(member.docId) ? "Removed" : "Remove"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                </table>
            </div>
            {/* Add Member UI */}
            {showAddSection && (
            <div className="border mt-4 p-4 bg-gray-50 rounded">
                <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2 px-3 py-2 border rounded w-full"
                />
                <div className="max-h-48 overflow-y-auto">
                    {addableUsers.filter(([user]) =>
                        `${user.name} ${user.last_name_1}`
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map(([user, docId]) => (
                        <div key={docId} className="flex justify-between items-center p-2 border-b">
                            <div>
                                <p className="font-semibold">{user.name} {user.last_name_1}</p>
                                <p className="text-sm text-gray-600">ID: {user.id} | Role: {user.rol[0]}</p>
                            </div>
                            <button
                            onClick={() => {
                                setNewMemberDocIds(prev => [...prev, docId]);
                                setMembers(prev => [
                                  ...prev,
                                  {
                                    name: `${user.name} ${user.last_name_1}`,
                                    id: user.id,
                                    rol: user.rol[0],
                                    email: user.email || "", 
                                    docId
                                  }
                                ]);
                                setAddableUsers(prev => prev.filter(([_, id]) => id !== docId));
                              }}                              
                            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                        ))}
                </div>
            </div>
            )}

            <div className="flex justify-center space-x-4 mt-8">
                <button
                    onClick={async () => {
                        if (!groupData) return;
                    
                        const confirmed = window.confirm("Are you sure you want to delete this group?");
                        if (!confirmed) return;
                    
                        const batch = writeBatch(db);
                    
                        // 1) remove group ID from each member's groups list
                        for (const docId of groupData.members || []) {
                            const userRef = doc(db, "Users", docId);
                            batch.update(userRef, {
                                groups: arrayRemove(groupData.id),
                            });
                        }
                    
                        // 2) delete the group document
                        const groupRef = doc(db, "Groups", localStorage.getItem("group_id") || "");
                        batch.delete(groupRef);
                    
                        // 3) commit all changes
                        await batch.commit();
                    
                        // 4) clear localStorage and redirect
                        localStorage.removeItem("group_id");
                        handleRouter();
                    }}
                    
                    className="bg-red-500 text-white text-md font-medium px-10 py-2 rounded hover:bg-red-700"
                    type="button"
                >
                    Delete Group
                </button>
                <button
                onClick={handleSaveChanges}
                className="bg-blue-600 text-white text-md font-medium px-10 py-2 rounded hover:bg-green-700"
                type="button"
                >
                    Save Changes
                </button>
            </div>
        </div>
    )
}
export default GroupInfoPage;