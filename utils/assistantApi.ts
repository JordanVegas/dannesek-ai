import { Alert } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const ASSISTANT_ID = process.env.EXPO_PUBLIC_OPENAI_ASSISTANT_ID;
const ORGANIZATION = process.env.EXPO_PUBLIC_OPENAI_ORGANIZATION;
const BASE_URL = 'https://api.openai.com/v1';

let threadId: string | null = null;

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'OpenAI-Organization': ORGANIZATION,
  'OpenAI-Beta': 'assistants=v2',
  'Content-Type': 'application/json',
};

export const uploadImageToOpenAI = async (uri: string): Promise<string | null> => {
  try {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';

    formData.append('file', {
      uri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    formData.append('purpose', 'assistants'); // ✅ Required field!

    const res = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'OpenAI-Organization': process.env.EXPO_PUBLIC_OPENAI_ORGANIZATION!,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('❌ Image upload failed:', data);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('💥 Error uploading image:', error);
    return null;
  }
};


export const talkToAssistant = async (userInput: string, imageFileIds?: string[]): Promise<string> => {
  if (!API_KEY || !ASSISTANT_ID || !ORGANIZATION) {
    Alert.alert('Missing API Key, Assistant ID, or Org ID');
    return 'Error: Missing credentials';
  }

  try {
    // Ensure assistant is available
    const assistantCheckRes = await fetch(`${BASE_URL}/assistants`, { headers });
    const assistantList = await assistantCheckRes.json();
    if (!assistantCheckRes.ok) return 'Error checking assistants';

    const found = assistantList.data.find((a: any) => a.id === ASSISTANT_ID);
    if (!found) return 'Error: Assistant not found';

    // Create thread if needed
    if (!threadId) {
      const threadRes = await fetch(`${BASE_URL}/threads`, { method: 'POST', headers });
      if (!threadRes.ok) return 'Error creating thread';
      const thread = await threadRes.json();
      threadId = thread.id;
    }

    // Send message
const messagePayload: any = {
  role: 'user',
  content: [],
};

if (userInput.trim()) {
  messagePayload.content.push({ type: 'text', text: userInput });
}

if (imageFileIds?.length) {
  imageFileIds.forEach((id) => {
    messagePayload.content.push({ type: 'image_file', image_file: { file_id: id } });
  });
}


    const msgRes = await fetch(`${BASE_URL}/threads/${threadId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(messagePayload),
    });
    if (!msgRes.ok) return 'Error sending message';

    // Create run
    const runRes = await fetch(`${BASE_URL}/threads/${threadId}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ assistant_id: ASSISTANT_ID }),
    });
    if (!runRes.ok) return 'Error creating run';
    const run = await runRes.json();

    // Poll for completion
    let status = 'queued';
    let retries = 0;
    const maxRetries = 20;

    while (status !== 'completed' && retries < maxRetries) {
      const pollRes = await fetch(`${BASE_URL}/threads/${threadId}/runs/${run.id}`, { headers });
      const pollData = await pollRes.json();
      status = pollData.status;

      if (status === 'failed' || status === 'cancelled') return `Run ${status}`;

      if (status !== 'completed') {
        await new Promise((res) => setTimeout(res, 1000));
        retries++;
      }
    }

    // Get assistant reply
    const finalMsgRes = await fetch(`${BASE_URL}/threads/${threadId}/messages`, { headers });
    const msgData = await finalMsgRes.json();
    const assistantMessages = msgData.data.filter((m: any) => m.role === 'assistant');
    assistantMessages.sort((a: any, b: any) => b.created_at - a.created_at);
    const reply = assistantMessages[0];

    return reply?.content?.[0]?.text?.value || 'No response';
  } catch (err) {
    console.error('💥 Assistant error:', err);
    return 'An error occurred.';
  }
};

