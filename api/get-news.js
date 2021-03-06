const chrome = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
const nodemailer = require('nodemailer')

const searchUrl = 'https://search-beta.abc.net.au/index.html?siteTitle=news#/?configure%5BgetRankingInfo%5D=true&configure%5BclickAnalytics%5D=true&configure%5BuserToken%5D=anonymous-98736bcf-4df7-45d6-a18d-326591d16864&configure%5BhitsPerPage%5D=10&query=%22Sydney%20news%3A%22&page=1&sortBy=ABC_production_all_latest'

const style = `
<style>
	._3b5Y5 {
		width: 93%;
		margin: 0 auto;
	}

	figure {
		display: none;
	}

	._3Rgf7, ._VOF7, ._3e8To {
		display: none;
	}
</style>
`

module.exports = async (req, res) => {
	console.log('Scraping request received.')
	pageUrl = await getLatestNewsUrl()
	messageHtml = await getPageContent(pageUrl)
	await sendMail(style + messageHtml)
	res.send(200)
}

async function sendMail(messageHtml) {
	console.log('Sending mail...')
	const transporter = nodemailer.createTransport({
		host: 'smtp.mailgun.org',
		port: 587,
		secure: false,
		tls: { ciphers: 'SSLv3' },
		auth: {
			user: process.env.MAILGUN_USER,
			pass: process.env.MAILGUN_PASS
		}
	});

	await transporter.sendMail({
			from: 'ABC News Update <postmaster@mail.rupert.cloud>',
			to: 'rp@rupert.cloud',
			subject: 'Your daily Sydney news bulletin',
			text: 'Your daily news bulletin, from ABC Sydney.',
			html: messageHtml
	})

	await transporter.sendMail({
		from: 'ABC News Update <postmaster@mail.rupert.cloud>',
		to: 'ericlferguson1@gmail.com',
		subject: 'Your daily Sydney news bulletin',
		text: 'Your daily news bulletin, from ABC Sydney.',
		html: messageHtml
	})

	console.log('Mail sent.')
}

async function getBrowserOptions() {
	return {
		args: chrome.args,
		executablePath: await chrome.executablePath,
		headless: chrome.headless
	}
}

async function getLatestNewsUrl() {
	console.log('Scraping for latest news link...')
	const browserOptions = await getBrowserOptions()
	browser = await puppeteer.launch(browserOptions)
	const page = await browser.newPage()
	await page.goto(searchUrl)
	const selector = '.link__link--1JC6x'
	await page.waitForSelector(selector)

	const href = await page.evaluate((selector) => {
		return document.querySelector(selector).href
	}, selector)

	await browser.close()
	console.log('Done.\n\n')
	return href
}

async function getPageContent(pageUrl) {
	console.log('Scraping for news page content...')
	const browserOptions = await getBrowserOptions()
	browser = await puppeteer.launch(browserOptions)
	const page = await browser.newPage()
	await page.goto(pageUrl)
	const selector = '#body'
	await page.waitForSelector(selector)

	const html = await page.evaluate((selector) => {
		return document.querySelector(selector).innerHTML
	}, selector)

	await browser.close();
	console.log('Done.')
	return html;
}