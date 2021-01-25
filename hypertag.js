const Hypertag = {
    storage: {},

    tokenize (text) {
        const tokens = []
        let textToken = ''

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{' || text[i] === '}') {
                if (text[i - 1] === '\\') {
                    textToken += text[i]
                    continue
                }
                if (textToken !== '') {
                    tokens.push(textToken)
                    textToken = ''
                }
                tokens.push(text[i])
            }
            else if (text[i] === ';') {
                if (text[i - 1] === '\\') {
                    textToken += ';'
                    continue
                }
                if (textToken !== '') {
                    tokens.push(textToken)
                    textToken = ''
                }
            }
            else if (text[i] === '\\') {
                if (text[i - 1] === '\\') {
                    textToken += '\\'
                }
                continue
            }
            else {
                textToken += text[i]
            }
        }
        if (textToken !== '') {
            tokens.push(textToken)
            textToken = ''
        }

        return tokens
    },

    parse (tokens) {
        const tree = [], stack = []

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '{') {
                stack.push([])
            }
            else if (tokens[i] === '}') {
                (stack[stack.length - 2] || tree).push(stack.pop())
            }
            else {
                (stack[stack.length - 1] || tree).push(tokens[i])
            }
        }

        return tree
    },

    evaluate (params, args) {
        for (let i = 0; i < params.length; i++) {
            if (typeof params[i] === 'object') params[i] = this.evaluate(params[i], args)
        }

        if (params[0] === 'args') {
            return args[params[1]] || 'none'
        }

        else if (params[0] === 'math') {
            if (params[1] === '+') {
                return parseInt(params[2]) + parseInt(params[3])
            }
            else if (params[1] === '-') {
                return parseInt(params[2]) - parseInt(params[3])
            }
            else if (params[1] === '*') {
                return parseInt(params[2]) * parseInt(params[3])
            }
            else if (params[1] === '/') {
                if (params[3] === 0) return NaN
                return parseInt(params[2]) / parseInt(params[3])
            }
            else {
                return ''
            }
        }

        else if (params[0] === 'if') {
            if (params[2] === '==') {
                return params[1] === params[3] ? params[4] : params[5]
            }
            else if (params[2] === '>') {
                return params[1] > params[3] ? params[4] : params[5]
            }
            else if (params[2] === '<') {
                return params[1] < params[3] ? params[4] : params[5]
            }
            else if (params[2] === '>=') {
                return params[1] >= params[3] ? params[4] : params[5]
            }
            else if (params[2] === '<=') {
                return params[1] <= params[3] ? params[4] : params[5]
            }
            else if (params[2] === '!=') {
                return params[1] !== params[3] ? params[4] : params[5]
            }
            else {
                return ''
            }
        }

        else if (params[0] === 'set') {
            this.storage[params[1]] = params[2]
            return ''
        }

        else if (params[0] === 'get') {
            if (!params[1]) return 'none'
            return this.storage[params[1]]
        }

        else if (params[0] === 'random') {
            params.shift()
            return params[Math.floor(Math.random() * params.length)]
        }

        else {
            return ''
        }
    },

    execute (text, args) {
        const tokens = this.tokenize(text)
        const tree = this.parse(tokens)

        let result = ''
        for (let i = 0; i < tree.length; i++) {
            if (typeof tree[i] === 'object') {
                tree[i] = this.evaluate(tree[i], args)
            }
            result += tree[i]
        }
        
        return result
    }
}

module.exports = Hypertag