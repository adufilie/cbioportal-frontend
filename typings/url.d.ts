declare module 'url'
{
	export type QueryParams = {[key:string]: undefined | string | ReadonlyArray<string>};

	export interface URLParts
	{
		auth: string | null,
		hash: string | null,
		host: string | null,
		hostname: string | null,
		href: string,
		path: string | null,
		pathname: string | null,
		port: string | null,
		protocol: string | null,
		query: string | QueryParams | null,
		search: string | null,
		slashes: true | null,
	}

	export function parse(urlStr:string, parseQueryString:true, slashesDenoteHost?:boolean):URLParts & {query: QueryParams, search: string};
	export function parse(urlStr:string, parseQueryString?:false, slashesDenoteHost?:boolean):URLParts & {query: string | null};

	export function format(urlObj:Partial<URLParts> & {query?: QueryParams}):string;

	export function resolve(from:string, to:string):string;
}
