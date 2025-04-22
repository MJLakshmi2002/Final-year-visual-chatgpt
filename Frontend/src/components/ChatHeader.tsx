import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatContext";
import { Trash2, RefreshCw, Info, Settings, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import type { ChatMode } from "./ChatContainer";

interface ChatHeaderProps {
  mode?: ChatMode;
}

const InfoDialog: React.FC = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Info className="w-4 h-4" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>About Visual ChatGPT</DialogTitle>
        <DialogDescription>
          Visual ChatGPT is an advanced AI assistant that combines natural language processing with computer vision capabilities. Here's what you can do:
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <Badge variant="outline">Chat</Badge>
          <p className="text-sm text-muted-foreground">
            Have natural conversations about any topic. The AI understands context and maintains coherent dialogue.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Badge variant="outline">Image Generation</Badge>
          <p className="text-sm text-muted-foreground">
            Request the AI to create images from your text descriptions. Be specific for better results.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Badge variant="outline">Image Analysis</Badge>
          <p className="text-sm text-muted-foreground">
            Upload images for the AI to analyze. It can describe content, identify objects, and answer questions about the image.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Badge variant="outline">Keyboard Shortcuts</Badge>
          <div className="text-sm text-muted-foreground">
            <p>• Ctrl/Cmd + K: Focus chat input</p>
            <p>• Ctrl/Cmd + I: Upload image</p>
            <p>• Esc: Close suggestions</p>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const ChatHeader: React.FC<ChatHeaderProps> = ({ mode = "chat" }) => {
  const { clearChat, regenerateResponse, isLoading, isProcessing, messages } = useChat();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  const handleClearChat = () => {
    if (messages.length > 0) {
      setShowClearConfirm(true);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'generate':
        return 'Image Generation';
      case 'analyze':
        return 'Image Analysis';
      default:
        return 'Chat';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <motion.div 
        className="flex items-center"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="bg-gradient-to-r from-ai-purple to-ai-blue text-white p-2 rounded-md mr-3 shadow-sm">
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-6 h-6"
            animate={{ 
              rotate: isProcessing ? 360 : 0,
            }}
            transition={{ 
              duration: 2,
              repeat: isProcessing ? Infinity : 0,
              ease: "linear"
            }}
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </motion.svg>
        </div>
        <div>
          <h1 className="text-xl font-bold">Visual ChatGPT - {getTitle()}</h1>
          {isProcessing && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Processing your request...
            </p>
          )}
        </div>
      </motion.div>

      <TooltipProvider>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={regenerateResponse}
                disabled={isLoading || isProcessing || messages.length === 0}
                className="w-9 h-9"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading || isProcessing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Regenerate last response</p>
            </TooltipContent>
          </Tooltip>

          <AnimatePresence>
            {showClearConfirm ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-2"
              >
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={clearChat}
                  className="w-9 h-9"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowClearConfirm(false)}
                  className="w-9 h-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClearChat}
                    disabled={messages.length === 0}
                    className="w-9 h-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear conversation</p>
                </TooltipContent>
              </Tooltip>
            )}
          </AnimatePresence>

          <Tooltip>
            <TooltipTrigger asChild>
              <InfoDialog />
            </TooltipTrigger>
            <TooltipContent>
              <p>About & Help</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </motion.div>
  );
};

export default ChatHeader;
