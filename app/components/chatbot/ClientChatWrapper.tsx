// /app/components/chatbot/ClientChatWrapper.tsx

"use client"; // This directive marks this as a Client Component

import React from "react";
import dynamic from "next/dynamic";

// Import chatbot with client-side only rendering
const ChatbotWrapper = dynamic(() => import("./ChatbotWrapper"), {
  ssr: false,
});

const ClientChatWrapper: React.FC = () => {
  return <ChatbotWrapper />;
};

export default ClientChatWrapper;
