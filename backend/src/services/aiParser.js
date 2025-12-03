const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function parseVoiceInput(transcript) {
  const prompt = `You are a task parser. Extract structured data from this natural language task description.

Input: "${transcript}"

Return ONLY valid JSON with these exact fields:
- title: string (main task, cleaned up, no filler words)
- priority: "Low" | "Medium" | "High"
- dueDate: ISO date string or null
- status: "To Do" (always default to this)

Rules:
1. Priority keywords:
   - High: urgent, critical, high priority, important, asap
   - Low: low priority, minor, small, whenever
   - Medium: default
2. Date parsing:
   - tomorrow = add 1 day
   - next Monday/Tuesday/etc = next occurrence of that day
   - in X days = add X days
   - next week = add 7 days
3. Remove phrases like "create a task", "remind me to", "add"
4. Capitalize first letter of title

Return JSON only, no explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const response = message.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.title) {
      throw new Error('Title is required');
    }
    
    return parsed;
  } catch (error) {
    console.error('AI parsing error:', error);
    // Fallback to rule-based parsing
    return fallbackParsing(transcript);
  }
}

function fallbackParsing(transcript) {
  let title = transcript;
  let priority = 'Medium';
  let dueDate = null;

  // Priority detection
  if (/urgent|critical|high priority|important|asap/i.test(transcript)) {
    priority = 'High';
    title = title.replace(/urgent|critical|high priority|important|asap/gi, '');
  } else if (/low priority|minor|small|whenever/i.test(transcript)) {
    priority = 'Low';
    title = title.replace(/low priority|minor|small|whenever/gi, '');
  }

  // Date parsing
  const today = new Date();
  
  if (/tomorrow/i.test(transcript)) {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    dueDate = date.toISOString();
    title = title.replace(/tomorrow/gi, '');
  } else if (/today/i.test(transcript)) {
    dueDate = today.toISOString();
    title = title.replace(/today/gi, '');
  } else if (/next week/i.test(transcript)) {
    const date = new Date(today);
    date.setDate(date.getDate() + 7);
    dueDate = date.toISOString();
    title = title.replace(/next week/gi, '');
  } else if (/in (\d+) days?/i.test(transcript)) {
    const match = transcript.match(/in (\d+) days?/i);
    const days = parseInt(match[1]);
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    dueDate = date.toISOString();
    title = title.replace(/in \d+ days?/gi, '');
  }

  // Clean up title
  title = title
    .replace(/^(create|add|remind me to|make a task to|task to)\s+/i, '')
    .replace(/\s+(task|by|before|due)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title,
    priority,
    dueDate,
    status: 'To Do'
  };
}

module.exports = { parseVoiceInput };