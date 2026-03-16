import { responsibleAPI, scope } from "../dsl/dsl.ts"
import { POST, response } from "../dsl/methods.ts"
import { array, boolean, object, string, unknown } from "../dsl/schema.ts"

const apply = () =>
  object({
    name: string({
      minLength: 1,
      description: "Your full name",
      default: "Your Name",
    }),
    email: string({
      format: "email",
      description: "A valid email we can reach you at.",
      default: "you@example.com",
    }),
    job: string({
      description:
        "The job you're looking to apply for (https://readme.com/careers).",
    }),
    "pronouns?": string({
      description: "Learn more at https://pronoun.is/",
    }),
    "linkedin?": string({
      format: "url",
      description: "What have you been up to the past few years?",
    }),
    "github?": string({
      format: "url",
      description: "Or Bitbucket, Gitlab or anywhere else your code is hosted!",
    }),
    "coverLetter?": string({
      format: "blob",
      description: "What should we know about you?",
    }),
    "dontReallyApply?": boolean({
      description:
        "Want to play with the API but not actually apply? Set this to true.",
      default: false,
    }),
  })

const jobOpening = () =>
  object({
    "slug?": string({
      description: "A slugified version of the job opening title.",
      example: "api-engineer",
    }),
    "title?": string({
      description: "The job opening position.",
      example: "API Engineer",
    }),
    "description?": string({
      description:
        "The description for this open position. This content is formatted as HTML.",
    }),
    "pullquote?": string({
      description: "A short pullquote for the open position.",
      example: "Deeply knowledgeable of the web, HTTP, and the API space.",
    }),
    "location?": string({
      description: "Where this position is located at.",
      example: "Remote",
    }),
    "department?": string({
      description: "The internal organization you'll be working in.",
      example: "Engineering",
    }),
    "url?": string({
      format: "url",
      description: "The place where you can apply for the position!",
    }),
  })

const apiSpecificationUpload = () =>
  object({
    spec: string({
      format: "binary",
      description: "OpenAPI/Swagger file. We accept JSON or YAML.",
    }),
  })

export default responsibleAPI({
  partialDoc: {
    openapi: "3.0.2",
    info: {
      description:
        "Create beautiful product and API documentation with our developer friendly platform.",
      version: "2.0.0",
      title: "API Endpoints",
      contact: {
        name: "API Support",
        url: "https://docs.readme.com/docs/contact-support",
        email: "support@readme.io",
      },
    },
    servers: [{ url: "http://dash.readme.local:3000/api/v1" }],
    tags: [{ name: "API Specification" }, { name: "Apply to ReadMe" }],
  },
  forAll: {},
  routes: {
    "/apply": scope(
      {
        req: { mime: "application/json" },
        res: { mime: "application/json" },
      },
      {
        GET: {
          id: "getOpenRoles",
          description: "Returns all the roles we're hiring for at ReadMe!",
          res: {
            add: {
              200: response({
                description: "All the roles that we're hiring for.",
                body: array(jobOpening),
              }),
            },
          },
        },
        POST: {
          id: "applyToReadMe",
          description:
            "This endpoint will let you apply to a job at ReadMe programatically, without having to go through our UI!",
          req: {
            body: apply,
          },
          res: {
            add: {
              200: response({
                description: "You did it!",
              }),
            },
          },
        },
      },
    ),
    "/api-specification": POST({
      id: "uploadAPISpecification",
      description:
        "Upload an API specification to ReadMe. Or, to use a newer solution see https://docs.readme.com/docs/automatically-sync-api-specification-with-github.",
      req: {
        headers: {
          "x-readme-version?": string({
            description:
              "Version number of your docs project, for example, v3.0.",
            example: "v3.0",
          }),
        },
        body: {
          "multipart/form-data": apiSpecificationUpload,
        },
      },
      res: {
        201: response({
          description: "The API specification was successfully uploaded.",
        }),
        400: response({
          description: "There was a validation error during upload.",
          body: { "application/json": unknown() },
        }),
      },
    }),
  },
})
