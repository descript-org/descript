declare const __covariant: unique symbol;
declare const __contravariant: unique symbol;
declare const __untyped: unique symbol;

export type DescriptBlockId<T = unknown> = symbol & {
    readonly [__covariant]: T;
    [__contravariant]: (_: T) => void;
};

export type UntypedId = symbol & { readonly [__untyped]: true };

type BlockResultOf<B> = B extends { readonly __resultType: infer R } ? R : unknown;

export type GenerateId = {
    <B extends { readonly __resultType: any }>(block: B): DescriptBlockId<BlockResultOf<B>>;
    (label?: string): UntypedId;
    <T>(label?: string): DescriptBlockId<T>;
};

export type DescriptBlockDeps = Record<symbol, any>;

export function dep<T>(deps: DescriptBlockDeps, id: DescriptBlockId<T>): T;
export function dep(deps: DescriptBlockDeps, id: UntypedId): unknown;
export function dep(deps: DescriptBlockDeps, id: symbol): unknown {
    return deps[ id ];
}

export type DepAccessor = {
    <T>(id: DescriptBlockId<T>): T;
    (id: UntypedId): unknown;
};

export function createDepAccessor(deps: DescriptBlockDeps): DepAccessor {
    return ((id: symbol) => deps[ id ]) as DepAccessor;
}

class DepsDomain {
    ids: Record<symbol, boolean>;

    constructor(parent: any) {
        this.ids = (parent instanceof DepsDomain) ? Object.create(parent.ids) : {};
    }

    // Runtime ignores the block argument (used only for type inference).
    // Symbol label is taken from a string arg or left undefined.
    generateId: GenerateId = ((blockOrLabel?: any): DescriptBlockId<any> => {
        const label = typeof blockOrLabel === 'string' ? blockOrLabel : undefined;
        const id = Symbol(label) as DescriptBlockId<any>;
        this.ids[ id ] = true;
        return id;
    }) as GenerateId;

    isValidId(id: symbol): boolean {
        return Boolean(this.ids[ id ]);
    }
}

export default DepsDomain;
