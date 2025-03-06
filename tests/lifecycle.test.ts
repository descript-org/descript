import { describe, expect, it, vi } from 'vitest';

import * as de from '../lib';

describe('lifecycle', () => {

    it('inheritance', async() => {
        let actionResult;
        const actionSpy = vi.fn<(...args: Array<any>) => any>(() => {
            actionResult = {
                a: 1,
            };
            return actionResult;
        });

        let parentParamsResult;
        const parentParamsSpy = vi.fn<(...args: Array<any>) => any>(() => {
            parentParamsResult = {
                b: 2,
            };
            return parentParamsResult;
        });

        const parentBeforeSpy = vi.fn();

        let parentAfterResult;
        const parentAfterSpy = vi.fn<(...args: Array<any>) => any>(() => {
            parentAfterResult = {
                c: 3,
            };
            return parentAfterResult;
        });

        const parent = de.func({
            block: actionSpy,
            options: {
                params: parentParamsSpy,
                before: parentBeforeSpy,
                after: parentAfterSpy,
            },
        });

        let childParamsResult;
        const childParamsSpy = vi.fn<(...args: Array<any>) => any>(() => {
            childParamsResult = {
                d: 4,
            };
            return childParamsResult;
        });

        const childBeforeSpy = vi.fn();

        let childAfterResult;
        const childAfterSpy = vi.fn<(...args: Array<any>) => any>(() => {
            childAfterResult = {
                e: 5,
            };
            return childAfterResult;
        });

        const child = parent.extend({
            options: {
                params: childParamsSpy,
                before: childBeforeSpy,
                after: childAfterSpy,
            },
        });

        const params = {
            foo: 42,
        };
        const result = await de.run(child, { params });

        expect(childParamsSpy.mock.calls[ 0 ][ 0 ].params).toBe(params);
        expect(childBeforeSpy.mock.calls[ 0 ][ 0 ].params).toBe(childParamsResult);
        expect(parentParamsSpy.mock.calls[ 0 ][ 0 ].params).toBe(childParamsResult);
        expect(parentBeforeSpy.mock.calls[ 0 ][ 0 ].params).toBe(parentParamsResult);
        expect(actionSpy.mock.calls[ 0 ][ 0 ].params).toBe(parentParamsResult);
        expect(parentAfterSpy.mock.calls[ 0 ][ 0 ].params).toBe(parentParamsResult);
        expect(parentAfterSpy.mock.calls[ 0 ][ 0 ].result).toBe(actionResult);
        expect(childAfterSpy.mock.calls[ 0 ][ 0 ].params).toBe(childParamsResult);
        expect(childAfterSpy.mock.calls[ 0 ][ 0 ].result).toBe(parentAfterResult);
        expect(result).toBe(childAfterResult);
    });

});
