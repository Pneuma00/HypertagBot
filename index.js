require('dotenv').config()

const Discord = require('discord.js')
const client = new Discord.Client()

const Hypertag = require('./hypertag')

const Enmap = require('enmap')

client.tags = new Enmap({ name: 'tags' })
client.storage = new Enmap({ name: 'storage' })

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}.`)

    client.user.setActivity('h.add 태그 | h.태그')

    client.guilds.cache.forEach(g => {
        if (!client.tags.has(g.id)) client.tags.set(g.id, {})
        if (!client.storage.has(g.id)) client.storage.set(g.id, {})
    })
})

client.on('gulidCreate', guild => {
    if (!client.tags.has(guild.id)) client.tags.set(guild.id, {})
    if (!client.storage.has(guild.id)) client.storage.set(guild.id, {})

    console.log(`Joined a guild '${guild.name}' (ID: ${guild.id})`)
})

client.on('message', msg => {
    if (msg.system || msg.author.bot) return
    if (!msg.content.startsWith('h.')) return

    if (msg.channel.type === 'dm') return msg.reply('명령어는 서버에서 사용해주세요!')

    console.log(`[Message] (Guild ID: ${msg.guild.id}) (User ID: ${msg.author.id}) ${msg.author.tag} : ${msg.content}`)

    const content = msg.content.slice('h.'.length)
    const args = content.split(' ')
    const command = args.shift()

    if (command === 'add') {
        const tagName = args.shift()
        const tagContent = args.join(' ')

        if (!tagName) return msg.reply('태그 이름을 입력해주세요.')
        if (tagName.includes('.')) return msg.reply('태그 이름에는 마침표를 포함할 수 없습니다.')
        if (client.tags.has(msg.guild.id, tagName)) return msg.reply('이미 존재하는 태그입니다.')
        if (!tagContent) return msg.reply('태그 내용을 입력해주세요.')

        client.tags.set(msg.guild.id, {
            content: tagContent,
            author: msg.author.id,
            usage: 0
        }, tagName)

        msg.channel.send(`\`${tagName}\` 태그가 저장되었습니다.`)
    }

    else if (command === 'edit') {
        // TODO
    }

    else if (command === 'delete') {
        const tagName = args.shift()

        if (!tagName) return msg.reply('삭제할 태그를 입력해주세요.')
        if (tagName.includes('.') || !client.tags.has(msg.guild.id, tagName)) return msg.reply('존재하지 않는 태그입니다.')

        if (msg.author.id !== client.tags.get(msg.guild.id, tagName + '.author') && msg.author.id !== msg.guild.owner.id) return msg.reply('태그를 삭제할 권한이 없습니다.')

        client.tags.delete(msg.guild.id, tagName)
        msg.channel.send(`\`${tagName}\` 태그를 삭제했습니다.`)
    }

    else if (command === 'raw') {
        // TODO
    }

    else if (command === 'list') {
        const tagList = client.tags.get(msg.guild.id)
        msg.channel.send(`태그 목록 : ${Object.keys(tagList).map(t => '`' + t + '`').join(' | ')}`)
    }

    else if (command === 'rank') {
        // TODO
    }
    
    else {
        if (command.includes('.')) return msg.reply('존재하지 않는 태그입니다.')

        const tagContent = client.tags.get(msg.guild.id, command + '.content')
        if (!tagContent) return msg.reply('존재하지 않는 태그입니다.')

        const result = Hypertag.execute(tagContent, args, msg)
        if (result) msg.channel.send(result)
    }
})

client.login(process.env.DISCORD_TOKEN)