import { useState } from "react";

"use client";


export default function RequestRequirementForm() {
    const [requirement, setRequirement] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Requirement submitted:", requirement);
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ textAlign: "center", fontWeight: "bold" }}>
                Request Requirement Form
            </h2>
            <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                    Requirement:
                </label>
                <textarea
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    style={{
                        width: "100%",
                        height: "100px",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    }}
                    placeholder="Enter your requirement..."
                ></textarea>
                <button
                    type="submit"
                    style={{
                        marginTop: "20px",
                        background: "#4F46E5",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontSize: "16px",
                        cursor: "pointer",
                    }}
                >
                    Submit
                </button>
            </form>
        </div>
    );
}