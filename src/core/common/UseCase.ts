/**
 * Base Interface for all Use Cases (Interactors)
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
