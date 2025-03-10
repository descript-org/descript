# Кэширование

Три параметра (`cache`, `key`, `maxage`) позволяют закэшировать блок и при последующем запуске брать результат из кэша.

Пример:

```js
const cache = new de.Cache();

const block = de.block( {
    options: {
        //  Кэшируем по имени метода и параметру id.
        key: ( { params } ) => `my_method:id=${ params.id }`,
        //  Храним 1 час.
        maxage: 60 * 60 * 1000,
        //  Задаем в каком кэше все храним.
        cache: cache,
    },
} );
```


## `options.cache`

Для начала нужно задать кэш, в который мы будем писать и из которого будем читать данные.
Кэш – это интерфейс с двумя методами:

```typescript
export interface CacheInterface<Result> {
    get: ({ key }: { key: string }) => Promise<Result | undefined>;
    set: ({ key, value, maxage }: { key: string; value: Result; maxage?: number }) => Promise<void>;
}
```

  * Метод `get` должен вернуть данные, соответствующие переданному ключу. Синхронно или в виде промиса.
  * Метод `set` соответственно, должен сохранить значение `value` по ключу `key` на период `maxage`.
    Результат работы `set` игнорируется.

Есть встроенный очень простой кэш `de.Cache`:

```js
const cache = new de.Cache();
```

Он хранит все просто в памяти, нет ограничений на количество записей.
Так что для каких-то серьезных ситуаций лучше его не использовать, а использовать [descript-redis-cache](https://www.npmjs.com/package/descript-redis-cache).

## `options.key`

Обязательный параметр `key` задает ключ хранения.
Ключ может быть строкой или вычисляться динамически.

```js
options: {
    //  Кэшируем по имени метода и параметру id.
    key: ( { params } ) => `my_method:id=${ params.id }`,
},
```

## `options.maxage`

Необязательный параметры `maxage` задает срок хранения. 
Для `de.Cache` задается в миллисекундах (0 - вечное хранение),
но в если реализовать свой интерфейс кеша, то можно задать любой срок хранения.

```js
options: {
    // Храним 1 секунду.
    maxage: 1000,
},
```
