import { DescriptError } from './error';
import { RequestOptions } from './request';
import type { DescriptHttpResult } from './types';

export type RetryStrategyRequest = () => Promise<DescriptHttpResult>;

export interface RetryStrategyInterface {
    makeRequest: () => Promise<DescriptHttpResult>;
}

function waitFor(timeout: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

interface BaseRetryStrategyConstructorParams {
    requestOptions: RequestOptions;
    request: RetryStrategyRequest;
}

export class BaseRetryStrategy implements RetryStrategyInterface {
    requestOptions: RequestOptions;
    request: RetryStrategyRequest;

    constructor({ requestOptions, request }: BaseRetryStrategyConstructorParams) {
        this.request = request;
        this.requestOptions = requestOptions;
    }

    private async retry() {
        this.requestOptions.retries++;

        if (this.requestOptions.retryTimeout > 0) {
            await waitFor(this.requestOptions.retryTimeout);
        }

        return this.makeRequest();
    }

    private isRetryAllowed(error: DescriptError) {
        return (
            this.requestOptions.retries < this.requestOptions.maxRetries &&
            this.requestOptions.isRetryAllowed?.(error, this.requestOptions)
        );
    }

    async makeRequest(): Promise<DescriptHttpResult> {
        try {
            return await this.request();
        } catch (error) {
            if (this.isRetryAllowed(error)) {
                return this.retry();
            } else {
                throw error;
            }
        }
    }
}
