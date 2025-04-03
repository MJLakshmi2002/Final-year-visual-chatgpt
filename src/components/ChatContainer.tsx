import React from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { ChatProvider } from "@/context/ChatContext";

const ChatContainer: React.FC = () => {
  return (
    <ChatProvider>
      <div className="flex flex-col h-full max-w-4xl mx-auto shadow-lg border rounded-lg overflow-hidden">
        <ChatHeader />
        <div className="flex-1 overflow-hidden relative">
          <ChatMessages />
        </div>
        <ChatInput />
      </div>
    </ChatProvider>
  );
};

export default ChatContainer;