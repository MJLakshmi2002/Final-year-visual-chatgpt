import React, { useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, MessageSquare, Image as ImageIcon, Upload, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { ChatMode } from "./ChatContainer";

const MessageStatus: React.FC<{ message: Message }> = ({ message }) => {
  const { isProcessing } = useChat();
  const isLatestMessage = useChat().messages[useChat().messages.length - 1]?.id === message.id;

  if (message.role === "user") {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
        <Check className="w-3 h-3" />
        <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
      </div>
    );
  }

  if (isLatestMessage && isProcessing) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
        <Clock className="w-3 h-3 animate-pulse" />
        <span>Processing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
      <Check className="w-3 h-3" />
      <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
    </div>
  );
};

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md text-sm font-semibold shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-r from-ai-purple to-ai-blue text-white"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="flex-1 space-y-2">
        <div className="prose dark:prose-invert">
          {message.content.split("\n").map((line, i) => (
            <p key={i} className={line.trim() === "" ? "h-4" : "mb-2"}>
              {line}
            </p>
          ))}
        </div>
        {message.image && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-3"
          >
            <img
              src={message.image.url}
              alt={message.image.caption || "Image"}
              className="rounded-md max-w-full max-h-[400px] object-contain border shadow-sm hover:shadow-md transition-shadow"
            />
            {message.image.caption && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                {message.image.caption}
              </p>
            )}
          </motion.div>
        )}
        <MessageStatus message={message} />
      </div>
    </motion.div>
  );
};

const EmptyState: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (mode: ChatMode) => {
    navigate(`/${mode === 'chat' ? 'chat' : mode === 'generate' ? 'generate' : 'analyze'}`);
  };

  const handleSuggestionClick = (suggestion: string, mode: ChatMode) => {
    navigate(`/${mode === 'chat' ? 'chat' : mode === 'generate' ? 'generate' : 'analyze'}`, {
      state: { suggestion, from: 'home' }
    });
  };

  const suggestions = {
    generate: [
      "Can you visualize a puppy in a hat",
      "Generate a futuristic cityscape at sunset"
    ],
    analyze: [
      "What can you tell me about this image? (with upload)"
    ],
    chat: [
      "Can you create a beautiful scenario?"
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col items-center justify-center p-4 text-center"
    >
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-ai-purple to-ai-blue text-white p-6 rounded-full mb-4 shadow-lg"
      >
        <Sparkles className="w-8 h-8" />
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">Visual ChatGPT</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        I'm your interactive AI assistant. I can understand your questions, generate images, 
        and analyze uploaded photos. Let's have a conversation!
      </p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 max-w-2xl"
      >
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex flex-col items-center text-center p-4 bg-muted/40 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleCardClick('chat')}
        >
          <MessageSquare className="w-8 h-8 mb-2 text-primary" />
          <h3 className="font-medium mb-1">Ask Me Anything</h3>
          <p className="text-sm text-muted-foreground">
            I can answer questions about a wide range of topics.
          </p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex flex-col items-center text-center p-4 bg-muted/40 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleCardClick('generate')}
        >
          <ImageIcon className="w-8 h-8 mb-2 text-primary" />
          <h3 className="font-medium mb-1">Generate Images</h3>
          <p className="text-sm text-muted-foreground">
            I can create images from your text descriptions.
          </p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex flex-col items-center text-center p-4 bg-muted/40 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleCardClick('analyze')}
        >
          <Upload className="w-8 h-8 mb-2 text-primary" />
          <h3 className="font-medium mb-1">Analyze Images</h3>
          <p className="text-sm text-muted-foreground">
            Upload an image and I'll tell you what I see.
          </p>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm"
      >
        {Object.entries(suggestions).map(([mode, suggestionList]) =>
          suggestionList.map((suggestion, index) => (
            <motion.div
              key={`${mode}-${index}`}
              whileHover={{ scale: 1.02 }}
              className="bg-muted/30 p-3 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion, mode as ChatMode)}
            >
              {suggestion}
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

interface ChatMessagesProps {
  mode?: ChatMode;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ mode = "chat" }) => {
  const { messages, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
      <AnimatePresence mode="wait">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-4 bg-background"
              >
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-gradient-to-r from-ai-purple to-ai-blue text-white text-sm font-semibold">
                  AI
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
