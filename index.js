require('dotenv').config()

const Discord = require('discord.js')
const client = new Discord.Client()

const Hypertag = require('./hypertag')

const Enmap = require('enmap')

client.tags = new Enmap({ name: 'tags' })

client.on('ready', () => {
    client.user.setActivity('h.add 태그 | h.태그')

    console.log(`Ready! Logged in as ${client.user.tag}.`)
})

client.on('message', msg => {
    if (msg.system || msg.author.bot) return
    if (!msg.content.startsWith('h.')) return

    console.log(`${msg.author.tag} : ${msg.content}`)

    const content = msg.content.slice('h.'.length)
    const args = content.split(' ')
    const command = args.shift()

    if (command === 'add') {
        const tagName = args.shift()
        const tagContent = args.join(' ')

        if (!tagName) return msg.reply('태그 이름을 입력해주세요.')
        if (!tagContent) return msg.reply('태그 내용을 입력해주세요.')

        client.tags.set(tagName, tagContent)
    }
    
    else {
        const tagContent = client.tags.get(command)
        if (!tagContent) return msg.reply('존재하지 않는 태그입니다.')

        const result = Hypertag.execute(tagContent, args, msg)
        if (result) msg.channel.send(result)
    }
})

client.login(process.env.DISCORD_TOKEN)