export type SlashCommandDisplay = "composer_hint" | "chat_status" | "composer_fill";

export interface SlashCommandListItem {
  name: string;
  descriptionKey: string;
  argsHint?: string;
}

export interface SlashCommandTokenData {
  contextUsedTokens?: number;
  contextWindowTokens?: number;
  contextPercent?: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  turnCount: number;
}

export interface ContextUsageSnapshot {
  contextUsedTokens: number;
  contextWindowTokens: number;
  contextPercent: number;
}

export type GetContextUsageResult =
  | { ok: true; data: ContextUsageSnapshot }
  | {
    ok: false;
    message: string;
    messageKey: string;
    messageParams?: Record<string, string | number>;
  };

export interface SlashCommandResult {
  ok: boolean;
  display: SlashCommandDisplay;
  message: string;
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  /** composer_fill: full text to place into the composer for the user to review and send. */
  fillText?: string;
  data?: SlashCommandTokenData;
}
