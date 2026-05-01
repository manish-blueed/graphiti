import { cn } from '@/lib/utils';
import { UIMessage } from '@ai-sdk/react';
import { User, Bot, Wrench, CheckCircle, AlertCircle } from 'lucide-react';

interface MessageProps {
  message: UIMessage;
}

interface ToolInvocationState {
  toolName: string;
  state: 'call' | 'result' | 'error';
  result?: unknown;
  error?: unknown;
}

interface ToolInvocationPart {
  type: 'tool-invocation';
  toolInvocation: ToolInvocationState;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  // In AI SDK v6, tool invocations are part of message.parts
  const toolInvocations = message.parts?.filter(part => part.type === 'tool-invocation');
  const textParts = message.parts?.filter(part => part.type === 'text');

  return (
    <div className={cn('flex flex-col mb-6', isUser ? 'items-end' : 'items-start')}>
      <div className="flex items-center gap-2 mb-1 px-2">
        {isUser ? (
          <>
            <span className="text-xs font-medium text-zinc-400">You</span>
            <User size={14} className="text-zinc-400" />
          </>
        ) : (
          <>
            <Bot size={14} className="text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Assistant</span>
          </>
        )}
      </div>

      <div
        className={cn(
          'chat-bubble',
          isUser ? 'chat-bubble-user' : 'chat-bubble-assistant shadow-lg'
        )}
      >
        {/* Render text parts */}
        {textParts?.map((part, i) => (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
            {part.text}
          </p>
        ))}
      </div>

      {toolInvocations && toolInvocations.length > 0 && (
        <div className="mt-2 space-y-2 w-full max-w-[80%]">
          {toolInvocations.map((part, i) => {
            const ti = (part as unknown as ToolInvocationPart).toolInvocation;
            if (!ti) return null;

            const isDone = ti.state === 'result';
            const hasError = ti.state === 'error';

            return (
              <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                  {isDone ? (
                    <CheckCircle size={12} className="text-green-400" />
                  ) : hasError ? (
                    <AlertCircle size={12} className="text-red-400" />
                  ) : (
                    <Wrench size={12} className="text-blue-400 animate-spin" />
                  )}
                  <span className="font-medium">{ti.toolName}</span>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    isDone && 'bg-green-500/10 text-green-400',
                    hasError && 'bg-red-500/10 text-red-400',
                    !isDone && !hasError && 'bg-blue-500/10 text-blue-400'
                  )}>
                    {ti.state}
                  </span>
                </div>
                {isDone && ti.result != null && (
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40 scrollbar-thin">
                    {typeof ti.result === 'string'
                      ? ti.result
                      : JSON.stringify(ti.result, null, 2)}
                  </pre>
                )}
                {hasError && ti.error != null && (
                  <p className="text-xs text-red-400">{String(ti.error)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
