const Hypertag = {

    tokenize (text) {
        const tokens = []
        let textToken = ''

        for (let i = 0; i < text.length; i++) {
            if ([ '{', ';', '}' ].includes(text[i])) {
                if (text[i - 1] === '\\') {
                    textToken += text[i]
                    continue
                }
                else if (textToken !== '' || text[i] !== '{' && text[i - 1] === ';') {
                    tokens.push(textToken)
                    textToken = ''
                }
                tokens.push(text[i])
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
        for (let i = 0; i < _params.length; i++) {
            if (typeof _params[i] === 'object') _params[i] = this.evaluate(_params[i], args, discordMsg)
        }

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
            if (params[0]) discordMsg.client.storage.set(discordMsg.guild.id, params[1], params[0])
            return ''
        }

        else if (func === 'get') {
            if (!params[0]) return ''
            return discordMsg.client.storage.get(discordMsg.guild.id, params[0]) || 'none'
        }

        else if (func === 'random') {
            return params[Math.floor(Math.random() * params.length)]
        }

        else if (func === 'discord') {
            if (params[0] === 'user') {
                if (params[1] === 'id') return discordMsg.author.id
                else if (params[1] === 'name') return discordMsg.author.username
                else if (params[1] === 'nick') return discordMsg.member.nickname
            }
            else if (params[0] === 'channel') {
                if (params[1] === 'id') return discordMsg.channel.id
                else if (params[1] === 'name') return discordMsg.channel.name
                else if (params[1] === 'topic') return discordMsg.channel.topic
            }
            else if (params[0] === 'guild') {
                if (params[1] === 'id') return discordMsg.guild.id
                else if (params[1] === 'name') return discordMsg.guild.name
                else if (params[1] === 'owner') {
                    if (params[2] === 'id') return discordMsg.guild.owner.id
                    else if (params[2] === 'name') return discordMsg.guild.owner.user.username
                    else if (params[2] === 'nick') return discordMsg.guild.owner.nickname
                }
            }
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

module.exports = Hypertag