import React, { useState } from 'react';

export default function ChatPanel({ contact, messages, onSend }) {
  const [text, setText] = useState('');

  if (!contact) {
    return <div className="w-80 border-l p-4 text-gray-500">Seleccione un contacto</div>;
  }

  return (
    <div className="w-80 border-l flex flex-col">
      <div className="p-4 border-b font-semibold">{contact.name}</div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={`text-sm ${m.direction === 'out' ? 'text-right' : ''}`}>{m.content}</div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text) return;
          onSend(text);
          setText('');
        }}
        className="p-2 border-t flex"
      >
        <input
          className="flex-1 border rounded px-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje"
        />
        <button type="submit" className="ml-2 px-3 rounded bg-blue-600 text-white text-sm">Enviar</button>
      </form>
    </div>
  );
}
