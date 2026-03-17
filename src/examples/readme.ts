import { responsibleAPI } from "../dsl/dsl.ts"
import { GET, POST, response } from "../dsl/methods.ts"
import {
  array,
  boolean,
  int32,
  object,
  string,
  unknown,
} from "../dsl/schema.ts"
import { scope } from "../dsl/scope.ts"

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
    format: "uuid",
  })

const apiSpecificationID = () =>
  string({
    description:
      "ID of the API specification. The unique ID for each API can be found by navigating to your API Definitions page.",
  })

const page = () =>
  int32({
    description: "Used to specify further pages (starts at 1).",
    default: 1,
    minimum: 1,
  })

const perPage = () =>
  int32({
    description:
      "Number of items to include in pagination (up to 100, defaults to 10).",
    default: 10,
    minimum: 1,
    maximum: 100,
  })

const readmeVersion = () =>
  string({
    description:
      "Version number of your docs project, for example, v3.0. By default the main project version is used.",
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
      "Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the Get Versions endpoint.",
    example: "v1.0.0",
  })

const paginationHeaders = {
  Link: string({
    description:
      "Pagination information. See https://docs.readme.com/reference/pagination for more information.",
  }),
  "x-total-count": string({
    description:
      "The total amount of results, ignoring pagination. See https://docs.readme.com/reference/pagination for more information about pagination.",
  }),
}

const authResponses = {
  401: response({
    description: "Unauthorized",
    body: { "application/json": unknown() },
  }),
  403: response({
    description: "Forbidden",
    body: { "application/json": unknown() },
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
    tags: [
      { name: "API Registry" },
      { name: "API Specification" },
      { name: "Apply to ReadMe" },
      { name: "Categories" },
      { name: "Changelog" },
      { name: "Custom Pages" },
      { name: "Docs" },
      { name: "Errors" },
      { name: "Projects" },
      { name: "Version" },
    ],
  },
  forAll: {},
  routes: {
    "/api-registry/:uuid": GET({
      id: "getAPIRegistry",
      description: "Get an API definition file that's been uploaded to ReadMe.",
      req: {
        params: { uuid: apiRegistryUUID },
      },
      res: {
        200: response({
          description: "Successfully retrieved API registry entry.",
          body: { "application/json": object() },
        }),
        404: response({
          description: "There is no API Registry entry with that UUID.",
        }),
      },
    }),
    "/api-specification": scope({
      forAll: {
        req: {
          headers: {
            "x-readme-version?": readmeVersion,
          },
        },
      },
      routes: {
        GET: {
          id: "getAPISpecification",
          description: "Get API specification metadata.",
          req: {
            query: {
              "perPage?": perPage,
              "page?": page,
            },
          },
          res: {
            200: response({
              description: "Successfully retrieved API specification metadata.",
              headers: paginationHeaders,
            }),
            400: response({
              description: "The supplied version header was empty.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description:
                "There is no project version matching x-readme-version.",
              body: { "application/json": unknown() },
            }),
          },
        },
        POST: {
          id: "uploadAPISpecification",
          description:
            "Upload an API specification to ReadMe. Or, to use a newer solution see https://docs.readme.com/docs/automatically-sync-api-specification-with-github.",
          req: {
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
            ...authResponses,
            408: response({
              description: "The API specification upload timed out.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
    "/api-specification/:id": scope({
      forAll: {
        req: {
          params: { id: apiSpecificationID },
        },
      },
      routes: {
        PUT: {
          id: "updateAPISpecification",
          description: "Update an API specification in ReadMe.",
          req: {
            body: {
              "multipart/form-data": apiSpecificationUpload,
            },
          },
          res: {
            200: response({
              description: "The API specification was updated.",
            }),
            400: response({
              description: "There was a validation error during upload.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description: "There is no API specification with that ID.",
            }),
            408: response({
              description: "The API specification upload timed out.",
              body: { "application/json": unknown() },
            }),
          },
        },
        DELETE: {
          id: "deleteAPISpecification",
          description: "Delete an API specification in ReadMe.",
          res: {
            204: response({
              description: "The API specification was deleted.",
            }),
            400: response({
              description: "The supplied API specification ID was invalid.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description: "There is no API specification with that ID.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
    "/apply": scope({
      forAll: {
        req: { mime: "application/json" },
        res: { mime: "application/json" },
      },
      routes: {
        GET: {
          id: "getOpenRoles",
          description: "Returns all the roles we're hiring for at ReadMe!",
          res: {
            200: response({
              description: "All the roles that we're hiring for.",
              body: array(jobOpening),
            }),
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
            200: response({
              description: "You did it!",
            }),
          },
        },
      },
    }),
    "/categories": scope({
      forAll: {
        req: {
          headers: {
            "x-readme-version?": readmeVersion,
          },
        },
      },
      routes: {
        GET: {
          id: "getCategories",
          description: "Returns all the categories for a specified version.",
          req: {
            query: {
              "perPage?": perPage,
              "page?": page,
            },
          },
          res: {
            200: response({
              description: "The list of categories.",
              headers: paginationHeaders,
            }),
            ...authResponses,
          },
        },
        POST: {
          id: "createCategory",
          description: "Create a new category inside of this project.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            201: response({
              description: "The category has successfully been created.",
            }),
            400: response({
              description: "The category payload was invalid.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
    "/categories/:slug": scope({
      forAll: {
        req: {
          params: { slug: categorySlug },
          headers: {
            "x-readme-version?": readmeVersion,
          },
        },
      },
      routes: {
        GET: {
          id: "getCategory",
          description: "Returns the category with this slug.",
          res: {
            200: response({
              description: "The category exists and has been returned.",
            }),
            404: response({
              description: "There is no category with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
        PUT: {
          id: "updateCategory",
          description: "Change the properties of a category.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            200: response({
              description: "The category was successfully updated.",
            }),
            400: response({
              description: "The category payload was invalid.",
              body: { "application/json": unknown() },
            }),
            404: response({
              description: "There is no category with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
        DELETE: {
          id: "deleteCategory",
          description:
            "Delete the category with this slug. This will also delete all of the docs within this category.",
          res: {
            204: response({
              description: "The category was deleted.",
            }),
            404: response({
              description: "There is no category with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
    "/categories/:slug/docs": GET({
      id: "getCategoryDocs",
      description: "Returns the docs and children docs within this category.",
      req: {
        params: { slug: categorySlug },
        headers: {
          "x-readme-version?": readmeVersion,
        },
      },
      res: {
        200: response({
          description: "The category exists and all of the docs have been returned.",
        }),
        404: response({
          description: "There is no category with that slug.",
          body: { "application/json": unknown() },
        }),
      },
    }),
    "/changelogs": scope({
      routes: {
        GET: {
          id: "getChangelogs",
          description: "Returns a list of changelogs.",
          req: {
            query: {
              "perPage?": perPage,
              "page?": page,
            },
          },
          res: {
            200: response({
              description: "The list of changelogs.",
              headers: paginationHeaders,
            }),
            ...authResponses,
          },
        },
        POST: {
          id: "createChangelog",
          description: "Create a new changelog entry.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            201: response({
              description: "The changelog was successfully created.",
            }),
            400: response({
              description: "There was a validation error during creation.",
            }),
            ...authResponses,
          },
        },
      },
    }),
    "/changelogs/:slug": scope({
      forAll: {
        req: {
          params: { slug: changelogSlug },
        },
      },
      routes: {
        GET: {
          id: "getChangelog",
          description: "Returns the changelog with this slug.",
          res: {
            200: response({
              description: "The changelog exists and has been returned.",
            }),
            404: response({
              description: "There is no changelog with that slug.",
            }),
            ...authResponses,
          },
        },
        PUT: {
          id: "updateChangelog",
          description: "Update a changelog with this slug.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            200: response({
              description: "The changelog was successfully updated.",
            }),
            400: response({
              description: "There was a validation error during update.",
            }),
            404: response({
              description: "There is no changelog with that slug.",
            }),
            ...authResponses,
          },
        },
        DELETE: {
          id: "deleteChangelog",
          description: "Delete the changelog with this slug.",
          res: {
            204: response({
              description: "The changelog was successfully deleted.",
            }),
            404: response({
              description: "There is no changelog with that slug.",
            }),
            ...authResponses,
          },
        },
      },
    }),
    "/custompages": scope({
      routes: {
        GET: {
          id: "getCustomPages",
          description: "Returns a list of custom pages.",
          req: {
            query: {
              "perPage?": perPage,
              "page?": page,
            },
          },
          res: {
            200: response({
              description: "The list of custom pages.",
              headers: paginationHeaders,
            }),
            ...authResponses,
          },
        },
        POST: {
          id: "createCustomPage",
          description: "Create a new custom page inside of this project.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            201: response({
              description: "The custom page was successfully created.",
            }),
            400: response({
              description: "The custom page payload was invalid.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
          },
        },
      },
    }),
    "/custompages/:slug": scope({
      forAll: {
        req: {
          params: { slug: customPageSlug },
        },
      },
      routes: {
        GET: {
          id: "getCustomPage",
          description: "Returns the custom page with this slug.",
          res: {
            200: response({
              description: "The custom page exists and has been returned.",
            }),
            ...authResponses,
            404: response({
              description: "There is no custom page with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
        PUT: {
          id: "updateCustomPage",
          description: "Update a custom page with this slug.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            200: response({
              description: "The custom page was successfully updated.",
            }),
            400: response({
              description: "The custom page payload was invalid.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description: "There is no custom page with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
        DELETE: {
          id: "deleteCustomPage",
          description: "Delete the custom page with this slug.",
          res: {
            204: response({
              description: "The custom page was successfully deleted.",
            }),
            ...authResponses,
            404: response({
              description: "There is no custom page with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
    "/docs/:slug": scope({
      forAll: {
        req: {
          params: { slug: docSlug },
          headers: {
            "x-readme-version?": readmeVersion,
          },
        },
      },
      routes: {
        GET: {
          id: "getDoc",
          description: "Returns the doc with this slug.",
          res: {
            200: response({
              description: "The doc exists and has been returned.",
            }),
            ...authResponses,
            404: response({
              description: "There is no doc with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
        PUT: {
          id: "updateDoc",
          description: "Update a doc with this slug.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            200: response({
              description: "The doc was successfully updated.",
            }),
            400: response({
              description: "The doc payload was invalid.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description: "There is no doc with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
        DELETE: {
          id: "deleteDoc",
          description: "Delete the doc with this slug.",
          res: {
            204: response({
              description: "The doc was successfully deleted.",
            }),
            ...authResponses,
            404: response({
              description: "There is no doc with that slug.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
    "/docs": POST({
      id: "createDoc",
      description: "Create a new doc inside of this project.",
      req: {
        headers: {
          "x-readme-version?": readmeVersion,
        },
        body: { "application/json": unknown() },
      },
      res: {
        201: response({
          description: "The doc was successfully created.",
        }),
        400: response({
          description: "The doc payload was invalid.",
          body: { "application/json": unknown() },
        }),
        ...authResponses,
      },
    }),
    "/docs/search": POST({
      id: "searchDocs",
      description: "Returns all docs that match the search.",
      req: {
        headers: {
          "x-readme-version?": readmeVersion,
        },
        query: {
          search: string({
            description: "Search string to look for.",
          }),
        },
      },
      res: {
        200: response({
          description: "The search was successful and results were returned.",
        }),
        ...authResponses,
      },
    }),
    "/errors": GET({
      id: "getErrors",
      description: "Returns all of the error page types for this project.",
      res: {
        200: response({
          description: "An array of the errors.",
        }),
        ...authResponses,
      },
    }),
    "/": GET({
      id: "getProject",
      description: "Returns project data for the API key.",
      res: {
        200: response({
          description: "Project data",
          body: { "application/json": unknown() },
        }),
        ...authResponses,
      },
    }),
    "/version": scope({
      routes: {
        GET: {
          id: "getVersions",
          description:
            "Retrieve a list of versions associated with a project API key.",
          res: {
            200: response({
              description: "A list of versions.",
            }),
            ...authResponses,
          },
        },
        POST: {
          id: "createVersion",
          description: "Create a new version.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            200: response({
              description: "The version was successfully created.",
            }),
            400: response({
              description: "There was a validation error during creation.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description: "The forked version was not found.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
    "/version/:versionId": scope({
      forAll: {
        req: {
          params: { versionId: versionID },
        },
      },
      routes: {
        GET: {
          id: "getVersion",
          description: "Returns the version with this version ID.",
          res: {
            200: response({
              description: "The version exists and has been returned.",
            }),
            ...authResponses,
            404: response({
              description: "There is no version with that version ID.",
              body: { "application/json": unknown() },
            }),
          },
        },
        PUT: {
          id: "updateVersion",
          description: "Update an existing version.",
          req: {
            body: { "application/json": unknown() },
          },
          res: {
            200: response({
              description: "The version was successfully updated.",
            }),
            400: response({
              description: "The stable version cannot be demoted.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description: "There is no version with that version ID.",
              body: { "application/json": unknown() },
            }),
          },
        },
        DELETE: {
          id: "deleteVersion",
          description: "Delete a version.",
          res: {
            200: response({
              description: "The version was successfully deleted.",
            }),
            400: response({
              description: "The stable version cannot be removed.",
              body: { "application/json": unknown() },
            }),
            ...authResponses,
            404: response({
              description: "There is no version with that version ID.",
              body: { "application/json": unknown() },
            }),
          },
        },
      },
    }),
  },
})
