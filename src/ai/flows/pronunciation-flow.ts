
'use server';
/**
 * @fileOverview AI flow to generate phonetic pronunciation (IPA) and audio for a word.
 *
 * - getPronunciation - Generates phonemes and a pronunciation data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

const PronunciationInputSchema = z.object({
  word: z.string().describe('The word to pronounce.'),
});

const PronunciationOutputSchema = z.object({
  phonemes: z.string().describe('The phonetic representation (IPA) of the word.'),
  audioUrl: z.string().describe('Data URI of the pronunciation audio (WAV).'),
});

// Define prompt at top level
const phonemePrompt = ai.definePrompt({
  name: 'generatePhonemes',
  input: { schema: z.object({ word: z.string() }) },
  output: { schema: z.object({ ipa: z.string() }) },
  prompt: 'Provide the International Phonetic Alphabet (IPA) representation for the word: "{{word}}".',
});

export async function getPronunciation(input: { word: string }): Promise<{ phonemes: string; audioUrl: string }> {
  // 1. Generate Phonemes (IPA)
  const { output: phonemeOutput } = await phonemePrompt(input);
  const ipa = phonemeOutput?.ipa || '';

  // 2. Generate Audio using TTS
  const { media } = await ai.generate({
    model: 'googleai/gemini-2.5-flash-preview-tts',
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: `Pronounce the word: ${input.word}`,
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
