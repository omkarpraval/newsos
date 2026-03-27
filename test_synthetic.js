
import { generateSyntheticArticles } from './src/services/groq.js';

async function test() {
  console.log('Testing synthetic news for "space tourism 2030"...');
  const articles = await generateSyntheticArticles('space tourism 2030');
  console.log('Generated Articles:', articles.length);
  if (articles.length > 0) {
    console.log('First Article Title:', articles[0].title);
  }
}

test();
