/*  eslint-disable */
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./canvas.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { format } from "path";
import { useDebouncedCallback } from "use-debounce";
import { EditorContent, EditorRoot, JSONContent, type EditorInstance } from "novel";
import TailwindAdvancedEditor from '@/components/tailwind/advanced-editor';
import Providers from "@/components/providers";


interface Message {
  message: string;
  author: string;
  files?: any[]; // Add files for messages that include uploads
}

interface ChatResponse {
  chatTitle: string;
  brainID?: string;
  messages: Message[];
}

interface Chat {
  chatID: string,
  chatTitle: string,
  teamTitle?: string,
  messages?: Message[],
}

const agents = ["internet", "codegen", "graphgen", "imagegen", "docucomp", "memstore", "memsearch", "simplechat"];

interface NotebookParams {
    content: JSONContent;
}

const defaultEditorContent = {
  "type": "doc",
  "content": [
      {
          "type": "heading",
          "attrs": {
              "level": 1
          },
          "content": [
              {
                  "type": "text",
                  "text": "Welcome to Levlex"
              }
          ]
      },
      {
          "type": "paragraph",
          "content": [
              {
                  "type": "text",
                  "marks": [
                      {
                          "type": "link",
                          "attrs": {
                              "href": "http://levlex.xyz/",
                              "target": "_blank",
                              "rel": "noopener noreferrer nofollow",
                              "class": "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer"
                          }
                      }
                  ],
                  "text": "Levlex"
              },
              {
                  "type": "text",
                  "text": " is your personal general intelligence. You can use it to automate repetitive tasks, knowledge retrieval, and semantic searches with analyses. For a wider array of applications, see our demos "
              },
              {
                  "type": "text",
                  "marks": [
                      {
                          "type": "link",
                          "attrs": {
                              "href": "http://levlex.xyz/demos",
                              "target": "_blank",
                              "rel": "noopener noreferrer nofollow",
                              "class": "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer"
                          }
                      }
                  ],
                  "text": "here"
              },
              {
                  "type": "text",
                  "text": "."
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 2
          },
          "content": [
              {
                  "type": "text",
                  "text": "this is your notebook"
              }
          ]
      },
      {
          "type": "paragraph",
          "content": [
              {
                  "type": "text",
                  "text": "Here you can take notes as you would with a normal notebook. To create different types of sections hit space and utilize the slash / key. "
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 2
          },
          "content": [
              {
                  "type": "text",
                  "text": "example sections"
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "code"
              }
          ]
      },
      {
          "type": "codeBlock",
          "attrs": {
              "language": null
          },
          "content": [
              {
                  "type": "text",
                  "text": "print(\"This is a code block\")"
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "numbered list"
              }
          ]
      },
      {
          "type": "orderedList",
          "attrs": {
              "tight": true,
              "start": 1
          },
          "content": [
              {
                  "type": "listItem",
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "This"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "listItem",
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "is"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "listItem",
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "a"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "listItem",
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "numbered"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "listItem",
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "list"
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "quote"
              }
          ]
      },
      {
          "type": "blockquote",
          "content": [
              {
                  "type": "paragraph",
                  "content": [
                      {
                          "type": "text",
                          "text": "This is a quote"
                      }
                  ]
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "todolist"
              }
          ]
      },
      {
          "type": "taskList",
          "content": [
              {
                  "type": "taskItem",
                  "attrs": {
                      "checked": false
                  },
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "this"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "taskItem",
                  "attrs": {
                      "checked": false
                  },
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "is"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "taskItem",
                  "attrs": {
                      "checked": false
                  },
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "a"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "taskItem",
                  "attrs": {
                      "checked": false
                  },
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "todolist"
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "links"
              }
          ]
      },
      {
          "type": "paragraph",
          "content": [
              {
                  "type": "text",
                  "text": "to embed links, simply copy the link, highlight the text you want to link, and paste. If you copied a valid url, it should embed onto your selected text "
              },
              {
                  "type": "text",
                  "marks": [
                      {
                          "type": "link",
                          "attrs": {
                              "href": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                              "target": "_blank",
                              "rel": "noopener noreferrer nofollow",
                              "class": "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer"
                          }
                      }
                  ],
                  "text": "like so"
              },
              {
                  "type": "text",
                  "text": "."
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "you can embed youtube videos"
              }
          ]
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          }
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "as well as tweets"
              }
          ]
      },
      {
          "type": "paragraph"
      },
      {
          "type": "heading",
          "attrs": {
              "level": 3
          },
          "content": [
              {
                  "type": "text",
                  "text": "and, of course, images"
              }
          ]
      },
      {
          "type": "image",
          "attrs": {
              "src": "https://cdn.statically.io/gh/numinousmuses/levlex-public/main/papelvlxwhite.png",
              "alt": "banner.png",
              "title": "banner.png"
          }
      },
      {
          "type": "heading",
          "attrs": {
              "level": 2
          },
          "content": [
              {
                  "type": "text",
                  "text": "recommended next steps"
              }
          ]
      },
      {
          "type": "taskList",
          "content": [
              {
                  "type": "taskItem",
                  "attrs": {
                      "checked": false
                  },
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "read the docs"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "taskItem",
                  "attrs": {
                      "checked": false
                  },
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "look through the demos"
                              }
                          ]
                      }
                  ]
              },
              {
                  "type": "taskItem",
                  "attrs": {
                      "checked": false
                  },
                  "content": [
                      {
                          "type": "paragraph",
                          "content": [
                              {
                                  "type": "text",
                                  "text": "follow our twitter, instagram,  youtube, and linkedin to stay in the loop"
                              }
                          ]
                      }
                  ]
              }
          ]
      }
  ]
}

const sampleNotebook: NotebookParams = {
  content: defaultEditorContent
}

export default function Chat() {
  const [session, setSession] = useState<{
    userId: string;
    email: string;
    username: string;
    docks?: any;
  } | null>(null);
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [author, setAuthor] = useState("user"); // Default author is "user"
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // For settings modal
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // For file uploads
  const [newChatTitle, setNewChatTitle] = useState(""); // For renaming chat
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [filteredAgents, setFilteredAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [ isChatOpen, setIsChatOpen ] = useState(true);
  const [ isCanvasOpen, setIsCanvasOpen ] = useState(true);
  const [notebook, setNotebook] = useState<NotebookParams>(sampleNotebook);
  const [charsCount, setCharsCount] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState("Saved");




  const router = useRouter();
  const params = useParams();
  const chatID = params?.chatID;

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setSession(data); // Set session here
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        router.push("/login");
      }
    };

    if (!session) {
      fetchSession(); // Fetch the session
    }
  }, [session, router]);


  // This effect runs after `session` is updated
  useEffect(() => {
    const fetchChatsAndTeams = async () => {
      if (!session?.userId) return;

      try {
        const chatResponse = await fetch(`/api/canvaschat/${session.userId}`);
        if (chatResponse.ok) {
          const chatData: Chat[] = await chatResponse.json();

          console.log("Chat data:", chatData);

          //if chatID not in chats, redirect to dashboard
          if (!chatData.some((chat: Chat) => chat.chatID === chatID)) {
            router.push("/dashboard");
          }

          
        }
      } catch (error) {
        console.log("Error fetching chats or teams:", error);
        
        console.error("Error fetching chats or teams:", error);
      }
    };

    if (session) {
      fetchChatsAndTeams(); // Fetch chats and teams after session is set
    }
  }, [session, chatID, router]);


  const fetchChatMessages = async () => {
    if (!session?.userId) return;
  
    try {
      const response = await fetch("/api/canvaschat/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: session?.userId, chatID: chatID, email: session?.email }),
      });
  
      if (response.ok) {
        const data: ChatResponse = await response.json();

        console.log("Data:", data);

  
        // Set the filtered data in state
        setChat(data);

      
      } else {
        console.error("Failed to retrieve chat");
      }
    } catch (error) {
      console.error("Error retrieving chat:", error);
    }
  };

  useEffect(() => {
    if (session?.userId && !chat) {
      fetchChatMessages();
    }
  }, [chatID, session]);

  // Ref to keep track of the bottom of the chat body
  const bottomRef = useRef<HTMLDivElement | null>(null); 

  const renameChat = async () => {
    if (!newChatTitle.trim()) return;

    try {
      const response = await fetch("/api/canvaschat/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatID: chatID,
          newChatTitle: newChatTitle,
        }),
      });

      if (response.ok) {
        fetchChatMessages();
        setNewChatTitle(""); // Clear input after renaming
        setIsSettingsModalOpen(false); // Close modal after renaming
      } else {
        console.error("Failed to rename chat");
      }
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
  };

  const handleAgentMention = (text: string) => {
    const match = text.match(/@(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      setFilteredAgents(agents.filter((agent) => agent.startsWith(query)));
      setIsAgentMenuOpen(true);
    } else {
      setIsAgentMenuOpen(false);
    }
  };

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
    setNewMessage(`@${agent} `);
    setIsAgentMenuOpen(false);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    handleAgentMention(value);
    // if ((value.match(/@/g) || []).length <= 1) {
      
    // } else {
    //   alert("Only one @mention is allowed per message.");
    // }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const validFiles = validateFiles(selectedFiles);
    if (!validFiles) return;

    const formData = new FormData();
    formData.append("chatID", String(chatID || ""));
    formData.append(
      "userMessage",
      JSON.stringify({
        message: newMessage,
        author: author,
      })
    );
    if (selectedAgent) formData.append("agent", selectedAgent);

    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/canvaschat/new", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setNewMessage(""); // Clear the input field after sending the message
        setSelectedFiles([]); // Clear file selection
        fetchChatMessages(); // Fetch updated chat messages
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteChat = async () => {
    if (!chatID) return;

    try {
      const response = await fetch("/api/canvaschat/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatID }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        console.error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = validateFiles(files);
    if (validFiles) {
      setSelectedFiles(files);
    }
  };

  const validateFiles = (files: File[]) => {
    const imageFormats = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    const documentFormats = [
      "application/pdf",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/html",
      "text/plain",
      "text/markdown",
    ];

    const maxImageSize = 3.75 * 1024 * 1024; // 3.75 MB
    const maxDocumentSize = 4.5 * 1024 * 1024; // 4.5 MB

    let imageCount = 0;
    let documentCount = 0;

    for (let file of files) {
      const fileType = file.type;

      if (imageFormats.includes(fileType)) {
        imageCount++;
        if (imageCount > 20) {
          alert("You can only upload up to 20 images.");
          return false;
        }
        if (file.size > maxImageSize) {
          alert("Each image must be smaller than 3.75 MB.");
          return false;
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (img.width > 8000 || img.height > 8000) {
            alert(
              "Each image's dimensions must be less than or equal to 8000px."
            );
            return false;
          }
        };
      } else if (documentFormats.includes(fileType)) {
        documentCount++;
        if (documentCount > 5) {
          alert("You can only upload up to 5 documents.");
          return false;
        }
        if (file.size > maxDocumentSize) {
          alert("Each document must be smaller than 4.5 MB.");
          return false;
        }
      } else {
        alert(
          `Unsupported file format: ${file.name}. Accepted formats: images (${imageFormats.join(
            " | "
          )}), documents (${documentFormats.join(" | ")}).`
        );
        return false;
      }
    }

    return true;
  };

  const updateNotebook = async (updatedNotebook: NotebookParams) => {
    try {
        const params = { userID: session?.userId, notebook: updatedNotebook };
        const response = await fetch(`/api/notebooks/${chatID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params), // Send updated notebook data
        });

        if (response.ok) {
            setSaveStatus("Saved");
        } else {
            console.error('Error updating notebook:', await response.text());
            setSaveStatus("Error saving");
        }
    } catch (error) {
        console.error('Error updating notebook:', error);
        setSaveStatus("Error saving");
    }
  };

  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    const updatedNotebook = { ...notebook };
    updatedNotebook.content = json;
    await updateNotebook(updatedNotebook)
    
    setCharsCount(editor.storage.characterCount.words());
  }, 500);

  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  return (
    <div className={styles.container}>
    {isChatOpen && <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.backButton} onClick={() => router.push("/dashboard")}>
          Back
        </div>
        <div className={styles.pageTitle}>
          {chat ? chat.chatTitle : "Loading..."}
        </div>
        <div className={styles.settings} onClick={openSettingsModal}>
          Settings
        </div>
      </div>

      <div className={styles.pageBody}>
        {chat ? (
          chat.messages.length > 0 ? (
            chat.messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.author === "user" ? styles.userMessage : styles.systemMessage
                }
              >
                {msg.author === "user" ? (
                  <span>{msg.message}</span>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    className={styles.markdown}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={nightOwl}
                            PreTag="div"
                            language={match[1]}
                            {...props}
                            className={styles.codeRender}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.message}
                  </ReactMarkdown>
                )}
              </div>
            ))
          ) : (
            <p className={styles.noMessages} >No messages yet. Start the conversation!</p>
          )
        ) : (
          <p className={styles.loading}>Loading chat...</p>
        )}
        <div ref={bottomRef} />
      </div>

      



      {canSendMessage && (
        <div className={styles.pageFooter}>
          
          <div className={styles.inputContainer}>
            
            <input
              type="file"
              id="file-upload"
              multiple
              hidden
              accept=".png,.jpeg,.gif,.webp,.pdf,.csv,.doc,.docx,.xls,.xlsx,.html,.txt,.md"
              className={styles.uploadButton}
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className={styles.customFileUpload}>⏏</label>
            <input
              type="text"
              className={styles.messageInput}
              placeholder="Type your message... Tip: use the @ symbol to select an agent"
              value={newMessage}
              onChange={handleMessageChange}
              onKeyPress={(e) => { if (e.key === "Enter") sendMessage(); }}
            />
            <button onClick={sendMessage} className={styles.sendButton}>Send</button>
          </div>

          {isAgentMenuOpen && (
            <div className={styles.agentMenu}>
              {filteredAgents.map((agent) => (
                <div
                  key={agent}
                  className={styles.agentMenuItem}
                  onClick={() => handleAgentSelect(agent)}
                >
                  {agent}
                </div>
              ))}
            </div>
          )}

          {selectedAgent && !isAgentMenuOpen && (
            <div className={styles.selectedAgentDisplay}>
              Selected Agent: <span className={styles.selectedAgent}>{selectedAgent}</span>
            </div>
          )}

        </div>
      )}

      {isSettingsModalOpen && (
        <div className={styles.modalOverlay} onClick={closeSettingsModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className={styles.modalContent}>
              <label>
                Rename Chat:
                <br />
                <br />
                <input
                  type="text"
                  placeholder="Enter new chat name"
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  className={styles.input}
                />
              </label>
              <button onClick={renameChat} className={styles.actionButton}>
                Rename Chat
              </button>

              <button onClick={deleteChat} className={styles.deleteButton}>
                Delete Chat
              </button>

              <button onClick={closeSettingsModal} className={styles.closeButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
     
    </div>}
     {isCanvasOpen && <div className={styles.canvas}>
      <button className={styles.toggleButton} onClick={() => setIsChatOpen(!isChatOpen)}>Toggle Chat</button>
      <button className={styles.switchButton} onClick={() => setIsCanvasOpen(!isCanvasOpen)}>Switch to Chat</button>
      <div className={styles.canvasContainer}>
        <Providers>
          <div className="flex min-h-screen flex-col items-center gap-4 py-4 sm:px-5">

            <TailwindAdvancedEditor
              initialContent={notebook.content}
              onUpdate={debouncedUpdates}
              saveStatus={saveStatus}
              charsCount={charsCount}/>
          </div>
        </Providers>
      </div>
     </div>}
     </div>
  );
}
