import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Title,
  Loader,
  Stack,
  Text,
  TextInput,
  Button,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { ChatInterfaceProps, ChatMessage } from "../../types";
import { pusherClient } from "../../lib/pusher";
import ReCAPTCHA from "react-google-recaptcha";

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  toggleChat,
}) => {
  const [userInfo, setUserInfo] = useState({ name: "", email: "", isValidEmail: false });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Empira, Empiric's virtual assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentRequested, setAgentRequested] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [agentName, setAgentName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
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

  // Set up Pusher channel subscription
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to the private channel for this session
    const channel = pusherClient.subscribe(`chat-${sessionId}`);

    // Listen for agent messages
    channel.bind(
      "agent-message",
      (data: { message: string; agentName: string }) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content: data.message,
            timestamp: new Date(),
          },
        ]);

        // If this is the first agent message, mark as being in agent mode
        if (!isAgentMode) {
          setIsAgentMode(true);
          setAgentRequested(false); // Reset request flag

          // Update the title/header with agent name
          setAgentName(data.agentName);
        }
      }
    );

    // Listen for handoff completed event
    channel.bind("handoff-completed", (data: { agentName: string }) => {
      setIsAgentMode(true);
      setAgentRequested(false);
      setSessionEnded(false);

      // Store agent name for display in header
      setAgentName(data.agentName);

      // Add system message notifying user
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `${data.agentName} has joined the conversation and will assist you.`,
          timestamp: new Date(),
        },
      ]);
    });

    // Listen for handoff cancelled event (when agent ignores the session)
    channel.bind("handoff-cancelled", () => {
      setIsAgentMode(false);
      setAgentRequested(false);
      setSessionEnded(false);
      setAgentName("");
    });

    // Listen for specific agent-ignored event with both messages
    channel.bind(
      "agent-ignored",
      (data: { systemMessage: string; aiMessage: string; timestamp: Date }) => {
        // Add system message
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: data.systemMessage,
            timestamp: new Date(data.timestamp),
          },
        ]);

        // Add AI assistant message (with a small delay to improve readability)
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.aiMessage,
              timestamp: new Date(),
            },
          ]);
        }, 500);

        // Reset state back to AI mode
        setIsAgentMode(false);
        setAgentRequested(false);
        setSessionEnded(false);
        setAgentName("");
      }
    );

    // Listen for session ended event
    channel.bind("session-ended", (data: { agentName: string }) => {
      setSessionEnded(true);
    });

    // Clean up on unmount
    return () => {
      pusherClient.unsubscribe(`chat-${sessionId}`);
    };
  }, [sessionId, isAgentMode]);

  const handleSendMessage = async (content: string) => {
    if (!sessionId || sessionEnded) return;

    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const country = await getCountry();
      // Determine endpoint based on current mode
      const endpoint = isAgentMode ? "/api/agent-chat" : "/api/chat";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: content,
          sessionId,
          agentRequested,
          country, // Pass the flag to the API
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Check if handoff is needed
      if (data.needsHandoff && !isAgentMode && !agentRequested) {
        setAgentRequested(true);

        // Add system message
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "I'm connecting you to a human agent who can better assist you. Please wait a moment.",
            timestamp: new Date(),
          },
        ]);
      }

      // Only add assistant response if we get one
      if (data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
          },
        ]);
      }
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

  const handleCaptchaVerify = (token: string | null) => {
    if (token) {
      setCaptchaVerified(true);
    }
  };

  const handleAuthentication = () => {
    if (
      userInfo.name.trim() === "" ||
      userInfo.email.trim() === "" ||
      !captchaVerified
    ) {
      alert("Please complete all fields and verify the CAPTCHA.");
      return;
    }
    else if(!userInfo.isValidEmail){
      alert("Enter a valid email")
      return
    } 
    setIsAuthenticated(true);
  };

  // Function to request human agent
  const handleRequestAgent = async () => {
    if (!sessionId || sessionEnded) return;

    setAgentRequested(true);

    // Add system message
    setMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: "I'll connect you with a human agent shortly. Please wait.",
        timestamp: new Date(),
      },
    ]);

    // Call API to request handoff
    try {
      const response = await fetch("/api/request-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to request agent");
      }
    } catch (error) {
      console.error("Error requesting agent:", error);
    }
  };

  // Start a new session
  const handleStartNewSession = () => {
    // Generate new session ID
    const newSessionId = generateUUID();
    localStorage.setItem("chatSessionId", newSessionId);
    setSessionId(newSessionId);

    // Reset states
    setIsAgentMode(false);
    setAgentRequested(false);
    setSessionEnded(false);
    setAgentName("");

    // Reset messages
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm Empiric's virtual assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

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
          {isAgentMode ? `Agent: ${agentName}` : "Empiric Assistant"}
        </Title>
        <IconX
          color="white"
          style={{ cursor: "pointer" }}
          onClick={toggleChat}
          size={20}
        />
      </Box>
      {!isAuthenticated ? (
        <Box p="md">
          <TextInput
            label="Name"
            placeholder="Enter your name"
            value={userInfo.name}
            onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
          />
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={userInfo.email}
            onChange={(e) => {
              const newEmail = e.target.value;
              setUserInfo({ ...userInfo, email: newEmail, isValidEmail: validateEmail(newEmail) })
            }
            }
          />
          <ReCAPTCHA
            sitekey="6Le01e8qAAAAAOW-XNOiagFA0-Ew2OQkWOoADvN1"
            onChange={handleCaptchaVerify}
          />
          <Button
            fullWidth
            mt="md"
            onClick={handleAuthentication}
            disabled={!captchaVerified}
          >
            Start Chat
          </Button>
        </Box>
      ) : (
        <>
          <Box p="sm" style={{ flexGrow: 1, overflowY: "auto" }}>
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
            {sessionEnded ? (
              <Paper p="xs" withBorder mb="sm" style={{ textAlign: "center" }}>
                <Text size="sm" mb="xs">
                  This conversation has ended.
                </Text>
                <ChatInput
                  onSend={handleStartNewSession}
                  disabled={false}
                  buttonLabel="Start New Chat"
                  placeholder="Click to start a new conversation"
                />
              </Paper>
            ) : (
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ChatInterface;
