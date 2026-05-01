'use client';

import { useState } from 'react';
import { ChatWindow } from '@/components/chat/chat-window';
import { FileUploader } from '@/components/upload/file-uploader';
import { Database, LayoutDashboard, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [groupId, setGroupId] = useState('default');

  return (
    <main className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-20 lg:w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col p-4">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Database size={24} className="text-white" />
          </div>
          <h1 className="font-bold text-xl hidden lg:block tracking-tight">Graphiti</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <SidebarItem icon={<Database size={20} />} label="Knowledge Graph" />
          <SidebarItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="mt-auto pt-4 border-t border-zinc-800">
          <SidebarItem icon={<HelpCircle size={20} />} label="Support" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">AI Knowledge Assistant</h2>
            <p className="text-zinc-500 text-sm">Powered by Graphiti MCP</p>
          </div>
          
          <div className="flex items-center gap-3 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <span className="text-xs text-zinc-500 px-3">Group ID:</span>
            <input 
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="bg-zinc-800 text-xs text-zinc-100 px-3 py-1.5 rounded-md border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
              placeholder="Set Group ID"
            />
          </div>
        </header>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Chat Section */}
          <div className="flex-[2] h-full flex flex-col min-w-0">
            <ChatWindow groupId={groupId} />
          </div>

          {/* Side Panel */}
          <div className="flex-1 hidden xl:flex flex-col gap-6 w-80 shrink-0">
            <FileUploader groupId={groupId} />
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex-1 shadow-xl overflow-hidden flex flex-col">
              <h3 className="font-semibold text-zinc-100 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <StatItem label="Entities" value="--" />
                <StatItem label="Relationships" value="--" />
                <StatItem label="Episodes" value="--" />
              </div>
              
              <div className="mt-auto p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-400 font-medium">Pro Tip</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Use specific entity names in your queries for more accurate graph traversal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group",
      active ? "bg-blue-600/10 text-blue-400" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
    )}>
      <div className={cn("transition-transform group-hover:scale-110", active && "scale-110")}>
        {icon}
      </div>
      <span className="font-medium text-sm hidden lg:block">{label}</span>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-sm font-bold text-zinc-200">{value}</span>
    </div>
  );
}
