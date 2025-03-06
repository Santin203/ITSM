"use client";

import {
  BellIcon,
  ClipboardIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

export default function US30Page() {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [enterIncidentModal, setEnterIncidentModal] = useState(false);
  const [trackIncidentModal, setTrackIncidentModal] = useState(false);

  const user = {
    name: "Tom Juan",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
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
        {/* Centered Bank of Escazú Logo */}
        <img
          src="/bank-of-escazu.svg" 
          alt="Bank of Escazú Logo"
          style={{ width: "80px", height: "auto" }}
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
            src={user.image}
            alt="User"
            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
          />
          <span style={{ fontWeight: "bold", color: "#1E293B" }}>
            {user.name}
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
            onClick={() => alert("Logged out! (replace with logout function)")}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* MAIN BODY */}
      <div style={{ display: "flex", flex: 1, background: "#F9FAFB" }}>
        {/* SIDEBAR */}
        <nav
          style={{
            width: "210px",
            background: "linear-gradient(to bottom, #224089 0%, #203e91 100%)",
            padding: "20px",
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #E5E7EB",
            boxShadow: "2px 0 4px rgba(0,0,0,0.03)",
            borderRadius: "0 8px 8px 0"
          }}
        >
          {/* Sidebar Heading: ITSM System */}
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

          <ul style={{ listStyleType: "none", padding: 0 }}>
            {/* Dashboard */}
            <li style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <HomeIcon style={{ width: "20px", color: "#FFFFFF" }} />
              <Link href="#" style={{ color: "#FFFFFF", textDecoration: "none" }}>
                Dashboard
              </Link>
            </li>

            {/* Incidents */}
            <li
              style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              onClick={() => setSubmenuOpen(!submenuOpen)}
            >
              <ClipboardIcon style={{ width: "20px", color: "#FFFFFF" }} />
              <span>Incidents ▼</span>
            </li>
            {submenuOpen && (
              <ul style={{ paddingLeft: "32px" }}>
                <li
                  style={{ padding: "8px", cursor: "pointer" }}
                  onClick={() => setEnterIncidentModal(true)}
                >
                  Enter Incidents
                </li>
                <li
                  style={{ padding: "10px", cursor: "pointer" }}
                  onClick={() => setTrackIncidentModal(true)}
                >
                  Track Incidents
                </li>
              </ul>
            )}

            {/* Notifications */}
            <li style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <BellIcon style={{ width: "20px", color: "#FFFFFF" }} />
              <Link href="#" style={{ textDecoration: "none", color: "#FFFFFF" }}>
                Notifications
              </Link>
            </li>

            {/* Team */}
            <li style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <UsersIcon style={{ width: "20px", color: "#FFFFFF" }} />
              <Link href="#" style={{ textDecoration: "none", color: "#FFFFFF" }}>
                Team
              </Link>
            </li>
          </ul>

          {/* YOUR TEAM */}
          <h3 style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "20px", paddingLeft: "15px" }}>
            Your Team
          </h3>
          <ul style={{ listStyleType: "none", paddingLeft: "15px" }}>
            <li style={{ padding: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <UserGroupIcon style={{ width: "20px", color: "#FFFFFF" }} />
              <Link href="#" style={{ textDecoration: "none", color: "#FFFFFF", fontSize: "16px" }}>
                My Team
              </Link>
            </li>
          </ul>
        </nav>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: "40px", fontFamily: "Arial, sans-serif" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1E293B" }}>
            Welcome to the Incident Management System
          </h1>
          <p style={{ fontSize: "16px", color: "#475569" }}>
            Select an option from the sidebar.
          </p>
        </div>
      </div>

      {/* MODALS */}
      {enterIncidentModal && (
        <Modal title="Enter Incident" onClose={() => setEnterIncidentModal(false)} />
      )}
      {trackIncidentModal && (
        <Modal title="Track Incidents" onClose={() => setTrackIncidentModal(false)} />
      )}
    </div>
  );
}

/** MODAL COMPONENT -- blocks interaction with the rest of the UI until it’s closed. */ 
function Modal({ title, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          background: "#FFF",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2>{title}</h2>
          <XMarkIcon
            width={24}
            height={24}
            style={{ cursor: "pointer" }}
            onClick={onClose}
          />
        </div>
        <p>poner formulario.</p>
      </div>
    </div>
  );
}