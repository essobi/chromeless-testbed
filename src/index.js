const launchChrome = require('@serverless-chrome/lambda');
const Chromeless = require('chromeless').Chromeless;
const fs = require('fs');

let chromeInstance = null;

console.log('Starting lambda');
function reloadChrome() {
	if (chromeInstance) {
		const logs = fs.readFileSync(chromeInstance.log).toString();
		const errorLogs = fs.readFileSync(chromeInstance.errorLog).toString();

		console.log(`Killing chrome: ${JSON.stringify(chromeInstance)}\nLogs: ${logs}\nError Logs: ${errorLogs}`);
		chromeInstance.kill();
	}
	return Promise.resolve(chromeInstance);
}

function logChrome() {
	const logs = fs.readFileSync(chromeInstance.log).toString();
	const errorLogs = fs.readFileSync(chromeInstance.errorLog).toString();
	// fs.writeFileSync(chromeInstance.log, '');
	// fs.writeFileSync(chromeInstance.errorLog, '');
	console.log(`Chrome Logs: ${JSON.stringify(chromeInstance)}\nLogs: ${logs}\nError Logs: ${errorLogs}`);
}

function getUrlFn(url) {
	return function getChrome(chrome) {
		chromeInstance = chrome;

		const chromeless = new Chromeless({
			launchChrome: false,
		});
		return chromeless.goto(url).evaluate(() => document.title).end();
	};
}

module.exports.handler = (ev, ctx, cb) => {
	const url = ev.url;
	ctx.callbackWaitsForEmptyEventLoop = false;
	console.log('Getting url', url);
	return launchChrome({
		flags: [
			'--window-size=1200,800',
			'--disable-gpu',
			'--headless',
			'--no-zygote',
			'--single-process',
			'--no-sandbox',
		],
	})
		.then(getUrlFn(url))
		.then(result => {
			console.log(result);
			logChrome();
			cb(null, result);
		})
		.catch(e => {
			console.log(e);
			logChrome();
			cb(e);
		});
};
//
// module.exports.handler = (ev, ctx, cb) => {
// 	const boundHandler = fakeHandler.bind(this, ev, ctx, cb);
// 	boundHandler()
// 		.then(boundHandler)
// 		.then(boundHandler)
// 		.then(boundHandler)
// 		.then(boundHandler)
// 		.then(boundHandler)
// 		.then(ctx.succeed, ctx.fail);
// };
