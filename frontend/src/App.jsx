// App.jsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

const checkAccuracy = (userCode) => {
  const lines = userCode.trim().split('\n');
  let score = 0;
  const feedback = [];

  if (userCode.includes('apt:')) score += 20;
  else feedback.push('Missing apt module');

  if (userCode.includes('service:')) score += 20;
  else feedback.push('Missing service module');

  if (userCode.includes('state: present')) score += 20;
  else feedback.push("'state: present' might be missing");

  if (userCode.includes('state: started')) score += 20;
  else feedback.push("'state: started' might be missing");

  if (userCode.includes('become: yes')) score += 20;
  else feedback.push("'become: yes' is a good practice for installing packages");

  return { score, feedback };
};

export default function App() {
  const [userCode, setUserCode] = useState('');
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [task, setTask] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');

  const handleCheck = () => {
    const result = checkAccuracy(userCode);
    setScore(result.score);
    setFeedback(result.feedback);
  };

  const fetchHintAndSolution = async (type) => {
    if (!task.trim()) {
      setSolution('Please enter a task before requesting hints or solutions.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer {GROQ_API}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are an Ansible expert helping users write playbooks.'
            },
            {
              role: 'user',
              content: `${type === 'hint' ? 'Give a hint for writing an Ansible playbook to:' : 'Write an Ansible playbook to:'} ${task}`
            }
          ]
        })
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || 'No response from AI.';
      setSolution(content);
    } catch (err) {
      console.error('Error fetching from Groq API', err);
      setSolution('Failed to fetch solution.');
    }
    setLoading(false);
  };

  const runMockTerminal = () => {
    setTerminalOutput('Running: ansible-playbook playbook.yml\n\nPLAY [localhost] SUCCESS');
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-gray-900 text-white p-4 font-bold text-lg">Ansible Learning Editor</div>

      <div className="flex flex-1">
        <div className="w-48 bg-gray-800 text-white p-4 hidden md:block">
          <p className="font-semibold mb-2">Tools</p>
          <ul className="space-y-2 text-sm">
            <li>📄 Editor</li>
            <li>💻 Terminal</li>
            <li>📤 Output</li>
          </ul>
        </div>

        <div className="flex-1 grid md:grid-cols-3 grid-cols-1">
          <div className="md:col-span-2 col-span-1">
            <div className="p-2">
              <input
                type="text"
                placeholder="Enter your task e.g. install and start nginx"
                className="w-full p-2 border rounded mb-2"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            </div>
            <Editor
              height="70vh"
              defaultLanguage="yaml"
              value={userCode}
              theme="vs-dark"
              onChange={(value) => setUserCode(value || '')}
            />
            <div className="bg-black text-green-400 p-2 h-32 overflow-auto text-sm font-mono">
              <p className="mb-1">Mock Terminal</p>
              <pre>{terminalOutput || 'Click Run to simulate ansible-playbook execution...'}</pre>
              <button
                onClick={runMockTerminal}
                className="mt-2 px-4 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Run
              </button>
            </div>
          </div>

          <div className="bg-gray-100 p-4 overflow-auto">
            <button
              onClick={handleCheck}
              className="mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Check My Code
            </button>

            <button
              onClick={() => { setShowHint(true); fetchHintAndSolution('hint'); }}
              className="mb-2 ml-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Show Hint
            </button>

            <button
              onClick={() => { setShowSolution(true); fetchHintAndSolution('solution'); }}
              className="mb-4 ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Show Solution
            </button>

            {score !== null && (
              <div>
                <p className="font-bold">Score: {score} / 100</p>
                <ul className="mt-2 list-disc list-inside">
                  {feedback.map((msg, idx) => (
                    <li key={idx} className="text-red-600">{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {loading && <p className="mt-4 text-sm text-gray-500">Loading...</p>}

            {(showHint || showSolution) && !loading && (
              <div className="mt-4">
                <p className="font-semibold">{showHint ? 'Hint:' : 'Suggested Solution:'}</p>
                <pre className="bg-white p-2 mt-2 rounded text-sm whitespace-pre overflow-auto">
                  <code className="block text-gray-800 whitespace-pre-wrap">
                    {solution}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
