import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: [
            './tests/expect.ts',
        ],
    },
});
