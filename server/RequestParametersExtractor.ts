import { AtlantisContext } from "./AtlantisContext";
import { JSONSchema4 } from "json-schema";
import { isReferenceObject } from "../codegen/ResourceFactory";
import { OpenAPIV3 } from "openapi-types";
import { BadRequestError } from "./errors/BadRequestError";
import Ajv from 'ajv'

export class RequestParametersExtractor<TContext = {}> {
    private readonly validator = new Ajv({ allErrors: true })

    /**
     * Extracts all parameters for the current operation from the request.
     */
    public async getParameters<TParams>(context: AtlantisContext<TContext>): Promise<TParams> {
        const { operationObject, req } = context

        const params: { [index: string]: any } = {}

        // TODO: This can be moved to the compile step
        // To validate the input parameters we dynamically create the schema
        const paramSchema: JSONSchema4 & Required<Pick<JSONSchema4, 'properties'>> & { required: string[] } = {
            type: 'object',
            properties: {},
            required: []
        }

        for (const parameter of operationObject.parameters || []) {
            if (isReferenceObject(parameter)) {
                // TODO: Not supported right now
                continue
            }

            const parameterInRequestProperty = {
                path: req.params,
                query: req.query,
                body: req.body,
            }

            const hasRequestMapping = (inValue: string): inValue is keyof typeof parameterInRequestProperty => {
                return Boolean(inValue in parameterInRequestProperty)
            }

            if (!hasRequestMapping(parameter.in)) {
                throw new Error(`Invalid parameter in value '${parameter.in}', only ${Object.keys(parameterInRequestProperty).join(', ')} are supported`)
            }

            let value = parameterInRequestProperty[parameter.in][parameter.name]
            if (parameter.schema) {
                paramSchema.properties[parameter.name] = parameter.schema
                if (parameter.required) {
                    paramSchema.required.push(parameter.name)
                }
                // Some routers will always pass path arguments as strings. To work around validation we need to convert
                // the type manually.
                // TODO: Actually revive all data
                const type = (parameter.schema as OpenAPIV3.NonArraySchemaObject).type
                if (parameter.in === 'path') {
                    if (type === 'integer' || type === 'number') {
                        value = Number(value)
                    }
                }
            }

            params[parameter.name] = value
        }

        const isValid = await this.validator.validate(paramSchema, params)
        if (!isValid) {
            throw new BadRequestError(this.validator.errorsText())
        }

        return params as TParams
    }

    public async getRequestBody<TBody>(context: AtlantisContext<TContext>): Promise<TBody> {
        const { operationObject: { requestBody }, req } = context
        // TODO: Support reference objects
        if (requestBody && !isReferenceObject(requestBody)) {
            if (requestBody.required && !req.body) {
                throw new BadRequestError('Request body is required')
            }

            // TODO: Support more mime types
            if (requestBody.content['application/json'] && requestBody.content['application/json'].schema) {
                const isValid = await this.validator.validate(requestBody.content['application/json'].schema, req.body)
                if (!isValid) {
                    throw new BadRequestError(this.validator.errorsText())
                }
            }
        }
        // FIXME: Not validated right now
        return req.body as TBody
    }
}