export type Equals<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? true : false


export interface ActionBuilderOptions {
    nameSeparator: string
    paramSeparator: string
    matchedParamOrderOffset: number
}


export interface ActionBuilderState<P extends Record<string, any>> {
    readonly names: readonly string[]
    readonly params: { [K in keyof P]: ActionBuilderParam<P[K]> }
    readonly isAnyNames: boolean
    readonly isAnyParams: boolean
    readonly isFromStart: boolean
    readonly isAtEnd: boolean
}


export interface ActionBuilderParam<V = any> {
    readonly name: string
    readonly order: number
    readonly pattern: string
    readonly value?: V
}


const defaultActionBuilderState: ActionBuilderState<Record<string, any>> = {
    names: [],
    params: {},
    isAnyNames: false,
    isAnyParams: false,
    isFromStart: false,
    isAtEnd: false
} as const


const defaultOptions: ActionBuilderOptions = {
    nameSeparator: '_',
    paramSeparator: ':',
    matchedParamOrderOffset: 1,
}


export class ActionBuilder<
    P extends Record<string, any> = Record<never, any>
> {
    protected readonly options: ActionBuilderOptions
    protected readonly state: ActionBuilderState<P>
    constructor(
        options: Partial<ActionBuilderOptions> = {},
        state: Partial<ActionBuilderState<P>> = {}
    ) {
        this.options = { ...defaultOptions, ...options }
        this.state = { ...defaultActionBuilderState, ...state } as ActionBuilderState<P>
    }

    protected getNextParamOrderCounter() {
        const params = this.state.params
        const currentMaxOrder = Object.values(params).reduce((prev, cur) => Math.max(prev, cur.order), this.options.matchedParamOrderOffset - 1)

        return currentMaxOrder + 1
    }

    new<NP extends Record<string, any> = P>(state: ActionBuilderState<NP>) {
        return new ActionBuilder<NP>(this.options, state)
    }

    withName(name: string) {
        if (typeof name !== 'string') {
            throw new Error(`Action name should be a string. Received "${typeof name}"`)
        }

        return this.new({
            ...this.state,
            names: [...this.state.names, name]
        })
    }

    withRootName(name: string) {
        if (typeof name !== 'string') {
            throw new Error(`Action name should be a string. Received "${typeof name}"`)
        }

        return this.new({
            ...this.state,
            names: [name, ...this.state.names]
        })
    }

    withAnyNames() {
        return this.new({
            ...this.state,
            isAnyNames: true
        })
    }

    withParam<K extends string>(param: K, pattern: string) {
        const paramState: ActionBuilderParam = {
            name: param,
            pattern,
            order: this.getNextParamOrderCounter()
        }

        return this.new<
            Equals<P, Record<never, any>> extends true
            ? Record<K, any>
            : P & Record<K, any>
        >({
            ...this.state,
            params: {
                ...this.state.params,
                [param]: paramState
            }
        })
    }

    getParam<K extends keyof P>(param: K) {
        return this.state.params[param]
    }

    getParamOrder<K extends keyof P>(param: K) {
        const paramState = this.state.params[param]

        if (!paramState) {
            throw new Error(`Unknown param name. Received "${String(param)}"`)
        }

        return paramState.order
    }

    getParamValue<K extends keyof P>(param: K) {
        return this.state.params[param]?.value
    }

    withParamValue<K extends keyof P, V extends P[K]>(param: K, value: V) {
        const paramState = this.state.params[param]

        if (!paramState) {
            throw new Error(`Unknown param name. Received "${String(param)}"`)
        }

        return this.new<P>({
            ...this.state,
            params: {
                ...this.state.params,
                [param]: {
                    ...paramState,
                    value
                }
            }
        })
    }

    withParamPattern<K extends keyof P>(param: K, pattern: string) {
        const paramState = this.state.params[param]

        if (!paramState) {
            throw new Error(`Unknown param name. Received "${String(param)}"`)
        }

        return this.new<P>({
            ...this.state,
            params: {
                ...this.state.params,
                [param]: {
                    ...paramState,
                    pattern
                }
            }
        })
    }

    hasParam<K extends keyof P | string>(param: K): this is ActionBuilder<Equals<P, Record<never, any>> extends true ? Record<K, any> : P & Record<K, any>> {
        return param in this.state.params
    }

    withAnyParams() {
        return this.new({
            ...this.state,
            isAnyParams: true
        })
    }

    fromStart() {
        return this.new({
            ...this.state,
            isFromStart: true
        })
    }

    atEnd() {
        return this.new({
            ...this.state,
            isAtEnd: true
        })
    }

    asRegExp() {
        const wildcard = '.*'
        const nameSeparator = this.options.nameSeparator
        const paramSeparator = this.options.paramSeparator
        const names = [...this.state.names]
        const paramPatterns = Object.values<ActionBuilderParam>(this.state.params)
            .sort((a, b) => a.order - b.order)
            .map(param => param.pattern)

        if (this.state.isAnyNames || names.length < 1) {
            names.push(wildcard)
        }

        if (this.state.isAnyParams || paramPatterns.length < 1) {
            paramPatterns.push(wildcard)
        }

        const completeName = names.join(nameSeparator)
        const completeParams = paramPatterns.join(paramSeparator)
        const pattern = `${this.state.isFromStart ? '^' : ''}${completeName}${paramSeparator}${completeParams}${this.state.isAtEnd ? '$' : ''}`

        return new RegExp(pattern)
    }

    asAction() {
        const params = this.state.params

        for (const param of Object.values<ActionBuilderParam>(params)) {
            if (param.value === undefined) {
                throw new Error(`Unset action param "${param.name}"`)
            }
        }

        const actionName = this.state.names.join(this.options.nameSeparator)

        const paramValues = Object.values(params)
            .sort((a, b) => a.order - b.order)
            .map(param => param.value)
            .join(this.options.paramSeparator)

        return `${actionName}${this.options.paramSeparator}${paramValues}`
    }
}
