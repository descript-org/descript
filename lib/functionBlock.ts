import BaseBlock from './block';
import type { DepAccessor, DescriptBlockDeps } from './depsDomain';
import DepsDomain, { createDepAccessor } from './depsDomain';
import { createError, ERROR_ID } from './error';
import type { BlockResultOut, DescriptBlockOptions, InferParamsOutFromBlock } from './types';
import type ContextClass from './context';
import type Cancel from './cancel';

export type FunctionBlockDefinition<
    Context,
    Params,
    BlockResult,
> = (args: {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
    dep: DepAccessor;
    generateId: DepsDomain['generateId'];
    cancel: Cancel;
    blockCancel: Cancel;
}) => Promise<BlockResult> | BlockResult;

class FunctionBlock<
    Context,
    ParamsOut,
    BlockResult,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    BeforeResultOut = unknown,
    AfterResultOut = unknown,
    ErrorResultOut = unknown,
    Params = never extends InferParamsOutFromBlock<BlockResult> ? ParamsOut : InferParamsOutFromBlock<BlockResult>,
> extends BaseBlock<
        Context,
        FunctionBlockDefinition<Context, ParamsOut, BlockResult>,
        ParamsOut,
        ResultOut,
        BlockResult,
        BlockResult,

        BeforeResultOut,
        AfterResultOut,
        ErrorResultOut,
        Params
    > {

    protected initBlock(block: FunctionBlockDefinition<Context, ParamsOut, BlockResult>) {
        if (typeof block !== 'function') {
            throw createError({
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be a function',
            });
        }

        super.initBlock(block);
    }

    protected async blockAction({ runContext, blockCancel, cancel, params, context, deps, nParents, depsDomain }: {
        runContext: ContextClass<BlockResult, BlockResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        depsDomain = new DepsDomain(depsDomain);

        const result = await Promise.race([
            this.block({
                blockCancel: blockCancel,
                cancel: cancel,
                params: params,
                context: context,
                deps: deps,
                dep: createDepAccessor(deps),
                generateId: depsDomain.generateId,
            }),
            blockCancel.getPromise(),
        ]) as BlockResult;

        if (result instanceof BaseBlock) {
            return await runContext.run({
                block: result,
                blockCancel: blockCancel.create(),
                depsDomain: depsDomain,
                cancel: cancel,
                params: params,
                context: context,
                nParents: nParents + 1,
            }) as BlockResult;
        }

        return result;
    }

    extend<
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(args: {
        options: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { required: true };
    }): FunctionBlock<Context, ExtendedParamsOut, ExtendedBlockResult, BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { readonly __isRequired: true };
    extend<
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(
        this: FunctionBlock<Context, ParamsOut, BlockResult, ResultOut, BeforeResultOut, AfterResultOut, ErrorResultOut, Params> & { readonly __isRequired: true },
        args: {
            options?: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { required?: true };
        }
    ): FunctionBlock<Context, ExtendedParamsOut, ExtendedBlockResult, BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams> & { readonly __isRequired: true };
    extend<
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = unknown,
        ExtendedAfterResultOut = unknown,
        ExtendedErrorResultOut = unknown,
    >(args: {
        options?: DescriptBlockOptions<Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams>;
    }): FunctionBlock<Context, ExtendedParamsOut, ExtendedBlockResult, BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams>;
    extend({ options }: { options?: any }): any {
        return new FunctionBlock({
            block: this.extendBlock(this.block) as typeof this.block,
            options: this.extendOptions(this.options, options) as typeof options,
        });
    }
}

export default FunctionBlock;
