"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation"; // Use `useParams` to get the chatID
import styles from "./chat.module.css";

interface Message {
  message: string;
  author: string;
}

interface ChatResponse {
  chatTitle: string;
  messages: Message[];
}

export default function Chat() {
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [author, setAuthor] = useState("user"); // Default author is "user"
  const router = useRouter();
  const params = useParams(); // Get the params from the dynamic route
  const chatID = params?.chatID; // Extract the chatID from the dynamic route params

  // Function to retrieve chat messages from the API
  const fetchChatMessages = async () => {
    if (!chatID) return;

    try {
      const response = await fetch("/api/chats/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: "USER_ID", chatID: chatID }), // Replace USER_ID with the actual userID
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

  // Function to handle sending a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch("/api/chats/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatID: chatID,
          userMessage: { message: newMessage, author: author },
        }),
      });

      if (response.ok) {
        setNewMessage(""); // Clear the input field after sending the message
        fetchChatMessages(); // Fetch updated chat messages
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.backButton} onClick={() => router.back()}>
        Back
        </div>
        <div className={styles.pageTitle}>
          {chat ? chat.chatTitle : "Loading..."}
        </div>
        <div className={styles.settings}>Settings</div>
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
                <strong>{msg.author}: </strong>
                <span>{msg.message}</span>
              </div>
            ))
          ) : (
            <p>No messages yet. Start the conversation!</p>
          )
        ) : (
          <p>Loading chat...</p>
        )}
      </div>

      {/* Page Footer - Input for Sending Messages */}
      <div className={styles.pageFooter}>
        <div className={styles.inputContainer}>
            <div className={styles.uploadButton}>⏏</div>
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
    </div>
  );
}
