const Axios = require('axios')
const TelegramBot = require('node-telegram-bot-api');

const axios = Axios.default.create({
    timeout: 10000
})

module.exports = class App {
    constructor ({ pageUrl, watchedString, interval, successMessage, telegram = {} }) {
        this.pageUrl = pageUrl
        this.document = null
        this.watchedString = watchedString
        this.interval = interval
        this.intervalId = null
        this.telegramBot = new TelegramBot(telegram.token, {polling: true});
        this.telegramBotChatIds = []
        this.successMessage = successMessage

        this._log('log', JSON.stringify({
            pageUrl,
            watchedString,
            interval
        }))
    }

    async boot () {
        this._initTelegramBot()
    }

    async _startInterval () {
        const interval = this.interval

        const done = await this._work()

        if (done) {
            this._notify()            
        } else {
            this.intervalId = setInterval(async () => {
                const done = await this._work()
                if (done) {
                    this._notify()
                }
                this._log('log', `boot::interval::sleeping::${interval}ms`)
            }, interval)
        }
    }

    async _work () {
        try {
            this._log('log', '_work::fetching document::start')
            const document = await this._fetchDocument()
            this._log('log', '_work::fetching document::done')
            const watchedString = this.watchedString
            const hasWatchedString = document.includes(watchedString)
    
            this._log('log', `_work::variables::hasWatchedString::${hasWatchedString}`)
    
            if (hasWatchedString) {
                return Promise.resolve(true)
            }
        } catch (e) {
            this._log('error', `_work::error::${e.message}`)
        }
        

        return Promise.resolve(false)
    }

    async _fetchDocument () {
        const { data: res } = await axios.get(this.pageUrl)
        this.document = res
        return res
    }

    async _notify () {
        this.telegramBotChatIds.forEach((chatId) => {
            this.telegramBot.sendMessage(chatId, this.successMessage)
                .then(() => {
                    this._log('log', `_notify::${chatId}::done`)
                    process.exit(0)
                })
                .catch((e) => {
                    this._log('log', `_notify::${chatId}::error::${e.message}`)
                    process.exit(0)
                })
        })
    }

    _initTelegramBot () {
        const bot = this.telegramBot
        this._log('log', '_initTelegramBot::start')
        bot.onText(/\/start/, (msg, match) => {
            // 'msg' is the received Message from Telegram
            // 'match' is the result of executing the regexp above on the text content
            // of the message

            const chatId = msg.chat.id;
            const pageUrl = this.pageUrl
          
            // send back the matched "whatever" to the chat
            bot.sendMessage(chatId, `Welcome, now you are watching for this page: ${pageUrl}`);

            if (!this.telegramBotChatIds.includes(chatId)) {
                this.telegramBotChatIds.push(chatId)
            }

            if (!this.intervalId) {
                this._startInterval()
            }
        });
        
        this._log('log', '_initTelegramBot::done')
    }


    _log (level, message) {
        const date = (new Date()).toISOString()
        console[level](`${date}::${message}`)
    }
}
