const dotenv = require('dotenv')
const App = require('./app')

dotenv.config()

async function main () {
    const app = new App({
        interval: process.env.INTERVAL,
        watchedString: process.env.WATCHED_STRING,
        pageUrl: process.env.PAGE_URL,
        successMessage: process.env.SUCCESS_MESSAGE,
        telegram: {
            token: process.env.TELEGRAM_TOKEN
        }
    })

    app.boot()
}

main()
