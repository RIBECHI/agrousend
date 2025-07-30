'use server';
/**
 * @fileOverview A simple diagnostic flow to measure network latency.
 *
 * - ping - A function that returns the input it received, to measure round-trip time.
 * - PingInput - The input type for the ping function.
 * - PingOutput - The return type for the ping function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PingInputSchema = z.object({
  timestamp: z.number().describe('The timestamp when the request was sent.'),
});
export type PingInput = z.infer<typeof PingInputSchema>;

const PingOutputSchema = z.object({
  timestamp: z.number().describe('The timestamp received from the input.'),
});
export type PingOutput = z.infer<typeof PingOutputSchema>;

export async function ping(input: PingInput): Promise<PingOutput> {
  return pingFlow(input);
}

const pingFlow = ai.defineFlow(
  {
    name: 'pingFlow',
    inputSchema: PingInputSchema,
    outputSchema: PingOutputSchema,
  },
  async input => {
    // Simply return the input to measure round-trip time.
    return {
      timestamp: input.timestamp,
    };
  }
);
