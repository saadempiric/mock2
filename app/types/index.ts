export interface ChatMessage {
  role: "user" | "assistant" | "system" | "agent";
  content: string;
  timestamp?: Date;
}

export interface ChatToggleProps {
  isOpen: boolean;
  toggleChat: () => void;
}

export interface ChatBubbleProps {
  message: ChatMessage;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  buttonLabel?: string;
}

export interface ChatInterfaceProps {
  isOpen: boolean;
  toggleChat: () => void;
}
