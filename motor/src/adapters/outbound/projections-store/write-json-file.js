import { dirname } from 'jsr:@std/path@1.0.8';

export const writeJsonFile = async ({ value, filePath }) => {
  await Deno.mkdir(dirname(filePath), { recursive: true });
  await Deno.writeTextFile(filePath, JSON.stringify(value, null, 2));
};
