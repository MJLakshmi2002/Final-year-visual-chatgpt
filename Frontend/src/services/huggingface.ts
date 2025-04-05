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
      this.updateConversationContext(prompt);
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
        throw new Error(error.error || "Failed to generate text response");
      }

      const data = await response.json();
      const text = this.postProcessResponse(data.generated_text, prompt);
      this.updateConversationContext(text, false);
      
      return text;
    } catch (error) {
      console.error("Error generating text response:", error);
      toast.error("Failed to generate text response. Please try again.");
      throw error;
    }
  }
  // Maintain conversation context for better flow
  private updateConversationContext(text: string, isUser: boolean = true) {
    this.conversationContext.push(`${isUser ? "User" : "Assistant"}: ${text}`);
    
    // Keep only the last N messages for context
    if (this.conversationContext.length > this.maxContextLength) {
      this.conversationContext = this.conversationContext.slice(-this.maxContextLength);
    }
  }

  // Helper method for formatting prompts with NLP techniques - now properly used
  private formatConversationalPrompt(prompt: string): string {
    // FLAN-T5 responds well to task-oriented prompts
    let formattedPrompt = "";
    
    // If we have context, include it in the prompt
    if (this.conversationContext.length > 1) { // If there's more than just the current prompt
      const contextHistory = this.conversationContext.slice(0, -1).join("\n"); // Exclude current prompt
      
      // Format for T5 with context
      formattedPrompt = `Given this conversation history:\n${contextHistory}\n\nRespond to the user's request: ${prompt}`;
    } else {
      // For standalone prompts, use task-specific formatting for T5
      formattedPrompt = `Respond to this request: ${prompt}`;
    }
    
    // Apply NLP enhancements based on prompt analysis
    if (this.detectInformalLanguage(prompt)) {
      formattedPrompt += " Keep your response casual and friendly.";
    }
    
    if (this.detectEmotionalContent(prompt)) {
      formattedPrompt += " Show empathy in your response.";
    }
    
    const questionType = this.detectQuestionType(prompt);
    if (questionType === "open_ended") {
      formattedPrompt += " Provide a thoughtful and detailed response.";
    } else if (questionType === "factual") {
      formattedPrompt += " Provide a concise, factual answer.";
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
    text = text.replace(/^(assistant|ai|bot):\s*/i, "");
    
    // Remove any echoed user query that might appear in the response
    const promptWords = originalPrompt.split(/\s+/).filter(word => word.length > 4);
    for (const word of promptWords) {
      // Check if response starts with a phrase containing the prompt
      const startPattern = new RegExp(`^(.*?${word}.*?:)`, 'i');
      text = text.replace(startPattern, '');
    }
    
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
    
    // Add conversation continuity markers for short responses
    if (text.length < 50 && this.detectQuestionType(originalPrompt) !== 'factual') {
      // Check if the text already ends with a question
      if (!text.endsWith("?")) {
        // Add a follow-up question based on the original prompt
        if (this.detectEmotionalContent(originalPrompt)) {
          text += " How do you feel about this?";
        } else if (originalPrompt.toLowerCase().includes("you")) {
          text += " Is there anything specific you'd like to know more about?";
        } else {
          text += " Would you like to know more about this topic?";
        }
      }
    }
    
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