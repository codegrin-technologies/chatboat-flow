import { FlowiseMessageRequest, FlowiseMessageResponse } from './types';

interface FlowiseClientConfig {
  apiUrl: string;
  apiKey?: string;
}

export class FlowiseClient {
  private apiUrl: string;
  private apiKey?: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: FlowiseClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  async sendMessage(
    chatflowId: string,
    request: FlowiseMessageRequest
  ): Promise<FlowiseMessageResponse> {
    const url = `${this.apiUrl}/api/v1/prediction/${chatflowId}`;

    return this.retryRequest(async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Flowise API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    });
  }

  async streamMessage(
    chatflowId: string,
    request: FlowiseMessageRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const url = `${this.apiUrl}/api/v1/prediction/${chatflowId}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Flowise API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        onChunk(chunk);
      }

      onComplete(fullResponse);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getChatflows(): Promise<unknown[]> {
    const url = `${this.apiUrl}/api/v1/chatflows`;

    return this.retryRequest(async () => {
      const headers: Record<string, string> = {};

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chatflows: ${response.statusText}`);
      }

      return response.json();
    });
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      const isRetryable = this.isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }

      await this.delay(this.retryDelay * attempt);
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('504')
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
