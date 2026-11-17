import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';

let recognizer = null;
let isListening = false;

/**
 * Low-latency, on-device acoustic distress listener.
 * Keeps raw audio local to the client runtime (Privacy-First).
 */
export const initAcousticListener = async (onDistressDetected) => {
  if (isListening) return;

  try {
    recognizer = speechCommands.create('BROWSER_FFT');
    await recognizer.ensureModelLoaded();

    const labels = recognizer.wordLabels();

    recognizer.listen(
      async (result) => {
        const scores = result.scores;
        for (let i = 0; i < labels.length; i++) {
          const confidence = scores[i];

          if (confidence > 0.85 && ['help', 'shout', 'distress'].includes(labels[i])) {
            stopAcousticListener();
            onDistressDetected({
              triggerType: 'ACOUSTIC_DETECTION',
              detectedLabel: labels[i],
              confidence: confidence.toFixed(2),
              timestamp: new Date().toISOString()
            });
            break;
          }
        }
      },
      {
        includeSpectrogram: false,
        probabilityThreshold: 0.80,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.5
      }
    );

    isListening = true;
    console.log('🔒 On-device acoustic monitoring active.');
  } catch (error) {
    console.error('Error starting acoustic listener:', error);
  }
};

export const stopAcousticListener = () => {
  if (recognizer && isListening) {
    recognizer.stopListening();
    isListening = false;
    console.log('Acoustic monitoring paused.');
  }
};
