declare module 'build-url'
{
	export type QueryParams = {[key:string]: undefined | string | ReadonlyArray<string>};
	type Params = {
		path?: string,
		hash?: string,
		queryParams?: QueryParams
	}
	function buildUrl(base:string|null, params:Params):string;
	function buildUrl(params:Params):string;
	export default buildUrl;
}
