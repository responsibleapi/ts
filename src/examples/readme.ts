import { responsibleAPI } from "../dsl/dsl.ts"
import { GET, POST } from "../dsl/methods.ts"
import { named } from "../dsl/nameable.ts"
import { resp } from "../dsl/operation.ts"
import { headerParam, pathParam, queryParam } from "../dsl/params.ts"
import { responseHeader } from "../dsl/response-headers.ts"
import {
  allOf,
  array,
  boolean,
  int32,
  integer,
  object,
  oneOf,
  string,
} from "../dsl/schema.ts"
import { scope } from "../dsl/scope.ts"
import { httpSecurity } from "../dsl/security.ts"
import { declareTags } from "../dsl/tags.ts"

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

const apiRegistryUUID = () =>
  string({
    description:
      "An API Registry UUID. This can be found by navigating to your API Reference page and viewing code snippets for Node with the `api` library.",
  })

const apiSpecificationID = () =>
  string({
    description:
      "ID of the API specification. The unique ID for each API can be found by navigating to your **API Definitions** page.",
  })

const readmeVersion = () =>
  string({
    description:
      "Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/reference/version#getversions.",
    example: "v3.0",
  })

const categorySlug = () =>
  string({
    description:
      'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".',
    example: "getting-started",
  })

const changelogSlug = () =>
  string({
    description:
      'A URL-safe representation of the changelog title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the changelog "Owlet Weekly Update", enter the slug "owlet-weekly-update".',
    example: "owlet-weekly-update",
  })

const customPageSlug = () =>
  string({
    description:
      'A URL-safe representation of the custom page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the custom page "Getting Started", enter the slug "getting-started".',
    example: "getting-started",
  })

const docSlug = () =>
  string({
    description:
      'A URL-safe representation of the doc title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the doc "New Features", enter the slug "new-features".',
    example: "new-features",
  })

const versionID = () =>
  string({
    description:
      "Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).",
    example: "v1.0.0",
  })

const pageQuery = named(
  "page",
  queryParam({
    name: "page",
    description: "Used to specify further pages (starts at 1).",
    schema: integer({
      default: 1,
      minimum: 1,
    }),
  }),
)

const perPageQuery = named(
  "perPage",
  queryParam({
    name: "perPage",
    description:
      "Number of items to include in pagination (up to 100, defaults to 10).",
    schema: integer({
      default: 10,
      minimum: 1,
      maximum: 100,
    }),
  }),
)

const paginationParams = [perPageQuery, pageQuery] as const

const xReadmeVersionParam = named(
  "x-readme-version",
  headerParam({
    name: "x-readme-version",
    description:
      "Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/reference/version#getversions.",
    example: "v3.0",
    required: false,
    schema: readmeVersion,
  }),
)

const versionIdParam = named(
  "versionId",
  pathParam({
    name: "versionId",
    description:
      "Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).",
    example: "v1.0.0",
    required: true,
    schema: versionID,
  }),
)

const tags = declareTags({
  "API Registry": {},
  "API Specification": {},
  "Apply to ReadMe": {},
  Categories: {},
  Changelog: {},
  "Custom Pages": {},
  Docs: {},
  Errors: {},
  Projects: {},
  Version: {},
} as const)

const basicAuth = named("apiKey", httpSecurity({ scheme: "basic" }))

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
      format: "url",
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

const errorWithCode = (code: string) =>
  allOf([
    baseError,
    object({
      "error?": string({ default: code }),
    }),
  ])

const category = () =>
  object({
    "title?": string({
      description:
        "A short title for the category. This is what will show in the sidebar.",
    }),
    "type?": string({
      enum: ["reference", "guide"],
      default: "guide",
      description:
        "A category can be part of your reference or guide documentation, which is determined by this field.",
    }),
  })

const createCategory = () =>
  allOf([
    category,
    object({
      title: string(),
    }),
  ])

const changelog = () =>
  object({
    title: string({
      description: "Title of the changelog.",
    }),
    "type?": string({
      default: "",
      enum: ["", "added", "fixed", "improved", "deprecated", "removed"],
    }),
    body: string({
      description: "Body content of the changelog.",
    }),
    "hidden?": boolean({
      description: "Visibility of the changelog.",
      default: true,
    }),
  })

const condensedProjectData = () =>
  object({
    "name?": string(),
    "subdomain?": string(),
    "jwtSecret?": string(),
    "baseUrl?": string({
      format: "url",
      description:
        "The base URL for the project. If the project is not running under a custom domain, it will be `https://projectSubdomain.readme.io`, otherwise it can either be or `https://example.com` or, in the case of an enterprise child project `https://example.com/projectSubdomain`.",
    }),
    "plan?": string(),
  })

const customPage = () =>
  object({
    title: string({
      description: "Title of the custom page.",
    }),
    "body?": string({
      description: "Body formatted in Markdown (displayed by default).",
    }),
    "html?": string({
      description:
        "Body formatted in HTML (sanitized, only displayed if `htmlmode` is **true**).",
    }),
    "htmlmode?": boolean({
      description:
        "**true** if `html` should be displayed, **false** if `body` should be displayed.",
      default: false,
    }),
    "hidden?": boolean({
      description: "Visibility of the custom page.",
      default: true,
    }),
  })

const doc = () =>
  object({
    title: string({
      description: "Title of the page.",
    }),
    "type?": string({
      description:
        'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).',
      enum: ["basic", "error", "link"],
    }),
    "body?": string({
      description:
        "Body content of the page, formatted in ReadMe or GitHub flavored Markdown. Accepts long page content, for example, greater than 100k characters.",
    }),
    category: string({
      description:
        "Category ID of the page, which you can get through https://docs.readme.com/reference/categories#getcategory.",
    }),
    "hidden?": boolean({
      description: "Visibility of the page.",
      default: true,
    }),
    "order?": int32({
      description: "The position of the page in your project sidebar.",
      default: 999,
    }),
    "parentDoc?": string({
      description:
        "For a subpage, specify the parent doc ID, which you can get through https://docs.readme.com/reference/docs#getdoc.",
    }),
    "error?": object({
      "code?": string({
        description: 'The error code for docs with the "error" type.',
      }),
    }),
  })

const version = () =>
  object({
    version: string({
      description: "Semantic Version",
    }),
    "codename?": string({
      description: "Dubbed name of version.",
    }),
    from: string({
      description: "Semantic Version to use as the base fork.",
    }),
    "is_stable?": boolean({
      description: "Should this be the **main** version?",
    }),
    "is_beta?": boolean({
      default: true,
    }),
    "is_hidden?": boolean({
      description: "Should this be publically accessible?",
    }),
    "is_deprecated?": boolean({
      description: "Should this be deprecated? Only allowed in PUT operations.",
    }),
  })

const linkPaginationHeader = named(
  "link",
  responseHeader({
    description:
      "Pagination information. See https://docs.readme.com/reference/pagination for more information.",
    schema: string(),
  }),
)

const xTotalCountHeader = named(
  "x-total-count",
  responseHeader({
    description:
      "The total amount of results, ignoring pagination. See https://docs.readme.com/reference/pagination for more information about pagination.",
    schema: string(),
  }),
)

const paginationHeaderParams = [
  linkPaginationHeader,
  xTotalCountHeader,
] as const

const authResponses = {
  401: resp({
    description: "Unauthorized",
    body: {
      "application/json": oneOf([
        errorWithCode("APIKEY_EMPTY"),
        errorWithCode("APIKEY_NOTFOUND"),
      ]),
    },
  }),
  403: resp({
    description: "Unauthorized",
    body: {
      "application/json": oneOf([errorWithCode("APIKEY_MISMATCH")]),
    },
  }),
}

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
    tags: Object.values(tags),
  },
  forAll: {},
  routes: {
    "/api-registry/:uuid": GET({
      id: "getAPIRegistry",
      summary: "Retrieve an entry from the API Registry",
      description: "Get an API definition file that's been uploaded to ReadMe.",
      tags: [tags["API Registry"]],
      req: {
        pathParams: { uuid: apiRegistryUUID },
      },
      res: {
        200: resp({
          description: "Successfully retrieved API registry entry.",
          body: { "application/json": object() },
        }),
        404: resp({
          description: "There is no API Registry entry with that UUID.",
          body: { "application/json": errorWithCode("REGISTRY_NOTFOUND") },
        }),
      },
    }),
    "/api-specification": scope({
      forAll: {
        tags: [tags["API Specification"]],
        req: {
          security: basicAuth,
        },
        res: {
          add: authResponses,
        },
      },
      GET: {
        id: "getAPISpecification",
        summary: "Get metadata",
        description: "Get API specification metadata.",
        req: {
          params: [...paginationParams, xReadmeVersionParam],
        },
        res: {
          200: resp({
            description: "Successfully retrieved API specification metadata.",
            headerParams: paginationHeaderParams,
          }),
          400: resp({
            description: "The supplied version header was empty.",
            body: { "application/json": errorWithCode("VERSION_EMPTY") },
          }),
          404: resp({
            description:
              "There is no project version matching x-readme-version.",
            body: { "application/json": errorWithCode("VERSION_NOTFOUND") },
          }),
        },
      },
      POST: {
        id: "uploadAPISpecification",
        summary: "Upload specification",
        description:
          "Upload an API specification to ReadMe. Or, to use a newer solution see https://docs.readme.com/docs/automatically-sync-api-specification-with-github.",
        req: {
          params: [xReadmeVersionParam],
          body: {
            "multipart/form-data": apiSpecificationUpload,
          },
        },
        res: {
          201: resp({
            description: "The API specification was successfully uploaded.",
          }),
          400: resp({
            description: "There was a validation error during upload.",
            body: {
              "application/json": oneOf([
                errorWithCode("SPEC_FILE_EMPTY"),
                errorWithCode("SPEC_INVALID"),
                errorWithCode("SPEC_INVALID_SCHEMA"),
                errorWithCode("SPEC_VERSION_NOTFOUND"),
              ]),
            },
          }),
          408: resp({
            description: "The API specification upload timed out.",
            body: { "application/json": errorWithCode("SPEC_TIMEOUT") },
          }),
        },
      },
    }),
    "/api-specification/:id": scope({
      forAll: {
        tags: [tags["API Specification"]],
        req: {
          security: basicAuth,
          pathParams: { id: apiSpecificationID },
        },
        res: {
          add: authResponses,
        },
      },
      PUT: {
        id: "updateAPISpecification",
        summary: "Update specification",
        description: "Update an API specification in ReadMe.",
        req: {
          body: {
            "multipart/form-data": apiSpecificationUpload,
          },
        },
        res: {
          200: resp({
            description: "The API specification was updated.",
          }),
          400: resp({
            description: "There was a validation error during upload.",
            body: {
              "application/json": oneOf([
                errorWithCode("SPEC_FILE_EMPTY"),
                errorWithCode("SPEC_ID_DUPLICATE"),
                errorWithCode("SPEC_ID_INVALID"),
                errorWithCode("SPEC_INVALID"),
                errorWithCode("SPEC_INVALID_SCHEMA"),
                errorWithCode("SPEC_VERSION_NOTFOUND"),
              ]),
            },
          }),
          404: resp({
            description: "There is no API specification with that ID.",
          }),
          408: resp({
            description: "The API specification upload timed out.",
            body: { "application/json": errorWithCode("SPEC_TIMEOUT") },
          }),
        },
      },
      DELETE: {
        id: "deleteAPISpecification",
        summary: "Delete specification",
        description: "Delete an API specification in ReadMe.",
        res: {
          204: resp({
            description: "The API specification was deleted.",
          }),
          400: resp({
            description: "The supplied API specification ID was invalid.",
            body: { "application/json": errorWithCode("SPEC_ID_INVALID") },
          }),
          404: resp({
            description: "There is no API specification with that ID.",
            body: { "application/json": errorWithCode("SPEC_NOTFOUND") },
          }),
        },
      },
    }),
    "/apply": scope({
      forAll: {
        tags: [tags["Apply to ReadMe"]],
        req: { mime: "application/json" },
        res: { mime: "application/json" },
      },
      GET: {
        id: "getOpenRoles",
        summary: "Get open roles",
        description: "Returns all the roles we're hiring for at ReadMe!",
        res: {
          200: resp({
            description: "All the roles that we're hiring for.",
            body: array(jobOpening),
          }),
        },
      },
      POST: {
        id: "applyToReadMe",
        summary: "Submit your application!",
        description:
          "This endpoint will let you apply to a job at ReadMe programatically, without having to go through our UI!",
        req: {
          body: apply,
        },
        res: {
          200: resp({
            description: "You did it!",
          }),
        },
      },
    }),
    "/categories": scope({
      forAll: {
        tags: [tags.Categories],
        req: {
          mime: "application/json",
          security: basicAuth,
        },
      },
      GET: {
        id: "getCategories",
        summary: "Get all categories",
        description: "Returns all the categories for a specified version.",
        req: {
          params: [xReadmeVersionParam, ...paginationParams],
        },
        res: {
          200: resp({
            description: "The list of categories.",
            headerParams: paginationHeaderParams,
          }),
        },
      },
      POST: {
        id: "createCategory",
        summary: "Create category",
        description: "Create a new category inside of this project.",
        req: {
          params: [xReadmeVersionParam],
          body: createCategory,
        },
        res: {
          201: resp({
            description: "The category has successfully been created.",
          }),
          400: resp({
            description: "The category payload was invalid.",
            body: { "application/json": errorWithCode("CATEGORY_INVALID") },
          }),
        },
      },
    }),
    "/categories/:slug": scope({
      forAll: {
        tags: [tags.Categories],
        req: {
          mime: "application/json",
          security: basicAuth,
          pathParams: { slug: categorySlug },
          params: [xReadmeVersionParam],
        },
      },
      GET: {
        id: "getCategory",
        summary: "Get category",
        description: "Returns the category with this slug.",
        res: {
          200: resp({
            description: "The category exists and has been returned.",
          }),
          404: resp({
            description: "There is no category with that slug.",
            body: { "application/json": errorWithCode("CATEGORY_NOTFOUND") },
          }),
        },
      },
      PUT: {
        id: "updateCategory",
        summary: "Update category",
        description: "Change the properties of a category.",
        req: {
          body: category,
        },
        res: {
          200: resp({
            description: "The category was successfully updated.",
          }),
          400: resp({
            description: "The category payload was invalid.",
            body: { "application/json": errorWithCode("CATEGORY_INVALID") },
          }),
          404: resp({
            description: "There is no category with that slug.",
            body: { "application/json": errorWithCode("CATEGORY_NOTFOUND") },
          }),
        },
      },
      DELETE: {
        id: "deleteCategory",
        summary: "Delete category",
        description:
          "Delete the category with this slug.\n>⚠️Heads Up!\n> This will also delete all of the docs within this category.",
        res: {
          204: resp({
            description: "The category was deleted.",
          }),
          404: resp({
            description: "There is no category with that slug.",
            body: { "application/json": errorWithCode("CATEGORY_NOTFOUND") },
          }),
        },
      },
    }),
    "/categories/:slug/docs": GET({
      id: "getCategoryDocs",
      summary: "Get docs for category",
      description: "Returns the docs and children docs within this category.",
      tags: [tags.Categories],
      req: {
        security: basicAuth,
        pathParams: { slug: categorySlug },
        params: [xReadmeVersionParam],
      },
      res: {
        200: resp({
          description:
            "The category exists and all of the docs have been returned.",
        }),
        404: resp({
          description: "There is no category with that slug.",
          body: { "application/json": errorWithCode("CATEGORY_NOTFOUND") },
        }),
      },
    }),
    "/changelogs": scope({
      forAll: {
        tags: [tags.Changelog],
        req: {
          mime: "application/json",
          security: basicAuth,
        },
      },
      GET: {
        id: "getChangelogs",
        summary: "Get changelogs",
        description: "Returns a list of changelogs.",
        req: {
          params: paginationParams,
        },
        res: {
          200: resp({
            description: "The list of changelogs.",
            headerParams: paginationHeaderParams,
          }),
        },
      },
      POST: {
        id: "createChangelog",
        summary: "Create changelog",
        description: "Create a new changelog entry.",
        req: {
          body: changelog,
        },
        res: {
          201: resp({
            description: "The changelog was successfully created.",
          }),
          400: resp({
            description: "There was a validation error during creation.",
          }),
        },
      },
    }),
    "/changelogs/:slug": scope({
      forAll: {
        tags: [tags.Changelog],
        req: {
          mime: "application/json",
          security: basicAuth,
          pathParams: { slug: changelogSlug },
        },
      },
      GET: {
        id: "getChangelog",
        summary: "Get changelog",
        description: "Returns the changelog with this slug.",
        res: {
          200: resp({
            description: "The changelog exists and has been returned.",
          }),
          404: resp({
            description: "There is no changelog with that slug.",
          }),
        },
      },
      PUT: {
        id: "updateChangelog",
        summary: "Update changelog",
        description: "Update a changelog with this slug.",
        req: {
          body: changelog,
        },
        res: {
          200: resp({
            description: "The changelog was successfully updated.",
          }),
          400: resp({
            description: "There was a validation error during update.",
          }),
          404: resp({
            description: "There is no changelog with that slug.",
          }),
        },
      },
      DELETE: {
        id: "deleteChangelog",
        summary: "Delete changelog",
        description: "Delete the changelog with this slug.",
        res: {
          204: resp({
            description: "The changelog was successfully deleted.",
          }),
          404: resp({
            description: "There is no changelog with that slug.",
          }),
        },
      },
    }),
    "/custompages": scope({
      forAll: {
        tags: [tags["Custom Pages"]],
        req: {
          mime: "application/json",
          security: basicAuth,
        },
        res: {
          add: authResponses,
        },
      },
      GET: {
        id: "getCustomPages",
        summary: "Get custom pages",
        description: "Returns a list of custom pages.",
        req: {
          params: paginationParams,
        },
        res: {
          200: resp({
            description: "The list of custom pages.",
            headerParams: paginationHeaderParams,
          }),
        },
      },
      POST: {
        id: "createCustomPage",
        summary: "Create custom page",
        description: "Create a new custom page inside of this project.",
        req: {
          body: customPage,
        },
        res: {
          201: resp({
            description: "The custom page was successfully created.",
          }),
          400: resp({
            description: "The custom page payload was invalid.",
            body: { "application/json": errorWithCode("CUSTOMPAGE_INVALID") },
          }),
        },
      },
    }),
    "/custompages/:slug": scope({
      forAll: {
        tags: [tags["Custom Pages"]],
        req: {
          mime: "application/json",
          security: basicAuth,
          pathParams: { slug: customPageSlug },
        },
        res: {
          add: authResponses,
        },
      },
      GET: {
        id: "getCustomPage",
        summary: "Get custom page",
        description: "Returns the custom page with this slug.",
        res: {
          200: resp({
            description: "The custom page exists and has been returned.",
          }),
          404: resp({
            description: "There is no custom page with that slug.",
            body: {
              "application/json": errorWithCode("CUSTOMPAGE_NOTFOUND"),
            },
          }),
        },
      },
      PUT: {
        id: "updateCustomPage",
        summary: "Update custom page",
        description: "Update a custom page with this slug.",
        req: {
          body: customPage,
        },
        res: {
          200: resp({
            description: "The custom page was successfully updated.",
          }),
          400: resp({
            description: "The custom page payload was invalid.",
            body: { "application/json": errorWithCode("CUSTOMPAGE_INVALID") },
          }),
          404: resp({
            description: "There is no custom page with that slug.",
            body: {
              "application/json": errorWithCode("CUSTOMPAGE_NOTFOUND"),
            },
          }),
        },
      },
      DELETE: {
        id: "deleteCustomPage",
        summary: "Delete custom page",
        description: "Delete the custom page with this slug.",
        res: {
          204: resp({
            description: "The custom page was successfully deleted.",
          }),
          404: resp({
            description: "There is no custom page with that slug.",
            body: {
              "application/json": errorWithCode("CUSTOMPAGE_NOTFOUND"),
            },
          }),
        },
      },
    }),
    "/docs/:slug": scope({
      forAll: {
        tags: [tags.Docs],
        req: {
          mime: "application/json",
          security: basicAuth,
          pathParams: { slug: docSlug },
          params: [xReadmeVersionParam],
        },
        res: {
          add: authResponses,
        },
      },
      GET: {
        id: "getDoc",
        summary: "Get doc",
        description: "Returns the doc with this slug.",
        res: {
          200: resp({
            description: "The doc exists and has been returned.",
          }),
          404: resp({
            description: "There is no doc with that slug.",
            body: { "application/json": errorWithCode("DOC_NOTFOUND") },
          }),
        },
      },
      PUT: {
        id: "updateDoc",
        summary: "Update doc",
        description: "Update a doc with this slug.",
        req: {
          body: doc,
        },
        res: {
          200: resp({
            description: "The doc was successfully updated.",
          }),
          400: resp({
            description: "The doc payload was invalid.",
            body: { "application/json": errorWithCode("DOC_INVALID") },
          }),
          404: resp({
            description: "There is no doc with that slug.",
            body: { "application/json": errorWithCode("DOC_NOTFOUND") },
          }),
        },
      },
      DELETE: {
        id: "deleteDoc",
        summary: "Delete doc",
        description: "Delete the doc with this slug.",
        res: {
          204: resp({
            description: "The doc was successfully deleted.",
          }),
          404: resp({
            description: "There is no doc with that slug.",
            body: { "application/json": errorWithCode("DOC_NOTFOUND") },
          }),
        },
      },
    }),
    "/docs": POST({
      id: "createDoc",
      summary: "Create doc",
      description: "Create a new doc inside of this project.",
      tags: [tags.Docs],
      req: {
        security: basicAuth,
        params: [xReadmeVersionParam],
        body: { "application/json": doc },
      },
      res: {
        201: resp({
          description: "The doc was successfully created.",
        }),
        400: resp({
          description: "The doc payload was invalid.",
          body: { "application/json": errorWithCode("DOC_INVALID") },
        }),
        ...authResponses,
      },
    }),
    "/docs/search": POST({
      id: "searchDocs",
      summary: "Search docs",
      description: "Returns all docs that match the search.",
      tags: [tags.Docs],
      req: {
        security: basicAuth,
        params: [xReadmeVersionParam],
        query: {
          search: string({
            description: "Search string to look for.",
          }),
        },
      },
      res: {
        200: resp({
          description: "The search was successful and results were returned.",
        }),
        ...authResponses,
      },
    }),
    "/errors": GET({
      id: "getErrors",
      summary: "Get errors",
      description: "Returns with all of the error page types for this project.",
      tags: [tags.Errors],
      req: {
        security: basicAuth,
      },
      res: {
        200: resp({
          description: "An array of the errors.",
        }),
        ...authResponses,
      },
    }),
    "/": GET({
      id: "getProject",
      summary: "Get metadata about the current project",
      description: "Returns project data for the API key.",
      tags: [tags.Projects],
      req: {
        security: basicAuth,
      },
      res: {
        200: resp({
          description: "Project data",
          body: { "application/json": condensedProjectData },
        }),
        ...authResponses,
      },
    }),
    "/version": scope({
      forAll: {
        tags: [tags.Version],
        req: {
          mime: "application/json",
          security: basicAuth,
        },
        res: {
          add: authResponses,
        },
      },
      GET: {
        id: "getVersions",
        summary: "Get versions",
        description:
          "Retrieve a list of versions associated with a project API key.",
        res: {
          200: resp({
            description: "A list of versions.",
          }),
        },
      },
      POST: {
        id: "createVersion",
        summary: "Create version",
        description: "Create a new version.",
        req: {
          body: version,
        },
        res: {
          200: resp({
            description: "The version was successfully created.",
          }),
          400: resp({
            description: "There was a validation error during creation.",
            body: {
              "application/json": oneOf([
                errorWithCode("VERSION_EMPTY"),
                errorWithCode("VERSION_DUPLICATE"),
                errorWithCode("VERSION_FORK_EMPTY"),
              ]),
            },
          }),
          404: resp({
            description: "The forked version was not found.",
            body: {
              "application/json": errorWithCode("VERSION_FORK_NOTFOUND"),
            },
          }),
        },
      },
    }),
    "/version/:versionId": scope({
      forAll: {
        tags: [tags.Version],
        req: {
          mime: "application/json",
          security: basicAuth,
          params: [versionIdParam],
        },
        res: {
          add: authResponses,
        },
      },
      GET: {
        id: "getVersion",
        summary: "Get version",
        description: "Returns the version with this version ID.",
        res: {
          200: resp({
            description: "The version exists and has been returned.",
          }),
          404: resp({
            description: "There is no version with that version ID.",
            body: { "application/json": errorWithCode("VERSION_NOTFOUND") },
          }),
        },
      },
      PUT: {
        id: "updateVersion",
        summary: "Update version",
        description: "Update an existing version.",
        req: {
          body: version,
        },
        res: {
          200: resp({
            description: "The version was successfully updated.",
          }),
          400: resp({
            description: "The stable version cannot be demoted.",
            body: {
              "application/json": errorWithCode("VERSION_CANT_DEMOTE_STABLE"),
            },
          }),
          404: resp({
            description: "There is no version with that version ID.",
            body: { "application/json": errorWithCode("VERSION_NOTFOUND") },
          }),
        },
      },
      DELETE: {
        id: "deleteVersion",
        summary: "Delete version",
        description: "Delete a version",
        res: {
          200: resp({
            description: "The version was successfully deleted.",
          }),
          400: resp({
            description: "The stable version cannot be removed.",
            body: {
              "application/json": errorWithCode("VERSION_CANT_REMOVE_STABLE"),
            },
          }),
          404: resp({
            description: "There is no version with that version ID.",
            body: { "application/json": errorWithCode("VERSION_NOTFOUND") },
          }),
        },
      },
    }),
  },
})
