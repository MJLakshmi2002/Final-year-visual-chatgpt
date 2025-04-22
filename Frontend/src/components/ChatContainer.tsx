import React from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { ChatProvider } from "@/context/ChatContext";

export type ChatMode = "chat" | "generate" | "analyze";

interface ChatContainerProps {
  mode?: ChatMode;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ mode = "chat" }) => {
  return (
    <ChatProvider>
      <div className="flex flex-col h-full max-w-4xl mx-auto shadow-lg border rounded-lg overflow-hidden">
        <ChatHeader mode={mode} />
        <div className="flex-1 overflow-y-auto relative">
          <ChatMessages mode={mode} />
        </div>
        <ChatInput mode={mode} />
      </div>
    </ChatProvider>
  );
};

export default ChatContainer;