function isPrimitive(value:any):boolean
{
	return value === null || typeof value !== 'object';
}

/**
 * Provides Map-like interface that uses Map for primitive keys and WeakMap for non-primitive keys.
 */
class Cache<K,V> {
	private map = new Map<any, V>();
	private weakMap = new WeakMap<any, V>();

	has(key:K):boolean {
		return isPrimitive(key) ? this.map.has(key) : this.weakMap.has(key);
	}
	get(key:K):V|undefined {
		return isPrimitive(key) ? this.map.get(key) : this.weakMap.get(key);
	}
	set(key:K, value:V):this {
		if (isPrimitive(key))
			this.map.set(key, value);
		else
			this.weakMap.set(key, value);
		return this;
	}
}

/**
 * Provides a multi-dimensional Map-like interface
 */
class HyperMap<T> {
	has(args:any[]):boolean {
		let cache:Cache<any, any>|undefined = this.getCache(args.length);
		if (args.length > 1)
			cache = this.traverse(cache, args.slice(0, args.length - 1)) as any;
		return cache !== undefined && cache.has(args[args.length - 1]);
	}

	get(args:any[]):T | undefined {
		return this.traverse(this.getCache(args.length), args);
	}

	set(args:any[], value:T):void {
		this.traverse(this.getCache(args.length), args, value);
	}

	// gets the Cache designated for a specific key length
	private getCache(numArgs:number)
	{
		let cache = this.map_numArgs_cache.get(numArgs);
		if (!cache)
			this.map_numArgs_cache.set(numArgs, cache = new Cache());
		return cache;
	}

	// used to avoiding the varying-key-length limitation of the traverse() function below
	private map_numArgs_cache = new Map<number, Cache<any, any>>();

	// dual-purpose setter/getter
	// note: does not work if subsequent calls vary the length of the keys array for the same cache param
	private traverse(cache:Cache<any, any>, keys:any[], value?:T):T|undefined {
		if (keys.length == 0)
			return undefined;
		if (keys.length == 1) {
			if (value === undefined)
				return cache.get(keys[0]);
			return void cache.set(keys[0], value);
		}

		let nextCache = cache.get(keys[0]);
		if (nextCache === undefined)
			cache.set(keys[0], nextCache = new Cache());
		return this.traverse(nextCache, keys.slice(1), value);
	}
}

export default class DataCache<Data, Transform extends (...args:any[])=>Data> {

	private transform:Transform;
	private cache = new HyperMap<Data>();

	constructor(transform:Transform) {
		this.transform = transform;
	}

	get:Transform = ((...args:any[]) => {
		let data = this.cache.get(args);
		if (data === undefined && !this.cache.has(args))
		{
			data = this.transform.apply(null, args);
			if (data !== undefined)
				this.cache.set(args, data);
		}
		return data;
	}) as Transform;
}

//declare type MethodDecorator = <T>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

/**
 * Creates a memoized version of a function.
 */
export function memoize<F extends (...args:any[])=>any>(fn:F):F;

/**
 * A method decorator that creates a memoized version of a method.
 */
export function memoize<T extends (...args:any[])=>any>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>):TypedPropertyDescriptor<T> | void;

export function memoize<T extends (...args:any[])=>any>(target: any, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<T>):TypedPropertyDescriptor<T> | void {
	// called as function
	if (arguments.length == 1)
		return new DataCache(target).get;

	// called as decorator
	if (descriptor && descriptor.value)
		descriptor.value = new DataCache(descriptor.value).get;
	return descriptor;
}
