import express, { Request, Response, RequestHandler, NextFunction } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Buffer } from "buffer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Define API endpoints for each HuggingFace model
const HF_API_BASE_URL = "https://api-inference.huggingface.co/models";
const HF_API_KEY = process.env.HF_API_KEY || "";

// Models from the huggingface.ts file
const MODELS = {
  TEXT_TO_IMAGE: "stabilityai/stable-diffusion-xl-base-1.0",
  IMAGE_UNDERSTANDING: "Salesforce/blip-image-captioning-large",
  TEXT_UNDERSTANDING: "google/flan-t5-base",
  TEXT_TO_TEXT: "google/flan-t5-base",
};

// Define types for request parameters
interface GenerateTextRequest {
  prompt: string;
}

interface GenerateImageRequest {
  prompt: string;
}

// Define types for API responses
interface HuggingFaceTextResponse {
  generated_text: string;
}

interface HuggingFaceImageResponse {
  imageUrl: string;
}

interface HuggingFaceCaptionResponse {
  generated_text: string;
}

// Define custom request handler type
type CustomRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Legacy endpoint (keep for backward compatibility)
app.post("/generate", async (req: Request<{}, {}, GenerateTextRequest>, res: Response) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(`${HF_API_BASE_URL}/google/flan-t5-base`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 100,
        },
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Text generation endpoint
const generateTextHandler: CustomRequestHandler = async (req, res, next) => {
  try {
    const { prompt } = req.body as GenerateTextRequest;
    
    if (!prompt) {
      res.status(400).json({ error: "No prompt provided" });
      return;
    }

    if (!HF_API_KEY) {
      res.status(500).json({ error: "HuggingFace API key not configured" });
      return;
    }

    console.log("Sending text generation request to HuggingFace API with prompt:", prompt);

    const response = await fetch(`${HF_API_BASE_URL}/${MODELS.TEXT_TO_TEXT}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 150,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("HuggingFace API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Check for specific error cases
      if (response.status === 401) {
        res.status(401).json({ 
          error: "Invalid or expired API key",
          details: errorData 
        });
        return;
      }
      
      if (response.status === 503) {
        res.status(503).json({ 
          error: "Model is currently loading",
          details: errorData 
        });
        return;
      }
      
      res.status(response.status).json({ 
        error: `Error from HuggingFace API: ${response.statusText}`, 
        details: errorData 
      });
      return;
    }

    const data = await response.json();
    
    // Validate response format
    if (!Array.isArray(data) || !data[0]?.generated_text) {
      console.error("Unexpected API response format:", data);
      res.status(500).json({ 
        error: "Invalid response format from API",
        details: data
      });
      return;
    }

    console.log("Successfully generated text response");
    res.json({ generated_text: data[0].generated_text });
  } catch (err) {
    console.error("Error in text generation handler:", err);
    res.status(500).json({ 
      error: "Internal server error",
      message: err instanceof Error ? err.message : "Unknown error occurred"
    });
  }
};

app.post("/api/generate-text", generateTextHandler);

// Image generation endpoint
const generateImageHandler: CustomRequestHandler = async (req, res, next) => {
  try {
    const { prompt } = req.body as GenerateImageRequest;
    
    if (!prompt) {
      res.status(400).json({ error: "No prompt provided" });
      return;
    }

    if (!HF_API_KEY) {
      res.status(500).json({ error: "HuggingFace API key not configured" });
      return;
    }

    console.log("Sending request to HuggingFace API with prompt:", prompt);

    const response = await fetch(`${HF_API_BASE_URL}/${MODELS.TEXT_TO_IMAGE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("HuggingFace API error:", errorData);
      res.status(response.status).json({ 
        error: "Error from HuggingFace API", 
        details: errorData 
      });
      return;
    }

    // Check if the response is JSON (error) or binary (image)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const jsonResponse = await response.json();
      console.error("Unexpected JSON response:", jsonResponse);
      res.status(500).json({ 
        error: "Unexpected response format from API",
        details: jsonResponse
      });
      return;
    }

    // HuggingFace returns the image as binary data
    const imageBuffer = await response.arrayBuffer().then(buffer => Buffer.from(buffer));
    
    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save the image to disk with a unique filename
    const timestamp = Date.now();
    const filename = `generated-${timestamp}.png`;
    const imagePath = path.join(uploadsDir, filename);
    fs.writeFileSync(imagePath, imageBuffer);
    
    // Return URL that can be accessed from the frontend
    // Make sure this matches your static file serving configuration
    const imageUrl = `/api/uploads/${filename}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ 
      error: "Internal server error", 
      details: err instanceof Error ? err.message : String(err) 
    });
  }
};

app.post("/api/generate-image", generateImageHandler);

// Image captioning endpoint
const generateCaptionHandler: CustomRequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    
    const response = await fetch(`${HF_API_BASE_URL}/${MODELS.IMAGE_UNDERSTANDING}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("HuggingFace API error:", errorData);
      res.status(response.status).json({ 
        error: "Error from HuggingFace API", 
        details: errorData 
      });
      return;
    }

    const data = await response.json() as HuggingFaceCaptionResponse[];
    res.json({ caption: data[0].generated_text });
    
    // Clean up the uploaded file
    fs.unlinkSync(imagePath);
  } catch (err) {
    console.error("Error generating caption:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.post("/api/generate-caption", upload.single("image"), generateCaptionHandler);

// Serve static files from the uploads directory
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Add error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});