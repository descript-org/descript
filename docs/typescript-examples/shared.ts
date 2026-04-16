import * as de from '../../lib';

export interface ParamsA {
    a: string;
}

export interface ParamsB {
    b: number;
}

export interface ParamsAB {
    a: string;
    b: number;
}

export const blockNeedsA = de.http({
    block: {
        pathname: ({ params }: { params: ParamsA }) => `/a/${ params.a }`,
    },
});

export const blockNeedsB = de.http({
    block: {
        pathname: ({ params }: { params: ParamsB }) => `/b/${ params.b }`,
    },
});

export const blockNeedsAB = de.http({
    block: {
        pathname: ({ params }: { params: ParamsAB }) => `/b/${ params.b }/${ params.a }`,
    },
});
