import pino from 'pino';
import { symbolKey } from '@denwa/tiny';

export interface LogData {
	[key: string]: any;
}

export interface Log {
	root: pino.Logger;
	instance: pino.Logger;

	getSource(): LogData | undefined;
	setSource(src: LogData): Log;
	applySource(src: LogData): Log;
	clearSource(): Log;

	getContext(): LogData | undefined;
	setContext(ctx: LogData): Log;
	applyContext(ctx: LogData): Log;	
	clearContext(ctx: LogData): Log;

	child(): Log;

	trace(message: string, data?: any): void;
	tracef(message: string, ...args: any[]): void;
	tracef(data: any, message: string, ...args: any[]): void;

	debug(message: string, data?: any): void;
	debugf(message: string, ...args: any[]): void;
	debugf(data: any, message: string, ...args: any[]): void;

	info(message: string, data?: any): void;
	infof(message: string, ...args: any[]): void;
	infof(data: any, message: string, ...args: any[]): void;

	warn(message: string, data?: any): void;
	warnf(message: string, ...args: any[]): void;
	warnf(data: any, message: string, ...args: any[]): void;

	error(message: string, data?: any): void;
	errorf(message: string, ...args: any[]): void;
	errorf(data: any, message: string, ...args: any[]): void;

	fatal(message: string, data?: any): void;
	fatalf(message: string, ...args: any[]): void;
	fatalf(data: any, message: string, ...args: any[]): void;
}

export const ILog = symbolKey<Log>('ILog');
export class Log {
	root: pino.Logger;
	instance: pino.Logger;
	src?: LogData;
	ctx?: LogData;

	constructor(root?: pino.Logger, src?: LogData, ctx?: LogData) {
		this.src = src;
		this.ctx = ctx;
		this.root = root ?? pino();
		this.instance = this.root.child({ src, ctx });
	}

	getSource(): LogData | undefined {
		return this.src;
	}

	setSource(src: LogData): Log {
		this.src = src;
		this.instance = this.root.child({
			src: this.src,
			ctx: this.ctx
		});
		return this;
	}

	applySource(src: LogData): Log {
		return this.setSource({
			...this.src,
			...src
		});
	}

	clearSource(): Log {
		this.src = undefined;
		this.instance = this.root.child({
			src: this.src,
			ctx: this.ctx
		});
		return this;
	}

	getContext(): LogData | undefined {
		return this.ctx;
	}

	setContext(ctx: LogData): Log {
		this.ctx = ctx;	
		this.instance = this.root.child({
			src: this.src,
			ctx: this.ctx
		});
		return this;
	}

	applyContext(ctx: LogData): Log {
		return this.setContext({
			...this.ctx,
			...ctx
		});		
	}

	clearContext(ctx: LogData): Log {
		this.ctx = undefined;
		this.instance = this.root.child({
			src: this.src,
			ctx: this.ctx
		});
		return this;
	}

	child(): Log {
		return new Log(this.root, this.src, this.ctx);
	}

	write(level: pino.Level, message: string, data?: any): void {
		if(data === undefined) {
			this.instance[level](message);
		}
		else {
			this.instance[level]({ data }, message);
		}
	}

	writef(level: pino.Level, args: any[]): void {
		if(typeof args[0] === 'string') {
			const [message, ...rest] = args;
			this.instance[level](message, ...rest);
		}
		else if(typeof args[1] === 'string') {
			const [data, message, ...rest] = args;
			if(data === undefined) {
				this.instance[level](message, ...rest);
			}
			else {
				this.instance[level]({ data }, message, ...rest);
			}
			
		}
		else {
			throw new Error(`invalid arguments: ${JSON.stringify(args)}`);
		}
	}

	trace(message: string, data?: any): void {
		this.write('trace', message, data);
	}

	tracef(...args: any[]): void {
		this.writef('trace', args);
	}

	debug(message: string, data?: any): void {
		this.write('debug', message, data);
	}

	debugf(...args: any[]): void {
		this.writef('debug', args);
	}

	info(message: string, data?: any): void {
		this.write('info', message, data);
	}

	infof(...args: any[]): void {
		this.writef('info', args);
	}

	warn(message: string, data?: any): void {
		this.write('warn', message, data);
	}

	warnf(...args: any[]): void {
		this.writef('warn', args);
	}

	error(message: string, data?: any): void {
		this.write('error', message, data);
	}

	errorf(...args: any[]): void {
		this.writef('error', args);
	}

	fatal(message: string, data?: any): void {
		this.write('fatal', message, data);
	}

	fatalf(...args: any[]): void {
		this.writef('fatal', args);
	}	
}