import { MiddlewareFactory } from './MiddlewareFactory'
import { SlushyProps, SlushyRequest, SlushyResponse } from '..'
import express = require('express')

export class RegisterAuthenticationMiddleware implements MiddlewareFactory {
    create(props: SlushyProps): Array<(req: SlushyRequest, res: SlushyResponse, next: (error?: Error) => any) => any> {
        const router = express.Router()
        if (props.authenticationMiddleware) {
            const { paths } = props.openApi
            /* Is security is enabled for all endpoints? */
            if (props.openApi.security && props.openApi.security.find((s: any) => s.bearerAuth)) {
                router.use('/', props.authenticationMiddleware.execute)
            } else {
                /* Transverse all endpoints and apply the middleware where is necessary */
                for (const [p, path] of Object.entries(paths)) {
                    for (const [v, verb] of Object.entries(path)) {
                        if (verb && verb.security && verb.security.find((s: any) => s.bearerAuth)) {
                            const r = router as any
                            r[v](p, props.authenticationMiddleware.execute)
                        }
                    }
                }
            }
        }
        return [router]
    }
}