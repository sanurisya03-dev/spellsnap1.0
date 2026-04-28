'use server';
/**
 * @fileOverview AI flow to generate phonetic pronunciation (IPA) and audio for a word.
 *
 * - getPronunciation - Generates phonemes and a pronunciation data URI.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const PronunciationInputSchema = z.object({
  word: z.string().describe('The word to pronounce.'),
});

const PronunciationOutputSchema = z.object({
  phonemes: z.string().describe('The phonetic representation (IPA) of the word.'),
  audioUrl: z.string().describe('Data URI of the pronunciation audio (WAV).'),
});

export async function getPronunciation(input: { word: string }): Promise<{ phonemes: string; audioUrl: string }> {
  // 1. Generate Phonemes (IPA) using British English standard
  const { output: phonemeOutput } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `Provide the International Phonetic Alphabet (IPA) representation for the word: "${input.word}". Use British English (Received Pronunciation) standard. Return ONLY the IPA symbols.`,
    output: {
      schema: z.object({ ipa: z.string() })
    },
    config: {
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
      ]
    }
  });

  const ipa = phonemeOutput?.ipa || '';

  // 2. Generate Audio using TTS with a British accent (Charon)
  const { media } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash-preview-tts'),
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' }, // Charon is a standard British English voice
        },
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
      ]
    },
    prompt: `Pronounce the word clearly with a British accent: ${input.word}`,
  });

  if (!media) {
    throw new Error('Failed to generate pronunciation audio');
  }

  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );

  const wavDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

  return {
    phonemes: ipa,
    audioUrl: wavDataUri,
  };
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
