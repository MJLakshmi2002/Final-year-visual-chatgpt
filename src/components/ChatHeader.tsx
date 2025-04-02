
import React from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatContext";
import { Trash2, RefreshCw } from "lucide-react";

const ChatHeader: React.FC = () => {
  const { clearChat, regenerateResponse, isLoading, isProcessing } = useChat();

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <div className="bg-gradient-to-r from-ai-purple to-ai-blue text-white p-2 rounded-md mr-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-6 h-6"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Visual ChatGPT</h1>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={regenerateResponse}
          disabled={isLoading || isProcessing}
          aria-label="Regenerate response"
          title="Regenerate response"
          className="w-9 h-9"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isProcessing ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={clearChat}
          aria-label="Clear chat"
          title="Clear chat"
          className="w-9 h-9"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
