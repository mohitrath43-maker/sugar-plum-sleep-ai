import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Gemini API - Getting available models...');
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

const API_KEY = process.env.GEMINI_API_KEY;

try {
  console.log('Getting list of available models...');
  const listURL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  const response = await fetch(listURL);
  const result = await response.json();
  
  if (response.ok && result.models) {
    console.log('✅ Available models:');
    result.models.forEach(model => {
      console.log(`  - ${model.name} (${model.displayName})`);
      if (model.supportedGenerationMethods) {
        console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
    
    // Find a model that supports generateContent
    const contentModel = result.models.find(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );
    
    if (contentModel) {
      console.log(`\nTesting with: ${contentModel.name}`);
      await testModel(contentModel.name, API_KEY);
    }
  } else {
    console.log('❌ Failed to get models:', result);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

async function testModel(modelName, apiKey) {
  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
    
    const testData = {
      contents: [{
        parts: [{
          text: "Hello, just say hi back"
        }]
      }]
    };
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok && result.candidates) {
      console.log(`✅ SUCCESS:`, result.candidates[0].content.parts[0].text);
      return modelName;
    } else {
      console.log(`❌ Test failed:`, result.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.error(`❌ Test error:`, error.message);
  }
}