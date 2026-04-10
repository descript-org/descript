import CompositeBlock from './compositeBlock';
import { ERROR_ID, createError } from './error';
import type BaseBlock from './block';
import type {
    BlockResultOut,
    First,
    InferResultOrError,
    InferParamsInFromBlock,
    Tail,
    DescriptBlockOptions,
} from './types';

import type ContextClass from './context';
import type Cancel from './cancel';
import type { DescriptBlockDeps } from './depsDomain';
import type DepsDomain from './depsDomain';

type GetPipeBlockParamsMap<T extends ReadonlyArray<unknown>> = {
    [ P in keyof T ]: InferParamsInFromBlock<T[ P ]>;
};

export type GetPipeBlockParamsUnion<T extends ReadonlyArray<unknown>> = {
    0: never;
    1: First<T>;
    2: First<T> & GetPipeBlockParamsUnion<Tail<T>>;
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

export type GetPipeBlockParams<
    T extends ReadonlyArray<unknown>,
    PA extends ReadonlyArray<unknown> = GetPipeBlockParamsMap<T>,
    PU = GetPipeBlockParamsUnion<PA>,
> = PU;

type GetPipeBlockResultUnion<T extends ReadonlyArray<unknown>> = {
    0: never;
    1: InferResultOrError<First<T>>;
    2: InferResultOrError<First<T>> | GetPipeBlockResultUnion<Tail<T>>;
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

export type GetPipeBlockResult<T extends ReadonlyArray<unknown>> =
    GetPipeBlockResultUnion<T>;

export type PipeBlockDefinition<T> = {
    [ P in keyof T ]: T[ P ] extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
        infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
    > ? T[ P ] : never
};

class PipeBlock<
    Context,
    Block extends ReadonlyArray<unknown>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetPipeBlockParams<Block>,
    BlockResult = GetPipeBlockResult<Block>,

    BeforeResultOut = unknown,
    AfterResultOut = unknown,
    ErrorResultOut = unknown,
    Params = GetPipeBlockParams<Block>,
> extends CompositeBlock<
        Context,
        PipeBlockDefinition<Block>,
        ParamsOut,
        ResultOut,
        BlockResult,
        BlockResult,

        BeforeResultOut,
        AfterResultOut,
        ErrorResultOut,
        Params
    > {

    extend<
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(args: {
        options: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { required: true };
    }): PipeBlock<Context, Block, BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { readonly __isRequired: true };
    extend<
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(
        this: PipeBlock<Context, Block, ResultOut, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params> & { readonly __isRequired: true },
        args: {
            options?: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { required?: true };
        }
    ): PipeBlock<Context, Block, BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { readonly __isRequired: true };
    extend<
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(args: {
        options?: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams>;
    }): PipeBlock<Context, Block, BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams>;
    extend({ options }: { options?: any }): any {
        return new PipeBlock({
            block: this.extendBlock(this.block),
            options: this.extendOptions(this.options, options) as typeof options,
        });
    }

    protected initBlock(block: PipeBlockDefinition<Block>) {
        if (!Array.isArray(block)) {
            throw createError({
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be an array',
            });
        }

        super.initBlock(block);
    }

    protected async blockAction({ runContext, blockCancel, cancel, params, context, nParents, depsDomain }: {
        runContext: ContextClass<BlockResult, BlockResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        let result;
        let prev: any = [];

        for (let i = 0; i < this.block.length; i++) {
            const block = this.block[ i ];

            result = await runContext.run({
                block: block,
                blockCancel: blockCancel.create(),
                depsDomain,
                params: params,
                context: context,
                cancel: cancel,
                prev: prev,
                nParents: nParents + 1,
            });

            prev = prev.concat(result);
        }

        return result as BlockResult;
    }

}

export default PipeBlock;
