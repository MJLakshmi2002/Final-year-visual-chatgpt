import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/context/ChatContext";
import { Send, Image, X, Lightbulb, Loader2 } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import type { ChatMode } from "./ChatContainer";

interface ChatInputProps {
  mode?: ChatMode;
}

const ChatInput: React.FC<ChatInputProps> = ({ mode = "chat" }) => {
  const location = useLocation();
  const { sendMessage, isLoading, isProcessing } = useChat();
  const [prompt, setPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const promptSuggestions = {
    chat: [
      "What are the key benefits of artificial intelligence?",
      "Explain quantum computing in simple terms",
      "What's your opinion on climate change?",
      "Tell me a joke about robots",
      "How are you feeling today?",
      "What makes a good conversation?",
      "If you could travel anywhere, where would you go?"
    ],
    generate: [
      "Generate a fantasy landscape with mountains and a castle",
      "Create an image of an astronaut riding a horse",
      "Show me a cyberpunk city at night",
      "Draw a cute cat playing with yarn",
      "Visualize a magical forest with glowing mushrooms",
      "Create a surreal underwater scene",
      "Design a futuristic flying car"
    ],
    analyze: [
      "What objects can you identify in this image?",
      "Describe the mood and atmosphere of this scene",
      "What can you tell me about the composition?",
      "Are there any people or animals in this image?",
      "What time of day does this appear to be?",
      "What's the main focus of this image?",
      "Can you describe the colors and lighting?"
    ]
  };

  // Handle suggestion from navigation
  useEffect(() => {
    if (location.state?.suggestion) {
      setPrompt(location.state.suggestion);
      // Clear the state to prevent re-setting on component re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle click outside of suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !event.composedPath().some(el => 
          (el as HTMLElement)?.classList?.contains('ideas-button')
        )
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    inputRef.current?.focus();
  });

  useHotkeys('mod+i', (e) => {
    e.preventDefault();
    fileInputRef.current?.click();
  });

  useHotkeys('esc', () => {
    setShowSuggestions(false);
  });

  // Maintain fixed height for suggestions container
  useEffect(() => {
    if (inputContainerRef.current) {
      const height = inputContainerRef.current.offsetHeight;
      inputContainerRef.current.style.minHeight = `${height}px`;
    }
  }, [prompt, selectedImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !selectedImage) return;

    try {
      await sendMessage(prompt.trim(), selectedImage || undefined);
      setPrompt("");
      setSelectedImage(null);
      setImagePreview(null);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };
  
  const toggleSuggestions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSuggestions(!showSuggestions);
  };

  const getPlaceholder = () => {
    switch (mode) {
      case 'generate':
        return 'Describe the image you want to generate...';
      case 'analyze':
        return 'Upload an image and ask me about it...';
      default:
        return 'Ask me anything...';
    }
  };

  return (
    <div className="p-4 border-t bg-background" ref={inputContainerRef}>
      <AnimatePresence>
        {imagePreview && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative inline-block mb-3"
          >
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="w-20 h-20 object-cover rounded-md border shadow-sm"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full shadow-sm"
              onClick={clearSelectedImage}
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showSuggestions && (
          <motion.div 
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white border rounded-md shadow-lg max-h-[300px] overflow-y-auto z-50 mx-4"
          >
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4" />
              <span>Try asking these:</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {promptSuggestions[mode].map((suggestion, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  className="text-left p-2 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <Input
          type="file"
          onChange={handleImageSelect}
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          id="image-upload"
          aria-label="Upload image"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "shrink-0 transition-colors",
            selectedImage && "border-primary text-primary"
          )}
          disabled={isLoading || (mode === 'generate')}
          title="Upload an image (Ctrl+I)"
        >
          <Image className="w-5 h-5" />
        </Button>
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`${getPlaceholder()} (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K to focus)`}
            className="min-w-0 pr-24"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 text-muted-foreground ideas-button hover:bg-gray-100"
            onClick={toggleSuggestions}
            title="Show suggestions (Esc to close)"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            <span className="text-xs">Ideas</span>
          </Button>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={(!prompt.trim() && !selectedImage) || isLoading}
          className={cn(
            "shrink-0 bg-gradient-to-r from-ai-purple to-ai-blue hover:from-ai-purple/90 hover:to-ai-blue/90 transition-all",
            isProcessing && "animate-pulse"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
      
      <div className="mt-2 text-xs text-muted-foreground flex justify-center space-x-4">
        <span>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K to focus input</span>
        {mode !== 'generate' && (
          <span>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+I to upload image</span>
        )}
        <span>Esc to close suggestions</span>
      </div>
    </div>
  );
};

export default ChatInput;
