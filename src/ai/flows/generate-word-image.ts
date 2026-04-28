'use server';
/**
 * @fileOverview An AI flow to generate educational illustrations for spelling words.
 *
 * - generateWordImage - Generates a base64 encoded image for a spelling word.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  word: z.string().describe('The spelling word to generate an image for.'),
  theme: z.string().optional().describe('Optional theme to guide the illustration style.'),
});

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('Data URI of the generated image.'),
});

export async function generateWordImage(input: { word: string; theme?: string }): Promise<{ imageUrl: string }> {
  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `A cute, colorful, and friendly educational illustration for children of the word: "${input.word}". ${input.theme ? `Theme: ${input.theme}.` : ''} High quality, simple 2D cartoon style, white background, no text.`,
      config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    if (!media?.url) {
      throw new Error('No media returned from model');
    }

    return { imageUrl: media.url };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}
