const Hypertag = {
    storage: {},

    tokenize (text) {
        const tokens = []
        let textToken = ''

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                if (text[i - 1] === '\\') {
                    textToken += '{'
                    continue
                }
                else if (textToken !== '') {
                    tokens.push(textToken)
                    textToken = ''
                }
                tokens.push('{')
            }
            else if (text[i] === '}') {
                if (text[i - 1] === '\\') {
                    textToken += '}'
                    continue
                }
                else if (textToken !== '' || text[i - 1] === ';') {
                    tokens.push(textToken)
                    textToken = ''
                }
                tokens.push('}')
            }
            else if (text[i] === ';') {
                if (text[i - 1] === '\\') {
                    textToken += ';'
                    continue
                }
                else if (textToken !== '' || text[i - 1] === ';') {
                    tokens.push(textToken)
                    textToken = ''
                }
                tokens.push(';')
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

    evaluate (_params, args, discordMsg) {

        // Evaluate child parameters
        for (let i = 0; i < _params.length; i++) {
            if (typeof _params[i] === 'object') _params[i] = this.evaluate(_params[i], args, discordMsg)
        }

        // Delete semicolons and Merge each parameters
        let params = [], p = ''
        for (let i = 0; i < _params.length; i++) {
            if (_params[i] === ';') {
                params.push(p)
                p = ''
            }
            else p += _params[i]
        }
        params.push(p)

        const func = params.shift()

        if (func === 'args') {
            return args[params[0]] || 'none'
        }

        else if (func === 'math') {
            if (params[0] === '+') {
                return parseInt(params[1]) + parseInt(params[2])
            }
            else if (params[0] === '-') {
                return parseInt(params[1]) - parseInt(params[2])
            }
            else if (params[0] === '*') {
                return parseInt(params[1]) * parseInt(params[2])
            }
            else if (params[0] === '/') {
                if (params[2] === 0) return NaN
                return parseInt(params[1]) / parseInt(params[2])
            }
            else {
                return ''
            }
        }

        else if (func === 'if') {
            if (params[1] === '==') {
                return params[0] === params[2] ? params[3] : params[4]
            }
            else if (params[1] === '>') {
                return params[0] > params[2] ? params[3] : params[4]
            }
            else if (params[1] === '<') {
                return params[0] < params[2] ? params[3] : params[4]
            }
            else if (params[1] === '>=') {
                return params[0] >= params[2] ? params[3] : params[4]
            }
            else if (params[1] === '<=') {
                return params[0] <= params[2] ? params[3] : params[4]
            }
            else if (params[1] === '!=') {
                return params[0] !== params[2] ? params[3] : params[4]
            }
            else {
                return ''
            }
        }

        else if (func === 'set') {
            this.storage[params[0]] = params[1]
            return ''
        }

        else if (func === 'get') {
            if (!params[0]) return 'none'
            return this.storage[params[0]] || 'none'
        }

        else if (func === 'random') {
            return params[Math.floor(Math.random() * params.length)]
        }

        else if (func === 'discord') {
            if (params[0] === 'userid') return discordMsg.author.id
            else if (params[0] === 'username') return discordMsg.author.username
            else if (params[0] === 'nickname') return discordMsg.member.nickname
            else if (params[0] === 'channelid') return discordMsg.channel.id
            else if (params[0] === 'guildid') return discordMsg.guild.id
            else return ''
        }

        else {
            return ''
        }
    },

    execute (text, args, discordMsg) {
        const tokens = this.tokenize(text)
        const tree = this.parse(tokens)

        let result = ''
        for (let i = 0; i < tree.length; i++) {
            if (typeof tree[i] === 'object') {
                tree[i] = this.evaluate(tree[i], args, discordMsg)
            }
            result += tree[i]
        }
        
        return result
    }
}

// console.log(Hypertag.execute('{set;dobak_{discord;userid};{if;{get;dobak_{discord;userid}};==;none;100;{get;dobak_{discord;userid}}}}{if;{math;+;0;{args;0}};==;NaN;숫자를 입력해주세요;{if;{get;dobak_{discord;userid}};<;{args;0};가지고 있는 금액보다 많이 베팅할 수 없습니다;}}{set;dobakok;{if;{math;+;0;{args;0}};==;NaN;no;{if;{get;dobak_{discord;userid}};<;{args;0};no;yes}}}{set;dobakrandom;{random;-1;0;1}}{set;dobak_{discord;userid};{if;{get;dobakok};==;no;{get;dobak_{discord;userid}};{math;+;{math;*;{args;0};{get;dobakrandom}};{get;dobak_{discord;userid}}}}}{if;{get;dobakok};==;no;;{if;{get;dobakrandom};==;-1;저런~ 돈이 날아갔습니다 -{args;0};{if;{get;dobakrandom};==;0;돈이 그대로입니다 ±0;돈이 불어났습니다 +{args;0}}}}', [ 10 ], { author: { id: 12345 } }))

module.exports = Hypertag