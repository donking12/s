/**
 * Premium client-side utility helper to safely process, decode,
 * and resample any uploaded audio file or microphone media blob into a 16000Hz float array required by Whisper models.
 */

export async function getAudioChannelData(audioFile: Blob): Promise<Float32Array> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000,
  });

  const fileReader = new FileReader();
  
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
    fileReader.onerror = () => reject(new Error('خطأ في قراءة ملف الصوت - Failed to read audio file'));
    fileReader.readAsArrayBuffer(audioFile);
  });

  let decodedData: AudioBuffer;
  try {
    decodedData = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    throw new Error('فشل فك ترميز ملف الصوت. يرجى التأكد من أن الملف غير تالف - Could not decode audio data.');
  }

  // Whisper expects mono audio (single channel) sampled at 16000 Hz
  const channelData = decodedData.getChannelData(0);
  
  // Clean up Audio Context to release system device hooks
  await audioContext.close();
  
  return channelData;
}

/**
 * Format time in seconds to elegant human readable timestamps (e.g., 01:23)
 */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const formattedM = m.toString().padStart(2, '0');
  const formattedS = s.toString().padStart(2, '0');
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${formattedM}:${formattedS}`;
  }
  return `${formattedM}:${formattedS}`;
}

/**
 * Generate SRT subtitle string from standard segment segments objects
 */
export function generateSRT(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((segment, index) => {
      const startFormatted = formatSRTTime(segment.start);
      const endFormatted = formatSRTTime(segment.end || (segment.start + 2));
      return `${index + 1}\n${startFormatted} --> ${endFormatted}\n${segment.text.trim()}\n\n`;
    })
    .join('');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${h}:${m}:${s},${ms}`;
}
