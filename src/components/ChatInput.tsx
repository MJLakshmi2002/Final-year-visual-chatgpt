import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/context/ChatContext";
import { Send, Image, X, Lightbulb } from "lucide-react";

const ChatInput: React.FC = () => {
  const { sendMessage, isLoading } = useChat();
  const [prompt, setPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
  const promptSuggestions = [
    "Generate a fantasy landscape with mountains and a castle",
    "What are the key benefits of artificial intelligence?",
    "Explain quantum computing in simple terms",
    "Create an image of an astronaut riding a horse",
    "How does visual recognition technology work?",
    "What's your opinion on climate change?",
    "Tell me a joke about robots",
    "How are you feeling today?",
    "What makes a good conversation?",
    "If you could travel anywhere, where would you go?"
  ];

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
  };
  
  const toggleSuggestions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSuggestions(!showSuggestions);
  };

  return (
    <div className="p-4 border-t bg-background" ref={inputContainerRef}>
      {imagePreview && (
        <div className="relative inline-block mb-3">
          <img 
            src={imagePreview} 
            alt="Selected" 
            className="w-20 h-20 object-cover rounded-md border"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full"
            onClick={clearSelectedImage}
            aria-label="Remove image"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      {showSuggestions && (
        <div 
          ref={suggestionsRef} 
          className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-background border rounded-md shadow-lg max-h-[300px] overflow-y-auto z-10 mx-4"
        >
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span>Try asking these:</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {promptSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="text-left p-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <Input
          type="file"
          onChange={handleImageSelect}
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
          disabled={isLoading}
          title="Upload an image"
        >
          <Image className="w-5 h-5" />
        </Button>
        <div className="relative flex-1">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything or request an image generation..."
            className="min-w-0"
            disabled={isLoading}
          />
          {prompt.length === 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 text-muted-foreground ideas-button"
              onClick={toggleSuggestions}
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              <span className="text-xs">Ideas</span>
            </Button>
          )}
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={(!prompt.trim() && !selectedImage) || isLoading}
          className="shrink-0 bg-gradient-to-r from-ai-purple to-ai-blue hover:from-ai-purple/90 hover:to-ai-blue/90 transition-all"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
