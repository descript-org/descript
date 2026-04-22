import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import http from 'node:http';

import * as de from '../lib';
import { DescriptError } from '../lib';
import { getPath } from './helpers';
import Server from './server';
import type { Expect, TypesMatch } from './test.types';

const PORT = 10000;
const fake = new Server({
    module: http,
    listen_options: {
        hostname: 'localhost',
        port: PORT,
    },
});

beforeAll(() => fake.start());
afterAll(() => fake.stop());

describe('options.required', () => {
    it('not fail for required=false', async() => {
        const block = de.object({
            block: {
                foo: de.func({
                    block: () => {
                        throw new Error('ERROR');
                    },
                    options: {
                        required: false,
                    },
                }),
            },
        });

        await expect(de.run(block))
            .resolves.toMatchObject({
                foo: expect.any(DescriptError),
            });
    });

    it('fail for required=true', async() => {
        const block = de.object({
            block: {
                foo: de.func({
                    block: () => {
                        throw new Error('ERROR');
                    },
                    options: {
                        required: true,
                    },
                }),
            },
        });

        await expect(de.run(block))
            .rejects.toMatchObject({
                error: { id: 'REQUIRED_BLOCK_FAILED' },
            });
    });

    it('required=true for parent=undefined and child=true', async() => {
        const path = getPath();
        const spy = vi.fn((req, res) => res.end());
        fake.add(path, spy);

        const parent = de.http({
            block: {
                hostname: 'localhost',
                port: 10000,
                pathname: path,
                prepareRequestOptions: (requestOptions, blockOptions) => {
                    requestOptions.headers = requestOptions.headers || {};
                    requestOptions.headers[ 'x-required-header' ] = blockOptions.required ? 'true' : 'false';
                    return requestOptions;
                },
            },
        });
        const child = parent.extend({
            options: {
                required: true,
            },
        });

        await de.run(child);

        const childHeaders = spy.mock.calls[ 0 ][ 0 ].headers;
        expect(childHeaders[ 'x-required-header' ]).toBe('true');
    });

    it('required=false for parent=true and child=false', async() => {
        const path = getPath();
        const spy = vi.fn((req, res) => res.end());
        fake.add(path, spy);

        const parent = de.http({
            block: {
                hostname: 'localhost',
                port: 10000,
                pathname: path,
                prepareRequestOptions: (requestOptions, blockOptions) => {
                    requestOptions.headers = requestOptions.headers || {};
                    requestOptions.headers[ 'x-required-header' ] = blockOptions.required ? 'true' : 'false';
                    return requestOptions;
                },
            },
            options: {
                required: true,
            },
        });
        const child = parent.extend({
            options: {
                required: false,
            },
        });

        await de.run(child);

        const childHeaders = spy.mock.calls[ 0 ][ 0 ].headers;
        expect(childHeaders[ 'x-required-header' ]).toBe('false');
    });

    it('required=true for parent=true and child=undefined', async() => {
        const path = getPath();
        const spy = vi.fn((req, res) => res.end());
        fake.add(path, spy);

        const parent = de.http({
            block: {
                hostname: 'localhost',
                port: 10000,
                pathname: path,
                prepareRequestOptions: (requestOptions, blockOptions) => {
                    requestOptions.headers = requestOptions.headers || {};
                    requestOptions.headers[ 'x-required-header' ] = blockOptions.required ? 'true' : 'false';
                    return requestOptions;
                },
            },
            options: {
                required: true,
            },
        });
        const child = parent.extend({});

        await de.run(child);

        const childHeaders = spy.mock.calls[ 0 ][ 0 ].headers;
        expect(childHeaders[ 'x-required-header' ]).toBe('true');
    });

    it('required=true for parent=false and child=true', async() => {
        const path = getPath();
        const spy = vi.fn((req, res) => res.end());
        fake.add(path, spy);

        const parent = de.http({
            block: {
                hostname: 'localhost',
                port: 10000,
                pathname: path,
                prepareRequestOptions: (requestOptions, blockOptions) => {
                    requestOptions.headers = requestOptions.headers || {};
                    requestOptions.headers[ 'x-required-header' ] = blockOptions.required ? 'true' : 'false';
                    return requestOptions;
                },
            },
            options: {
                required: false,
            },
        });
        const child = parent.extend({
            options: {
                required: true,
            },
        });

        await de.run(child);

        const childHeaders = spy.mock.calls[ 0 ][ 0 ].headers;
        expect(childHeaders[ 'x-required-header' ]).toBe('true');
    });

    it('types: required=true removes DescriptError from object block result', async() => {
        const block = de.object({
            block: {
                foo: de.func({
                    block: () => 42,
                    options: {
                        required: true,
                    },
                }),
                bar: de.func({
                    block: () => 'hello',
                    options: {
                        required: true,
                    },
                }),
            },
        });

        const result = await de.run(block, { params: {} });

        expect(result.foo).toBe(42);
        expect(result.bar).toBe('hello');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type Tests = [
            Expect<TypesMatch<typeof result, { foo: number; bar: string }>>,
        ];
    });

    it('types: required=false keeps DescriptError in object block result', async() => {
        const block = de.object({
            block: {
                foo: de.func({
                    block: () => 42,
                    options: {
                        required: false,
                    },
                }),
            },
        });

        const result = await de.run(block, { params: {} });

        expect(result.foo).toBe(42);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type Tests = [
            Expect<TypesMatch<typeof result, { foo: number | DescriptError }>>,
        ];
    });
});
