import React from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconMessageCircle, IconX } from "@tabler/icons-react";
import { ChatToggleProps } from "../../../app/types";

const ChatToggle: React.FC<ChatToggleProps> = ({ isOpen, toggleChat }) => {
  return (
    <Tooltip label={isOpen ? "Close chat" : "Get help"} position="left">
      <ActionIcon
        onClick={toggleChat}
        color="violet"
        variant="filled"
        radius="xl"
        size="lg"
        style={(theme) => ({
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          boxShadow: theme.shadows.md,
          zIndex: 1000,
        })}
      >
        {isOpen ? <IconX size={24} /> : <IconMessageCircle size={24} />}
      </ActionIcon>
    </Tooltip>
  );
};

export default ChatToggle;
