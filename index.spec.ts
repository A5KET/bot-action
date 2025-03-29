import { ActionBuilder } from './index'


describe(ActionBuilder.name, function () {
    const wildcard = '.*'
    const nameSep = '_'
    const paramSep = ':'
    const patterns = {
        number: '(\\d+)',
        string: '(\\w+)'
    }

    function createBuilder() {
        return new ActionBuilder({
            nameSeparator: nameSep,
            paramSeparator: paramSep
        })
    }

    function regexp(string: string) {
        return `/${string}/`
    }

    function anyNames() {
        return wildcard
    }

    function anyParams() {
        return paramSep + wildcard
    }

    function anyNamesParams() {
        return anyNames() + anyParams()
    }

    let builder = createBuilder()

    afterEach(function () {
        builder = createBuilder()
    })

    describe('#asRegExp', function () {
        it('returns RegExp', function () {
            const res = builder.asRegExp()

            expect(res).toBeInstanceOf(RegExp)
        })
        it('returns regexp for any name and any params', function () {
            const res = String(builder.asRegExp())
            const expected = regexp(`${wildcard}${paramSep}${wildcard}`)

            expect(res).toEqual(expected)
        })

        it('returns regexp with start, end, two names and two params', function () {
            const firstName = 'firstname'
            const secondName = 'secondname'
            const firstParam = 'first'
            const secondParam = 'second'
            const firstParamPattern = patterns['string']
            const secondParamPattern = patterns['number']

            const res = String(
                builder
                    .fromStart()
                    .withName(firstName)
                    .withName(secondName)
                    .withParam(firstParam, 'string')
                    .withParam(secondParam, 'number')
                    .atEnd()
                    .asRegExp()
            )
            const expected = regexp(`^${firstName}${nameSep}${secondName}${paramSep}${firstParamPattern}${paramSep}${secondParamPattern}$`)

            expect(res).toBe(expected)
        })

        it('returns regexp with start, end, one name, any names and one param', function () {
            const name = 'test'
            const param = 'param'
            const pattern = 'string'
            const paramPattern = patterns[pattern]

            const res = String(
                builder
                    .fromStart()
                    .withName(name)
                    .withAnyNames()
                    .withParam(param, pattern)
                    .atEnd()
                    .asRegExp()
            )
            const expected = regexp(`^${name}${nameSep}${wildcard}${paramSep}${paramPattern}$`)

            expect(res).toBe(expected)
        })

        it('returns regexp with start, end, one name, one param and any params', function () {
            const name = 'test'
            const param = 'first'
            const paramType = 'string'
            const paramPattern = patterns[paramType]

            builder


            const res = String(
                builder
                    .fromStart()
                    .withName(name)
                    .withParam(param, paramType)
                    .withAnyParams()
                    .atEnd()
                    .asRegExp()
            )
            const expected = regexp(`^${name}${paramSep}${paramPattern}${anyParams()}$`)

            expect(res).toBe(expected)
        })
    })

    describe('#withName', function () {
        it('throws error if passed name is not a string', function () {
            expect(function () {
                // @ts-expect-error
                builder.withName(12345)
            }).toThrow(Error)
        })

        it('builds regexp with name', function () {
            const name = 'testname'
            const res = String(builder.withName(name).asRegExp())

            expect(res).toBe(regexp(name + anyParams()))
        })

        it('builds regexp with two names and separator', function () {
            const firstName = 'firstname'
            const secondName = 'secondname'
            const res = String(builder.withName(firstName).withName(secondName).asRegExp())

            expect(res).toBe(regexp(firstName + nameSep + secondName + anyParams()))
        })
    })

    describe('#withAnyNames', function () {
        it('returns regexp with wildcard', function () {
            const res = String(builder.withAnyNames().asRegExp())

            expect(res).toBe(regexp(wildcard + anyParams()))
        })
    })

    describe('#withParam', function () {
        it('throws error if param is not a string', function () {
            expect(function () {
                // @ts-expect-error
                builder.withParam(123456789)
            }).toThrow(Error)
        })

        it('throws error if param is not in param patterns', function () {
            expect(function () {
                builder.withParam('test', 'random')
            }).toThrow(Error)
        })
    })

    describe('#withAnyParams', function () {
        it('returns regexp with any names and any params if names were not passed', function () {
            const res = String(builder.withAnyParams().asRegExp())

            expect(res).toBe(regexp(wildcard + paramSep + wildcard))
        })
    })

    describe('#withParamValue', function () {
        it('throws error if type of passed value is not allowed', function () {
            expect(function () {
                // @ts-expect-error
                builder.withParamValue({})
            }).toThrow(Error)
        })
    })

    describe('#fromStart', function () {
        it('returns regexp with start anchor', function () {
            const res = String(builder.fromStart().asRegExp())

            expect(res).toBe(regexp('^' + anyNamesParams()))
        })
    })

    describe('#atEnd', function () {
        it('returns regexp with end anchor', function () {
            const res = String(builder.atEnd().asRegExp())

            expect(res).toBe(regexp(anyNamesParams() + '$'))
        })
    })
})
