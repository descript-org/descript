/* eslint-disable no-console */

import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    isMobile: boolean;
}

//  Это параметры, которые приходят в блок извне.
//
interface ParamsIn {
    id: string;
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Вариант 1.

//  * Вычисляем новые параметры.
//  * Обрабатываем результат.
//  * Используем вычисленные параметры.

const block1 = de.http({
    block: {},
    options: {
        //  Имеет смысл сделать явный интерфейс для вычисленных параметров.
        //  Это нужно, если, скажем, в after нужны будут эти параметры.
        //  Если мы просто вернем что-то из options.params, то мы не сможем потом объяснить options.after,
        //  что же за params в него пришли.
        //
        //  Если нам где-то вообще понадобится context, то лучше всего задать его тип здесь.
        //
        params: ({ params }: { params: ParamsIn; context?: Context }) => {
            return {
                foo: params.id,
            };
        },

        //  Тут тип params уже ParamsOut.
        //
        before: ({ params }) => {
            if (!params.foo) {
                //  Мы можем вернуть тот же тип, что возвращает options.after.
                return 'foo';
            }

            //  Или же ничего не возвращать.
        },

        //  Тут мы задаем тип сырого результата.
        //  Если мы здесь хотим использовать params, то нам приходится прописать тип явно.
        //  Typescript не позволяет частично задавать тип при destructure.
        //
        after: ({ result }) => {
            //  Тип для обработанного результата нам в принципе не нужен.
            //  Он выведется из того, что мы вернули.
            //
            return result;
        },
    },
});

de.run(block1, {
    params: {
        id: '12345',
    },
})
    .then((result) => {
        console.log(result);
    });

//  ---------------------------------------------------------------------------------------------------------------  //

//  Вариант 2.

//  * Вычисляем новые параметры.
//  * Обрабатываем результат, но params нам в after не нужны.

const block2 = de.http({
    block: {},
    options: {
        params: ({ params }: { params: ParamsIn; context?: Context }) => {
            return {
                foo: params.id,
            };
        },

        before: ({ params }) => {
            if (!params.foo) {
                return 'foo';
            }
        },

        after: ({ result }) => {
            return result;
        },
    },
});

de.run(block2, {
    params: {
        id: '12345',
    },
})
    .then((result) => {
        console.log(result);
    });

//  ---------------------------------------------------------------------------------------------------------------  //

//  Вариант 3.

//  * Не вычисляем новые параметры.

const block3 = de.http({
    block: {},
    options: {
        // TODO как вывести In из Out?
        // params: ({ params }: { params: ParamsIn }) => params,
        before: ({ params }: { params: ParamsIn }) => {
            if (!params.id) {
                return 'foo';
            }
        },

        //  Где-то нужно объявить тип входящих params.
        //  Например, в after. Или же в before. В зависимости от того, что есть.
        //
        after: ({ params, result }) => {
            params.id;
            return result;
        },
    },
});

de.run(block3, {
    params: {
        id: '12345',
    },
})
    .then((result) => {
        console.log(result);

        return result;
    });

const block4 = de.http({
    block: {
        agent: { maxSockets: 16 },
        maxRetries: 1,
        timeout: 1000,
        body: ({ params }: { params: { p4: number } }) => params,
    },
    options: {
        after: ({ result }: { result: de.DescriptHttpBlockResult<{ r: number }> }) => result.result,
    },
});

de.run(block4, {
    params: {
        p4: 1,
    },
});

const block5 = block4.extend({
    block: {
        body: ({ params }) => params,
    },

    options: {
        after: ({ params }) => params,
    },
});

const block6 = de.object({
    block: {
        block4: block5.extend({
            options: {
                params: ({ params }) => {
                    return {
                        p4: params.p4,
                    };
                },
                // after: ({ result }) => result,
            },
        }),
        block3: block3.extend({}),
    },

    options: {
        after: ({ result }) => {
            return result.block4;
        },
    },
});

de.run(block6, {
    params: {
        p4: 8,
        id: '1',
    },
});

const block7 = de.object({
    block: {
        block6: block6.extend({
            options: {
                params: ({ params }) => {
                    return {
                        p4: params.p4,
                        id: '1',
                        x: 1,
                    };
                },
                // after: ({ result }) => result,
            },
        }),
        block3: block3.extend({}),
    },
    options: {
        after: ({ result }) => {
            return result.block6;
        },
    },
});

de.run(block7, {
    params: {
        p4: 8,
        id: '1',
    },
});

const block8 = de.http({
    block: {
        agent: { maxSockets: 16 },
        maxRetries: 1,
        timeout: 1000,
        body: ({ params }: { params: { p1: number } }) => params,
    },
    options: {
        after: ({ result }: { result: de.DescriptHttpBlockResult<{ r: number }> }) => result.result,
    },
});

const block9 = block8.extend({
    block: {
        body: ({ params }: { params: { p4: number; p1: number } }) => params,
    },

    options: {
        after: ({ params }) => params,
    },
});

de.run(block9, {
    params: {
        p1: 8,
    },
});

const block10 = de.func({
    block: () => {
        return block8;
    },
});

de.run(block10, {
    params: {},
});

export type BlockResultOut<
    Result = never,
    Before = never,
    After = never,
> =
[ After ] extends [ never ] ?
    [ Before ] extends [ never ] ?
        Result :
        Before | Result :
    After;

class Block<
    ResultOut extends BlockResultOut<Result, Before, After>,
    Result = never,
    Before = never,
    After = never,
> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Options<Result, Before, After>) {

    }

    extend<
        ResultOut2 extends BlockResultOut<BlockResult2, Before2, After2>,
        BlockResult2 = ResultOut,
        Before2 = never,
        After2 = never,
    >(options: Options<BlockResult2, Before2, After2>) {
        return new Block<ResultOut2, BlockResult2, Before2, After2>(options);
    };

    run() {
        return 1 as ResultOut;
    }
}

export type InferResultOrResult<Result> = Result extends Block<
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer ResultOut, infer After, infer Before, infer Result
> ? InferResultOrResult<ResultOut> : Result;

type Options<
    Result = never,
    Before = never,
    After = never,
> = {
    block?: () => Result;
    before?: () => Before;
    after?: (
        res: [ Before ] extends [ never ] ?
            InferResultOrResult<Result> : InferResultOrResult<Before> | InferResultOrResult<Result>
    ) => After;
};

const block = <
    ResultOut extends BlockResultOut<Result, Before, After>,
    Result = never,
    Before = never,
    After = never,
>(options: Options<Result, Before, After>) => {
    return new Block<ResultOut, Result, Before, After>(options);
};

type Block11Result = {
    data: { somefield: number } | null;
    errors: Array<string> | null;
};

const b1 = block({
    block: (): Block11Result => {
        return { data: { somefield: 42 }, errors: null };
    },

    after: (res) => res,
});

const b2 = b1.extend({
    after(res) {
        return res.data?.somefield;
    },
});

const b3 = b2.extend({
    after(res) {
        return res;
    },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const r1 = b3.run();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type R = typeof r1; // оно должно стать number | undefined
