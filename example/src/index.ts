import { SlushyFactory } from './SlushyFactory'

async function run() {
    const slushy = await SlushyFactory.create()
    await slushy.start(3031)
    console.log('Started server')
}

run().catch(error => {
    console.error(error)
    process.exit(1)
})
