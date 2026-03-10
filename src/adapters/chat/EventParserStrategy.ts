import { StreamEvent } from "../../core/entities/chat-stream";

/**
 * Strategy Interface for Parsing Raw SSE JSON Data
 */
export interface EventParserStrategy {
  canParse(data: any): boolean;
  parse(data: any): StreamEvent;
}

export class TextDeltaParser implements EventParserStrategy {
  canParse(data: any) { return !!data.delta; }
  parse(data: any): StreamEvent {
    return { type: "text", delta: data.delta };
  }
}

export class ToolCallParser implements EventParserStrategy {
  canParse(data: any) { return !!data.tool_call; }
  parse(data: any): StreamEvent {
    return { 
      type: "tool_call", 
      name: data.tool_call.name, 
      args: data.tool_call.args 
    };
  }
}

export class ToolResultParser implements EventParserStrategy {
  canParse(data: any) { return !!data.tool_result; }
  parse(data: any): StreamEvent {
    return { 
      type: "tool_result", 
      name: data.tool_result.name, 
      result: data.tool_result.result 
    };
  }
}

export class EventParser {
  constructor(private strategies: EventParserStrategy[]) {}

  parse(data: any): StreamEvent | null {
    const strategy = this.strategies.find(s => s.canParse(data));
    return strategy ? strategy.parse(data) : null;
  }
}
