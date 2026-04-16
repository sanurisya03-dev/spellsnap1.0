'use server';
/**
 * @fileOverview An AI assistant flow for generating personalized spelling word lists.
 *
 * - generateWordList - A function that generates a personalized spelling word list.
 * - GenerateWordListInput - The input type for the generateWordList function.
 * - GenerateWordListOutput - The return type for the generateWordList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const GenerateWordListInputSchema = z.object({
  theme: z
    .string()
    .describe(
      'The thematic category for the word list (e.g., "animals", "space", "food").'
    ),
  gradeLevel: z
    .string()
    .describe(
      'The target grade level or proficiency (e.g., "Year 1", "Beginner ESL", "Grade 3").'
    ),
  learnerNeeds: z
    .string()
    .describe(
      'Specific learner needs or focus areas (e.g., "struggles with vowels", "needs more complex words", "focus on sight words").'
    ),
});
export type GenerateWordListInput = z.infer<typeof GenerateWordListInputSchema>;

// Output Schema
const WordItemSchema = z.object({
  word: z.string().describe('The spelling word.'),
  definition: z.string().describe('A concise definition of the word.'),
  exampleSentence:
    z.string().describe('An example sentence using the word, suitable for the specified grade level.'),
});

const GenerateWordListOutputSchema = z
  .array(WordItemSchema)
  .describe(
    'A list of personalized spelling words with definitions and example sentences.'
  );
export type GenerateWordListOutput = z.infer<typeof GenerateWordListOutputSchema>;

// Wrapper function
export async function generateWordList(
  input: GenerateWordListInput
): Promise<GenerateWordListOutput> {
  return generateWordListFlow(input);
}

// Prompt definition
const generateWordListPrompt = ai.definePrompt({
  name: 'generateWordListPrompt',
  input: {schema: GenerateWordListInputSchema},
  output: {schema: GenerateWordListOutputSchema},
  prompt: `You are an AI assistant designed to help teachers and parents create personalized spelling word lists for young ESL learners.\n\nBased on the following criteria, generate a list of 10-15 spelling words. For each word, provide a simple definition and an example sentence appropriate for the specified grade level. Ensure the words are relevant to the theme and consider the learner's specific needs.\n\nTheme: {{{theme}}}\nGrade Level/Proficiency: {{{gradeLevel}}}\nLearner Needs: {{{learnerNeeds}}}\n\nGenerate the output as a JSON array of objects, where each object has 'word', 'definition', and 'exampleSentence' fields.`,
});

// Flow definition
const generateWordListFlow = ai.defineFlow(
  {
    name: 'generateWordListFlow',
    inputSchema: GenerateWordListInputSchema,
    outputSchema: GenerateWordListOutputSchema,
  },
  async (input) => {
    const {output} = await generateWordListPrompt(input);
    return output!;
  }
);
