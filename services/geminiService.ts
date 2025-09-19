import { GoogleGenAI, Modality, Chat } from "@google/genai";
import type { Message, AIModel, GroundingChunk, ChatSession } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const defaultTitleModel = 'gemini-2.5-flash';

const systemInstruction = `You are 'Innovate', a deeply curious and creative AI partner. Your primary goal is to be a brilliant collaborator, helping users explore ideas in a way that feels like a natural, insightful, and engaging conversation with an expert human.

**YOUR UNBREAKABLE CORE DIRECTIVES:**

1.  **ALWAYS ASK QUESTIONS:** This is your most critical function. You must **NEVER** end a response without asking 2-3 insightful, open-ended follow-up questions. This is non-negotiable and is the primary way you will drive the conversation forward and help the user think more deeply. These questions must be directly inspired by the user's prompt and your response.

2.  **STRUCTURE IS MANDATORY:** Every response you provide *must* be well-organized and easy to read.
    *   **Use Paragraphs:** Structure your responses into clear, distinct paragraphs. ALWAYS use double line breaks (\\n\\n) between paragraphs. Do not write long, unbroken walls of text.
    *   **Use Markdown:** Effectively use Markdown for clarity: headings (\`## Heading\`), bold text (\`**Bold**\`), and bulleted lists (\`* Item\`).
    *   **Use Tables:** When comparing ideas or presenting structured data, use Markdown tables to make the information clear and actionable.

3.  **DELIVER COMPREHENSIVE DETAIL:**
    *   Provide detailed, expert-level responses that go far beyond a simple surface-level answer. Your goal is to deliver a comprehensive analysis, complete with essential background context, exploration of nuances, potential implications, and diverse perspectives.
    *   Despite the depth, you **must** explain everything in simple, accessible, and easy-to-understand language. Avoid jargon. Your goal is to make complex topics feel intuitive and actionable.

4.  **MAINTAIN PERSONA:** In every single message, you must maintain your persona as 'Innovate'—curious, collaborative, and human-like. Your tone should be warm and encouraging.

---

**CONVERSATIONAL STYLE GUIDE:**

*   **Act as a True Thought Partner:** Don't just answer questions. Anticipate the user's needs, challenge their assumptions with respectful questions, and help them connect disparate ideas to unlock new insights.
*   **Use Analogies:** Use analogies and real-world examples to make complex topics feel relatable and easy to grasp.

---

**SPECIALIZED PROTOCOLS:**

*   **SYNTHESIZE & ADD UNIQUE VALUE:** Your internet access is your most powerful tool. **Do not just report facts from a single source.** Proactively use your search tool to gather information from multiple web pages. Your primary task is to **synthesize** these findings, identify the key themes, and provide a unique, comprehensive analysis that is more valuable than any single source. Always cite your sources.
*   **Health & Wellness:** You can analyze health data to spot trends and help users formulate questions for their doctor. For general advice, suggest safe, common-sense practices. **Always end health-related responses with this disclaimer:** "Remember, I am an AI partner, not a medical professional. This information is for educational purposes. Please consult a qualified healthcare professional for any medical advice."`;


// Helper to convert the application's message format to the Gemini API's `Content` format.
const formatHistoryForChat = (history: Message[]): any[] => {
  const chatHistory = history.reduce((acc, msg) => {
    // Filter out system messages and messages without content.
    if ((msg.sender !== 'user' && msg.sender !== 'ai') || (!msg.text && !msg.file)) {
      return acc;
    }

    const parts: any[] = [];
    
    // Handle file attachments for supported MIME types.
    if (msg.file) {
      const dataParts = msg.file.dataUrl.split(',');
      if (dataParts.length === 2) {
          parts.push({
            inlineData: {
              mimeType: msg.file.type,
              data: dataParts[1],
            }
          });
      }
    }
    
    // Always include the text part if it exists.
    if (msg.text && msg.text.trim()) {
      parts.push({ text: msg.text });
    }

    // Only add the message to history if it has valid parts.
    if (parts.length > 0) {
        acc.push({
            role: msg.sender === 'user' ? "user" : "model",
            parts: parts
        });
    }

    return acc;
  }, [] as any[]);

  // The Gemini API requires a conversation history to start with a user message.
  const firstUserMessageIndex = chatHistory.findIndex(msg => msg.role === 'user');
  if (firstUserMessageIndex > -1) {
    return chatHistory.slice(firstUserMessageIndex);
  }
  return [];
};


export function createChat(modelId: AIModel['id'], history: Message[]): Chat {
    const config: any = {
        systemInstruction: systemInstruction,
    };
    
    const chat = ai.chats.create({
        model: modelId,
        config: config,
        history: formatHistoryForChat(history)
    });
    return chat;
}

export async function generateChatResponseStream(
  chat: Chat,
  prompt: string,
  modelId: AIModel['id'],
  file?: Message['file']
): Promise<AsyncGenerator<{ text: string; groundingChunks?: any[] }>> {
    const parts: any[] = [];

    if (file) {
        // Removed the file type whitelist. The Gemini API will handle unsupported types.
        const dataParts = file.dataUrl.split(',');
        if (dataParts.length === 2) {
            parts.push({
                inlineData: { mimeType: file.type, data: dataParts[1] }
            });
        }
    }

    if (prompt && prompt.trim()) {
        parts.push({ text: prompt });
    }

    if (parts.length === 0) {
        return (async function*() {
            yield { text: "I see you've attached a file. Please tell me what you'd like me to do with it, or ask me a question." };
        })();
    }
    
    const config: any = {};
    // For text-only prompts with the text model, provide the Google Search tool.
    // The model will decide whether to use it for grounding.
    if (modelId === 'gemini-2.5-flash' && prompt && prompt.trim() && !file) {
        config.tools = [{googleSearch: {}}];
    }
    
    const stream = await chat.sendMessageStream({ message: parts, config });

    return (async function*() {
      let fullText = '';
      for await (const chunk of stream) {
          // The API may send empty text chunks while processing, so we filter those out.
          // We yield every chunk, even if empty, but only append non-empty text to our full response.
          // This ensures grounding metadata arrives promptly.
          const textChunk = chunk.text;
          if (textChunk) {
              fullText += textChunk;
          }
          yield {
              text: fullText, // Always send the full accumulated text to ensure smooth UI rendering.
              groundingChunks: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
          };
      }
    })();
}

export async function refineVisualPrompt(prompt: string): Promise<string> {
    const refinementPrompt = `You are a world-class AI prompt engineer, acting as an expert photographer and art director. Your mission is to rewrite a user's simple idea into a single, breathtakingly detailed paragraph for a hyper-realistic image generation model.

**MANDATORY PROCESS:**
1.  **Deconstruct the Idea:** Identify the core subject, setting, and mood.
2.  **Inject Hyper-Realism:** Add intricate details. Specify textures (e.g., "rough-hewn wood," "gleaming chrome," "dew-kissed petals"), materials, and atmospheric effects (e.g., "subtle heat haze," "wisps of morning fog," "lens flare from the setting sun").
3.  **Define Cinematic Lighting:** This is critical. Use professional terms. Examples: "dramatic Rembrandt lighting with deep shadows," "soft, ethereal light filtering through a dense canopy," "the vibrant, electric glow of neon signs on wet asphalt," "warm, nostalgic golden hour backlighting."
4.  **Master the Composition:** Specify the camera shot and lens. Examples: "epic, ultra-wide-angle landscape shot with a deep depth of field," "intimate, telephoto lens portrait with a beautifully blurred bokeh background," "dynamic, low-angle action shot with motion blur," "a perfectly composed shot using the rule of thirds."
5.  **Set the Style:** Emphasize the highest quality. Use keywords like "hyper-realistic," "photorealistic," "cinematic," "8K resolution," "professional photography," "Unreal Engine 5 render."
6.  **Synthesize:** Weave all elements into a single, fluid, and evocative descriptive paragraph. **Do not use lists or bullet points.**

**UNBREAKABLE RULES:**
*   Respond ONLY with the final, enhanced prompt paragraph.
*   Your response must be a single block of text.
*   Do NOT include any conversational text, explanations, or labels like "Enhanced Prompt:".

**User's Idea:** "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: refinementPrompt,
            config: {
                // Use a zero thinking budget for the fastest possible refinement.
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        // Clean up the response to ensure it's just the prompt.
        const refined = response.text.replace(/"/g, '').trim();
        // If the model fails or returns an empty string, fall back to the original prompt.
        return refined || prompt; 
    } catch (error) {
        console.error("Error refining visual prompt, falling back to original:", error);
        // On error, just return the original prompt to avoid breaking the flow.
        return prompt;
    }
}

export async function refineVideoPrompt(prompt: string): Promise<string> {
    const refinementPrompt = `You are an elite AI film director and cinematographer, creating a shot description for the 'veo-2.0-generate-001' video model. Your task is to transform a user's simple idea into a single, rich, and highly detailed paragraph that reads like a professional shot list from a major motion picture.

**MANDATORY PROCESS:**
1.  **Scene & Action:** Clearly define the subject and the specific action occurring in the shot.
2.  **Environment:** Describe the setting with vivid sensory details. What does it look, sound, and feel like?
3.  **Expert Cinematography:** This is the most critical step.
    *   **Camera Shot:** Specify the shot type (e.g., Extreme Wide Shot, Cowboy Shot, Medium Close-Up, Macro Shot).
    *   **Camera Movement:** Define a precise camera movement. Examples: "a slow, dramatic dolly push-in," "a sweeping crane shot revealing the landscape," "a fast-paced tracking shot following the action," "an elegant aerial drone shot orbiting the subject."
    *   **Lens & Style:** Mention lens characteristics (e.g., "shot on a wide-angle anamorphic lens creating cinematic flares," "telephoto lens compressing the background"). Define the visual style (e.g., "hyper-realistic," "found-footage style," "dreamlike and ethereal").
4.  **Professional Lighting:** Describe the lighting in cinematic terms (e.g., "moody chiaroscuro creating high contrast," "soft, diffused magic hour light," "harsh, direct overhead sunlight").
5.  **Color Grading:** Briefly mention the color palette (e.g., "a modern teal and orange color grade," "a desaturated, gritty color palette," "vibrant, saturated colors").
6.  **Synthesize:** Weave all elements into one cohesive, compelling paragraph. **Do not use lists or bullet points.**

**UNBREAKABLE RULES:**
*   Respond ONLY with the final, enhanced prompt paragraph.
*   Do NOT add any conversational text, explanations, or labels like "Enhanced Prompt:".

**User's Idea:** "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: refinementPrompt,
            config: {
                // Use a zero thinking budget for the fastest possible refinement.
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        const refined = response.text.replace(/"/g, '').trim();
        return refined || prompt; 
    } catch (error) {
        console.error("Error refining video prompt, falling back to original:", error);
        return prompt;
    }
}

export async function refineAnimationPrompt(prompt: string): Promise<string> {
    const refinementPrompt = `You are an expert animator and visual effects artist, creating a prompt for an AI that generates a video from a still image. Your task is to take a user's simple animation instruction and elevate it into a single, rich, descriptive paragraph.

**Your Process:**
1.  **Analyze the Action:** What is the core motion requested? (e.g., rain, snow, zoom, pan, character movement).
2.  **Describe the Motion:** Detail the animation. Is the rain gentle or a downpour? Is the pan slow or fast?
3.  **Add Environmental Effects:** Describe how the animation affects the scene. Rain creates wet surfaces and ripples. Wind rustles leaves.
4.  **Consider Camera Movement:** Suggest a subtle camera move that enhances the animation (e.g., "a slow dolly forward," "a gentle pan to the right").
5.  **Lighting & Atmosphere:** How does the animation change the mood? Does it become darker, brighter, more magical?
6.  **Weave it Together:** Combine these into a single, compelling descriptive paragraph. Do not use lists or bullet points.

**Response Requirements:**
*   Respond ONLY with the final, enhanced prompt paragraph.
*   Do NOT add any conversational text, explanations, or labels like "Enhanced Prompt:".

**User's Idea:** "${prompt}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: refinementPrompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        const refined = response.text.replace(/"/g, '').trim();
        return refined || prompt; 
    } catch (error) {
        console.error("Error refining animation prompt, falling back to original:", error);
        return prompt;
    }
}

export async function generateTitle(prompt: string): Promise<string> {
    const titlePrompt = `Generate a concise, 2-4 word title for the following user prompt. Just return the title and nothing else.\n\nPROMPT: "${prompt}"`;
    const response = await ai.models.generateContent({
        model: defaultTitleModel,
        contents: titlePrompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 },
        }
    });
    return response.text.replace(/"/g, '').trim();
}

export async function generateImage(prompt: string, modelId: AIModel['id']): Promise<string> {
  const response = await ai.models.generateImages({
    model: modelId,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } else {
    throw new Error("Image generation failed or returned no images.");
  }
}

export async function editImage(prompt: string, file: Message['file']): Promise<{ imageUrl: string; text: string }> {
  if (!file || !file.dataUrl) {
    throw new Error("An image file is required for editing.");
  }

  const dataParts = file.dataUrl.split(',');
  if (dataParts.length !== 2) {
    throw new Error("Invalid file data URL format.");
  }
  const base64ImageData = dataParts[1];

  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: file.type,
    },
  };

  const textPart = {
    text: prompt,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [imagePart, textPart],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let imageUrl = '';
  let text = '';

  if (response.candidates && response.candidates.length > 0) {
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        text += part.text + '\n';
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("Image editing failed to produce an image. The model may have refused the request.");
  }

  return { imageUrl, text: text.trim() };
}

export async function generateVideo(prompt: string, modelId: AIModel['id'], file?: Message['file']) {
    const request: any = {
        model: modelId,
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            durationSecs: 16,
        }
    };

    if (file && file.type.startsWith('image/')) {
        const dataParts = file.dataUrl.split(',');
        if (dataParts.length === 2) {
            request.image = {
                imageBytes: dataParts[1],
                mimeType: file.type
            };
        }
    }

    const operation = await ai.models.generateVideos(request);
    return operation;
}

export async function getVideosOperation(operation: any) {
    const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
    return updatedOperation;
}