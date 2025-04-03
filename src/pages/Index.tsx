import React from "react";
import ChatContainer from "@/components/ChatContainer";

const Index = () => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20 p-4 overflow-hidden">
      <div className="flex-1 flex flex-col py-4 overflow-hidden">
        <ChatContainer />
      </div>
      <footer className="text-center text-sm text-muted-foreground py-4">
        <p>Visual ChatGPT - Powered by Hugging Face Models</p>
      </footer>
    </div>
  );
};

export default Index;
