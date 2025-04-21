// /api/inspect.js
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getRandomEntries(meta, count) {
  const entries = Object.entries(meta);
  return entries.sort(() => 0.5 - Math.random()).slice(0, count);
}

function validateURL(url) {
  return fetch(url, { method: 'HEAD' }).then(res => res.ok).catch(() => false);
}

export async function POST(req) {
  const data = await req.formData();
  const file = data.get('file');

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64Image = Buffer.from(bytes).toString('base64');

  try {
    // Load metadata
    const failMetaPath = path.join(process.cwd(), 'fail', 'metadata.json');
    const passMetaPath = path.join(process.cwd(), 'pass', 'metadata.json');
    const failMeta = JSON.parse(fs.readFileSync(failMetaPath, 'utf-8'));
    const passMeta = JSON.parse(fs.readFileSync(passMetaPath, 'utf-8'));

    const buildReferences = async (meta, folder, label) => {
      const refs = [];
      const random = getRandomEntries(meta, 4); // request more to cover failures

      for (const [filename, caption] of random) {
        const url = `https://strapscan.vercel.app/${folder}/${filename}`;
        const valid = await validateURL(url);
        if (!valid) continue;

        refs.push(
          {
            type: 'image_url',
            image_url: { url }
          },
          {
            type: 'text',
            text: `${label.toUpperCase()}: ${caption}`
          }
        );

        if (refs.length >= 4) break; // 2 image+text pairs
      }

      return refs;
    };

    const references = [
      {
        type: 'text',
        text: 'Use the following examples before analyzing the image below. Start your answer with PASS: or FAIL: and nothing else.'
      },
      ...(await buildReferences(failMeta, 'fail', 'fail')),
      ...(await buildReferences(passMeta, 'pass', 'pass')),
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${base64Image}` }
      },
      {
        type: 'text',
        text: 'Analyze the image above. Start your result with PASS: or FAIL: followed by a short explanation.'
      }
    ];

    // Call OpenAI
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

    const result = response.choices[0]?.message?.content || 'Inspection failed. GPT returned no output.';
    return new Response(result);
  } catch (err) {
    console.error('Inspection error:', err);
    return new Response('Inspection failed due to a server error.', { status: 500 });
  }
}
