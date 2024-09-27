/* eslint-disable */
"use client";
import styles from "./dashboard.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
    id: string;
    name: string;
    members: string[];
}

interface Chat {
    chatID: string,
    chatTitle: string,
    groupID?: string,
    groupTitle?: string,
    teamID?: string,
    teamTitle?: string,
    messages?: Message[],
}

interface Message {
  author: string,
  message: string
}

// retrieved chats are Chat[], and then a chats are separated first based on team, then within team, separated by group

// on load, retrieve chats, then extract teamIDs, and retrieve teams


export default function Dashboard() {
  const [session, setSession] = useState<{
    userId: string;
    email: string;
    username: string;
    docks?: any;
  } | null>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamID, setSelectedTeamID] = useState<string | null>(null);
  const [selectedGroupID, setSelectedGroupID] = useState<string | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedTeam, setSelectedTeam] = useState({} as Team);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberEmailToRemove, setMemberEmailToRemove] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [deleteMemberEmail, setDeleteMemberEmail] = useState('');
  const [newTeamTitle, setNewTeamTitle] = useState('');
  const [hasError, setHasError] = useState(false); 
  const [isCreatingTeam, setIsCreatingTeam] = useState(false); // State to toggle create team mode



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

    const sampleChats = [
      {
        chatID: "chat1",
        chatTitle: "Team A - General",
        teamID: "team1",
        teamTitle: "Team A",
        groupID: "group1",
        groupTitle: "Group 1",
      },
      {
        chatID: "chat2",
        chatTitle: "Team A - Development",
        teamID: "team1",
        teamTitle: "Team A",
        groupID: "group2",
        groupTitle: "Group 2",
      },
      {
        chatID: "chat3",
        chatTitle: "Team A - Random",
        teamID: "team1",
        teamTitle: "Team A",
      },
      {
        chatID: "chat4.5",
        chatTitle: "Team A - Random2",
        teamID: "team1",
        teamTitle: "Team A",
      },
      {
        chatID: "chat9",
        chatTitle: "Team A - Random3",
        teamID: "team1",
        teamTitle: "Team A",
      },
      {
        chatID: "chat4",
        chatTitle: "Team B - General",
        teamID: "team2",
        teamTitle: "Team B",
        groupID: "group3",
        groupTitle: "Group 3",
      },
      {
        chatID: "chat11",
        chatTitle: "Team B - General",
        groupID: "group7",
        groupTitle: "Group 7",
      },
      {
        chatID: "chat5",
        chatTitle: "Team B - Marketing",
        teamID: "team2",
        teamTitle: "Team B",
      },
      {
        chatID: "chat6",
        chatTitle: "Standalone Chat 1",
      },
      {
        chatID: "chat7",
        chatTitle: "Standalone Chat 2",
      },
    ];

    const sampleTeams = [
      {
        id: "team1",
        name: "Team A",
        members: ["member1@example.com", "member2@example.com", "member3@example.com", "member4@example.com", "member5@example.com", "member6@example.com", "member7@example.com", "member8@example.com", "member9@example.com", "member10@example.com"],
      },
      {
        id: "team2",
        name: "Team B",
        members: ["member4@example.com", "member5@example.com"],
      },
    ];

    const fetchChatsAndTeams = async () => {
      // Prevent fetch if there's an error or session is not yet set
      if (!session?.userId || hasError) return;

      try {
        // Fetch chats for the user
        const chatResponse = await fetch(`/api/chats/${session.userId}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          setChats(chatData);

          // Extract unique team IDs from chats using Set and convert to array
          const teamIDsSet = new Set(chatData.map((chat: Chat) => chat.teamID).filter(Boolean));
          const teamIDs = Array.from(teamIDsSet) as string[]; // Convert Set to array

          // Fetch teams by team IDs
          if (teamIDs.length > 0) {
            const teamResponse = await fetch("/api/teams", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: session.userId, teamIDs }),
            });

            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              setTeams(teamData);
            } else {
              setHasError(true);
              setChats(sampleChats);
              setTeams(sampleTeams);
            }
          }
        } else {
          setHasError(true);
          setChats(sampleChats);
          setTeams(sampleTeams);
        }
      } catch (error) {
        setHasError(true);
        setChats(sampleChats);
        setTeams(sampleTeams);

        console.error("Error fetching chats or teams:", error);
      }
    };

    fetchSession();

    // Only call fetchChatsAndTeams when session is available and no errors have occurred
    if (session && !hasError) {
      fetchChatsAndTeams();
    }
  }, [router, session, hasError]);

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

    const handleTeamClick = (teamID: string) => {
        setSelectedTeamID(teamID === selectedTeamID ? null : teamID);
        setSelectedGroupID(null); // Reset group selection when a team is selected
    };
    
    const handleGroupClick = (groupID: string) => {
        setSelectedGroupID(groupID === selectedGroupID ? null : groupID);
    };

        // Organize chats by team, then group, then standalone
    const organizedChats = () => {
        const teamChats: { [key: string]: Chat[] } = {};
        const groupChats: { [key: string]: Chat[] } = {};
        const standaloneChats: Chat[] = [];

        // Sort chats into categories
        chats.forEach((chat) => {
        if (chat.teamID) {
            if (!teamChats[chat.teamID]) teamChats[chat.teamID] = [];
            teamChats[chat.teamID].push(chat);
        } else if (chat.groupID) {
            if (!groupChats[chat.groupID]) groupChats[chat.groupID] = [];
            groupChats[chat.groupID].push(chat);
        } else {
            standaloneChats.push(chat);
        }
        });

        // Sort chats within each team by group and then standalone within the team
        const sortedChats: JSX.Element[] = [];

        // Add team chats
        Object.entries(teamChats).forEach(([teamID, teamChats]) => {
        const team = teams.find((t) => t.id === teamID);
        if (team) {
            sortedChats.push(
            <div key={teamID} className={styles.teamBox}>
                {/* <h3>{team.name}</h3> */}
                {teamChats.map((chat) =>
                chat.groupID ? (
                    <div key={chat.chatID} className={styles.chatBox} onClick={() => router.push(`/chat/${chat.chatID}`)} >
                    {chat.chatTitle} (Group: {chat.groupTitle})
                    </div>
                ) : (
                    <div key={chat.chatID} className={styles.chatBox}>
                    {chat.chatTitle}
                    </div>
                )
                )}
            </div>
            );
        }
        });

        // Add standalone group chats
        Object.values(groupChats).forEach((groupChatArray) => {
        groupChatArray.forEach((chat) => {
            sortedChats.push(
            <div key={chat.chatID} className={styles.chatBox}>
                {chat.chatTitle} (Group: {chat.groupTitle})
            </div>
            );
        });
        });

        // Add standalone chats
        standaloneChats.forEach((chat) => {
        sortedChats.push(
            <div key={chat.chatID} className={styles.chatBox}>
            {chat.chatTitle}
            </div>
        );
        });

        return sortedChats;
    };

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

    // Fetch teams when opening team settings modal
    const fetchTeams = async () => {
        try {
        const response = await fetch(`/api/teams/${session?.userId}`);
        if (response.ok) {
            const data = await response.json();
            setTeams(data);
        } else {
            console.error('Failed to fetch teams');
        }
        } catch (error) {
        console.error('Error fetching teams:', error);
        }
    };
    
    // Create a new team if no teams exist
    const createTeam = async () => {
        if (!newTeamTitle.trim()) {
        alert('Please enter a team title.');
        return;
        }
    
        if (confirm('Are you sure you want to create a new team?')) {
        try {
            const response = await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session?.userId, teamTitle: newTeamTitle }),
            });
            if (response.ok) {
            alert('Team created successfully');
            setNewTeamTitle(''); // Clear input after team creation
            fetchTeams(); // Refresh teams after creation
            } else {
            console.error('Failed to create team');
            alert('Failed to create team');
            }
        } catch (error) {
            console.error('Error creating team:', error);
        }
        }
    };
  
  
  // Function to handle adding a team member
    const addTeamMember = async () => {
        if (confirm('Are you sure you want to add this member?')) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/add-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newMemberEmail }),
            });
            if (response.ok) {
            alert('Member added successfully');
            setNewMemberEmail('');
            } else {
            console.error('Failed to add team member');
            }
        } catch (error) {
            console.error('Error adding team member:', error);
        }
        }
    };
  
    // Function to handle removing a team member
    const removeTeamMember = async () => {
        if (confirm('Are you sure you want to remove this member?')) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/remove-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: memberEmailToRemove }),
            });
            if (response.ok) {
            alert('Member removed successfully');
            setMemberEmailToRemove('');
            } else {
            console.error('Failed to remove team member');
            }
        } catch (error) {
            console.error('Error removing team member:', error);
        }
        }
    };
  
    // Function to promote a member to admin
    const promoteToAdmin = async () => {
        if (confirm('Are you sure you want to promote this member to admin?')) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/promote-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail }),
            });
            if (response.ok) {
            alert('Member promoted to admin successfully');
            setAdminEmail('');
            } else {
            console.error('Failed to promote member to admin');
            }
        } catch (error) {
            console.error('Error promoting member to admin:', error);
        }
        }
    };
  
    // Function to delete a team member
    const demoteTeamMember = async () => {
        if (confirm('Are you sure you want to demote this member?')) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/demote-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: deleteMemberEmail }),
            });
            if (response.ok) {
            alert('Member demoted successfully');
            setDeleteMemberEmail('');
            } else {
            console.error('Failed to demote member');
            }
        } catch (error) {
            console.error('Error demoting member:', error);
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
      <div className={styles.content}>
      {organizedChats()}
      </div>

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
                <button onClick={() => router.push("/forgot-password")} className={styles.actionButton}>
                Reset Password
                </button>
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
            {Object.keys(teams).length > 0 ? (
              <>
                <ul className={styles.teamList}>
                  {Object.values(teams).map((team) => (
                    <li
                      key={team.id}
                      className={styles.teamItem}
                      onClick={() => {
                        setSelectedTeam(team);
                        setIsCreatingTeam(false); // Ensure not in create mode when a team is selected
                      }}
                    >
                      {team.name}
                    </li>
                  ))}
                  {/* Create Team Button */}
                  <li
                    className={styles.teamItem}
                    onClick={() => {
                      setIsCreatingTeam(true);
                      setSelectedTeam({} as Team); // Deselect any team
                    }}
                  >
                    Create Team
                  </li>
                </ul>

                {/* Display Create Team Form if in create mode */}
                {isCreatingTeam ? (
                  <div className={styles.createTeamSection}>
                    <input
                      type="text"
                      placeholder="Enter team title"
                      value={newTeamTitle}
                      onChange={(e) => setNewTeamTitle(e.target.value)}
                      className={styles.input}
                    />
                    <button onClick={createTeam} className={styles.actionButton}>
                      Create Team
                    </button>
                  </div>
                ) : (
                  // Display team members and actions if a team is selected
                  selectedTeam.id && (
                    <>
                      <h3>Modifying {selectedTeam.name}</h3>
                      <br />
                      <h4>Members:</h4>
                      <ul className={styles.memberList}>
                        {selectedTeam?.members?.map((member) => (
                          <li key={member} className={styles.memberItem}>
                            {member}
                          </li>
                        ))}
                      </ul>
                      <div className={styles.teamActions}>
                        <label className={styles.actionInput}>
                          <input
                              type="email"
                              placeholder="Enter member email"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              className={styles.input}
                          />
                          <button
                              onClick={addTeamMember}
                              className={styles.actionButton}
                          >
                              Add Team Member
                          </button>
                        </label>
                        <label className={styles.actionInput}>
                          <input
                              type="email"
                              placeholder="Enter member email"
                              value={memberEmailToRemove}
                              onChange={(e) => setMemberEmailToRemove(e.target.value)}
                              className={styles.input}
                          />
                          <button
                              onClick={removeTeamMember}
                              className={styles.actionButton}
                          >
                              Remove Team Member
                          </button>
                        </label>
                        <label className={styles.actionInput}>
                          <input
                              type="email"
                              placeholder="Enter member email"
                              value={adminEmail}
                              onChange={(e) => setAdminEmail(e.target.value)}
                              className={styles.input}
                          />
                          <button
                              onClick={promoteToAdmin}
                              className={styles.actionButton}
                          >
                              Promote to Admin
                          </button>
                        </label>
                        <label className={styles.actionInput}>
                          <input
                              type="email"
                              placeholder="Enter member email"
                              value={deleteMemberEmail}
                              onChange={(e) => setDeleteMemberEmail(e.target.value)}
                              className={styles.input}
                          />
                          <button
                              onClick={demoteTeamMember}
                              className={styles.actionButton}
                          >
                              Demote Team Member
                          </button>
                        </label>
                    </div>
                    </>
                  )
                )}
              </>
            ) : (
              <div className={styles.createTeamSection}>
                <input
                  type="text"
                  placeholder="Enter team title"
                  value={newTeamTitle}
                  onChange={(e) => setNewTeamTitle(e.target.value)}
                  className={styles.input}
                />
                <button onClick={createTeam} className={styles.actionButton}>
                  Create a Team
                </button>
              </div>
            )}
            <button onClick={closeTeamModal} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
