import type { Settings } from '../types';

export const buildVeoCommand = (
  segment: string,
  index: number,
  total: number,
  settings: Settings
): string => {
  const clipNumber = index + 1;
  const progress = `Clip ${clipNumber} of ${total}`;

  // Add specific shot instructions based on clip number for variety
  let shotInstruction = "";
  if (clipNumber === 1) {
    shotInstruction = "SCENE START: Medium close-up shot (MCU) of the doctor from the waist up, centered in frame, looking directly into the camera with a warm, welcoming expression. The shot is stable, on a tripod. Start with a 1-second pause before he begins speaking.";
  } else if (clipNumber % 5 === 0 && clipNumber < total) {
    shotInstruction = `TRANSITION: Smooth, slow 1-second cross-dissolve to a slightly different angle. Now a medium shot (MS), showing the doctor from the hips up. He continues to speak directly to the camera. Maintain eye contact.`;
  } else if (clipNumber === total) {
    shotInstruction = "SCENE END: Hold on a close-up shot of the doctor smiling warmly for 2 seconds after he finishes speaking. Slow 2-second fade to black.";
  } else {
    shotInstruction = `CONTINUATION: Maintain the current shot. The doctor continues his delivery with natural, subtle hand gestures and empathetic facial expressions. Ensure seamless continuity from the previous clip.`;
  }

  // Sanitize the segment to be used inside a quoted string
  const sanitizedSegment = segment.replace(/"/g, "'");

  return `
veo3 generate --prompt """
**VIDEO PROMPT**
**Clip Progress:** ${progress}
**Character:** ${settings.characterName}. CONSISTENCY LOCK: ${settings.characterLock}
**Action & Dialogue:** ${settings.characterName} says, "${sanitizedSegment}"
**Shot Type & Direction:** ${shotInstruction}
**Global Visual Style:** ${settings.style}

**AUDIO PROMPT (VEO3 NATIVE AUDIO GENERATION)**
**Dialogue:** "${sanitizedSegment}"
**Voice Instructions:** ${settings.voiceNote}
**Background Music:** ${settings.musicMood}
**Sound Effects:** ${settings.sfxPack}
"""
--aspect_ratio ${settings.aspect}
--resolution ${settings.quality}
--duration 8s
--native_audio
`.trim();
};
