import { dirname } from 'jsr:@std/path@1.0.8';

const toJsonLine = (event) => `${JSON.stringify(event)}\n`;

export const persistEventsAsJsonl = async ({ events, filePath }) => {
  const allLines = events.map(toJsonLine).join('');
  await Deno.mkdir(dirname(filePath), { recursive: true });
  await Deno.writeTextFile(filePath, allLines, { append: true });
};
