require('dotenv').config()

const Discord = require('discord.js')
const client = new Discord.Client()

const Hypertag = require('./hypertag')

const Enmap = require('enmap')

client.tags = new Enmap({ name: 'tags' })
client.storage = new Enmap({ name: 'storage' })

client.config = require('./config.json')

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}.`)

    client.user.setActivity('h.add 태그 | h.태그')

    client.guilds.cache.array().forEach(g => {
        if (!client.tags.has(g.id)) client.tags.set(g.id, {})
        if (!client.storage.has(g.id)) client.storage.set(g.id, {})
    })

    const statusChannel = client.channels.cache.get(client.config.statusChannel)
    statusChannel.setTopic(':green_circle: **Online**')
    statusChannel.send(`[${new Date().toLocaleString('ko-KR')}] :green_circle: Bot is Online`)
})

client.on('guildCreate', guild => {
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

    if (command === 'help') {
        const embed = new Discord.MessageEmbed({
            color: '#00b0f0',
            title: 'Hypertag 도움말',
            description: '하이퍼태그는 명령어와 봇의 대답을 사용자가 추가할 수 있는 봇입니다.\n' +
                '나아가 자체적인 문법을 지원하여 동적인 명령어를 만들 수 있습니다.\n\n' +
                '**기본 명령어**\n' +
                '- h.add : 태그 추가하기\n' +
                '- h.edit : 태그 수정하기\n' +
                '- h.raw : 태그 내용 보기\n' +
                '- h.delete : 태그 삭제하기\n' +
                '- h.info : 태그 정보 확인하기\n' +
                '- h.list : 서버 내 태그 목록 보기\n\n' +
                '※ 수정은 __태그 작성자__만, 삭제는 __작성자와 서버 소유자__만 가능합니다.\n\n' +
                '**문법**\n' +
                '[깃헙 문서](https://github.com/Pneuma714/HypertagBot/blob/master/readme.md)를 참고해주세요.\n\n' +
                '**공식 서버**\n' +
                'https://discord.gg/fejtMXeYKR'
        })

        msg.channel.send(embed)
    }

    else if (command === 'add') {
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
        const tagName = args.shift()
        const tagContent = args.join(' ')

        if (!tagName) return msg.reply('태그 이름을 입력해주세요.')
        if (tagName.includes('.') || !client.tags.has(msg.guild.id, tagName)) return msg.reply('존재하지 않는 태그입니다.')

        if (msg.author.id !== client.tags.get(msg.guild.id, tagName + '.author')) return msg.reply('태그를 수정할 권한이 없습니다.')

        if (!tagContent) return msg.reply('태그 내용을 입력해주세요.')

        client.tags.set(msg.guild.id, tagContent, tagName + '.content')

        msg.channel.send(`\`${tagName}\` 태그가 저장되었습니다.`)
    }

    else if (command === 'raw') {
        const tagName = args.shift()

        if (!tagName) return msg.reply('확인할 태그를 입력해주세요.')
        if (tagName.includes('.') || !client.tags.has(msg.guild.id, tagName)) return msg.reply('존재하지 않는 태그입니다.')

        msg.channel.send(client.tags.get(msg.guild.id, tagName + '.content'), { code: 'txt' })
    }

    else if (command === 'delete') {
        const tagName = args.shift()

        if (!tagName) return msg.reply('삭제할 태그를 입력해주세요.')
        if (tagName.includes('.') || !client.tags.has(msg.guild.id, tagName)) return msg.reply('존재하지 않는 태그입니다.')

        if (msg.author.id !== client.tags.get(msg.guild.id, tagName + '.author') && msg.author.id !== msg.guild.owner.id) return msg.reply('태그를 삭제할 권한이 없습니다.')

        client.tags.delete(msg.guild.id, tagName)
        msg.channel.send(`\`${tagName}\` 태그를 삭제했습니다.`)
    }

    else if (command === 'info') {
        const tagName = args.shift()

        if (!tagName) return msg.reply('정보를 확인할 태그를 입력해주세요.')
        if (tagName.includes('.') || !client.tags.has(msg.guild.id, tagName)) return msg.reply('존재하지 않는 태그입니다.')

        const tag = client.tags.get(msg.guild.id, tagName)

        const embed = new Discord.MessageEmbed({
            color: '#00b0f0',
            title: `${tagName} 태그 정보`,
            description: `**작성자** : ${client.users.cache.get(tag.author).tag}\n**사용 횟수** : ${tag.usage}회`
        })

        msg.channel.send(embed)
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
        msg.channel.send(result || '** **', { disableMentions: 'everyone' })

        client.tags.inc(msg.guild.id, command + '.usage')
    }
})

client.login(process.env.DISCORD_TOKEN)

const stop = async () => {
    console.log('Stopping bot...')
    
    const statusChannel = client.channels.cache.get(client.config.statusChannel)
    await statusChannel.setTopic(':red_circle: **Offline**')
    await statusChannel.send(`[${new Date().toLocaleString('ko-KR')}] :red_circle: Bot is Offline`)

    process.exit()
}

process.on('SIGINT', stop) // Ctrl + C

process.on('SIGHUP', stop) // Close Console