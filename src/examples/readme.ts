import { openAPI, scope } from "../methods.ts"
import { allOf, array, object, string } from "../schema.ts"

const baseError = () =>
  object({
    "error?": string({
      description: "An error code unique to the error received.",
    }),
    "message?": string({
      description: "The reason why the error occured.",
    }),
    "suggestion?": string({
      description: "A helpful suggestion for how to alleviate the error.",
    }),
    "docs?": string({
      format: "uri",
      description:
        "A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.",
      example:
        "https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f",
    }),
    "help?": string({
      description:
        "Information on where you can receive additional assistance from our wonderful support team.",
      example: "If you need help, email support@readme.io",
    }),
    "poem?": array(string(), {
      description: "A short poem we wrote you about your error.",
      example: [
        "If you're seeing this error,",
        "Things didn't quite go the way we hoped.",
        "When we tried to process your request,",
        "Maybe trying again it'll work—who knows!",
      ],
    }),
  })

/**
 *     jobOpening:
 *       type: object
 *       properties:
 *         slug:
 *           type: string
 *           description: A slugified version of the job opening title.
 *           example: api-engineer
 *         title:
 *           type: string
 *           description: The job opening position.
 *           example: API Engineer
 *         description:
 *           type: string
 *           description: >-
 *             The description for this open position. This content is formatted as
 *             HTML.
 *         pullquote:
 *           type: string
 *           description: A short pullquote for the open position.
 *           example: "Deeply knowledgeable of the web, HTTP, and the API space."
 *         location:
 *           type: string
 *           description: Where this position is located at.
 *           example: Remote
 *         department:
 *           type: string
 *           description: The internal organization you'll be working in.
 *           example: Engineering
 *         url:
 *           type: string
 *           format: url
 *           description: The place where you can apply for the position!
 */
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
      format: "uri",
      description: "The place where you can apply for the position!",
    }),
  })

const error_VERSION_NOTFOUND = () =>
  allOf([
    baseError,
    object({
      "error?": string({ default: "VERSION_NOTFOUND" }),
    }),
  ])

export const readmeAPI = openAPI(
  {},
  {
    "/apply": scope({
      GET: {},
    }),
  },
)
