import { generateVideo } from './src/services/video';

// Simple test for video generation
async function testVideoGeneration() {
  try {
    console.log('Testing video generation with provided API key...');
    const videoBuffer = await generateVideo("A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.");
    console.log(`Success! Generated video buffer size: ${videoBuffer.length} bytes`);
    console.log('Video generation feature is working correctly.');
  } catch (error) {
    console.error('Video generation test failed:', error.message);
    process.exit(1);
  }
}

testVideoGeneration();