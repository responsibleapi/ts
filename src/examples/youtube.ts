import {
  array,
  dict,
  GET,
  int32,
  int64,
  middleware,
  object,
  openAPI,
  querySecurity,
  scope,
  string,
  unknown,
} from "../responsible.ts"

const VideoID = () => string({ minLength: 1 })
const ChannelID = () => string({ minLength: 1 })
const PlaylistID = () => string({ minLength: 1 })

const HttpURL = () =>
  string({
    format: "uri",
    pattern: /^https?:\/\/\S+$/,
  })

const Thumbnail = () =>
  object({
    "height?": int32({ minimum: 1 }),
    "url?": HttpURL,
    "width?": int32({ minimum: 1 }),
  })

const Localized = () => object()

const PageInfo = () => object()

const UnixMillis = () => int64({ description: "UNIX epoch milliseconds" })

const Snippet = () =>
  object({
    title: string,
    publishedAt: UnixMillis,
    "country?": string,
    "customUrl?": string,
    "description?": string,
    "localized?": Localized,
    "thumbnails?": dict(string, Thumbnail),
  })

const RelatedPlaylists = () =>
  object({
    uploads: PlaylistID,
    "watchHistory?": PlaylistID,
    "watchLater?": PlaylistID,
  })

const ContentDetails = () =>
  object({
    relatedPlaylists: RelatedPlaylists,
  })

const Item = () =>
  object({
    id: VideoID,
    "contentDetails?": ContentDetails,
    "etag?": string({ minLength: 1 }),
    "kind?": string({ minLength: 1 }),
    "snippet?": Snippet,
  })

const Channels = () =>
  object({
    etag: string({ minLength: 1 }),
    items: array(Item, { minItems: 0 }),
    kind: string({ minLength: 1 }),
    pageInfo: PageInfo,
  })

const VideoIDs = () => array(VideoID)

const Part = () =>
  string({ enum: ["id", "snippet", "contentDetails", "statistics"] })

const Parts = () => array(Part)

const PlaylistItems = () => object()

const Playlists = () => object()

const Videos = () => object

const security = () => querySecurity({ name: "key" })

export const YouTubeAPI = openAPI(
  {
    openapi: "3.1.0",
    info: {
      title: "YouTube API",
      version: "3",
    },
    servers: [{ url: "https://www.googleapis.com/youtube/v3" }],
  },
  {
    "/*": middleware({
      req: { security },
      res: {
        mime: "application/json",
        add: { 401: unknown },
      },
    }),
    "/videos": scope({
      POST: {},
      GET: {
        req: {
          query: {
            id: VideoIDs,
            maxResults: int32({ minimum: 1, default: 50 }),
            part: Parts,
          },
        },
        res: { 200: Videos },
      },
    }),
    "/playlistItems": GET({
      req: {
        query: {
          playlistId: PlaylistID,
          maxResults: int32({ minimum: 1, default: 50 }),
          part: Parts,
          "pageToken?": string({ minLength: 1 }),
        },
      },
      res: { 200: PlaylistItems },
    }),
    "/playlists": GET({
      req: {
        query: {
          id: PlaylistID,
          part: Parts,
        },
      },
      res: { 200: Playlists },
    }),
    "/channels": GET({
      req: {
        query: {
          id: ChannelID,
          part: Parts,
          "forUsername?": string({ minLength: 1 }),
        },
      },
      res: { 200: Channels },
    }),
  },
)
