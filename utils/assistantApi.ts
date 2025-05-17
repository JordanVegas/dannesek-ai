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

export const talkToAssistant = async (userInput: string): Promise<string> => {
  if (!API_KEY || !ASSISTANT_ID || !ORGANIZATION) {
    Alert.alert('Missing API Key, Assistant ID, or Org ID');
    return 'Error: Missing credentials';
  }

  try {
    // ✅ Step 0: Confirm assistant exists and log all assistants
    const assistantCheckRes = await fetch(`${BASE_URL}/assistants`, { headers });
    const assistantList = await assistantCheckRes.json();

    if (!assistantCheckRes.ok) {
      console.error('Failed to fetch assistant list:', assistantList);
      return 'Error checking assistants';
    }

    console.log('📋 Available assistants:');
    assistantList.data.forEach((a: any) => {
      console.log(`- ${a.id} (${a.name})`);
    });

    const found = assistantList.data.find((a: any) => a.id === ASSISTANT_ID);
    if (!found) {
      console.error('❌ Assistant ID not found in list:', ASSISTANT_ID);
      Alert.alert('Assistant not found', 'Your assistant ID is not available to this API key.');
      return 'Error: Assistant not found';
    }

    // Step 1: Create thread if needed
    if (!threadId) {
      const threadRes = await fetch(`${BASE_URL}/threads`, {
        method: 'POST',
        headers,
      });
      if (!threadRes.ok) {
        console.error('Failed to create thread:', await threadRes.text());
        return 'Error creating thread';
      }
      const thread = await threadRes.json();
      threadId = thread.id;
      console.log('🧵 Created thread:', threadId);
    }

    // Step 2: Add user message
    const msgRes = await fetch(`${BASE_URL}/threads/${threadId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        role: 'user',
        content: userInput,
      }),
    });
    if (!msgRes.ok) {
      console.error('❌ Failed to add message:', await msgRes.text());
      return 'Error sending message';
    }

    // Step 3: Run assistant
    console.log('▶️ Starting run with assistant:', ASSISTANT_ID);
    const runRes = await fetch(`${BASE_URL}/threads/${threadId}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
    });
    if (!runRes.ok) {
      console.error('❌ Failed to create run:', await runRes.text());
      return 'Error creating run';
    }
    const run = await runRes.json();

    // Step 4: Poll run status
    let status = 'queued';
    while (status !== 'completed') {
      const pollRes = await fetch(`${BASE_URL}/threads/${threadId}/runs/${run.id}`, {
        headers,
      });
      if (!pollRes.ok) {
        console.error('❌ Polling failed:', await pollRes.text());
        return 'Error polling run status';
      }
      const pollData = await pollRes.json();
      status = pollData.status;
      if (status !== 'completed') await new Promise((res) => setTimeout(res, 1000));
    }

    // Step 5: Get reply
    const finalMsgRes = await fetch(`${BASE_URL}/threads/${threadId}/messages`, {
      headers,
    });
    if (!finalMsgRes.ok) {
      console.error('❌ Failed to get messages:', await finalMsgRes.text());
      return 'Error getting assistant response';
    }
    const msgData = await finalMsgRes.json();
    const reply = msgData.data.find((m: any) => m.role === 'assistant');

    return reply?.content?.[0]?.text?.value || 'No response';
  } catch (err) {
    console.error('💥 Assistant error:', err);
    return 'An error occurred.';
  }
};
