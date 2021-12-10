import fs from 'fs';
import pump from 'pump';
import split from 'split2';
import { Transform } from 'stream';
import chalk from 'chalk';
import dateformat from 'dateformat';
import util from 'util';

const EOL = '\r\n';
const LEVEL_NAMES = {
	default: 'user',
	60: 'fatal',
    50: 'error',
    40: 'warn',
    30: 'info',
    20: 'debug',
    10: 'trace'
}

const LEVEL_COLORS = {
	default: chalk.white,
	60: chalk.bgWhite.black,
    50: chalk.red,
    40: chalk.yellow,
    30: chalk.green,
    20: chalk.magenta,
    10: chalk.blue
}

function pretty(chunk: any) {
	let event;

	try {
		event = JSON.parse(chunk);
	}
	catch(error) {
		return chunk.toString() + EOL;
	}

	if(!event) {
		return undefined;
	}

	let { level, time, pid, hostname, msg, src, ctx, data } = event;

	const valid = typeof event === 'object'
		&& typeof level === 'number'
		&& typeof time === 'number'
		&& typeof pid === 'number'
		&& (msg === undefined || typeof msg === 'string')
		&& (src === undefined || typeof src === 'object')
		&& (ctx === undefined || typeof ctx === 'object')
		&& (data === undefined || typeof data === 'object');

	if(!valid) {
		return chunk.toString() + EOL;
	}

	let levelText: string;
	let timeText: string = dateformat(time, "HH:MM:ss.L");	

	if((LEVEL_NAMES as any)[level] === undefined) {
		level = 30;
	}

	const levelColor = (LEVEL_COLORS as any)[level];
	const levelName = (LEVEL_NAMES as any)[level];

	if((levelColor && levelName)) {
		levelText = levelColor(levelName.padEnd(5))
	}
	else {
		levelText = ''.padEnd(5);
	}
	
	let srcText = '';
	let msgText = msg;

	if(src?.mod)  {
		srcText = `[${chalk.cyan(src.mod)}]`
	}

	// fatal
	if(level === 60) {
		msgText = chalk.bgWhite.black(msgText);
	}

	// error
	if(level === 50) {
		msgText = chalk.bgRed.white(msgText);
	}

	// warn
	if(level === 40) {
		msgText = chalk.bgYellow.black(msgText);
	}

	// debug
	if(level == 20) {
		msgText = chalk.magenta(msgText);
	}

	// trace
	if(level === 10) {
		msgText = chalk.underline(msgText);
	}

	let line = `${chalk.gray(timeText)} ${levelText}`;
	if(srcText !== '') {
		line += ` ${srcText}`;
	}

	line += ` ${msgText}${EOL}`;

	if(ctx !== undefined) {
		line += chalk.gray('ctx: ' + util.inspect(ctx, { compact: true })) + EOL;
	}

	if(data !== undefined) {
		line += chalk.cyan('data') + ': ' + util.inspect(data, false, 2, true) + EOL;
	}

	if(data !== undefined || ctx !== undefined) {
		//line += EOL;
	}
	
	return line;
}

const devTransport = new Transform({
	objectMode: true,
	transform(chunk, enc, cb) {
		try {
			const line = pretty(chunk);
			if (line === undefined) {
				return cb()
			}
			else {
				cb(null, line)
			}
		}
		catch(error: any) {
			console.log(`devprint: tranform error: ${error.message}`);
			console.log(error);
		}
	}
})

pump(process.stdin, split(), devTransport, process.stdout).on('error', error => {
	console.log(`devprint: pump error: ${error.message}`);
	console.log(error);
});

if (!process.stdin.isTTY && !fs.fstatSync(process.stdin.fd).isFile()) {
	process.once('SIGINT', function noop() { });
}
