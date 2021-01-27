const Enmap = require('enmap')

if (process.argv[2] === 'clear') {
    if (process.argv[3] === 'confirm') {
        const tags = new Enmap({ name: 'tags' })
        tags.clear()

        const storage = new Enmap({ name: 'storage' })
        storage.clear()
        
        console.log('Cleared database.')
    }
    else console.log('Please enter \'init.js clear confirm\' to clear database')
}