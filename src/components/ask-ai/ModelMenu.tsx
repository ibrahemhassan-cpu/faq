import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Settings2, Sparkles } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/services/aiService';
import { cn } from '@/lib/utils';

interface ModelMenuProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onOpenSettings: () => void;
  disabled?: boolean;
}

const PROVIDERS = ['Google Gemini', 'NVIDIA'] as const;

const BADGE_STYLES: Record<string, string> = {
  Recommended: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Free: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Paid: 'bg-amber-50 text-amber-700 border-amber-200',
};

/** Model picker next to the question box (like ChatGPT / Claude), with Settings at the top. */
export const ModelMenu: React.FC<ModelMenuProps> = ({ selectedModel, onModelChange, onOpenSettings, disabled }) => {
  const current = AVAILABLE_MODELS.find((m) => m.id === selectedModel) ?? AVAILABLE_MODELS[0];

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        disabled={disabled}
        className="group flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 data-[state=open]:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none min-w-0 max-w-[11rem] sm:max-w-[13rem] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`Model: ${current.name}. Change model or open settings`}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-600" />
        <span className="truncate">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-60 max-w-[calc(100vw-1.5rem)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-fade-in"
        >
          <DropdownMenu.Item
            onSelect={onOpenSettings}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 cursor-pointer outline-none data-[highlighted]:bg-slate-100"
          >
            <Settings2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Settings</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />

          {PROVIDERS.map((provider) => (
            <DropdownMenu.Group key={provider}>
              <DropdownMenu.Label className="px-2 pt-1.5 pb-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                {provider === 'NVIDIA' ? 'NVIDIA • via OpenRouter' : provider}
              </DropdownMenu.Label>
              {AVAILABLE_MODELS.filter((m) => m.provider === provider).map((model) => {
                const isSelected = model.id === current.id;
                return (
                  <DropdownMenu.Item
                    key={model.id}
                    onSelect={() => onModelChange(model.id)}
                    className={cn(
                      'flex items-start gap-2 rounded-md px-2 py-1.5 cursor-pointer outline-none data-[highlighted]:bg-slate-100',
                      isSelected && 'bg-blue-50/60'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-xs', isSelected ? 'font-medium text-blue-900' : 'text-slate-700')}>
                          {model.name}
                        </span>
                        {model.badge && (
                          <span className={cn('text-[8px] font-medium px-1 py-px rounded border', BADGE_STYLES[model.badge])}>
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] leading-snug text-slate-400">{model.description}</p>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-600" />}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Group>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
