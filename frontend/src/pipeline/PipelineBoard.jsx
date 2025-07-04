import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { pipelineService } from '../services/api';
import ChatPanel from './ChatPanel';

export default function PipelineBoard() {
  const [stages, setStages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function load() {
      const [s, c] = await Promise.all([
        pipelineService.getStages(),
        pipelineService.getContacts(),
      ]);
      setStages(s);
      setContacts(c);
    }
    load();
  }, []);

  async function loadMessages(id) {
    const msgs = await pipelineService.getMessages(id);
    setMessages(msgs);
  }

  const contactsByStage = {};
  stages.forEach(s => {
    contactsByStage[s.id] = contacts.filter(c => c.stageId === s.id);
  });

  const onDragEnd = async (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const contactId = parseInt(draggableId, 10);
    const stageId = parseInt(destination.droppableId, 10);
    await pipelineService.updateContact(contactId, { stageId });
    const updated = await pipelineService.getContacts();
    setContacts(updated);
  };

  const handleSelect = async (contact) => {
    setActive(contact);
    const msgs = await pipelineService.getMessages(contact.id);
    setMessages(msgs);
  };

  return (
    <div className="flex">
      <div className="flex-1 overflow-auto flex" style={{ gap: '1rem' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {stages.map(stage => (
            <Droppable droppableId={String(stage.id)} key={stage.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-50 rounded p-2 w-64 flex-shrink-0"
                >
                  <h3 className="font-semibold mb-2">{stage.name}</h3>
                  {contactsByStage[stage.id].map((c, index) => (
                    <Draggable draggableId={String(c.id)} index={index} key={c.id}>
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className="bg-white rounded shadow p-2 mb-2 cursor-pointer"
                          onClick={() => handleSelect(c)}
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-sm text-gray-500">{c.project}</div>
                          <div className="text-sm text-gray-500">${'{'}c.amount{'}'}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
      <ChatPanel contact={active} messages={messages} onSend={async (text) => {
        if (!active) return;
        const msg = await pipelineService.sendMessage(active.id, text);
        setMessages(prev => [...prev, msg]);
      }} />
    </div>
  );
}
