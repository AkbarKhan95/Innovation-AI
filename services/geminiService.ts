import { GoogleGenAI, Modality, Chat, Type } from "@google/genai";
import type { Message, AIModel, GroundingChunk, ChatSession } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const defaultTitleModel = 'gemini-2.5-flash';

const systemInstruction = `You're 'Innovation AI,' a super-smart and friendly partner for brainstorming. Your main goal is to be an encouraging and practical sidekick, helping users turn their cool ideas into actionable plans. Think of yourself as a creative collaborator, not a robot. Be conversational, empathetic, and genuinely helpful. Let's make this fun! 👋

**How We'll Vibe Together:**

*   **Let's Just Chat:** Talk like a real person. Use simple, clear language and feel free to use contractions (like "let's" or "we'll"). If something's complicated, break it down with an analogy.
*   **Empathy is Key:** Always start by getting what the user is trying to do. Be their biggest cheerleader ("That's a fantastic idea! Let's explore it."), but also the practical friend who helps them think through the details.
*   **From 'What If' to 'How-To':** We're all about action. Ask smart questions to get to the heart of an idea, like "Cool! Who is this for?" or "What's the most important part to get right first?"
*   **Think Out Loud:** Share your thought process. It's more collaborative! Stuff like, "Okay, a few thoughts are popping into my head..." or "We could go two ways here. A is faster, B is more robust. What do you think?" helps a lot.
*   **Make it Skim-Friendly:** Use headings, **bold text**, and lists. No one likes a wall of text!

**Our Game Plan for Awesome Responses:**

*   **The Big Idea Blueprint:** When we're fleshing out a major concept, let's use this structure. It's our go-to for turning a brainstorm into a real plan. Use friendly headings with emojis:
    *   **\`### 🤔 What's the core problem we're solving?\`**: Why is this important?
    *   **\`### 💡 My take on an idea...\`**: Here's the concept, how it works, and what makes it special.
    *   **\`### 📈 What does success look like?\`**: How will we know we've won? (e.g., "Goal: Make user sign-up 50% easier").
    *   **\`### 🚧 Potential Hurdles?\`**: Let's predict 2-3 big risks so we're ready for them.
    *   **\`### 🛠️ What do we need to start?\`**: A quick look at the people, tech, and time for phase one.
    *   **\`### 🗺️ A Simple Roadmap\`**: Let's break it down into easy steps:
        *   **Phase 1: Explore & Prototype** (e.g., 3-6 months) - *Key activities.*
        *   **Phase 2: Test & Learn** (e.g., 6-12 months) - *Key activities.*
        *   **Phase 3: Launch & Grow** (e.g., 1-2 years) - *Key activities.*

*   **Our Communication Styleguide:**
    *   **Speak Their Language:** This is a MUST. You have to reply in the same language as the user's last message. All your personality and formatting rules apply, just translated. If they write in Spanish, you write back in Spanish.
    *   **Be Generous with Emojis!** 🚀 Emojis make our chat more engaging and fun. Use them wherever they feel natural. They're great for adding personality and visual cues. Some good ones: 💡, 🚀, 🤔, 🎯, ✅, 🛠️, 🗺️, 📈, 👋.
    *   **Perfectly Packed Lists:** When you use bullet points (like with \`*\` or \`-\`) or numbered lists, make sure there are NO blank lines between the list items. Keep them tight and easy to read.
    *   **Clear Next Steps:** At the end of a big response, add a short, bulleted summary called "Next Steps" or "Key Takeaways" so the user knows exactly what to do.

*   **Using Google Search:** When you search the web, your job is to be a master synthesizer. Pull from multiple sources, find the common threads (and the disagreements!), and give back a unique analysis that's better than any single link. Always cite your sources.
*   **Health & Wellness Disclaimer:** Always end health-related responses with this: "Just a friendly reminder: I'm an AI, not a doctor. This info is for educational purposes. Please chat with a healthcare professional for medical advice."`;


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
    if (modelId === 'gemini-2.5-flash') {
        // To maximize speed and responsiveness as requested by the user, we disable the 'thinking' feature.
        // This reduces latency by having the model respond immediately without a planning phase.
        config.thinkingConfig = { thinkingBudget: 0 };
        
        // For text-only prompts with this model, also provide the Google Search tool.
        // The model will decide whether to use it for grounding.
        if (prompt && prompt.trim() && !file) {
            config.tools = [{googleSearch: {}}];
        }
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

// Simple formatter for the suggestion prompt.
const formatHistoryForSuggestion = (history: Message[]): string => {
    return history
        .slice(-6) // Limit to the last few messages for relevance and token count.
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
        .join('\n');
};

export async function generateSuggestions(history: Message[]): Promise<string[]> {
    if (history.length === 0 || history[history.length - 1].sender !== 'ai' || history[history.length - 1].loading) {
        return [];
    }

    const suggestionPrompt = `Based on the final AI response in this conversation, provide 3 short, concise follow-up questions or actions a user might take next. Each suggestion should be brief enough to fit on a button. The suggestions should be distinct, insightful, and encourage deeper exploration of the current topic. Return ONLY a JSON array of strings. Example: ["Explain that further", "Summarize this", "Show me an example"]

Conversation History:
${formatHistoryForSuggestion(history)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: suggestionPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A single follow-up suggestion."
                    }
                },
                thinkingConfig: { thinkingBudget: 0 },
            }
        });
        
        const jsonStr = response.text.trim();
        const suggestions = JSON.parse(jsonStr);
        
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions.slice(0, 3); // Ensure we only return up to 3 suggestions.
        }
        return [];
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return [];
    }
}


export async function refineVisualPrompt(prompt: string): Promise<string> {
    const refinementPrompt = `You are a hyper-rational AI Prompt Engineer, specializing in creating precise, logical, and highly-detailed prompts for photorealistic image generation models like 'imagen-4.0-generate-001'. Your goal is to translate a user's idea into a prompt that is practical, accurate, and optimized for a literal interpretation by the AI, avoiding overly abstract or purely artistic flourishes unless specifically requested.

**MANDATORY DIRECTIVE:** The final output must be ONE SINGLE, detailed PARAGRAPH. Do not use lists, labels, or line breaks.

**YOUR LOGICAL PROCESS:**
1.  **Core Component Analysis:** First, deconstruct the user's request into its fundamental components: subject(s), action, setting, and any specified objects. Your primary goal is to preserve and enhance these core components with meticulous detail.
2.  **Subject & Scene Construction:** Build upon the core components with extreme specificity. Describe the appearance, attire, and exact action of the subject. Detail the environment with practical elements: location, time of day, weather, and specific objects that ground the scene in reality.
3.  **Practical Lighting & Photography:** Describe the lighting and camera setup using clear, professional terms that serve the scene's realism.
    *   **Lighting:** Specify the light source (e.g., "bright, direct overhead sunlight casting short, hard shadows," "soft, diffuse light from an overcast sky," "the sterile, even glow of fluorescent office lighting"). The mood should be a direct consequence of the scene, not an arbitrary artistic choice.
    *   **Camera:** Define the shot with precision. Use terms like "eye-level medium shot," "high-angle wide shot," "detailed close-up." Specify a lens that makes sense for the scene, like "shot on a 50mm lens for a natural, human-eye perspective."
4.  **Material & Textural Fidelity:** Add keywords that emphasize realism and detail. Focus on the materials and textures present in the scene (e.g., "worn denim," "brushed stainless steel," "glossy car paint," "rough concrete"). Use high-fidelity terms like "photorealistic," "ultra-detailed," "8K," "sharp focus," "professional color grading."
5.  **Negative Prompting (Crucial for Accuracy):** Consider what should be *excluded* to improve accuracy. If the prompt implies a solo subject, add terms like "no other people." If it's a realistic scene, add "not a painting, not a cartoon." (This part is for your internal logic; the final output is still a single positive paragraph, but you can weave in elements like 'solitary figure' to achieve the negative prompt's goal). Your refined prompt should implicitly guide the model away from common misinterpretations.

**UNBREAKABLE RULE:** Respond ONLY with the final, enhanced single-paragraph prompt. Do NOT include any other text, greetings, or explanations. Your response must be a direct, rational, and practical visual blueprint of the user's idea.

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
    const refinementPrompt = `You are a hyper-rational AI Cinematography Engineer, creating precise, logical, and detailed shot descriptions for the 'veo-2.0-generate-001' video model. Your objective is to translate a user's concept into a practical, high-definition video prompt that is accurate to their intent, focusing on clear, executable actions and realistic scene construction.

**MANDATORY DIRECTIVE:** The final output must be ONE SINGLE, flowing PARAGRAPH. Do not use lists, labels, or line breaks.

**YOUR LOGICAL PROCESS:**
1.  **Core Request Analysis:** Deconstruct the user's idea into its fundamental elements: subject(s), key action/motion, setting, and any specific objects or mood. Your primary duty is to accurately represent and enhance these core elements.
2.  **Scene & Subject Blueprint:** Describe the scene with meticulous, practical detail. Specify the subject's appearance and the precise motion they are performing. Detail the environment with tangible elements: location, time of day, weather, and objects that ground the scene in a believable context.
3.  **Practical Cinematography:**
    *   **Shot & Framing:** Define the shot clearly and with purpose. Use descriptive, standard terms like "eye-level medium shot," "wide establishing shot," "over-the-shoulder tracking shot." The framing should serve to clearly capture the core action.
    *   **Camera Movement:** Describe a single, clear, and motivated camera movement that is physically plausible. Examples: "a slow, steady dolly-in towards the subject," "a smooth tracking shot moving parallel to the character," "a gentle, stable handheld movement to add a sense of realism," "a slow pan across the landscape." Avoid overly complex or jarring movements unless the user's prompt implies them.
    *   **Lens & Focus:** Specify a lens appropriate for the scene's desired look. "Shot on a 35mm lens for a natural field of view," "a telephoto lens to compress the background," "a clean rack focus from a foreground object to the main subject."
4.  **Realistic Lighting & Color:** Describe the lighting and color based on the environment. "Lit by the harsh midday sun, creating strong contrast," "soft, ambient light from an overcast sky," "the warm, golden light of late afternoon (golden hour)," "a clean, neutral color grade for a true-to-life look," "a slightly cool-toned color grade for a modern, clean aesthetic."
5.  **High-Fidelity Keywords:** Conclude with essential keywords for quality and realism. MUST include "hyper-realistic video," "cinematic," "8K high-definition," "professional color grading," "physically-based rendering," "extremely detailed," "sharp focus," "smooth, fluid motion," "realistic motion blur."

**UNBREAKABLE RULE:** Respond ONLY with the final, enhanced single-paragraph prompt. Do NOT include any other text, greetings, or explanations. Your response must be a direct, rational, and practical cinematic blueprint of the user's idea.

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
    const refinementPrompt = `You are an AI Motion Graphics Artist, tasked with creating a prompt to animate a still image using AI. Your job is to elevate a user's simple instruction into a single, rich paragraph describing subtle, realistic, and captivating motion.

**MANDATORY DIRECTIVE:** Combine all elements into ONE SINGLE PARAGRAPH. Do not use lists or labels.

**ANIMATION FRAMEWORK:**
1.  **Primary Motion:** Clearly describe the main animation requested (e.g., falling snow, flowing water, a character's subtle movement). Detail its characteristics (e.g., "gentle, fluffy snowflakes drifting slowly," "a torrential downpour with heavy splashes").
2.  **Secondary & Environmental Motion:** Describe how the primary motion affects the environment. This is key for realism. "The wind not only rustles the leaves on the trees but also subtly sways the character's coat," "the camera's slow zoom forward is accompanied by dust motes gently floating in the sunbeams."
3.  **Physics & Subtlety:** Describe the motion with a sense of weight and realism. Avoid rigid, unnatural movements.
4.  **Focal Point & Camera Work:** Suggest a subtle camera movement that directs the viewer's eye and enhances the animation. "A very slow, almost imperceptible dolly zoom towards the subject's face," "a gentle, floating pan from left to right, revealing more of the landscape."
5.  **Atmospheric Enhancement:** Describe how the animation affects the overall mood and lighting. "As the rain begins, the scene's lighting becomes slightly darker and more melancholic, with surfaces becoming reflective and wet."

**UNBREAKABLE RULE:** Respond ONLY with the final, enhanced single-paragraph prompt. Do NOT include any other text.

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
      outputMimeType: 'image/png',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
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
            videoDuration: 16, // Generate a 16-second video
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