import {
  array,
  dict,
  httpURL,
  int32,
  object,
  openAPI,
  querySecurity,
  string,
  unixMillis,
  unknown,
} from "../responsible.ts"

const Thumbnail = () =>
  object({
    "height?": int32({ minimum: 1 }),
    "url?": httpURL(),
    "width?": int32({ minimum: 1 }),
  })

const schemas = {
  ChannelID: string({ minLength: 1 }),
  PlaylistID: string({ minLength: 1 }),
  VideoID: string({ minLength: 1 }),

  get Channels() {
    return object({
      etag: string({ minLength: 1 }),
      items: array(this.Item, { minItems: 0 }),
      kind: string({ minLength: 1 }),
      pageInfo: this.PageInfo,
    })
  },

  get ContentDetails() {
    return object({
      relatedPlaylists: this.RelatedPlaylists,
    })
  },

  get Item() {
    return object({
      id: this.VideoID,
      "contentDetails?": this.ContentDetails,
      "etag?": string({ minLength: 1 }),
      "kind?": string({ minLength: 1 }),
      "snippet?": this.Snippet,
    })
  },

  get Localized() {
    return object()
  },

  get PageInfo() {
    return object()
  },

  Part: string({ enum: ["id", "snippet", "contentDetails", "statistics"] }),
  get Parts() {
    return array(this.Part)
  },

  PlaylistItems: object(),
  Playlists: object(),
  get RelatedPlaylists() {
    return object({
      uploads: this.PlaylistID,
      "watchHistory?": this.PlaylistID,
      "watchLater?": this.PlaylistID,
    })
  },

  get Snippet() {
    return object({
      "country?": string(),
      "customUrl?": string(),
      "description?": string(),
      "localized?": this.Localized,
      publishedAt: unixMillis(),
      "thumbnails?": dict(string(), Thumbnail),
      title: string(),
    })
  },

  get VideoIDs() {
    return array(this.VideoID)
  },
  Videos: object(),
} as const

const securitySchemes = {
  ApiToken: querySecurity({ name: "key" }),
} as const

export const YouTubeAPI = openAPI(
  {
    openapi: "3.1.0",
    info: {
      title: "YouTube API",
      version: "3",
    },
    servers: [{ url: "https://www.googleapis.com/youtube/v3" }],
  },
  { schemas, securitySchemes },
  {
    forAll: {
      req: {
        security: "ApiToken",
      },
      res: {
        mime: "application/json",
        add: {
          401: unknown(),
        },
      },
    },
    "scope /videos": {
      POST: {},
      GET: {
        req: {
          query: {
            id: "VideoIDs",
            maxResults: int32({ minimum: 1, default: 50 }),
            part: "Parts",
          },
        },
        res: {
          200: "Videos",
        },
      },
    },
    "GET /playlistItems": {
      req: {
        query: {
          playlistId: "PlaylistID",
          maxResults: int32({ minimum: 1, default: 50 }),
          part: "Parts",
          "pageToken?": string({ minLength: 1 }),
        },
      },
      res: {
        200: "PlaylistItems",
      },
    },
    "GET /playlists": {
      req: {
        query: {
          id: "PlaylistID",
          part: "Parts",
        },
      },
      res: {
        200: "Playlists",
      },
    },
    "GET /channels": {
      req: {
        query: {
          id: "ChannelID",
          part: "Parts",
          "forUsername?": string({ minLength: 1 }),
        },
      },
      res: {
        200: "Channels",
      },
    },
  },
)
