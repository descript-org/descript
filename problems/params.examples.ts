/**
 * Примеры для проблемы типизации params.ts
 *
 * Здесь собраны сценарии, которые ДОЛЖНЫ и НЕ ДОЛЖНЫ работать.
 * Сейчас TypeScript не ловит ошибочные случаи — это то, что нужно починить.
 *
 * Запуск проверки типов: npx tsc --noEmit
 */

import * as de from '../lib';

// =============================================================================
// Вспомогательные типы
// =============================================================================

interface ParamsA {
    a: string;
}

interface ParamsB {
    b: number;
}

interface ParamsAB {
    a: string;
    b: number;
}

interface ParamsABC {
    a: string;
    b: number;
    c: boolean;
}

// =============================================================================
// 1. БАЗОВЫЙ СЛУЧАЙ — возврат одного блока из de.func
// =============================================================================

// [VALID] params родителя содержит всё, что нужно дочернему блоку
const _case1_valid = de.func({
    block: ({ params }: { params: ParamsAB }) => {
        return de.http({
            block: {
                pathname: ({ params }: { params: ParamsA }) => `/resource/${params.a}`,
            },
        });
    },
});

// [INVALID] params родителя не содержит то, что нужно дочернему блоку
// Сейчас: TypeScript НЕ ругается. ДОЛЖЕН ругаться.
const _case1_invalid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        // ParamsA = { a: string }, но дочерний блок требует ParamsB = { b: number }
        return de.http({
            block: {
                pathname: ({ params }: { params: ParamsB }) => `/resource/${params.b}`,
            },
        });
    },
});

// =============================================================================
// 2. МОСТ ЧЕРЕЗ options.params — родитель трансформирует params для дочернего
// =============================================================================

// [VALID] options.params преобразует ParamsA → ParamsB
const _case2_valid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        return de.http({
            block: {
                pathname: ({ params }: { params: ParamsB }) => `/resource/${params.b}`,
            },
            options: {
                params: ({ params }: { params: ParamsA }): ParamsB => ({
                    b: params.a.length,
                }),
            },
        });
    },
});

// =============================================================================
// 3. de.object — пересечение params всех дочерних блоков
// =============================================================================

const blockNeedsA = de.http({
    block: {
        pathname: ({ params }: { params: ParamsA }) => `/a/${params.a}`,
    },
});

const blockNeedsB = de.http({
    block: {
        pathname: ({ params }: { params: ParamsB }) => `/b/${params.b}`,
    },
});

// [VALID] родитель даёт ParamsAB, object требует ParamsA & ParamsB = ParamsAB
const _case3_valid = de.func({
    block: ({ params }: { params: ParamsAB }) => {
        return de.object({
            block: {
                resA: blockNeedsA,
                resB: blockNeedsB,
            },
        });
    },
});

// [INVALID] родитель даёт только ParamsA, но object требует ParamsA & ParamsB
// Сейчас: TypeScript НЕ ругается. ДОЛЖЕН ругаться.
const _case3_invalid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        return de.object({
            block: {
                resA: blockNeedsA,
                resB: blockNeedsB, // требует ParamsB, которых нет в ParamsA
            },
        });
    },
});

// =============================================================================
// 4. de.array
// =============================================================================

// [VALID] родитель даёт ParamsAB, array требует ParamsA & ParamsB = ParamsAB
const _case4_valid = de.func({
    block: ({ params }: { params: ParamsAB }) => {
        return de.array({
            block: [ blockNeedsA, blockNeedsB ] as const,
        });
    },
});

// [INVALID] родитель даёт только ParamsA, array требует ParamsA & ParamsB
// Сейчас: TypeScript НЕ ругается. ДОЛЖЕН ругаться.
const _case4_invalid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        return de.array({
            block: [ blockNeedsA, blockNeedsB ] as const,
        });
    },
});

// =============================================================================
// 5. de.first
// =============================================================================

// [VALID] родитель даёт ParamsAB, first требует ParamsA & ParamsB
const _case5_valid = de.func({
    block: ({ params }: { params: ParamsAB }) => {
        return de.first({
            block: [ blockNeedsA, blockNeedsB ] as const,
        });
    },
});

// [INVALID] родитель даёт только ParamsB, first требует ParamsA & ParamsB
// Сейчас: TypeScript НЕ ругается. ДОЛЖЕН ругаться.
const _case5_invalid = de.func({
    block: ({ params }: { params: ParamsB }) => {
        return de.first({
            block: [ blockNeedsA, blockNeedsB ] as const,
        });
    },
});

// =============================================================================
// 6. de.pipe
// =============================================================================

// [VALID] родитель даёт ParamsAB, pipe требует ParamsA & ParamsB
const _case6_valid = de.func({
    block: ({ params }: { params: ParamsAB }) => {
        return de.pipe({
            block: [ blockNeedsA, blockNeedsB ] as const,
        });
    },
});

// [INVALID] родитель даёт только ParamsA, pipe требует ParamsA & ParamsB
// Сейчас: TypeScript НЕ ругается. ДОЛЖЕН ругаться.
const _case6_invalid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        return de.pipe({
            block: [ blockNeedsA, blockNeedsB ] as const,
        });
    },
});

// =============================================================================
// 7. ВЛОЖЕННЫЕ de.func — каждый уровень проверяется независимо
// =============================================================================

// [VALID] каждый уровень передаёт достаточно params следующему
const _case7_valid = de.func({
    block: ({ params }: { params: ParamsABC }) => {
        return de.func({
            block: ({ params }: { params: ParamsAB }) => {
                return de.http({
                    block: {
                        pathname: ({ params }: { params: ParamsA }) => `/a/${params.a}`,
                    },
                });
            },
        });
    },
});

// [INVALID] средний уровень получает ParamsA, но возвращает блок требующий ParamsAB
const _case7_invalid = de.func({
    block: ({ params }: { params: ParamsABC }) => {
        // внешний func даёт ParamsABC → вложенному func → OK (ParamsABC extends ParamsA)
        return de.func({
            block: ({ params }: { params: ParamsA }) => {
                // средний func имеет только ParamsA, но возвращает блок требующий ParamsAB
                return de.http({
                    block: {
                        pathname: ({ params }: { params: ParamsAB }) => `/ab/${params.a}/${params.b}`,
                    },
                });
            },
        });
    },
});

// =============================================================================
// 8. CORNER CASE: блок без params (unknown / never)
// =============================================================================

const blockNoParams = de.http({
    block: {
        hostname: 'example.com',
        pathname: '/static',
    },
});

// [VALID] дочерний блок вообще не требует params — любой родитель совместим
const _case8_valid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        return blockNoParams; // не требует никаких params
    },
});

// =============================================================================
// 9. CORNER CASE: суперсет params — родитель даёт больше, чем нужно
// =============================================================================

// [VALID] родитель даёт ParamsABC, дочерний требует только ParamsA — OK (суперсет)
const _case9_valid = de.func({
    block: ({ params }: { params: ParamsABC }) => {
        return de.http({
            block: {
                pathname: ({ params }: { params: ParamsA }) => `/a/${params.a}`,
            },
        });
    },
});

// =============================================================================
// 10. CORNER CASE: опциональные поля
// =============================================================================

interface ParamsOptional {
    required: string;
    optional?: number;
}

interface ParamsOnlyRequired {
    required: string;
}

// [VALID] дочерний блок требует { required, optional? } — родитель с { required } подходит,
// так как optional опционален
const _case10_valid = de.func({
    block: ({ params }: { params: ParamsOnlyRequired }) => {
        return de.http({
            block: {
                pathname: ({ params }: { params: ParamsOptional }) => `/r/${params.required}`,
            },
        });
    },
});

// =============================================================================
// 11. CORNER CASE: динамический выбор блока (union return type)
// =============================================================================

const blockNeedsA_func = de.http({
    block: { pathname: ({ params }: { params: ParamsA }) => `/a/${params.a}` },
});
const blockNeedsB_func = de.http({
    block: { pathname: ({ params }: { params: ParamsB }) => `/b/${params.b}` },
});

// [VALID] родитель даёт ParamsAB — совместим с blockNeedsA (ParamsA ⊆ ParamsAB)
const _case11_valid = de.func({
    block: (args: { params: ParamsAB }) => {
        void args;
        return blockNeedsA_func;
    },
});

// [VALID] родитель даёт ParamsAB — совместим с blockNeedsB (ParamsB ⊆ ParamsAB)
void de.func({
    block: (args: { params: ParamsAB }) => {
        void args;
        return blockNeedsB_func;
    },
});

// KNOWN LIMITATION: union return (ternary) с conditional constraint.
// TypeScript инферит BlockResult из одного operand тернарного оператора,
// из-за чего constraint ожидает только один тип в return, а не union.
// Работает только однотипный возврат (выше), не union return.

// [INVALID] родитель даёт ParamsA — совместим с blockNeedsA, но НЕ с blockNeedsB
// При ternary TypeScript инферит BlockResult как union → constraint проверяет каждую ветку
const _case11_invalid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        // DescriptParamsError: blockNeedsB_func требует ParamsB, а ParamsA его не содержит
        return params.a === 'special' ? blockNeedsA_func : blockNeedsB_func;
    },
});

// =============================================================================
// 12. CORNER CASE: de.func возвращает не блок, а значение (не BaseBlock)
// =============================================================================

// [VALID] func возвращает примитив — params вообще не передаются никуда дальше,
// ограничение не нужно
const _case12_valid = de.func({
    block: ({ params }: { params: ParamsA }) => {
        return `result: ${params.a}`;
    },
});

// =============================================================================
// 13. CORNER CASE: de.run — финальная проверка совместимости params
// =============================================================================

const blockTopLevel = de.func({
    block: ({ params }: { params: ParamsAB }) => {
        return de.http({
            block: {
                pathname: ({ params }: { params: ParamsAB }) => `/ab/${params.a}/${params.b}`,
            },
        });
    },
});

// [VALID] передаём полные params
de.run(blockTopLevel, {
    params: { a: 'hello', b: 42 },
});

// [INVALID] передаём неполные params — TypeScript уже ловит это на уровне de.run
de.run(blockTopLevel, {
    params: { a: 'hello' },
});


// =============================================================================
// 14. CORNER CASE: de.object с options.params который возвращает меньше чем нужно детям
// =============================================================================

// [VALID] options.params возвращает ParamsA & ParamsB — достаточно для обоих детей
const _case14_valid = de.object({
    options: {
        params: ({ params }: { params: { source: string } }): ParamsAB => ({
            a: params.source,
            b: params.source.length,
        }),
    },
    block: {
        resA: blockNeedsA,
        resB: blockNeedsB,
    },
});

// [INVALID] options.params возвращает только ParamsA, но resB требует ParamsB
const _case14_invalid = de.object({
    options: {
        params: ({ params }: { params: ParamsA }) => {
            return params; // возвращает ParamsA, но нужно ParamsA & ParamsB
        },
    },
    block: {
        resA: blockNeedsA,
        resB: blockNeedsB,
    },
});

const block1 = de.http({
    block: {
        pathname: () => `/resource/`,
    },
    options: {
        params: ({ params }: { params: { id1: number } }) => {
            return params;
        },
    }
})

const block2 = de.http({
    block: {
        pathname: () => `/resource/`,
    },
    options: {
        params: ({ params }: { params: { id2: number } }) => {
            return params;
        },
    }
})


const block2Func = de.func({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    block: ({ params }: { params: { id1: number } }) => {
        return block2.extend({
            options: {
                params: () => {
                    if (params.id1 > 10) {
                        return ({ id2: params.id1 });
                    }

                    return { id2: 1 };
                },
            },
        });
    },
});


const block2Func = de.func({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    block: ({ params }: { params: { id1: number }}) => {
        if (params.id1 === 12345) {
            return block2;
        }

        return block1;
    },
});

