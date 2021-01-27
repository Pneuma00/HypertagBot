const Enmap = require('enmap')
console.log(JSON.parse((new Enmap({ name: 'tags' })).export()))
console.log((new Enmap({ name: 'storage' })).export())