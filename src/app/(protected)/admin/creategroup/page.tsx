"use client";
import { sendEmail } from '@/hooks/emails';
import React, { useEffect, useState } from 'react';
import { getAllGroups, getUsersDataDic, newGroup, sleep } from "../../../../hooks/db";


const CreateGroupPage: React.FC = () => {
    const [groupName, setGroupName] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allGroupNames, setAllGroupNames] = useState<string []>([]);
    const [nextID, setNextID] = useState<number>(0);
    const [createFlag, setCreateFlag] = useState<number>(1);

    useEffect(() => {
      const fetchEscalationTargets = async () => {
        try {
          // Fetch all users from Firebase
          const allUsers = await getUsersDataDic();
          const allGroups = await getAllGroups();
          const allGroupNames = allGroups.map((group: any) => group.name.toLowerCase());
          const nextID = -1*(allGroups.length + 1);
          console.log("nextid", nextID);
          const usersList = allUsers
            .map((userTuple: any) => {
              const userData = userTuple[0];
              const userId = userTuple[1];
              // Create a full name using available name fields
              const firstName = userData.name || '';
              const lastName1 = userData.last_name_1 || '';
              const lastName2 = userData.last_name_2 || '';
              
              // Format name as "First Last" 
              let displayName = firstName;
              if (lastName1) displayName += ' ' + lastName1;
              if (lastName2) displayName += ' ' + lastName2;
              
              // If no name is available, use ID as fallback
              if (!displayName.trim()) displayName = `User ${userData.id}`;
              
              return {
                id: userData.id,
                name: displayName,
                email: userData.email || '',
                firebaseId: userId
              };
            })
          
          setAllUsers(usersList);
          setAllGroupNames(allGroupNames);
          setNextID(nextID);
        } catch (error) {
          console.error("Error fetching escalation targets:", error);
        }
      };
      
      fetchEscalationTargets();
    }, []);

    const filteredMembers = allUsers.filter(
      (m) => (m.name).toLowerCase().includes(memberSearch.toLowerCase()) && !members.includes(m.name)
    );
    
    const addMember = (member : any) => {
      if (member && !members.includes(member)) {
        setMembers([...members, member]);
        setMemberSearch("");
      }
    };

    const removeMember = (memberToRemove: string) => {
        setMembers(members.filter((member) => member !== memberToRemove));
    };

    const createGroup  = async() => {
        console.log("Creating group with ID:", nextID);
        console.log("Group Name:", groupName);
        console.log("Members:", members);
        if (groupName === "" || members.length === 0) {
            alert("Please enter a group name and add at least one member.");
            return;
        }
        if(allGroupNames.includes(groupName.toLowerCase()))
        {
          alert("This group name already exists. Please choose a different name.");
          return;
        }
        const membersIDs = members.map((member) => member.firebaseId);

        const flag = await newGroup(nextID, groupName, membersIDs);
        setCreateFlag(flag);
        if (flag === 0) {
            const membersEmails = members.map((member) => member.email);
            const subject = `New Group Created: ${groupName}`;
            const body = `You have been added to the newly created group: ${groupName}.`;
            for (const email of membersEmails) {
                // const status = await sendEmail(email, subject, body);
                sendEmail(email, subject, body)
                // console.log("Email sent: ", status.success, "message: ", status.message); 
            }
            await sleep(2000);
            alert("Group created successfully! \nThe group has been created and members have been notified.");
            window.location.href = "/admin"
        } else {
            alert("Error creating group.");
        }

        // Add your submit logic here
      };
      
    if (createFlag === 0) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-[#203e91] rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Creating Group...</h1>
            </div>
        );
    }
    return (

        <div className="max-w-md mx-auto mt-10 p-6  bg-[#203e91] rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Create New Group</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                    className="w-full border border-gray-300 rounded px-4 py-1 text-black"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                />
                <span className={"text-sm text-red-500 " +(!(allGroupNames.includes(groupName.toLowerCase()))? "hidden":"")}> group name already exists </span>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Add Members</label>
              <div className="flex flex-col gap-2">
                <input
                  className='w-full border border-gray-300 rounded px-4 py-1 text-black'
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Type member name"
                />
                {filteredMembers.length > 0 && (
                  <div className="border rounded-lg p-2 bg-gray-50 max-h-40 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.name}
                        className="p-2 cursor-pointer hover:bg-gray-200 text-black rounded"
                        onClick={() => addMember(member)}
                      >
                        {member.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
                {members.map((member, index) => (
                    <div
                        key={index}
                        className="flex items-center text-black bg-gray-100 rounded-full px-3 py-1 text-sm"
                    >
                            {member.name}
                        <button
                            className="ml-2 text-gray-500 hover:text-red-500"
                            onClick={() => removeMember(member)}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
            <div className='flex flex-row gap-2'>
              <button className="w-3/4 border border-gray-300 rounded px-4 py-1 text-white font-semibold bg-[#aebc35]" onClick={createGroup}>
                  Create Group
              </button>
              <button className="w-1/4 border border-gray-300 rounded px-4 py-1 text-white font-semibold bg-[#EF4444] " onClick={ ()=> window.location.href = "/admin"}>
                    Cancel
                </button>
            </div>
            
        </div>
    );
};

export default CreateGroupPage;