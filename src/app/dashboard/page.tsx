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

  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [brainIDs, setBrainIDs] = useState<string[]>([]); // List of brainIDs
  const [selectedBrainID, setSelectedBrainID] = useState('');
  const [newBrainID, setNewBrainID] = useState('');
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [viewPermissions, setViewPermissions] = useState<{ [key: string]: boolean }>({});
  const [editPermissions, setEditPermissions] = useState<{ [key: string]: boolean }>({});


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
          const chatData: Chat[] = await chatResponse.json();
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
              const teamData: Team[] = await teamResponse.json();
              setTeams(teamData);
              setHasError(false);

            } else {
              setTeams(sampleTeams);
              setHasError(true);
            }
          } else {
            setTeams(sampleTeams);
          }
        } else {
          setChats(sampleChats);
          setTeams(sampleTeams);
          setHasError(true);
        }
      } catch (error) {

        setChats(sampleChats);
        setTeams(sampleTeams);
        setHasError(true);


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
        // Prevent fetch if there's an error or session is not yet set
      if (!session?.userId || hasError) return;

      try {
        // Fetch chats for the user
        const chatResponse = await fetch(`/api/chats/${session.userId}`);
        if (chatResponse.ok) {
          const chatData: Chat[] = await chatResponse.json();
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
              const teamData: Team[] = await teamResponse.json();
              setTeams(teamData);
            } else {
              setHasError(true);
              console.error("Error fetching teams:", teamResponse.statusText);
            }
          }
        } else {
          setHasError(true);
          console.error("Error fetching chats:", chatResponse.statusText);
        }
      } catch (error) {
        setHasError(true);

        console.error("Error fetching chats or teams:", error);
      }
    };

    // Functions to handle opening/closing modals
  const openCreateChatModal = () => setIsCreateChatModalOpen(true);
  const closeCreateChatModal = () => setIsCreateChatModalOpen(false);

  // Fetch brainIDs when opening the modal
  useEffect(() => {
    const fetchBrainIDs = async () => {
        if (!session?.userId) return;

        try {
            const response = await fetch(`/api/brainID/${session.userId}`);
            if (response.ok) {
                const data = await response.json();
                setBrainIDs(data);
            } else {
                console.error("Failed to fetch brain IDs");
            }
        } catch (error) {
            console.error("Error fetching brain IDs:", error);
        }
    };

    if (isCreateChatModalOpen) {
        fetchBrainIDs();
    }
  }, [isCreateChatModalOpen, session?.userId]);

  interface CreateChatRequest {
    userId: string; // The ID of the user creating the chat
    chatTitle: string; // The title of the new chat
    brainID?: string; // The brain ID associated with the chat (can be selected or created new)
    teamID?: string; // Optional: The team ID where the chat is created (if applicable)
    groupID?: string; // Optional: The group ID to add the chat to, or new group title
    viewPermissions?: { [key: string]: boolean }; // Optional: A mapping of team members who can view the chat
    editPermissions?: { [key: string]: boolean }; // Optional: A mapping of team members who can edit the chat
  }

  // Function to handle chat creation
  const createChat = async () => {
    if (!newChatTitle.trim()) {
        alert("Please enter a chat title.");
        return;
    }

    try {
        const response = await fetch("/api/chats/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: session?.userId,
                chatTitle: newChatTitle,
                brainID: selectedBrainID === "createNew" ? newBrainID : selectedBrainID,
                teamID: selectedTeamID,
                groupID: selectedGroupID === "createNewGroup" ? newGroupTitle : selectedGroupID,
                viewPermissions,
                editPermissions,
            }),
        });

        if (response.ok) {
            const { chatID } = await response.json();
            // alert("Chat created successfully");
            router.push(`/chat/${chatID}`);
            closeCreateChatModal();
        } else {
            alert("Failed to create chat");
        }
    } catch (error) {
        console.error("Error creating chat:", error);
    }
  };
    
    // Function to handle creating a new team
    const createTeam = async () => {
      if (!newTeamTitle.trim()) {
          alert('Please enter a team title.');
          return;
      }
  
      if (confirm('Are you sure you want to create a new team?')) {
          try {
              const response = await fetch('/api/teams/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: session?.userId, teamTitle: newTeamTitle }),
              });
  
              if (response.ok) {
                  alert('Team created successfully');
                  setNewTeamTitle(''); // Clear input after team creation
  
                  // Call fetchTeams to refresh the teams state
                  fetchTeams(); // Refresh the teams after the team is created
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
        <button onClick={openCreateChatModal} className={styles.createChatButton}>
            New Chat
          </button>
          <button className={styles.settingsButton} onClick={openSettingsModal}>
            Settings
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          
        </div>
      </div>
      <div className={styles.content}>
      {organizedChats()}
      {chats.length === 0 && 
      <div className={styles.noChats}>
        <p>You have no chats yet, create one now!</p>
        <button onClick={openCreateChatModal} className={styles.createChatButton}>Create Chat</button>
      </div>
      }
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


      {isCreateChatModalOpen && (
          <div className={styles.modalOverlay} onClick={closeCreateChatModal}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                  <h2>Create a New Chat</h2>
                  <div className={`${styles.createChatSection} ${styles.modalContent}` }>
                      <label>
                          Chat Title:
                          <input
                              type="text"
                              placeholder="Enter chat title"
                              value={newChatTitle}
                              onChange={(e) => setNewChatTitle(e.target.value)}
                              className={styles.input}
                          />
                      </label>

                      <label>
                          Select Brain:
                          <select
                              value={selectedBrainID}
                              onChange={(e) => setSelectedBrainID(e.target.value)}
                              className={styles.input}
                          >
                              {brainIDs.length > 0 ? (
                                  brainIDs.map((brainID) => (
                                      <option key={brainID} value={brainID}>
                                          {brainID}
                                      </option>
                                  ))
                              ) : (
                                  <option value="">No Custom Brain (Default)</option>
                              )}
                              <option value="createNew">Create New Brain ID</option>
                          </select>
                      </label>

                      {selectedBrainID === "createNew" && (
                          <label>
                              New Brain ID:
                              <input
                                  type="text"
                                  placeholder="Enter new brain ID"
                                  value={newBrainID}
                                  onChange={(e) => setNewBrainID(e.target.value)}
                                  className={styles.input}
                              />
                          </label>
                      )}

                      {teams.length > 0 && (
                          <label>
                          Select Team (Optional): 
                          <select
                            value={selectedTeamID || ''}
                            onChange={(e) => setSelectedTeamID(e.target.value)}
                            className={styles.input}
                          >
                            <option value="">None</option> {/* Add None/Default option */}
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      {/* Group Creation Section */}
                      {selectedTeamID && (
                        <>
                          <label>
                            Select Group or Create New Group:
                            <select
                              value={selectedGroupID || ''}
                              onChange={(e) => setSelectedGroupID(e.target.value)}
                              className={styles.input}
                            >
                              {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                              <option value="">None</option> 
                              <option value="createNewGroup">Create New Group</option>
                            </select>
                          </label>

                          {selectedGroupID === "createNewGroup" && (
                            <>
                              {/* Input for the group name */}
                              <label>
                                Group Title:
                                <input
                                  type="text"
                                  placeholder="Enter group title"
                                  value={newGroupTitle}
                                  onChange={(e) => setNewGroupTitle(e.target.value)}
                                  className={styles.input}
                                />
                              </label>
                            </>
                          )}

                        {selectedTeamID && teams.length > 0 ? (
                                <div className={styles.permissionsSection}>
                                  <h4>Team Members</h4>
                                  <p>(Leave blank to give all users view and write access)</p>
                                  <table className={styles.permissionsTable}>
                                    <thead>
                                      <tr>
                                        <th>Member</th>
                                        <th className={styles.viewHeader}> View</th>
                                        <th className={styles.editHeader}> Edit</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {teams
                                        .find((team) => team.id === selectedTeamID)
                                        ?.members.map((member) => (
                                          <tr key={member}>
                                            <td>{member}</td>
                                            <td>
                                              <input
                                                type="checkbox"
                                                checked={viewPermissions[member] || false}
                                                onChange={(e) =>
                                                  setViewPermissions({
                                                    ...viewPermissions,
                                                    [member]: e.target.checked,
                                                  })
                                                }
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="checkbox"
                                                checked={editPermissions[member] || false}
                                                onChange={(e) =>
                                                  setEditPermissions({
                                                    ...editPermissions,
                                                    [member]: e.target.checked,
                                                  })
                                                }
                                              />
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p>No team members to assign permissions to.</p>
                              )} 
                        </>
                      )}

                      {/* Allow creating a group even when no teams exist */}
                      {!selectedTeamID && (
                        <>
                          <label>
                            Select Group (Optional):
                            <select
                              value={selectedGroupID || ''}
                              onChange={(e) => setSelectedGroupID(e.target.value)}
                              className={styles.input}
                            >
                              {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                              <option value="">None</option> 
                              <option value="createNewGroup">Create New Group</option>
                            </select>
                          </label>

                          {selectedGroupID === "createNewGroup" && (
                            <>
                              {/* Input for the group name */}
                              <label>
                                Group Title:
                                <input
                                  type="text"
                                  placeholder="Enter group title"
                                  value={newGroupTitle}
                                  onChange={(e) => setNewGroupTitle(e.target.value)}
                                  className={styles.input}
                                />
                              </label>
                            </>
                          )}
                        </>
                      )}


                      <button onClick={createChat} className={styles.actionButton}>
                          Create Chat
                      </button>
                  </div>
                  <div className={styles.modalFooter}>
                      <button onClick={closeCreateChatModal} className={styles.closeButton}>
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
