import React from "react";
import ChatContainer from "@/components/ChatContainer";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ImageGeneration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If there's a suggestion in the state, it will be automatically populated in the chat input
    // This is handled by the ChatContext
    if (!location.state?.from) {
      navigate('/');
    }
  }, [location.state, navigate]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20 p-4 overflow-hidden">
      <div className="flex-1 flex flex-col py-4 overflow-hidden">
        <ChatContainer mode="generate" />
      </div>
      <footer className="text-center text-sm text-muted-foreground py-4">
        <p>Visual ChatGPT - Powered by Hugging Face Models</p>
      </footer>
    </div>
  );
};

export default ImageGeneration; 