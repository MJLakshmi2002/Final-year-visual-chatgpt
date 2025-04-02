
import React, { createContext, useContext, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, MessageRole, ChatState, ImageAttachment } from "@/types/chat";
import { huggingFaceService } from "@/services/huggingface";
import { toast } from "sonner";

interface ChatContextType extends ChatState {
  sendMessage: (content: string, imageFile?: File) => Promise<void>;
  clearChat: () => void;
  regenerateResponse: () => Promise<void>;
  isProcessing: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback((role: MessageRole, content: string, image?: ImageAttachment) => {
    const newMessage: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      image,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (content: string, imageFile?: File) => {
    try {
      setIsLoading(true);
      setIsProcessing(true);
      
      let imageAttachment: ImageAttachment | undefined;
      
      // Handle image file if provided
      if (imageFile) {
        imageAttachment = {
          url: URL.createObjectURL(imageFile),
          file: imageFile,
        };
        
        // Get image caption
        try {
          const caption = await huggingFaceService.generateImageCaption(imageFile);
          imageAttachment.caption = caption;
        } catch (error) {
          console.error("Error getting image caption:", error);
        }
      }
      
      // Add user message
      addMessage("user", content, imageAttachment);
      
      // Determine what type of response to generate
      let responseContent = "";
      let responseImage: ImageAttachment | undefined;
      
      if (content.toLowerCase().includes("generate") || 
          content.toLowerCase().includes("create") || 
          content.toLowerCase().includes("make") || 
          content.toLowerCase().includes("draw")) {
        // Generate image
        try {
          const generatedImage = await huggingFaceService.generateImage(content);
          responseImage = { url: generatedImage.url };
          responseContent = "I've generated this image based on your request.";
        } catch (error) {
          responseContent = "I couldn't generate an image based on your request. Please try again with a different prompt.";
        }
      } else {
        // Generate text response
        let prompt = content;
        
        // If there's an image, include its caption in the prompt
        if (imageAttachment?.caption) {
          prompt = `User uploaded an image that shows: "${imageAttachment.caption}". Their message: "${content}"`;
        }
        
        responseContent = await huggingFaceService.generateTextResponse(prompt);
      }
      
      // Add AI response
      addMessage("assistant", responseContent, responseImage);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  }, [addMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const regenerateResponse = useCallback(async () => {
    if (messages.length < 1) return;
    
    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];
    
    // Remove the last assistant message
    setMessages(prev => prev.filter(m => m.role !== "assistant" || m.id !== prev[prev.length - 1].id));
    
    // Regenerate response
    await sendMessage(lastUserMessage.content, lastUserMessage.image?.file);
  }, [messages, sendMessage]);

  return (
    <ChatContext.Provider 
      value={{ 
        messages, 
        isLoading, 
        sendMessage, 
        clearChat, 
        regenerateResponse,
        isProcessing
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
