import { toast } from "sonner";

// Define available models
export const AVAILABLE_MODELS = {
  TEXT_TO_IMAGE: "stabilityai/stable-diffusion-xl-base-1.0",
  IMAGE_UNDERSTANDING: "Salesforce/blip-image-captioning-large",
  TEXT_UNDERSTANDING: "google/flan-t5-base",
  TEXT_TO_TEXT: "google/flan-t5-base",
};

// Define types
export interface GeneratedImage {
  url: string;
}

export interface TextResponse {
  generated_text: string;
}

export interface ImageCaptionResponse {
  caption: string;
}

class HuggingFaceService {
  private baseUrl = "http://localhost:3001"; // Update to your backend URL
  private conversationContext: string[] = [];
  private maxContextLength = 5;

  // Generate image from text prompt
  async generateImage(prompt: string): Promise<GeneratedImage> {
    try {
      const enhancedPrompt = this.enhanceImagePrompt(prompt);
      
      const response = await fetch(`${this.baseUrl}/api/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Image generation error:", error);
        throw new Error(error.error || error.details || "Failed to generate image");
      }

      const data = await response.json();
      // Construct the full URL for the image
      const imageUrl = `${this.baseUrl}${data.imageUrl}`;
      return { url: imageUrl };
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image. Please try again.");
      throw error;
    }
  }

  // Helper method to enhance image prompts
  private enhanceImagePrompt(prompt: string): string {
    // Add style details and quality indicators if they're not already present
    if (!prompt.toLowerCase().includes("high quality") && 
        !prompt.toLowerCase().includes("detailed") &&
        !prompt.toLowerCase().includes("4k") &&
        !prompt.toLowerCase().includes("hd")) {
      prompt += ", high quality, detailed, 4K";
    }
    
    return prompt;
  }

  // Generate text response using FLAN-T5 with NLP enhancements
  async generateTextResponse(prompt: string): Promise<string> {
    try {
      const formattedPrompt = this.formatConversationalPrompt(prompt);
      
      const response = await fetch(`${this.baseUrl}/api/generate-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: formattedPrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Text generation error:", error);
        
        // Handle specific error cases
        if (response.status === 401) {
          toast.error("API authentication failed. Please check API key configuration.");
          throw new Error("API authentication failed");
        }
        
        if (response.status === 503) {
          toast.warning("Model is currently loading. Please try again in a moment.");
          throw new Error("Model is loading");
        }
        
        if (error.error) {
          toast.error(error.error);
          throw new Error(error.error);
        }
        
        throw new Error("Failed to generate text response");
      }

      const data = await response.json();
      const text = this.postProcessResponse(data.generated_text, prompt);
      this.updateConversationContext(text, false);
      
      return text;
    } catch (error) {
      console.error("Error generating text response:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to generate text response. Please try again.");
      }
      throw error;
    }
  }
  // Maintain conversation context for better flow
  private updateConversationContext(text: string, isUser: boolean = true) {
    // Clean up the text before adding to context
    const cleanedText = text.trim()
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/^(User:|Assistant:)\s*/i, ''); // Remove any existing prefixes
    
    // Add role prefix and cleaned text
    this.conversationContext.push(`${isUser ? "User" : "Assistant"}: ${cleanedText}`);
    
    // Keep only the last N messages for context, but ensure we maintain conversation flow
    if (this.conversationContext.length > this.maxContextLength) {
      // Keep the first message (for context) and the last N-1 messages
      const firstMessage = this.conversationContext[0];
      const recentMessages = this.conversationContext.slice(-(this.maxContextLength - 1));
      this.conversationContext = [firstMessage, ...recentMessages];
    }
  }

  // Helper method for formatting prompts with NLP techniques - now properly used
  private formatConversationalPrompt(prompt: string): string {
    let formattedPrompt = "";
    
    // If we have context, include it in the prompt but with better structure
    if (this.conversationContext.length > 1) {
      const contextHistory = this.conversationContext
        .slice(-3) // Only use last 3 messages for more focused context
        .join("\n");
      
      formattedPrompt = `Given this conversation history:\n${contextHistory}\n\nRespond naturally and informatively to: ${prompt}`;
    } else {
      formattedPrompt = `Respond naturally and informatively to: ${prompt}`;
    }
    
    // Add task-specific guidance without being too prescriptive
    if (prompt.toLowerCase().includes("explain") || prompt.toLowerCase().includes("description")) {
      formattedPrompt += "\nProvide a clear explanation with examples where appropriate.";
    }
    
    return formattedPrompt;
  }
  
  // NLP helper for detecting informal language
  private detectInformalLanguage(text: string): boolean {
    const informalMarkers = ['hey', 'hi', 'hello', 'lol', 'haha', 'cool', 'awesome', 'yeah', 'yep', 'nope'];
    return informalMarkers.some(marker => text.toLowerCase().includes(marker));
  }
  
  // NLP helper for detecting emotional content
  private detectEmotionalContent(text: string): boolean {
    const emotionalMarkers = ['feel', 'happy', 'sad', 'angry', 'upset', 'excited', 'worried', 'anxious', 'love', 'hate'];
    return emotionalMarkers.some(marker => text.toLowerCase().includes(marker));
  }
  
  // NLP helper for classifying question types
  private detectQuestionType(text: string): 'open_ended' | 'factual' | 'none' {
    // Check if it's a question
    if (!text.includes('?')) return 'none';
    
    // Detect open-ended questions
    const openEndedMarkers = ['why', 'how', 'what do you think', 'opinion', 'feel about'];
    if (openEndedMarkers.some(marker => text.toLowerCase().includes(marker))) {
      return 'open_ended';
    }
    
    // Default to factual for other question types
    return 'factual';
  }
  
  // Post-process response text with NLP enhancements
  private postProcessResponse(text: string, originalPrompt: string): string {
    // Catch empty responses
    if (!text || text.trim() === "") {
      return "I'm not sure how to respond to that. Could you please rephrase your question?";
    }
    
    // Remove any assistant/AI prefixes that might have been generated
    text = text.replace(/^(assistant|ai|bot|1\.|2\.|3\.|4\.|5\.|6\.)\s*/gi, "");
    text = text.replace(/^(make sure to:|based on this conversation:)/gi, "");
    
    // Remove any enumerated lists that might have been generated from the prompt
    text = text.replace(/^\d+\.\s*(address|provide|be|break|use|explain)/gim, "");
    
    // Clean up any remaining instruction-like text
    text = text.replace(/^(I will |Let me |Here's how to |First, |Next, )/gi, "");
    
    // Ensure text has proper sentence structure
    if (!text.match(/[.!?]$/)) {
      text += ".";
    }
    
    // Make sure first letter is capitalized
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    // Improve response formatting
    text = text.replace(/\n{3,}/g, "\n\n"); // Remove excessive line breaks
    
    return text;
  }

  // Generate caption for an image
  async generateImageCaption(imageFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(`${this.baseUrl}/api/generate-caption`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Image captioning error:", error);
        throw new Error(error.error || "Failed to generate image caption");
      }

      const data = await response.json();
      let caption = data.caption;
      
      if (caption.length < 15) {
        caption += " (Note: Limited detail detected in this image)";
      }
      
      return caption;
    } catch (error) {
      console.error("Error generating image caption:", error);
      toast.error("Failed to analyze image. Please try again.");
      throw error;
    }
  }

  }


export const huggingFaceService = new HuggingFaceService();