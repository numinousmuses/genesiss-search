/* eslint-disable */
"use client";
import styles from "./dashboard.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [session, setSession] = useState<{
    userId: string;
    email: string;
    username: string;
    docks?: any;
  } | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // State to control modal visibility
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false); // State for Team Settings modal
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        router.push("/login");
      }
    };

    fetchSession();
  }, [router]);

    const handleLogout = async () => {
        try {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (response.ok) {
            router.push("/login");
        } else {
            console.error("Logout failed");
        }
        } catch (error) {
        console.error("Logout error:", error);
        }
    };

  // State variables for inputs


    // Function to handle username change
    const changeUsername = async () => {
        const confirmChange = window.confirm(
            "Are you sure you want to change your username?"
          );
      
          if (confirmChange) {
            try {
              const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: session?.userId,
                  action: "changeUsername",
                  oldEmail: session?.email,
                  newUsername,
                }),
              });
              if (response.ok) {
                alert("Username changed successfully");
                // update session username
                setSession((prevSession) => {
                  if (prevSession) {
                    return { ...prevSession, username: newUsername };
                  }
                  return prevSession;
                });
              } else {
                console.error("Failed to change username");
              }
            } catch (error) {
              console.error("Error changing username:", error);
            }
          }
    };

    // Function to handle password reset
    const resetPassword = async () => {
    if (confirm('Are you sure you want to reset your password?')) {
        try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword }),
        });
        if (response.ok) {
            alert('Password reset successfully');
            setNewPassword('');
        } else {
            alert('Failed to reset password');
        }
        } catch (error) {
        console.error('Error resetting password:', error);
        }
    }
    };

    // Function to handle email change
    const changeEmail = async () => {
        const confirmChange = window.confirm(
            "Are you sure you want to change your email?"
          );
      
          if (confirmChange) {
            try {
              const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: session?.userId,
                  action: "changeEmail",
                  oldEmail: session?.email,
                  newEmail,
                }),
              });
              if (response.ok) {
                alert("Email change initiated. Please check your email for verification.");
                handleLogout(); // Log out the user after email change
              } else {
                console.error("Failed to change email");
              }
            } catch (error) {
              console.error("Error changing email:", error);
            }
          }
    };

  const openSettingsModal = () => setIsSettingsModalOpen(true); // Open Settings modal
  const closeSettingsModal = () => setIsSettingsModalOpen(false); // Close Settings modal
  const openTeamModal = () => {
    setIsSettingsModalOpen(false); // Close Settings modal
    setIsTeamModalOpen(true); // Open Team modal
  };
  const closeTeamModal = () => setIsTeamModalOpen(false); // Close Team modal

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logoText}>
          <a href="/">
            GENESISS <span className={styles.logospan}>SEARCH</span>
          </a>
        </div>
        <div className={styles.session}>
          {session ? (
            <div className={styles.sessionText}>
              <p className={styles.username}>Hello, {session.username}!</p>
            </div>
          ) : (
            <p className={styles.sessionText}>Not logged in</p>
          )}
        </div>
        <div className={styles.settings}>
          <button className={styles.settingsButton} onClick={openSettingsModal}>
            Settings
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
      </div>
      <div className={styles.content}></div>

      {/* Settings Modal */}
    {isSettingsModalOpen && (
        <div className={styles.modalOverlay} onClick={closeSettingsModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className={styles.modalContent}>
                <label>
                <input
                    type="text"
                    placeholder="Enter new username"
                    className={styles.input}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                />
                <button onClick={changeUsername} className={styles.actionButton}>
                    Change Username
                </button>
                </label>
                <label>
                
                <input
                    type="password"
                    placeholder="Enter new password"
                    className={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <button onClick={resetPassword} className={styles.actionButton}>
                Reset Password
                </button>
                </label>
                <label>
                
                <input
                    type="email"
                    placeholder="Enter new email"
                    className={styles.input}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                />
                <button onClick={changeEmail} className={styles.actionButton}>
                Change Email
                </button>
                </label>
            </div>
            <div className={styles.modalFooter}>
                <button onClick={openTeamModal} className={styles.teamSettingsButton}>
                    Team Settings
                </button>
                <button onClick={closeSettingsModal} className={styles.closeButton}>
                    Close
                </button>
            </div>
            </div>
        </div>
    )}


      {/* Team Settings Modal */}
      {isTeamModalOpen && (
        <div className={styles.modalOverlay} onClick={closeTeamModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Team Settings</h2>
            <p>Team settings content goes here...</p>
            <button onClick={closeTeamModal} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
