/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+.tsx?$': ['ts-jest', {}],
    },
    watch: false,
    roots: ['<rootDir>'],
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/'
    ]
}