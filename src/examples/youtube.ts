import { responsibleAPI } from "../dsl/dsl.ts"
import { GET } from "../dsl/methods.ts"
import { named } from "../dsl/nameable.ts"
import {
  array,
  dict,
  int32,
  int64,
  object,
  string,
  unknown,
} from "../dsl/schema.ts"
import { queryParam } from "../dsl/scope.ts"
import { oauth2Security } from "../dsl/security.ts"

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
    "?height": int32({ minimum: 1 }),
    "?url": HttpURL,
    "?width": int32({ minimum: 1 }),
  })

const Localized = () => object()

const PageInfo = () => object()

const UnixMillis = () => int64({ description: "UNIX epoch milliseconds" })

const Snippet = () =>
  object({
    title: string,
    publishedAt: UnixMillis,
    "?country": string,
    "?customUrl": string,
    "?description": string,
    "?localized": Localized,
    "?thumbnails": dict(string, Thumbnail),
  })

const RelatedPlaylists = () =>
  object({
    uploads: PlaylistID,
    "?watchHistory": PlaylistID,
    "?watchLater": PlaylistID,
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

const Videos = () => object()

const youtubeAuthScopes = {
  "https://www.googleapis.com/auth/youtube": "Manage your YouTube account",
  "https://www.googleapis.com/auth/youtube.channel-memberships.creator":
    "See a list of your current active channel members, their current level, and when they became a member",
  "https://www.googleapis.com/auth/youtube.force-ssl":
    "See, edit, and permanently delete your YouTube videos, ratings, comments and captions",
  "https://www.googleapis.com/auth/youtube.readonly":
    "View your YouTube account",
  "https://www.googleapis.com/auth/youtube.upload":
    "Manage your YouTube videos",
  "https://www.googleapis.com/auth/youtubepartner":
    "View and manage your assets and associated content on YouTube",
  "https://www.googleapis.com/auth/youtubepartner-channel-audit":
    "View private information of your YouTube channel relevant during the audit process with a YouTube partner",
} as const

const Oauth2 = () =>
  oauth2Security({
    description: "Oauth 2.0 implicit and authorizationCode authentication",
    flows: {
      implicit: {
        authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
        scopes: youtubeAuthScopes,
      },
      authorizationCode: {
        authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://accounts.google.com/o/oauth2/token",
        scopes: youtubeAuthScopes,
      },
    },
  })

const keyQuery = named(
  "key",
  queryParam({
    description:
      "API key. Your API key identifies your project and provides you with API access, quota, and reports. Required unless you provide an OAuth 2.0 token.",
    in: "query",
    name: "key",
    schema: string(),
  }),
)

const xgafv = named(
  "_.xgafv",
  queryParam({
    description: "V1 error format.",
    in: "query",
    name: "$.xgafv",
    schema: string({ enum: ["1", "2"] }),
  }),
)

export default responsibleAPI({
  partialDoc: {
    openapi: "3.1.0",
    info: {
      title: "YouTube API",
      version: "3",
    },
    servers: [{ url: "https://www.googleapis.com/youtube/v3" }],
  },
  forAll: {
    req: {
      "security?": Oauth2,
      params: [keyQuery, xgafv],
    },
    res: {
      mime: "application/json",
      add: { 401: unknown },
    },
  },
  routes: {
    "/videos": GET({
      req: {
        query: {
          id: VideoIDs,
          maxResults: int32({ minimum: 1, default: 50 }),
          part: Parts,
        },
      },
      res: { 200: Videos },
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
})
