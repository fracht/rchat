import { EventEmitter } from 'https://deno.land/x/event@2.0.0/mod.ts';

type ChatEvents = {
    0: [];
};

export class MessageHandler extends EventEmitter<ChatEvents> {}
