export interface Environment {
    mongodb: Mongo[];
    databases: Database[];
}

interface Mongo {
    uri: string;
    port:string;
}

interface Database {
    name: string;
}
