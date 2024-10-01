/*  eslint-disable */
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./chat.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface Message {
  message: string;
  author: string;
  files?: any[]; // Add files for messages that include uploads
}

interface ChatResponse {
  chatTitle: string;
  messages: Message[];
}

export default function Chat() {
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [author, setAuthor] = useState("user"); // Default author is "user"
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // For settings modal
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // For file uploads

  const router = useRouter();
  const params = useParams();
  const chatID = params?.chatID;

  // Function to retrieve chat messages from the API
  const fetchChatMessages = async () => {
    if (!chatID) return;

    try {
      const response = await fetch("/api/chats/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: "USER_ID", chatID: chatID }),
      });

      if (response.ok) {
        const data: ChatResponse = await response.json();
        setChat(data);
      } else {
        console.error("Failed to retrieve chat");
      }
    } catch (error) {
      console.error("Error retrieving chat:", error);
    }
  };

  // Fetch chat messages when the component mounts or chatID changes
  useEffect(() => {
    if (chatID) {
      fetchChatMessages();
    }
  }, [chatID]);

   // Ref to keep track of the bottom of the chat body
   const bottomRef = useRef<HTMLDivElement | null>(null); 

   // Function to scroll to the bottom of the chat
   const scrollToBottom = () => {
     if (bottomRef.current) {
       bottomRef.current.scrollIntoView({ behavior: "smooth" });
     }
   };

   // Scroll to bottom when messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);



  // Function to handle sending a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Validate and prepare file uploads if any
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

    // Append files to the form data
    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/chats/new", {
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

  // Handle file selection and validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = validateFiles(files);
    if (validFiles) {
      setSelectedFiles(files);
    }
  };

  // Function to validate files
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

  // Function to handle settings modal opening
  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  return (
    <div className={styles.page}>
      {/* Page Header */}
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

      {/* Page Body - Display Chat Messages */}
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
            <p>No messages yet. Start the conversation!</p>
          )
        ) : (
          <p>Loading chat...</p>
        )}
        {/* Scroll to bottom reference element */}
        <div ref={bottomRef} />

      </div>

      {/* Page Footer - Input for Sending Messages and File Upload */}
      <div className={styles.pageFooter}>
        <div className={styles.inputContainer}>
        <div className={styles.fileInputContainer}>
          <input
            type="file"
            id="file-upload"
            multiple
            hidden
            accept=".png,.jpeg,.gif,.webp,.pdf,.csv,.doc,.docx,.xls,.xlsx,.html,.txt,.md"
            className={styles.uploadButton}
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className={styles.customFileUpload}>
                ⏏
            </label>
        </div>
          <input
            type="text"
            className={styles.messageInput}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") sendMessage(); // Send message on pressing Enter
            }}
          />
          <button onClick={sendMessage} className={styles.sendButton}>
            Send
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className={styles.modalOverlay} onClick={closeSettingsModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className={styles.modalContent}>
              <p>Settings options will be available here.</p>
              <button onClick={closeSettingsModal} className={styles.closeButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
