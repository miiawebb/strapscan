// /api/inspect.js
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const data = await req.formData();
  const file = data.get('file');

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64Image = Buffer.from(bytes).toString('base64');

  // Load example metadata
  const failMetaPath = path.join(process.cwd(), 'fail', 'metadata.json');
  const passMetaPath = path.join(process.cwd(), 'pass', 'metadata.json');
  const failMeta = JSON.parse(fs.readFileSync(failMetaPath, 'utf-8'));
  const passMeta = JSON.parse(fs.readFileSync(passMetaPath, 'utf-8'));

  // Pick 2 random examples from each
  const getRandomExamples = (meta, type) => {
    const entries = Object.entries(meta);
    const selected = entries.sort(() => 0.5 - Math.random()).slice(0, 2);
    return selected.flatMap(([filename, caption]) => [
      {
        type: 'image_url',
        image_url: { url: `https://strapscan.vercel.app/${type}/${filename}` }
      },
      {
        type: 'text',
        text: `${type.toUpperCase()}: ${caption}`
      }
    ]);
  };

  const references = [
    {
      type: 'text',
      text: 'Use these examples to guide your analysis. Begin your answer with PASS: or FAIL: and nothing else.'
    },
    ...getRandomExamples(failMeta, 'fail'),
    ...getRandomExamples(passMeta, 'pass'),
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64Image}` }
    },
    {
      type: 'text',
      text: 'Analyze this image and return your result. Begin with PASS: or FAIL: followed by a short explanation.'
    }
  ];

  // Call GPT-4 Vision
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: references
      }
    ],
    max_tokens: 500
  });

  const result = response.choices[0]?.message?.content || 'Inspection failed. Try again later.';
  return new Response(result);
}
