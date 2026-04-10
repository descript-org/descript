import CompositeBlock from './compositeBlock';
import { ERROR_ID, createError } from './error';
import type { DescriptError } from './error';
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

type GetFirstBlockParamsMap<T extends ReadonlyArray<unknown>> = {
    [ P in keyof T ]: InferParamsInFromBlock<T[ P ]>;
};

export type GetFirstBlockParamsUnion<T extends ReadonlyArray<unknown>> = {
    0: never;
    1: First<T>;
    2: First<T> & GetFirstBlockParamsUnion<Tail<T>>;
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

export type GetFirstBlockParams<
    T extends ReadonlyArray<unknown>,
    PA extends ReadonlyArray<unknown> = GetFirstBlockParamsMap<T>,
    PU = GetFirstBlockParamsUnion<PA>,
> = PU;

type GetFirstBlockResultUnion<T extends ReadonlyArray<unknown>> = {
    0: never;
    1: InferResultOrError<First<T>>;
    2: InferResultOrError<First<T>> | GetFirstBlockResultUnion<Tail<T>>;
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

export type GetFirstBlockResult<T extends ReadonlyArray<unknown>> =
    GetFirstBlockResultUnion<T>;

export type FirstBlockDefinition<T> = {
    [ P in keyof T ]: T[ P ] extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
        infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
    > ? T[ P ] : never
};

class FirstBlock<
    Context,
    Block extends ReadonlyArray<unknown>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetFirstBlockParams<Block>,
    BlockResult = GetFirstBlockResult<Block>,

    BeforeResultOut = unknown,
    AfterResultOut = unknown,
    ErrorResultOut = unknown,
    Params = GetFirstBlockParams<Block>,
> extends CompositeBlock<
        Context,
        FirstBlockDefinition<Block>,
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
        ExtendedResultOut extends BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>,
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(args: {
        options: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { required: true };
    }): FirstBlock<Context, Block, ExtendedResultOut, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { readonly __isRequired: true };
    extend<
        ExtendedResultOut extends BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>,
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(
        this: FirstBlock<Context, Block, ResultOut, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params> & { readonly __isRequired: true },
        args: {
            options?: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { required?: true };
        }
    ): FirstBlock<Context, Block, ExtendedResultOut, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { readonly __isRequired: true };
    extend<
        ExtendedResultOut extends BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>,
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(args: {
        options?: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams>;
    }): FirstBlock<Context, Block, ExtendedResultOut, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams>;
    extend({ options }: { options?: any }): any {
        return new FirstBlock({
            block: this.extendBlock(this.block),
            options: this.extendOptions(this.options, options) as typeof options,
        });
    }

    protected initBlock(block: FirstBlockDefinition<Block>) {
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
        let prev: Array<DescriptError> = [];

        for (let i = 0; i < this.block.length; i++) {
            const block = this.block[ i ];

            try {
                const result = await runContext.run({
                    block: block,
                    blockCancel: blockCancel.create(),
                    depsDomain,
                    params: params,
                    context: context,
                    cancel: cancel,
                    prev: prev,
                    nParents: nParents + 1,
                });

                return result as Promise<BlockResult>;

            } catch (e) {
                prev = prev.concat(e);
            }
        }

        throw createError({
            id: ERROR_ID.ALL_BLOCKS_FAILED,
            reason: prev,
        });
    }
}

export default FirstBlock;
