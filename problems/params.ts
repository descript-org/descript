import * as de from 'descript';

interface ParamsTop {
    param1: string;
    param2: string;
}

interface ParamsResource1 {
    resourceParams: string;
}

const block1 = de.func({
    block: ({ params }: { params: ParamsTop }) => {
        return de.object({
            block: {
                resource1: de.func({
                    block: ({ params }: { params: ParamsResource1 }) => {
                        console.log('params');
                        console.log(params);

                        return 'resource1 result'
                    },
                })
            }
        });
    }
});

de.run(block1, {
    params: {
        param1: 'param1',
        param2: 'param2',
    },
})
    .then((result) => {
        console.log(result);
    });

// ParamsResource1 - контракт при котором будет работать блок resource1.
// Однако нет проверки на то, что эти параметры будут доставлены до этого блока (в моем примере не доставлены)

// Нужно проверять параметры всех parent блоков + их результатов метода options.params, и сравнивать с тем, что нужно для вызова блока. При несоответсвии выдавать ошибку типов