

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

  const analyzePromptIntent = useCallback((prompt: string) => {
    // Improved intent detection for various user inputs
    const lowercasePrompt = prompt.toLowerCase();
    
    if (
      lowercasePrompt.includes("generate") || 
      lowercasePrompt.includes("create") || 
      lowercasePrompt.includes("make") || 
      lowercasePrompt.includes("draw") ||
      lowercasePrompt.includes("show me") ||
      lowercasePrompt.includes("visualize") ||
      lowercasePrompt.includes("imagine") ||
      lowercasePrompt.includes("picture of") ||
      lowercasePrompt.includes("image of")
    ) {
      return "image_generation";
    }
    
    if (
      lowercasePrompt.includes("what is") ||
      lowercasePrompt.includes("how to") ||
      lowercasePrompt.includes("explain") ||
      lowercasePrompt.includes("describe") ||
      lowercasePrompt.includes("tell me about") ||
      lowercasePrompt.startsWith("why") ||
      lowercasePrompt.startsWith("when") ||
      lowercasePrompt.startsWith("who") ||
      lowercasePrompt.startsWith("how")
    ) {
      return "knowledge_query";
    }
    
    // Default to conversation if no specific intent is detected
    return "conversation";
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
          // Still proceed with the conversation even if caption fails
        }
      }
      
      // Add user message
      addMessage("user", content, imageAttachment);
      
      // Determine what type of response to generate based on improved intent analysis
      let responseContent = "";
      let responseImage: ImageAttachment | undefined;
      
      const promptIntent = analyzePromptIntent(content);
      
      if (promptIntent === "image_generation") {
        // Generate image
        try {
          const generatedImage = await huggingFaceService.generateImage(content);
          responseImage = { url: generatedImage.url };
          
          // Generate a more descriptive and conversational response about the image
          responseContent = `I've created this image based on your request: "${content}". What do you think?`;
        } catch (error) {
          responseContent = "I tried to generate an image for you, but encountered a technical issue. Could you try rephrasing your request or asking for something else?";
        }
      } else {
        // Prepare prompt with context from previous messages for better conversation flow
        let promptWithContext = content;
        
        // If there's an image, include its caption in the prompt
        if (imageAttachment?.caption) {
          promptWithContext = `The user has shared an image that shows: "${imageAttachment.caption}". They asked: "${content}"`;
        }
        
        // Include previous messages for context if available (last 2-3 messages)
        if (messages.length > 0) {
          const recentMessages = messages.slice(-3);
          const contextPrefix = "Based on our conversation so far, where: ";
          
          const conversationContext = recentMessages.map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'} said: "${msg.content}"`
          ).join(". ");
          
          promptWithContext = `${contextPrefix}${conversationContext}. Now the user asks: "${content}"`;
        }
        
        // Generate conversational response
        responseContent = await huggingFaceService.generateTextResponse(promptWithContext);
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
  }, [addMessage, analyzePromptIntent, messages]);

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
}