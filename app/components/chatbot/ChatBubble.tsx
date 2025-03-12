import React from "react";
import { Avatar, Box, Text, Badge } from "@mantine/core";
import { ChatBubbleProps } from "../../../app/types";

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAgent = message.role === "agent";

  if (isSystem) {
    return (
      <Box
        p="xs"
        mb="sm"
        style={(theme) => ({
          backgroundColor: theme.colors.gray[1],
          borderRadius: theme.radius.md,
          textAlign: "center",
        })}
      >
        <Text size="xs" color="dimmed">
          {message.content}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={(theme) => ({
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        marginBottom: theme.spacing.sm,
        alignItems: "flex-start",
      })}
    >
      <Avatar
        size="sm"
        radius="xl"
        color={isUser ? "gray" : isAgent ? "green" : "violet"}
        mr={isUser ? 0 : 8}
        ml={isUser ? 8 : 0}
      >
        {isUser ? "U" : isAgent ? "A" : "E"}
      </Avatar>
      <Box
        p="xs"
        style={(theme) => ({
          maxWidth: "80%",
          backgroundColor: isUser
            ? theme.colors.gray[1]
            : isAgent
            ? theme.colors.green[0]
            : theme.colors.violet[0],
          borderRadius: theme.radius.md,
          borderTopLeftRadius: isUser ? theme.radius.md : 0,
          borderTopRightRadius: isUser ? 0 : theme.radius.md,
        })}
      >
        {isAgent && (
          <Badge size="xs" color="green" variant="light" mb="xs">
            Human Agent
          </Badge>
        )}
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {message.content}
        </Text>
      </Box>
    </Box>
  );
};

export default ChatBubble;
