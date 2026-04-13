/**
 * Примеры для проблемы типизации deps.prev в de.pipe
 *
 * deps.prev — массив результатов предыдущих блоков в пайпе.
 * Каждый следующий блок получает его через deps.prev в callbacks (before/after/params/error).
 *
 * Проблема двухуровневая:
 *   1. deps.prev не объявлен в типе DescriptBlockDeps вообще (TS ругается на обращение)
 *   2. Даже если обойти это через (deps as any).prev — тип будет any, без проверок
 *
 * Запуск проверки типов: npx tsc --noEmit
 */

import * as de from '../lib';

// =============================================================================
// Вспомогательные типы результатов блоков
// =============================================================================

interface UserResult {
    id: number;
    name: string;
}

interface OrderResult {
    orderId: string;
    total: number;
}

// Блок 1: возвращает UserResult
const fetchUser = de.http({
    block: { pathname: '/user' },
    options: {
        after: () => ({ id: 1, name: 'Alice' } as UserResult),
    },
});

// Блок 2: возвращает OrderResult
const fetchOrder = de.http({
    block: { pathname: '/order' },
    options: {
        after: () => ({ orderId: 'ORD-42', total: 100 } as OrderResult),
    },
});

// =============================================================================
// ПРОБЛЕМА 1: deps.prev не существует в типе DescriptBlockDeps
// =============================================================================
//
// DescriptBlockDeps = Record<symbol, any>
// Поле prev устанавливается в рантайме через @ts-ignore (см. block.ts:252-254),
// но в типах оно не объявлено — TypeScript не знает о его существовании.

const blockA = de.http({
    block: { pathname: '/a' },
    options: {
        before: ({ deps }) => {
            // [COMPILE ERROR] Property 'prev' does not exist on type 'DescriptBlockDeps'
            // TypeScript прав — поле не объявлено. Но оно ЕСТЬ в рантайме!
            //
            deps.prev; // <-- раскомментировать, чтобы увидеть ошибку

            void deps;
        },
    },
});

// =============================================================================
// ПРОБЛЕМА 2: единственный способ добраться до deps.prev — это (deps as any).prev
// После этого все проверки типов отключаются
// =============================================================================

const summarize = de.http({
    block: { pathname: '/summary' },
    options: {
        // Этот блок стоит третьим в пайпе: [fetchUser, fetchOrder, summarize]
        // deps.prev должен быть [UserResult, OrderResult], но TypeScript об этом не знает
        before: ({ deps }) => {
            // Разработчик вынужден кастить, чтобы вообще получить доступ к prev
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            const prev = (deps as any).prev as unknown[];

            // =================================================================
            // После каста — никаких проверок, все ошибки ниже молчат:
            // =================================================================

            // [INVALID] несуществующее поле — нет ошибки
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bad1 = (prev[ 0 ] as any).nonExistentField;

            // [INVALID] перепутан индекс: prev[0] — UserResult, у него нет orderId
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bad2 = (prev[ 0 ] as any).orderId;

            // [INVALID] индекс за пределами массива (пайп из 3 блоков, prev.length max = 2)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bad3 = (prev[ 5 ] as any).id;

            // [INVALID] присваиваем OrderResult переменной типа UserResult — нет ошибки
            const bad4: UserResult = prev[ 1 ] as UserResult;

            // =================================================================
            // Как должно работать при правильной типизации:
            // =================================================================
            //
            // prev[0]               → тип UserResult  ✓
            // prev[0].name          → string           ✓
            // prev[0].orderId       → TS ERROR: не существует на UserResult
            // prev[1]               → тип OrderResult  ✓
            // prev[1].total         → number           ✓
            // prev[5]               → TS ERROR: tuple length is 2
            // const x: UserResult = prev[1] → TS ERROR: OrderResult не совместим

            void bad1;
            void bad2;
            void bad3;
            void bad4;
        },
    },
});

// =============================================================================
// ПРОБЛЕМА 3: блок с deps.prev поставлен не на то место в пайпе
// TypeScript никак не защищает от неправильного порядка
// =============================================================================

const blockExpectsUserFirst = de.http({
    block: { pathname: '/check' },
    options: {
        before: ({ deps }) => {
            // Разработчик ожидает UserResult на позиции 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prev = (deps as any).prev as [ UserResult, OrderResult ];
            const user = prev[ 0 ]; // ожидает UserResult
            // undefined в рантайме — блок стоит ПЕРВЫМ, prev === []
            void user;
        },
    },
});

// [INVALID] blockExpectsUserFirst стоит первым — deps.prev будет пустым массивом [].
// Должна быть ошибка типа: блок ожидает prev[0] = UserResult, но он первый в пайпе.
// TypeScript не ругается.
const _wrong_pipe = de.pipe({
    block: [
        blockExpectsUserFirst, // prev = [] — краш в рантайме
        fetchUser,
        fetchOrder,
    ] as const,
});

// [VALID] правильный порядок
const _correct_pipe = de.pipe({
    block: [
        fetchUser, // prev = []
        fetchOrder, // prev = [UserResult]
        summarize, // prev = [UserResult, OrderResult]
    ] as const,
});

void blockA;
void _wrong_pipe;
void _correct_pipe;
