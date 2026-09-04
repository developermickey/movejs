// Type declarations for optional database drivers (peer dependencies)
declare module 'pg' {
  const content: any;
  export const Client: any;
  export const Pool: any;
  export default content;
}

declare module 'mysql2/promise' {
  const content: any;
  export const createConnection: any;
  export const createPool: any;
  export default content;
}

declare module 'better-sqlite3' {
  const factory: new (file: string) => any;
  export default factory;
}

declare module 'mongodb' {
  export const MongoClient: any;
  export const ObjectId: any;
}