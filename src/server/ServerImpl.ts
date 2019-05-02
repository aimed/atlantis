/**
 * This abstracts away the underlying server implementation
 */
import express from 'express'

export class AtlantisApplicationFactory {
    public static create(): AtlantisApplication {
        return express()
    }
}

export class AtlantisRouterImplementationFactory {
    public static create(): AtlantisRouterImplementation {
        return express.Router()
    }
}

export type AtlantisRouterImplementation = express.Router
export type AtlantisApplication = express.Application
export type AtlantisRequest = express.Request
export type AtlantisResponse = express.Response
export type AtlantisRequestHandler = express.RequestHandler