import { toast } from "sonner";

// Define available models
export const AVAILABLE_MODELS = {
  TEXT_TO_IMAGE: "stabilityai/stable-diffusion-xl-base-1.0",
  IMAGE_UNDERSTANDING: "Salesforce/blip-image-captioning-large",
  TEXT_UNDERSTANDING: "google/flan-t5-xl", // Upgraded from large to xl for better understanding
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
  private apiKey: string;
  private baseUrl = "https://api-inference.huggingface.co/models";

  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || "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";
  }

  // Generate image from text prompt
  async generateImage(prompt: string): Promise<GeneratedImage> {
    try {
      // Enhance the prompt to get better image generation results
      const enhancedPrompt = this.enhanceImagePrompt(prompt);
      
      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.TEXT_TO_IMAGE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ 
          inputs: enhancedPrompt,
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 50,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Image generation error:", error);
        throw new Error(error.error || "Failed to generate image");
      }

      // The response is a blob (image data)
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return { url };
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
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

  // Generate text response using FLAN-T5
  async generateTextResponse(prompt: string): Promise<string> {
    try {
      // Format prompt to get better conversational results
      const formattedPrompt = this.formatConversationalPrompt(prompt);
      
      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.TEXT_UNDERSTANDING}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ 
          inputs: formattedPrompt,
          parameters: {
            max_length: 500,
            temperature: 0.7, // Add some creativity but not too much
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Text generation error:", error);
        throw new Error(error.error || "Failed to generate text response");
      }

      const data = await response.json();
      let text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
      
      // Post-process the response for better conversation quality
      text = this.postProcessResponse(text);
      
      return text;
    } catch (error) {
      console.error("Error generating text response:", error);
      toast.error("Failed to generate text response. Please try again.");
      throw error;
    }
  }

  // Helper method for formatting prompts
  private formatConversationalPrompt(prompt: string): string {
    // For FLAN-T5, adding instruction prefix helps guide the model
    if (!prompt.toLowerCase().startsWith("question:") && 
        !prompt.toLowerCase().startsWith("respond to")) {
      prompt = `Respond conversationally as a friendly AI assistant: ${prompt}`;
    }
    
    return prompt;
  }
  
  // Post-process response text
  private postProcessResponse(text: string): string {
    // Remove any "Assistant:" or similar prefixes
    text = text.replace(/^(assistant|ai|bot):\s*/i, "");
    
    // If the response is too short, add a follow-up question
    if (text.length < 50 && !text.includes("?")) {
      text += " Is there anything else you'd like to know about this?";
    }
    
    return text;
  }

  // Generate caption for an image
  async generateImageCaption(imageFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch(`${this.baseUrl}/${AVAILABLE_MODELS.IMAGE_UNDERSTANDING}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Image captioning error:", error);
        throw new Error(error.error || "Failed to generate image caption");
      }

      const data = await response.json();
      let caption = Array.isArray(data) ? data[0].generated_text : data.generated_text;
      
      // Enhance caption detail
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

