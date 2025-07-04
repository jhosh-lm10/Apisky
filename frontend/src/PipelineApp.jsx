import React from 'react';
import { PipelineBoard } from './pipeline';
import './index.css';

export default function PipelineApp() {
  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 shadow font-bold">CRM Pipeline</header>
      <div className="flex-1 overflow-hidden">
        <PipelineBoard />
      </div>
    </div>
  );
}
