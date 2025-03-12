import React, { useState, useEffect, useRef } from "react";
import { Box, Paper, Title, Loader, Stack } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { ChatInterfaceProps, ChatMessage } from "../../../app/types";


const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  toggleChat,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Empiric's virtual assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    // Retrieve or create a session ID
    const storedSessionId = localStorage.getItem("chatSessionId");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = generateUUID();
      localStorage.setItem("chatSessionId", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const getCountry = async () => {
    try {
      const res = await fetch("https://ipwho.is/");
      const data = await res.json();
      return data.country; // Example: "Canada"
    } catch (error) {
      console.error("Failed to fetch country:", error);
      return "Unknown";
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionId) return; // Ensure sessionId exists before sending request

    const userMessage: ChatMessage
     = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const country = await getCountry();
      // Send message to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content, sessionId, country }),
      });


      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant response to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Paper
      shadow="md"
      p={0}
      style={(theme) => ({
        position: "fixed",
        bottom: "5rem",
        right: "2rem",
        width: "350px",
        height: "500px",
        borderRadius: theme.radius.md,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      })}
    >
      {/* Chat Header */}
      <Box
        p="xs"
        style={(theme) => ({
          backgroundColor: theme.colors.violet[6],
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <Title order={4} c="white">
          Empiric Assistant
        </Title>
        <IconX
          color="white"
          style={{ cursor: "pointer" }}
          onClick={toggleChat}
          size={20}
        />
      </Box>

      {/* Chat Messages */}
      <Box
        p="sm"
        style={{
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        {messages.map((message, index) => (
          <ChatBubble key={index} message={message} />
        ))}
        {isLoading && (
          <Box
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginTop: "8px",
            }}
          >
            <Loader size="sm" color="violet" />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Chat Input */}
      <Box p="sm">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </Box>
    </Paper>
  );
};

export default ChatInterface;
