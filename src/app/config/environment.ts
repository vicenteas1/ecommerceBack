import { Environment } from "../interfaces/environment.interface.js";
const mdbURI = process.env.MDBURI;
const mdbPORT = process.env.MDBPORT;
const mdbDB = process.env.MDBDB;
export const environment: Environment = {
    mongodb: [
        {
            uri: `${mdbURI}`,
            port: `${mdbPORT}`
        }
    ],
    databases: [
        {
            name: `${mdbDB}`
        }
    ]
}