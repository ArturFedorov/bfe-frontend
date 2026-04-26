export interface Message {
  id: string;
  seq: number;
  text: string;
}

export interface MessageListOptions {
  container: HTMLElement;
  renderMessage?: (message: Message) => string;
  stickThreshold?: number;
}

export function createMessageList(options: MessageListOptions): {
  addMessages: (messages: Message[]) => void;
  getMessages: () => Message[];
  destroy: () => void;
} {
  return { addMessages() {}, getMessages: () => [], destroy() {} };
}
