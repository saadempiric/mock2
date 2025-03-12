import React, { useState } from "react";
import { TextInput, ActionIcon, Box, Button } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  buttonLabel?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled,
  placeholder = "Type your message...",
  buttonLabel,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If a buttonLabel is provided, treat this as a command button (like "Start New Chat")
    if (buttonLabel) {
      onSend("");
      return;
    }

    // Normal message submission
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  // Render a full-width button if buttonLabel is provided
  if (buttonLabel) {
    return (
      <Box component="form" onSubmit={handleSubmit}>
        <Button type="submit" fullWidth color="violet">
          {buttonLabel}
        </Button>
      </Box>
    );
  }

  // Otherwise render the normal chat input
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextInput
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rightSection={
          <ActionIcon
            type="submit"
            color="violet"
            disabled={disabled || !message.trim()}
          >
            <IconSend size={18} />
          </ActionIcon>
        }
      />
    </Box>
  );
};

export default ChatInput;
