import { WORDS_PER_CLIP } from '../constants';

export const chunkWordsToClips = (script: string): string[] => {
  if (!script.trim()) {
    return [];
  }
  // Normalize whitespace and split into words
  const words = script.trim().split(/\s+/);
  const clips: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CLIP) {
    const chunk = words.slice(i, i + WORDS_PER_CLIP);
    clips.push(chunk.join(' '));
  }
  return clips;
};
