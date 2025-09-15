export async function analyzeDocument(text: string) {
    const res = await fetch('http://localhost:8080/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to analyze document');
    return res.json();
  }
  
  export async function askChatbot(inputData: any, question: string) {
    const res = await fetch('http://localhost:8080/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...inputData, question }),
    });
    if (!res.ok) throw new Error('Failed to get chatbot response');
    return res.json();
  }