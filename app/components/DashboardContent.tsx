"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Title,
  Card,
  Text,
  Button,
  Group,
  Badge,
  TextInput,
  Paper,
  ScrollArea,
  Modal,
  Drawer,
  ActionIcon,
  SimpleGrid,
  useMantineTheme,
  useComputedColorScheme,
} from "@mantine/core";
import { IconSend, IconX, IconMenu2, IconArrowLeft } from "@tabler/icons-react";
import { pusherClient } from "../lib/pusher";
import { useMediaQuery } from "@mantine/hooks";
import { ColorSchemeToggle } from "./ColorSchemeToggle";

// Message type definition
interface Message {
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  timestamp: Date;
}

// Session type definition
interface Session {
  id: string;
  status: "active" | "pending" | "closed" | "ignored";
  messages: Message[];
  needsHandoff: boolean;
  lastActivity: Date;
}

const DashboardContent = () => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [agentMessage, setAgentMessage] = useState("");
  const [agentName, setAgentName] = useState("Support Agent");
  const [endSessionModalOpen, setEndSessionModalOpen] = useState(false);
  const [ignoreSessionModalOpen, setIgnoreSessionModalOpen] = useState(false);
  const [sessionToAction, setSessionToAction] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load initial sessions on mount
  useEffect(() => {
    fetchPendingSessions();

    // Subscribe to the agent dashboard channel
    const dashboardChannel = pusherClient.subscribe("agent-dashboard");

    // Listen for handoff requests
    dashboardChannel.bind(
      "handoff-needed",
      (data: {
        sessionId: string;
        timestamp: Date;
        userQuery?: string;
        isExplicitRequest?: boolean;
      }) => {
        // Check if session already exists
        if (!sessions.some((s) => s.id === data.sessionId)) {
          // Create a new session
          setSessions((prev) => [
            ...prev,
            {
              id: data.sessionId,
              status: "pending",
              messages: data.userQuery
                ? [
                    {
                      role: "user",
                      content: data.userQuery,
                      timestamp: new Date(data.timestamp),
                    },
                  ]
                : [],
              needsHandoff: true,
              lastActivity: new Date(data.timestamp),
            },
          ]);
        }

        // Fetch messages for this session
        fetchSessionMessages(data.sessionId);
      }
    );

    // Listen for new user messages
    dashboardChannel.bind(
      "user-message",
      (data: { sessionId: string; message: string; timestamp: Date }) => {
        // Update session if it exists
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === data.sessionId) {
              return {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    role: "user",
                    content: data.message,
                    timestamp: new Date(data.timestamp),
                  },
                ],
                lastActivity: new Date(data.timestamp),
              };
            }
            return session;
          })
        );
      }
    );

    // Cleanup on unmount
    return () => {
      pusherClient.unsubscribe("agent-dashboard");
    };
  }, [sessions]);

  // When an agent selects a session, subscribe to its channel
  useEffect(() => {
    if (!activeSession) return;

    // Fetch messages for this session
    fetchSessionMessages(activeSession);

    // Subscribe to this specific session channel
    const sessionChannel = pusherClient.subscribe(`chat-${activeSession}`);

    // Listen for new messages in this session
    sessionChannel.bind(
      "new-message",
      (data: {
        role: "user" | "assistant" | "agent" | "system";
        content: string;
        timestamp: Date;
      }) => {
        // Update session messages
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === activeSession) {
              // Check if message already exists to prevent duplicates
              const messageExists = session.messages.some(
                (m) =>
                  m.content === data.content &&
                  m.role === data.role &&
                  Math.abs(
                    new Date(m.timestamp).getTime() -
                      new Date(data.timestamp).getTime()
                  ) < 1000
              );

              if (messageExists) return session;

              return {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    role: data.role,
                    content: data.content,
                    timestamp: new Date(data.timestamp),
                  },
                ],
                lastActivity: new Date(data.timestamp),
              };
            }
            return session;
          })
        );
      }
    );

    // Close mobile menu when a session is selected
    if (isMobile) {
      setMobileMenuOpen(false);
    }

    // Cleanup on unmount or session change
    return () => {
      pusherClient.unsubscribe(`chat-${activeSession}`);
    };
  }, [activeSession, isMobile]);

  // Fetch pending sessions from API
  const fetchPendingSessions = async () => {
    try {
      const response = await fetch("/api/agent/pending-sessions");
      if (response.ok) {
        const data = await response.json();
        // Transform data to Session type
        const pendingSessions = data.sessions.map((s: any) => ({
          id: s.sessionId,
          status: "pending",
          messages: [],
          needsHandoff: true,
          lastActivity: new Date(s.lastActivity),
        }));

        // Add only sessions that don't already exist
        setSessions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSessions = pendingSessions.filter(
            (s: Session) => !existingIds.has(s.id)
          );
          return [...prev, ...newSessions];
        });
      }
    } catch (error) {
      console.error("Error fetching pending sessions:", error);
    }
  };

  // Fetch messages for a specific session
  const fetchSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/agent/session-messages?sessionId=${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();

        // Update session with messages
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === sessionId) {
              return {
                ...session,
                messages: data.messages,
              };
            }
            return session;
          })
        );
      }
    } catch (error) {
      console.error("Error fetching session messages:", error);
    }
  };

  // Accept a session and start handling it
  const handleAcceptSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/agent/accept-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          agentName,
        }),
      });

      if (response.ok) {
        // Update session status
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === sessionId) {
              return {
                ...session,
                status: "active",
                messages: [
                  ...session.messages,
                  {
                    role: "system",
                    content: `${agentName} has joined the conversation.`,
                    timestamp: new Date(),
                  },
                  {
                    role: "agent",
                    content: `Hello! I'm ${agentName} and I'll be helping you today. How can I assist you?`,
                    timestamp: new Date(),
                  },
                ],
              };
            }
            return session;
          })
        );

        // Set as active session
        setActiveSession(sessionId);
      }
    } catch (error) {
      console.error("Error accepting session:", error);
    }
  };

  // Ignore a session
  const handleIgnoreSession = async () => {
    if (!sessionToAction) return;

    try {
      const response = await fetch("/api/agent/ignore-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionToAction,
        }),
      });

      if (response.ok) {
        // Remove session from the list entirely
        setSessions((prev) =>
          prev.filter((session) => session.id !== sessionToAction)
        );

        // If this was the active session, clear it
        if (activeSession === sessionToAction) {
          setActiveSession(null);
        }
      }
    } catch (error) {
      console.error("Error ignoring session:", error);
    } finally {
      setIgnoreSessionModalOpen(false);
      setSessionToAction(null);
    }
  };

  // End active session
  const handleEndSession = async () => {
    if (!sessionToAction) return;

    try {
      const response = await fetch("/api/agent/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionToAction,
          agentName,
        }),
      });

      if (response.ok) {
        // Update session status
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === sessionToAction) {
              return {
                ...session,
                status: "closed",
                messages: [
                  ...session.messages,
                  {
                    role: "system",
                    content: `${agentName} has ended the conversation.`,
                    timestamp: new Date(),
                  },
                ],
              };
            }
            return session;
          })
        );

        // If this was the active session, clear it
        if (activeSession === sessionToAction) {
          setActiveSession(null);
        }
      }
    } catch (error) {
      console.error("Error ending session:", error);
    } finally {
      setEndSessionModalOpen(false);
      setSessionToAction(null);
    }
  };

  // Open end session modal
  const openEndSessionModal = (sessionId: string) => {
    setSessionToAction(sessionId);
    setEndSessionModalOpen(true);
  };

  // Open ignore session modal
  const openIgnoreSessionModal = (sessionId: string) => {
    setSessionToAction(sessionId);
    setIgnoreSessionModalOpen(true);
  };

  // Send a message as the agent
  const handleSendMessage = async () => {
    if (!activeSession || !agentMessage.trim()) return;

    try {
      const response = await fetch("/api/agent/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession,
          message: agentMessage,
          agentName,
        }),
      });

      if (response.ok) {
        // Add message to the UI immediately
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id === activeSession) {
              return {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    role: "agent",
                    content: agentMessage,
                    timestamp: new Date(),
                  },
                ],
                lastActivity: new Date(),
              };
            }
            return session;
          })
        );

        // Clear input
        setAgentMessage("");
      }
    } catch (error) {
      console.error("Error sending agent message:", error);
    }
  };

  // Get the active session data
  const currentSession = sessions.find((s) => s.id === activeSession);

  // Session List Component
  const SessionsList = () => (
    <Card withBorder p="xs" style={{ height: "100%" }}>
      <Group justify="space-between" mb="md">
        <Title order={4}>Sessions</Title>
        {isMobile && activeSession && (
          <ActionIcon onClick={() => setActiveSession(null)}>
            <IconArrowLeft size={20} />
          </ActionIcon>
        )}
      </Group>
      <ScrollArea h={isMobile ? "calc(100vh - 190px)" : "calc(100% - 40px)"}>
        {sessions.length === 0 ? (
          <Text c="dimmed" ta="center">
            No active sessions
          </Text>
        ) : (
          sessions
            .filter(
              (session) =>
                session.status !== "ignored" && session.status !== "closed"
            )
            .map((session) => (
              <Card
                key={session.id}
                withBorder
                mb="xs"
                p="xs"
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    activeSession === session.id
                      ? isDark
                        ? theme.colors.dark[5]
                        : theme.colors.blue[0]
                      : undefined,
                }}
                onClick={() => setActiveSession(session.id)}
              >
                <Group justify="apart">
                  <Text fw={500}>Session #{session.id.substring(0, 6)}</Text>
                  <Badge
                    color={session.status === "pending" ? "yellow" : "green"}
                  >
                    {session.status}
                  </Badge>
                </Group>
                <Group justify="apart" mt="xs">
                  <Text size="xs" c="dimmed">
                    {new Date(session.lastActivity).toLocaleTimeString()}
                  </Text>
                  {session.status === "pending" ? (
                    <Group gap="xs">
                      <Button
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptSession(session.id);
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        color="gray"
                        onClick={(e) => {
                          e.stopPropagation();
                          openIgnoreSessionModal(session.id);
                        }}
                      >
                        Ignore
                      </Button>
                    </Group>
                  ) : (
                    <Button
                      size="xs"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEndSessionModal(session.id);
                      }}
                    >
                      End
                    </Button>
                  )}
                </Group>
              </Card>
            ))
        )}
      </ScrollArea>
    </Card>
  );

  // Chat View Component
  const ChatView = () => (
    <Card
      withBorder
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {activeSession && currentSession ? (
        <>
          <Group justify="space-between" mb="md">
            <Group>
              {isMobile && (
                <ActionIcon onClick={() => setActiveSession(null)}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
              )}
              <Title order={4}>Chat #{currentSession.id.substring(0, 6)}</Title>
            </Group>
            <Group gap="xs">
              <Badge color={currentSession.needsHandoff ? "red" : "blue"}>
                {currentSession.needsHandoff
                  ? "Needs Assistance"
                  : "Monitoring"}
              </Badge>
              <Button
                size="xs"
                color="red"
                onClick={() => openEndSessionModal(currentSession.id)}
              >
                End Session
              </Button>
            </Group>
          </Group>

          <ScrollArea
            style={{ flex: 1 }}
            mb="md"
            h={isMobile ? "calc(100vh - 240px)" : undefined}
          >
            {currentSession.messages.length === 0 ? (
              <Text c="dimmed" ta="center">
                No messages yet
              </Text>
            ) : (
              currentSession.messages.map((message, index) => (
                <Box
                  key={index}
                  mb="xs"
                  style={{
                    display: "flex",
                    flexDirection:
                      message.role === "user" ? "row" : "row-reverse",
                    justifyContent: "flex-start",
                  }}
                >
                  <Paper
                    p="xs"
                    withBorder
                    style={{
                      maxWidth: "80%",
                      backgroundColor: isDark
                        ? message.role === "user"
                          ? theme.colors.dark[6]
                          : message.role === "assistant"
                          ? theme.colors.blue[9]
                          : message.role === "agent"
                          ? theme.colors.green[9]
                          : theme.colors.dark[5]
                        : message.role === "user"
                        ? "#f0f0f0"
                        : message.role === "assistant"
                        ? "#e6f7ff"
                        : message.role === "agent"
                        ? "#e6ffe6"
                        : "#f9f9f9",
                    }}
                  >
                    {message.role !== "user" && (
                      <Badge
                        size="xs"
                        mb="xs"
                        color={
                          message.role === "assistant"
                            ? "blue"
                            : message.role === "agent"
                            ? "green"
                            : "gray"
                        }
                      >
                        {message.role === "assistant"
                          ? "AI Bot"
                          : message.role === "agent"
                          ? "Agent"
                          : "System"}
                      </Badge>
                    )}
                    <Text size="sm">{message.content}</Text>
                    <Text size="xs" c="dimmed" ta="right" mt="xs">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </Paper>
                </Box>
              ))
            )}
          </ScrollArea>

          <Group>
            <TextInput
              placeholder="Type a message..."
              value={agentMessage}
              onChange={(e) => setAgentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconSend size={16} />}
              onClick={handleSendMessage}
              disabled={!agentMessage.trim()}
            >
              Send
            </Button>
          </Group>
        </>
      ) : (
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Text c="dimmed">
            {isMobile
              ? "Select a session from the menu"
              : "Select a session to view the conversation"}
          </Text>
        </Box>
      )}
    </Card>
  );

  // Render mobile layout
  if (isMobile) {
    return (
      <Box p="md">
        <Group justify="space-between" mb="lg">
          <Title order={2}>Agent Dashboard</Title>
          <Group gap="sm">
            <ColorSchemeToggle />
            {!activeSession && (
              <ActionIcon size="lg" onClick={() => setMobileMenuOpen(true)}>
                <IconMenu2 size={24} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Mobile Layout */}
        <Card withBorder mb="md">
          <Group justify="space-between">
            <Text>Agent Name:</Text>
            <TextInput
              value={agentName}
              onChange={(e) => {
                if (e.target.value.trim()) {
                  setAgentName(e.target.value);
                } else {
                  setAgentName("Support Agent");
                }
              }}
              placeholder="Your name"
              size="sm"
              style={{ width: "200px" }}
              required
            />
          </Group>
        </Card>

        {/* Mobile View: Show either session list or chat */}
        {activeSession ? <ChatView /> : <SessionsList />}

        {/* Mobile Drawer for Sessions */}
        <Drawer
          opened={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title="Sessions"
          padding="md"
        >
          <SessionsList />
        </Drawer>

        {/* Modals */}
        <Modal
          opened={endSessionModalOpen}
          onClose={() => setEndSessionModalOpen(false)}
          title="End Session"
          centered
        >
          <Text mb="md">
            Are you sure you want to end this session? The user will be notified
            that the conversation has ended.
          </Text>
          <Group justify="right">
            <Button
              variant="outline"
              onClick={() => setEndSessionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleEndSession}>
              End Session
            </Button>
          </Group>
        </Modal>

        <Modal
          opened={ignoreSessionModalOpen}
          onClose={() => setIgnoreSessionModalOpen(false)}
          title="Ignore Session"
          centered
        >
          <Text mb="md">
            Are you sure you want to ignore this session? The user will be
            notified that all agents are currently busy.
          </Text>
          <Group justify="right">
            <Button
              variant="outline"
              onClick={() => setIgnoreSessionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button color="yellow" onClick={handleIgnoreSession}>
              Ignore Session
            </Button>
          </Group>
        </Modal>
      </Box>
    );
  }

  // Render tablet/desktop layout
  return (
    <Box p="md">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Agent Dashboard</Title>
        <ColorSchemeToggle />
      </Group>

      {/* Agent settings */}
      <Card withBorder mb="md">
        <Group justify="space-between">
          <Text>Agent Name:</Text>
          <TextInput
            value={agentName}
            onChange={(e) => {
              if (e.target.value.trim()) {
                setAgentName(e.target.value);
              } else {
                setAgentName("Support Agent");
              }
            }}
            placeholder="Your name"
            size="sm"
            style={{ width: "200px" }}
            required
          />
        </Group>
      </Card>

      <SimpleGrid
        cols={isTablet ? 1 : 2}
        spacing={4} // Use a very small value
        style={{
          height: "calc(100vh - 180px)",
          gridTemplateColumns: isTablet ? "1fr" : "300px 1fr", // This is key
        }}
      >
        {/* Session list - fixed width in desktop */}
        <Box
          style={{
            height: isTablet ? "auto" : "100%",
          }}
        >
          <SessionsList />
        </Box>

        {/* Chat view */}
        {(!isTablet || !activeSession) && (
          <Box
            style={{
              height: isTablet && !activeSession ? "auto" : "100%",
            }}
          >
            <ChatView />
          </Box>
        )}
      </SimpleGrid>

      {/* End Session Confirmation Modal */}
      <Modal
        opened={endSessionModalOpen}
        onClose={() => setEndSessionModalOpen(false)}
        title="End Session"
        centered
      >
        <Text mb="md">
          Are you sure you want to end this session? The user will be notified
          that the conversation has ended.
        </Text>
        <Group justify="right">
          <Button
            variant="outline"
            onClick={() => setEndSessionModalOpen(false)}
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleEndSession}>
            End Session
          </Button>
        </Group>
      </Modal>

      {/* Ignore Session Confirmation Modal */}
      <Modal
        opened={ignoreSessionModalOpen}
        onClose={() => setIgnoreSessionModalOpen(false)}
        title="Ignore Session"
        centered
      >
        <Text mb="md">
          Are you sure you want to ignore this session? The user will be
          notified that all agents are currently busy.
        </Text>
        <Group justify="right">
          <Button
            variant="outline"
            onClick={() => setIgnoreSessionModalOpen(false)}
          >
            Cancel
          </Button>
          <Button color="yellow" onClick={handleIgnoreSession}>
            Ignore Session
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default DashboardContent;
