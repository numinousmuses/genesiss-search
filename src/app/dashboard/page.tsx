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

// retrieved chats are Chat[], and then chats are separated based on team


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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
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
  const [viewPermissions, setViewPermissions] = useState<{ [key: string]: boolean }>({});
  const [editPermissions, setEditPermissions] = useState<{ [key: string]: boolean }>({});

  // Function to check if a string is a UUID
  const isEmail = (member: string): boolean => {
    return member.includes('@');
  };

  // Function to filter out UUIDs from a list of team members and return only emails
  const filterMembers = (members: string[]): string[] => {
    return members.filter((member) => isEmail(member));
  };

  const refreshPage = () => {
    window.location.reload(); // Use any of the methods above here
  };


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


    const fetchChatsAndTeams = async () => {
      // Prevent fetch if there's an error or session is not yet set
      if (!session?.userId || hasError) return;

      try {
        // Fetch chats for the user
        const chatResponse = await fetch(`/api/chats/${session.userId}`);
        if (chatResponse.ok) {
          const chatData: Chat[] = await chatResponse.json();
          setChats(chatData);

          fetchTeams();
          // Extract unique team IDs from chats using Set and convert to array
          // const teamIDsSet = new Set(chatData.map((chat: Chat) => chat.teamID).filter(Boolean));
          // const teamIDs = Array.from(teamIDsSet) as string[]; // Convert Set to array

          // Fetch teams by team IDs
          // if (teamIDs.length > 0) {
          //   const teamResponse = await fetch("/api/teams", {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify({ userId: session.userId, teamIDs }),
          //   });

          //   if (teamResponse.ok) {
          //     const teamData: Team[] = await teamResponse.json();
          //     setTeams(teamData);
          //     setHasError(true)
          //   } else {
          //       setHasError(true);
          //   }
          // } 
        } else {
      
          setHasError(true);
        }
      } catch (error) {

        setHasError(true);


        console.error("Error fetching chats or teams:", error);
      }
    };

    if(!session){fetchSession();}


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
    };

        // Organize chats by team, then standalone
        const organizedChats = () => {
          const teamChats: { [key: string]: Chat[] } = {};
          const standaloneChats: Chat[] = [];
        
          // Sort chats into categories
          chats.forEach((chat) => {
            if (chat.teamID) {
              if (!teamChats[chat.teamID]) teamChats[chat.teamID] = [];
              teamChats[chat.teamID].push(chat);
            } else {
              standaloneChats.push(chat);
            }
          });
        
          // Sort chats within each team
          const sortedChats: JSX.Element[] = [];
        
          // Add team chats
          Object.entries(teamChats).forEach(([teamID, teamChats]) => {
            const team = teams.find((t) => t.id === teamID);
            if (team) {
              sortedChats.push(
                <div key={teamID} className={styles.teamBox}>
                  {teamChats.map((chat) => (<>
                    <div
                      key={chat.chatID}
                      className={styles.chatBox}
                      onClick={() => router.push(`/chat/${chat.chatID}`)} // Correct the router push action
                    >
                      {chat.chatTitle}
                      <div className={styles.teamSubtitle}>{chat.teamTitle}</div>
                    </div>
                    
                    </>
                  ))}
                </div>
              );
            }
          });
        
          // Add standalone chats
          standaloneChats.forEach((chat) => {
            sortedChats.push(
              <div
                key={chat.chatID}
                className={styles.chatBox}
                onClick={() => router.push(`/chat/${chat.chatID}`)} // Ensure standalone chats have a router push
              >
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
    // Fetch teams when opening team settings modal
    const fetchTeams = async () => {
      // Prevent fetch if there's an error or session is not yet set
      if (!session?.userId || hasError) return;

      try {
        // Fetch team IDs for the user
        const teamIDsResponse = await fetch(`/api/teams/${session.userId}`);
        if (teamIDsResponse.ok) {
          const teamIDs = await teamIDsResponse.json();

          // Fetch teams by team IDs if they exist
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
          console.error("Error fetching team IDs:", teamIDsResponse.statusText);
        }
      } catch (error) {
        setHasError(true);
        console.error("Error fetching team IDs or teams:", error);
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

      const params = {
        userId: session?.userId,
        chatTitle: newChatTitle,
        brainID: selectedBrainID === "createNew" ? newBrainID : selectedBrainID,
        teamID: selectedTeamID,
        viewPermissions,
        editPermissions,
    }

        const response = await fetch("/api/chats/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });

        if (response.ok) {
            const { chatID } = await response.json();


            

            const chatResponse = await fetch(`/api/chats/${session?.userId}`);

            const chatData: Chat[] = await chatResponse.json();
            

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
                  body: JSON.stringify({ userId: session?.userId, teamTitle: newTeamTitle, email: session?.email }),
              });
  
              if (response.ok) {
                  alert('Team created successfully');
                  setNewTeamTitle(''); // Clear input after team creation
  
                  // Call fetchTeams to refresh the teams state
                  fetchTeams(); // Refresh the teams after the team is created
                  refreshPage();
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
        if (confirm(`Are you sure you want to add ${newMemberEmail} as a new team member?`)) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/add-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newMemberEmail }),
            });
            if (response.ok) {
            alert(`Member ${newMemberEmail} added successfully`);
            setNewMemberEmail('');
            fetchTeams();
            refreshPage();
            } else {
              alert('Failed to add team member');
            console.error('Failed to add team member');
            }
        } catch (error) {
            console.error('Error adding team member:', error);
        }
        }
    };
  
    // Function to handle removing a team member
    const removeTeamMember = async () => {
        if (confirm(`Are you sure you want to remove ${memberEmailToRemove} from the team?`)) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/remove-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: memberEmailToRemove }),
            });
            if (response.ok) {
            alert(`Member ${memberEmailToRemove} removed successfully`);
            setMemberEmailToRemove('');
            fetchTeams();
            refreshPage();
            } else {
              alert('Failed to remove team member');
            console.error('Failed to remove team member');
            }
        } catch (error) {
            console.error('Error removing team member:', error);
        }
        }
    };
  
    // Function to promote a member to admin
    const promoteToAdmin = async () => {
        if (confirm(`Are you sure you want to promote ${adminEmail} to admin?`)) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/promote-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail }),
            });
            if (response.ok) {
            alert(`Member ${adminEmail} promoted to admin successfully`);
            setAdminEmail('');
            fetchTeams();
            refreshPage();
            } else {
            alert('Failed to promote member to admin');
            console.error('Failed to promote member to admin');
            }
        } catch (error) {
            console.error('Error promoting member to admin:', error);
        }
        }
    };
  
    // Function to delete a team member
    const demoteTeamMember = async () => {
        if (confirm(`Are you sure you want to demote ${deleteMemberEmail} from admin?`)) {
        try {
            const response = await fetch(`/api/teams/${selectedTeam.id}/demote-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: deleteMemberEmail }),
            });
            if (response.ok) {
            alert(`Member ${deleteMemberEmail} demoted from admin successfully`);
            setDeleteMemberEmail('');
            fetchTeams();
            refreshPage();
            } else {
            alert('Failed to demote member');
            console.error('Failed to demote member');
            }
        } catch (error) {
            console.error('Error demoting member:', error);
        }
        }
    };

    // Function to delete a team
    const deleteTeam = async () => {
      if (confirm(`Are you sure you want to delete ${selectedTeam.name}?`)) {
        try {
          const response = await fetch(`/api/teams/${selectedTeam.id}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            alert(`Team ${selectedTeam.name} deleted successfully`);
            // Refresh the teams state after deletion
            fetchTeams();
            setSelectedTeam({} as Team); // Clear the selected team after deletion
            refreshPage();
          } else {
            console.error('Failed to delete team');
            alert('Failed to delete team');
          }
        } catch (error) {
          console.error('Error deleting team:', error);
        }
      }
    };

    // Function to rename a team
    const renameTeam = async () => {
      if (!newTeamTitle.trim()) {
        alert('Please enter a team title.');
        return;
      }

      if (confirm('Are you sure you want to rename this team?')) {
        try {
          const response = await fetch(`/api/teams/${selectedTeam.id}/rename`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newTitle: newTeamTitle }),
          });

          if (response.ok) {
            alert('Team renamed successfully');
            // Refresh the teams state after renaming
            fetchTeams();
            setNewTeamTitle(''); // Clear input after renaming
            refreshPage();
          } else {
            console.error('Failed to rename team');
            alert('Failed to rename team');
          }
        } catch (error) {
          console.error('Error renaming team:', error);
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
            <p className={styles.sessionText}>Loading...</p>
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
        <p>You have no chats yet. Create one now!</p>
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
                Forgot your password?
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
                    <h3>Create a Team:</h3>
                    <br />
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
                      {filterMembers(selectedTeam?.members || []).map((member) => (
                        <li key={member} className={styles.memberItem}>
                          {member} {/* Only email will be shown, UUIDs are filtered out */}
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
                        
                        <label className={styles.actionInput}>
                          <input
                            type="text"
                            placeholder="Enter new team title"
                            value={newTeamTitle}
                            onChange={(e) => setNewTeamTitle(e.target.value)}
                            className={styles.input}
                          />
                          <button onClick={renameTeam} className={styles.actionButton}>
                            Rename Team
                          </button>
                        </label>
                        <button onClick={deleteTeam} className={styles.deleteButton}>
                          Delete Team
                        </button>
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
                            {filterMembers(
                              teams.find((team) => team.id === selectedTeamID)?.members || []
                            ).map((member) => (
                              <tr key={member}>
                                <td>{member}</td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={viewPermissions[member] || false}
                                    onChange={(e) => {
                                      const newViewPermissions = {
                                        ...viewPermissions,
                                        [member]: e.target.checked,
                                      };

                                      // If edit is checked, make sure view is also checked for that member
                                      if (editPermissions[member]) {
                                        newViewPermissions[member] = true;
                                      }

                                      const newEditPermissions = { ...editPermissions };

                                      // If any permissions are selected for other members, enable the user's view & edit
                                      const anyOtherMemberSelected =
                                        Object.keys(newViewPermissions).some(
                                          (key) => key !== session!.email && (newViewPermissions[key] || newEditPermissions[key])
                                        ) || Object.keys(newEditPermissions).some(
                                          (key) => key !== session!.email && newEditPermissions[key]
                                        );

                                      if (anyOtherMemberSelected) {
                                        newViewPermissions[session!.email] = true;
                                        newEditPermissions[session!.email] = true;
                                      } else {
                                        // If no other member is selected, deselect both view and edit for the user
                                        newViewPermissions[session!.email] = false;
                                        newEditPermissions[session!.email] = false;
                                      }

                                      setViewPermissions(newViewPermissions);
                                      setEditPermissions(newEditPermissions);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={editPermissions[member] || false}
                                    onChange={(e) => {
                                      const newEditPermissions = {
                                        ...editPermissions,
                                        [member]: e.target.checked,
                                      };

                                      // Automatically check view if edit is selected
                                      const newViewPermissions = { ...viewPermissions };
                                      if (e.target.checked) {
                                        newViewPermissions[member] = true;
                                      }

                                      // If any permissions are selected for other members, enable the user's view & edit
                                      const anyOtherMemberSelected =
                                        Object.keys(newViewPermissions).some(
                                          (key) => key !== session?.email && (newViewPermissions[key] || newEditPermissions[key])
                                        ) || Object.keys(newEditPermissions).some(
                                          (key) => key !== session?.email && newEditPermissions[key]
                                        );

                                      if (anyOtherMemberSelected) {
                                        newViewPermissions[session!.email] = true;
                                        newEditPermissions[session!.email] = true;
                                      } else {
                                        // If no other member is selected, deselect both view and edit for the user
                                        newViewPermissions[session!.email] = false;
                                        newEditPermissions[session!.email] = false;
                                      }

                                      setViewPermissions(newViewPermissions);
                                      setEditPermissions(newEditPermissions);
                                    }}
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