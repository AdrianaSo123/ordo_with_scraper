export interface ToolCommand<TInput = any, TOutput = any> {
  execute(input: TInput): Promise<TOutput>;
}
