import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({

    test: {

        environment: 'jsdom',

        coverage: {

            provider: 'v8',

            reporter: ['lcov'],

            reportsDirectory: './coverage',

            exclude: [
                'node_modules/',
                'coverage/'
            ]
        }
    },

    resolve: {

        alias: {

            '@': path.resolve(__dirname, './js')

        }
    }
})