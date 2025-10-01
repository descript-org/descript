import type Cancel from './cancel';
import type BaseBlock from './block';
import type { DescriptBlockDeps, DescriptBlockId } from './depsDomain';
import type { DescriptError } from './error';
import type { CacheInterface } from './cache';
import type { IncomingHttpHeaders } from 'http';
import type { EventTimestamps, LoggerInterface } from './logger';
import type { RequestOptions } from './request';
import type HttpBlock from './httpBlock';

export interface DescriptHttpBlockResult<Result> {
    statusCode: number;
    headers: DescriptHttpBlockHeaders;
    requestOptions: RequestOptions;

    result: Result;
}

export type DescriptHttpBlockHeaders = IncomingHttpHeaders;
export interface DescriptHttpResult {
    statusCode: number;
    headers: DescriptHttpBlockHeaders;
    requestOptions: RequestOptions;
    body: Buffer | null;

    timestamps: EventTimestamps;
}

export type UnionToIntersection<U> = (
    U extends any ?
        (k: U) => void :
        never
) extends (
    (k: infer I) => void
) ? I : never;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DescriptContext {}

export type NonNullableObject<T extends Record<string, unknown>> = {
    [P in keyof T]: Exclude<T[P], undefined>;
};

export type DescriptJSON =
  boolean |
  number |
  string |
  undefined |
  null |
    { [ property: string ]: DescriptJSON } |
    object |
    Array<DescriptJSON>;

export type BlockResultOut<
    BlockResult,
    BeforeResultOut = unknown,
    AfterResultOut = unknown,
    ErrorResultOut = unknown,
> =
     [ unknown ] extends [ Exclude<ErrorResultOut, undefined | void> ] ?
         [ unknown ] extends [ AfterResultOut ] ?
             [ unknown ] extends [ Exclude<BeforeResultOut, undefined | void> ] ?
                 BlockResult :
                 Exclude<BeforeResultOut, undefined | void> | BlockResult :
             AfterResultOut :
         [ unknown ] extends [ AfterResultOut ] ?
             [ unknown ] extends [ Exclude<BeforeResultOut, undefined | void> ] ?
                 BlockResult | Exclude<ErrorResultOut, undefined | void> :
                 Exclude<BeforeResultOut, undefined | void> | BlockResult | Exclude<ErrorResultOut, undefined | void> :
             AfterResultOut | Exclude<ErrorResultOut, undefined | void>;

export type InferResultOrResult<Result> = Result extends BaseBlock<
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? InferResultOrResult<ResultOut> : Result;

export type InferResultOrResultOnce<Result> = Result extends BaseBlock<
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? ResultOut : Result;

export type InferResultFromBlock<Type> = Type extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? InferResultOrResult<ResultOut> : never;

export type InferParamsInFromBlock<Type> = Type extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? Params : never;

export type InferParamsInFromBlockOrParams<Type, P> = Type extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? Params : P;

export type InferParamsOutFromBlock<Type> = Type extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? ParamsOut : never;

export type InferBlock<Type> = Type extends BaseBlock<
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? Type : never;

export type InferHttpBlock<Type> = Type extends HttpBlock<
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer ParamsOut, infer HttpResult, infer ResultOut, infer BlockResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? Type : never;

export type InferContextFromBlock<T> = T extends BaseBlock<
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ? Context : never;

export type First<T> =
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? First : never;

export type Tail<T> =
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? Rest : never;

export type Equal<A, B> = A extends B ? (B extends A ? A : never) : never;

export type DepsIds = Array<DescriptBlockId>;
export interface DescriptBlockOptions<
    Context,
    ParamsOut,
    BlockResult,
    BeforeResultOut = unknown,
    AfterResultOut = unknown,
    ErrorResultOut = unknown,
    Params = ParamsOut,
> {
    name?: string;

    id?: DescriptBlockId;
    deps?: DescriptBlockId | DepsIds | null;

    params?: (args: {
        params: Params;
        context?: Context;
        deps: DescriptBlockDeps;
    }) => ParamsOut;

    before?: (args: {
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        cancel: Cancel;
    }) => BeforeResultOut;

    after?: (args: {
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        cancel: Cancel;
        result: [ unknown ] extends [ Exclude<BeforeResultOut, undefined | void> ] ?
            InferResultOrResult<BlockResult> : InferResultOrResult<Exclude<BeforeResultOut, undefined | void>> | InferResultOrResult<BlockResult>;
    }) => AfterResultOut;

    error?: (args: {
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        cancel: Cancel;
        error: DescriptError;
    }) => ErrorResultOut;

    timeout?: number;

    key?: string | ((args: {
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
    }) => string);
    maxage?: number;
    cache?: CacheInterface<BlockResult>;

    required?: boolean;

    logger?: LoggerInterface;
}
