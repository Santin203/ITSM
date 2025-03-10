"use client";

import {
    BellIcon,
    ClipboardIcon,
    HomeIcon,
    UsersIcon
} from "@heroicons/react/24/outline";
import Link from 'next/link';
import React, { use, useEffect, useState } from 'react';
import { getCurrUserData } from '../../hooks/db';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../firebaseConfig';


interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [userSubmenu, setUserSubmenu] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // State to track admin status
    const [incidentsSubmenu, setIncidentsSubmenu] = useState(false); // Toggle state for the submenu
    const [userData, setUserData] = useState({name:"", img:""});
    const {logout} = useAuth();
    const currUser = auth.currentUser; 
    console.log("Current User:", currUser);
    
    
    useEffect(() => {
        if(userData.name == "")
        {
        const fetch = async (): Promise<void> => {    
            const data = await getCurrUserData();
            if(data)
            {
                const name = data["name"];
                const img = data["picture_url"];
                setUserData({name, img});
                setIsAdmin(data["rol"] == "Admin");
            }
        }
        fetch();
        }
    });
    
    console.log(isAdmin);
    const handleLogout = async () => {
        console.log("Current User:", currUser);
        await logout();
        if(currUser == null) 
        {
            console.log("Logged out");
            window.location.href = "/";
        }
        else
        {
            console.log("Error logging out");
        }
    };
    return (
        <div className="flex min-h-screen font-sans bg-gray-100">
            {/* Side Bar */}
            <aside style={{
                width: "210px",
                background: "linear-gradient(to bottom, #224089 0%, #203e91 100%)",
                padding: "20px",
                color: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid #E5E7EB",
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)",
                borderRadius: "0 8px 8px 0"
            }}>
                {/* ITSM Title */}
                <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>
                    ITSM System
                </h2>

                <hr
                    style={{
                    border: "none",
                    borderTop: "1px solid rgba(255,255,255,0.3)",
                    marginBottom: "16px",
                    }}
                />

                {/* Navigation Side bar */}
                <nav>
                    {/* Dashboard (? Not in stories might delete)  */}
                    <ul className="list-none p-0 m-0">
                        {isAdmin && (<li style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <HomeIcon style={{ width: "20px", color: "#FFFFFF" }} />
                            <Link href="/admin" style={{ color: "#FFFFFF", textDecoration: "none" }}>
                                Dashboard
                            </Link>
                        </li>
                        )}
                        
                        {/* User Options for Admin */}
                        {isAdmin && (<li
                            style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                            onClick={() => setUserSubmenu(!userSubmenu)}
                            >
                            <UsersIcon style={{ width: "20px", color: "#FFFFFF" }} />
                            <span>User Options ▼</span>
                        </li>)}
                        {userSubmenu && (
                            <ul style={{ paddingLeft: "32px" }}>
                                <li
                                    style={{ padding: "8px", cursor: "pointer" }}
                                    // onClick={() => setEnterIncidentModal(true)}
                                >
                                    <Link href="/admin/viewusers" className="text-white font-medium no-underline">
                                        View Users
                                    </Link>
                                </li>
                                <li
                                    style={{ padding: "10px", cursor: "pointer" }}
                                    // onClick={() => setTrackIncidentModal(true)}
                                >
                                    <Link href="/admin/grantaccess" className="text-white font-medium no-underline">
                                        Grant Access
                                    </Link>
                                </li>
                            </ul>
                            )}

                        {isAdmin != null && !isAdmin && (<li style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <HomeIcon style={{ width: "20px", color: "#FFFFFF" }} />
                            <Link href="/main" style={{ color: "#FFFFFF", textDecoration: "none" }}>
                                Dashboard
                            </Link>
                        </li>
                        )}
                        {/* Incidents */}
                        {isAdmin != null && !isAdmin && (<li                     
                            style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                            onClick={() => setIncidentsSubmenu(!incidentsSubmenu)}
                            >
                            <ClipboardIcon style={{ width: "20px", color: "#FFFFFF" }} />
                            <span>Incidents ▼</span>
                        </li>)}
                        {incidentsSubmenu && (
                            <ul style={{ paddingLeft: "32px" }}>
                                <li
                                    style={{ padding: "8px", cursor: "pointer" }}
                                    // onClick={() => setEnterIncidentModal(true)}
                                >
                                    <Link href="/enterincident" className="text-white font-medium no-underline">
                                        Enter Incidents
                                    </Link>
                                </li>
                                <li
                                    style={{ padding: "10px", cursor: "pointer" }}
                                    // onClick={() => setTrackIncidentModal(true)}
                                >
                                    <Link href="/main/trackincidents" className="text-white font-medium no-underline">
                                        Track Incidents
                                    </Link>
                                </li>
                            </ul>
                            )}   
                        {/* Not Yet Needed to Implement */}
                        {/* <li className="mb-4">
                            <Link href="/reports" className="text-gray-800 font-medium no-underline">
                                Reports
                            </Link>
                        </li>
                        <li className="mb-4">
                            <Link href="/settings" className="text-gray-800 font-medium no-underline">
                                Settings
                            </Link>
                        </li> */}

                        {/* Notifications */}
                        {/* <li style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                            <BellIcon style={{ width: "20px", color: "#FFFFFF" }} />
                            <Link href="#" style={{ textDecoration: "none", color: "#FFFFFF" }}>
                                Notifications
                            </Link>
                        </li> */}

                        {/* Team */}
                        {/* <li style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <UsersIcon style={{ width: "20px", color: "#FFFFFF" }} />
                            <Link href="#" style={{ textDecoration: "none", color: "#FFFFFF" }}>
                                Team
                            </Link>
                        </li> */}
                    </ul>

                    {/* YOUR TEAM */}
                    {/* <h3 style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "20px", paddingLeft: "15px" }}>
                        Your Team
                    </h3>
                    <ul style={{ listStyleType: "none", paddingLeft: "15px" }}>
                        <li style={{ padding: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <UserGroupIcon style={{ width: "20px", color: "#FFFFFF" }} />
                        <Link href="#" style={{ textDecoration: "none", color: "#FFFFFF", fontSize: "16px" }}>
                            My Team
                        </Link>
                        </li>
                    </ul> */}
                </nav>
            </aside>
            <main className="flex-1 flex flex-col bg-gray-50">
                {/* TOP NAVBAR */}
                <div
                    style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center", 
                    padding: "10px 30px",
                    borderBottom: "1px solid #E5E7EB",
                    background: "white", //"linear-gradient(to right, #a8bf00 0%, #ffffff 60%)"
                    borderRadius: "0 0 8px 8px",
                    position: "relative",
                    }}
                >
                    {/* Centered Bank of Escazú Logo 
                    /bank-of-escazu.svg*/}
                    <img
                    src="https://icons.veryicon.com/png/o/miscellaneous/quick/bank-111.png" 
                    alt="Bank of Escazú Logo"
                    style={{ width: "60px", height: "auto" }}
                    />

                    {/* RIGHT: Bell, Avatar, Name, Logout (absolute so the logo stays centered) */}
                    <div
                    style={{
                        position: "absolute",
                        right: "30px",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                    }}
                    >
                    <BellIcon style={{ width: "24px", color: "#64748B", cursor: "pointer" }} />
                    <img
                        src={(userData.img == "")? "https://icons.veryicon.com/png/o/miscellaneous/taiwu-network-icon-library/not-logged-in-1.png": userData.img}
                        alt="User"
                        style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                    />
                    <span style={{ fontWeight: "bold", color: "#1E293B" }}>
                        {userData.name}
                    </span>
                    <button
                        style={{
                        background: "#EF4444",
                        color: "white",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                        }}
                        onClick={handleLogout}
                    >
                        Log Out
                    </button>
                    </div>
                </div>
                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
