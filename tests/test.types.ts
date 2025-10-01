// https://frontendmasters.com/blog/testing-types-in-typescript/

export type Expect<T extends true> = T;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Not<T extends false> = true;

export type ShapesMatch<T, U> = [T] extends [U]
    ? [U] extends [T]
        ? true
        : false
    : false;

export type TypesMatch<T, U> = ShapesMatch<T, U> extends true
    ? ShapesMatch<keyof T, keyof U> extends true
        ? true
        : false
    : false;
