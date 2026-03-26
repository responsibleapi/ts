import { responsibleAPI } from "../dsl/dsl.ts"
import { GET, POST, response } from "../dsl/methods.ts"
import { named } from "../dsl/nameable.ts"
import { dict } from "../dsl/schema.ts"
import { queryParam, scope } from "../dsl/scope.ts"
import {
  securityAND,
  securityOR,
  oauth2Requirement,
  oauth2Security,
} from "../dsl/security.ts"
import { declareTags } from "../dsl/tags.ts"

const oauthScopes = {
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

const Oauth2 = named(
  "Oauth2",
  oauth2Security({
    description: "Oauth 2.0 implicit authentication",
    flows: {
      implicit: {
        authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
        scopes: oauthScopes,
      },
    },
  }),
)

const Oauth2c = () =>
  oauth2Security({
    description: "Oauth 2.0 authorizationCode authentication",
    flows: {
      authorizationCode: {
        authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://accounts.google.com/o/oauth2/token",
        scopes: oauthScopes,
      },
    },
  })

const youtubeScope = (scopeName: keyof typeof oauthScopes) =>
  securityAND(
    oauth2Requirement(Oauth2, [scopeName]),
    oauth2Requirement(Oauth2c, [scopeName]),
  )

const youtubeScopes = (
  ...scopes: readonly [
    keyof typeof oauthScopes,
    keyof typeof oauthScopes,
    ...(keyof typeof oauthScopes)[],
  ]
) => {
  const [first, second, ...rest] = scopes

  return securityOR(
    youtubeScope(first),
    youtubeScope(second),
    ...rest.map(youtubeScope),
  )
}

const AbuseReport = () =>
  ({
    properties: {
      abuseTypes: {
        items: AbuseType,
        type: "array",
      } as const,
      description: {
        type: "string",
      } as const,
      relatedEntities: {
        items: RelatedEntity,
        type: "array",
      } as const,
      subject: Entity,
    },
    type: "object",
  }) as const

const AbuseType = () =>
  ({
    properties: {
      id: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const AccessPolicy = () =>
  ({
    description: "Rights management policy for YouTube resources.",
    properties: {
      allowed: {
        description:
          "The value of allowed indicates whether the access to the policy is allowed or denied by default.",
        type: "boolean",
      } as const,
      exception: {
        description:
          "A list of region codes that identify countries where the default policy do not apply.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const Activity = () =>
  ({
    description:
      "An *activity* resource contains information about an action that a particular channel, or user, has taken on YouTube.The actions reported in activity feeds include rating a video, sharing a video, marking a video as a favorite, commenting on a video, uploading a video, and so forth. Each activity resource identifies the type of action, the channel associated with the action, and the resource(s) associated with the action, such as the video that was rated or uploaded.",
    properties: {
      contentDetails: ActivityContentDetails,
      etag: {
        description: "Etag of this resource",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the activity.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#activity",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#activity".',
        type: "string",
      } as const,
      snippet: ActivitySnippet,
    },
    type: "object",
  }) as const

const ActivityContentDetails = () =>
  ({
    description:
      "Details about the content of an activity: the video that was shared, the channel that was subscribed to, etc.",
    properties: {
      bulletin: ActivityContentDetailsBulletin,
      channelItem: ActivityContentDetailsChannelItem,
      comment: ActivityContentDetailsComment,
      favorite: ActivityContentDetailsFavorite,
      like: ActivityContentDetailsLike,
      playlistItem: ActivityContentDetailsPlaylistItem,
      promotedItem: ActivityContentDetailsPromotedItem,
      recommendation: ActivityContentDetailsRecommendation,
      social: ActivityContentDetailsSocial,
      subscription: ActivityContentDetailsSubscription,
      upload: ActivityContentDetailsUpload,
    },
    type: "object",
  }) as const

const ActivityContentDetailsBulletin = () =>
  ({
    description: "Details about a channel bulletin post.",
    properties: {
      resourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsChannelItem = () =>
  ({
    description: "Details about a resource which was added to a channel.",
    properties: {
      resourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsComment = () =>
  ({
    description: "Information about a resource that received a comment.",
    properties: {
      resourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsFavorite = () =>
  ({
    description:
      "Information about a video that was marked as a favorite video.",
    properties: {
      resourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsLike = () =>
  ({
    description:
      "Information about a resource that received a positive (like) rating.",
    properties: {
      resourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsPlaylistItem = () =>
  ({
    description: "Information about a new playlist item.",
    properties: {
      playlistId: {
        description:
          "The value that YouTube uses to uniquely identify the playlist.",
        type: "string",
      } as const,
      playlistItemId: {
        description: "ID of the item within the playlist.",
        type: "string",
      } as const,
      resourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsPromotedItem = () =>
  ({
    description: "Details about a resource which is being promoted.",
    properties: {
      adTag: {
        description:
          "The URL the client should fetch to request a promoted item.",
        type: "string",
      } as const,
      clickTrackingUrl: {
        description:
          "The URL the client should ping to indicate that the user clicked through on this promoted item.",
        type: "string",
      } as const,
      creativeViewUrl: {
        description:
          "The URL the client should ping to indicate that the user was shown this promoted item.",
        type: "string",
      } as const,
      ctaType: {
        description:
          "The type of call-to-action, a message to the user indicating action that can be taken.",
        enum: ["ctaTypeUnspecified", "visitAdvertiserSite"],
        type: "string",
      } as const,
      customCtaButtonText: {
        description:
          "The custom call-to-action button text. If specified, it will override the default button text for the cta_type.",
        type: "string",
      } as const,
      descriptionText: {
        description: "The text description to accompany the promoted item.",
        type: "string",
      } as const,
      destinationUrl: {
        description:
          "The URL the client should direct the user to, if the user chooses to visit the advertiser's website.",
        type: "string",
      } as const,
      forecastingUrl: {
        description:
          "The list of forecasting URLs. The client should ping all of these URLs when a promoted item is not available, to indicate that a promoted item could have been shown.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      impressionUrl: {
        description:
          "The list of impression URLs. The client should ping all of these URLs to indicate that the user was shown this promoted item.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      videoId: {
        description:
          "The ID that YouTube uses to uniquely identify the promoted video.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ActivityContentDetailsRecommendation = () =>
  ({
    description: "Information that identifies the recommended resource.",
    properties: {
      reason: {
        description: "The reason that the resource is recommended to the user.",
        enum: [
          "reasonUnspecified",
          "videoFavorited",
          "videoLiked",
          "videoWatched",
        ],
        type: "string",
      } as const,
      resourceId: ResourceId,
      seedResourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsSocial = () =>
  ({
    description: "Details about a social network post.",
    properties: {
      author: {
        description: "The author of the social network post.",
        type: "string",
      } as const,
      imageUrl: {
        description: "An image of the post's author.",
        type: "string",
      } as const,
      referenceUrl: {
        description: "The URL of the social network post.",
        type: "string",
      } as const,
      resourceId: ResourceId,
      type: {
        description: "The name of the social network.",
        enum: ["unspecified", "googlePlus", "facebook", "twitter"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ActivityContentDetailsSubscription = () =>
  ({
    description: "Information about a channel that a user subscribed to.",
    properties: {
      resourceId: ResourceId,
    },
    type: "object",
  }) as const

const ActivityContentDetailsUpload = () =>
  ({
    description: "Information about the uploaded video.",
    properties: {
      videoId: {
        description:
          "The ID that YouTube uses to uniquely identify the uploaded video.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ActivityListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        items: Activity,
        type: "array",
      } as const,
      kind: {
        default: "youtube#activityListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#activityListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ActivitySnippet = () =>
  ({
    description:
      "Basic details about an activity, including title, description, thumbnails, activity type and group. Next ID: 12",
    properties: {
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the channel associated with the activity.",
        type: "string",
      } as const,
      channelTitle: {
        description:
          "Channel title for the channel responsible for this activity",
        type: "string",
      } as const,
      description: {
        description:
          "The description of the resource primarily associated with the activity. @mutable youtube.activities.insert",
        type: "string",
      } as const,
      groupId: {
        description:
          "The group ID associated with the activity. A group ID identifies user events that are associated with the same user and resource. For example, if a user rates a video and marks the same video as a favorite, the entries for those events would have the same group ID in the user's activity feed. In your user interface, you can avoid repetition by grouping events with the same groupId value.",
        type: "string",
      } as const,
      publishedAt: {
        description: "The date and time that the video was uploaded.",
        format: "date-time",
        type: "string",
      } as const,
      thumbnails: ThumbnailDetails,
      title: {
        description:
          "The title of the resource primarily associated with the activity.",
        type: "string",
      } as const,
      type: {
        description: "The type of activity that the resource describes.",
        enum: [
          "typeUnspecified",
          "upload",
          "like",
          "favorite",
          "comment",
          "subscription",
          "playlistItem",
          "recommendation",
          "bulletin",
          "social",
          "channelItem",
          "promotedItem",
        ],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const Caption = () =>
  ({
    description:
      "A *caption* resource represents a YouTube caption track. A caption track is associated with exactly one YouTube video.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the caption track.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#caption",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#caption".',
        type: "string",
      } as const,
      snippet: CaptionSnippet,
    },
    type: "object",
  }) as const

const CaptionListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of captions that match the request criteria.",
        items: Caption,
        type: "array",
      } as const,
      kind: {
        default: "youtube#captionListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#captionListResponse".',
        type: "string",
      } as const,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const CaptionSnippet = () =>
  ({
    description:
      "Basic details about a caption track, such as its language and name.",
    properties: {
      audioTrackType: {
        description:
          "The type of audio track associated with the caption track.",
        enum: ["unknown", "primary", "commentary", "descriptive"],
        type: "string",
      } as const,
      failureReason: {
        description:
          "The reason that YouTube failed to process the caption track. This property is only present if the state property's value is failed.",
        enum: ["unknownFormat", "unsupportedFormat", "processingFailed"],
        type: "string",
      } as const,
      isAutoSynced: {
        description:
          "Indicates whether YouTube synchronized the caption track to the audio track in the video. The value will be true if a sync was explicitly requested when the caption track was uploaded. For example, when calling the captions.insert or captions.update methods, you can set the sync parameter to true to instruct YouTube to sync the uploaded track to the video. If the value is false, YouTube uses the time codes in the uploaded caption track to determine when to display captions.",
        type: "boolean",
      } as const,
      isCC: {
        description:
          "Indicates whether the track contains closed captions for the deaf and hard of hearing. The default value is false.",
        type: "boolean",
      } as const,
      isDraft: {
        description:
          "Indicates whether the caption track is a draft. If the value is true, then the track is not publicly visible. The default value is false. @mutable youtube.captions.insert youtube.captions.update",
        type: "boolean",
      } as const,
      isEasyReader: {
        description:
          'Indicates whether caption track is formatted for "easy reader," meaning it is at a third-grade level for language learners. The default value is false.',
        type: "boolean",
      } as const,
      isLarge: {
        description:
          "Indicates whether the caption track uses large text for the vision-impaired. The default value is false.",
        type: "boolean",
      } as const,
      language: {
        description:
          "The language of the caption track. The property value is a BCP-47 language tag.",
        type: "string",
      } as const,
      lastUpdated: {
        description:
          "The date and time when the caption track was last updated.",
        format: "date-time",
        type: "string",
      } as const,
      name: {
        description:
          "The name of the caption track. The name is intended to be visible to the user as an option during playback.",
        type: "string",
      } as const,
      status: {
        description: "The caption track's status.",
        enum: ["serving", "syncing", "failed"],
        type: "string",
      } as const,
      trackKind: {
        description: "The caption track's type.",
        enum: ["standard", "ASR", "forced"],
        type: "string",
      } as const,
      videoId: {
        description:
          "The ID that YouTube uses to uniquely identify the video associated with the caption track. @mutable youtube.captions.insert",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const CdnSettings = () =>
  ({
    description: "Brief description of the live stream cdn settings.",
    properties: {
      format: {
        description:
          "The format of the video stream that you are sending to Youtube. ",
        type: "string",
      } as const,
      frameRate: {
        description: "The frame rate of the inbound video data.",
        enum: ["30fps", "60fps", "variable"],
        type: "string",
      } as const,
      ingestionInfo: IngestionInfo,
      ingestionType: {
        description:
          " The method or protocol used to transmit the video stream.",
        enum: ["rtmp", "dash", "webrtc", "hls"],
        type: "string",
      } as const,
      resolution: {
        description: "The resolution of the inbound video data.",
        enum: [
          "240p",
          "360p",
          "480p",
          "720p",
          "1080p",
          "1440p",
          "2160p",
          "variable",
        ],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const Channel = () =>
  ({
    description:
      "A *channel* resource contains information about a YouTube channel.",
    properties: {
      auditDetails: ChannelAuditDetails,
      brandingSettings: ChannelBrandingSettings,
      contentDetails: ChannelContentDetails,
      contentOwnerDetails: ChannelContentOwnerDetails,
      conversionPings: ChannelConversionPings,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the channel.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#channel",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#channel".',
        type: "string",
      } as const,
      localizations: dict({ type: "string" } as const, ChannelLocalization, {
        description: "Localizations for different languages",
      }),
      snippet: ChannelSnippet,
      statistics: ChannelStatistics,
      status: ChannelStatus,
      topicDetails: ChannelTopicDetails,
    },
    type: "object",
  }) as const

const ChannelAuditDetails = () =>
  ({
    description:
      "The auditDetails object encapsulates channel data that is relevant for YouTube Partners during the audit process.",
    properties: {
      communityGuidelinesGoodStanding: {
        description:
          "Whether or not the channel respects the community guidelines.",
        type: "boolean",
      } as const,
      contentIdClaimsGoodStanding: {
        description: "Whether or not the channel has any unresolved claims.",
        type: "boolean",
      } as const,
      copyrightStrikesGoodStanding: {
        description: "Whether or not the channel has any copyright strikes.",
        type: "boolean",
      } as const,
    },
    type: "object",
  }) as const

const ChannelBannerResource = () =>
  ({
    description:
      "A channel banner returned as the response to a channel_banner.insert call.",
    properties: {
      etag: {
        type: "string",
      } as const,
      kind: {
        default: "youtube#channelBannerResource",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#channelBannerResource".',
        type: "string",
      } as const,
      url: {
        description: "The URL of this banner image.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelBrandingSettings = () =>
  ({
    description: "Branding properties of a YouTube channel.",
    properties: {
      channel: ChannelSettings,
      hints: {
        description: "Additional experimental branding properties.",
        items: PropertyValue,
        type: "array",
      } as const,
      image: ImageSettings,
      watch: WatchSettings,
    },
    type: "object",
  }) as const

const ChannelContentDetails = () =>
  ({
    description: "Details about the content of a channel.",
    properties: {
      relatedPlaylists: {
        properties: {
          favorites: {
            description:
              'The ID of the playlist that contains the channel"s favorite videos. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list.',
            type: "string",
          } as const,
          likes: {
            description:
              'The ID of the playlist that contains the channel"s liked videos. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list.',
            type: "string",
          } as const,
          uploads: {
            description:
              'The ID of the playlist that contains the channel"s uploaded videos. Use the videos.insert method to upload new videos and the videos.delete method to delete previously uploaded videos.',
            type: "string",
          } as const,
          watchHistory: {
            description:
              'The ID of the playlist that contains the channel"s watch history. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list.',
            type: "string",
          } as const,
          watchLater: {
            description:
              'The ID of the playlist that contains the channel"s watch later playlist. Use the playlistItems.insert and playlistItems.delete to add or remove items from that list.',
            type: "string",
          } as const,
        },
        type: "object",
      } as const,
    },
    type: "object",
  }) as const

const ChannelContentOwnerDetails = () =>
  ({
    description:
      "The contentOwnerDetails object encapsulates channel data that is relevant for YouTube Partners linked with the channel.",
    properties: {
      contentOwner: {
        description: "The ID of the content owner linked to the channel.",
        type: "string",
      } as const,
      timeLinked: {
        description:
          "The date and time when the channel was linked to the content owner.",
        format: "date-time",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelConversionPing = () =>
  ({
    description:
      "Pings that the app shall fire (authenticated by biscotti cookie). Each ping has a context, in which the app must fire the ping, and a url identifying the ping.",
    properties: {
      context: {
        description: "Defines the context of the ping.",
        enum: ["subscribe", "unsubscribe", "cview"],
        type: "string",
      } as const,
      conversionUrl: {
        description:
          "The url (without the schema) that the player shall send the ping to. It's at caller's descretion to decide which schema to use (http vs https) Example of a returned url: //googleads.g.doubleclick.net/pagead/ viewthroughconversion/962985656/?data=path%3DtHe_path%3Btype%3D cview%3Butuid%3DGISQtTNGYqaYl4sKxoVvKA&labe=default The caller must append biscotti authentication (ms param in case of mobile, for example) to this ping.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelConversionPings = () =>
  ({
    description:
      "The conversionPings object encapsulates information about conversion pings that need to be respected by the channel.",
    properties: {
      pings: {
        description:
          "Pings that the app shall fire (authenticated by biscotti cookie). Each ping has a context, in which the app must fire the ping, and a url identifying the ping.",
        items: ChannelConversionPing,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const ChannelListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        items: Channel,
        type: "array",
      } as const,
      kind: {
        default: "youtube#channelListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#channelListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelLocalization = () =>
  ({
    description: "Channel localization setting",
    properties: {
      description: {
        description: "The localized strings for channel's description.",
        type: "string",
      } as const,
      title: {
        description: "The localized strings for channel's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelProfileDetails = () =>
  ({
    properties: {
      channelId: {
        description: "The YouTube channel ID.",
        type: "string",
      } as const,
      channelUrl: {
        description: "The channel's URL.",
        type: "string",
      } as const,
      displayName: {
        description: "The channel's display name.",
        type: "string",
      } as const,
      profileImageUrl: {
        description: "The channels's avatar URL.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelSection = () =>
  ({
    properties: {
      contentDetails: ChannelSectionContentDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the channel section.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#channelSection",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#channelSection".',
        type: "string",
      } as const,
      localizations: dict(
        { type: "string" } as const,
        ChannelSectionLocalization,
        { description: "Localizations for different languages" },
      ),
      snippet: ChannelSectionSnippet,
      targeting: ChannelSectionTargeting,
    },
    type: "object",
  }) as const

const ChannelSectionContentDetails = () =>
  ({
    description:
      "Details about a channelsection, including playlists and channels.",
    properties: {
      channels: {
        description: "The channel ids for type multiple_channels.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      playlists: {
        description:
          "The playlist ids for type single_playlist and multiple_playlists. For singlePlaylist, only one playlistId is allowed.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const ChannelSectionListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of ChannelSections that match the request criteria.",
        items: ChannelSection,
        type: "array",
      } as const,
      kind: {
        default: "youtube#channelSectionListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#channelSectionListResponse".',
        type: "string",
      } as const,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelSectionLocalization = () =>
  ({
    description: "ChannelSection localization setting",
    properties: {
      title: {
        description: "The localized strings for channel section's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelSectionSnippet = () =>
  ({
    description:
      "Basic details about a channel section, including title, style and position.",
    properties: {
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the channel that published the channel section.",
        type: "string",
      } as const,
      defaultLanguage: {
        description:
          "The language of the channel section's default title and description.",
        type: "string",
      } as const,
      localized: ChannelSectionLocalization,
      position: {
        description: "The position of the channel section in the channel.",
        format: "uint32",
        type: "integer",
      } as const,
      style: {
        description: "The style of the channel section.",
        enum: [
          "channelsectionStyleUnspecified",
          "horizontalRow",
          "verticalList",
        ],
        type: "string",
      } as const,
      title: {
        description:
          "The channel section's title for multiple_playlists and multiple_channels.",
        type: "string",
      } as const,
      type: {
        description: "The type of the channel section.",
        enum: [
          "channelsectionTypeUndefined",
          "singlePlaylist",
          "multiplePlaylists",
          "popularUploads",
          "recentUploads",
          "likes",
          "allPlaylists",
          "likedPlaylists",
          "recentPosts",
          "recentActivity",
          "liveEvents",
          "upcomingEvents",
          "completedEvents",
          "multipleChannels",
          "postedVideos",
          "postedPlaylists",
          "subscriptions",
        ],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelSectionTargeting = () =>
  ({
    description: "ChannelSection targeting setting.",
    properties: {
      countries: {
        description: "The country the channel section is targeting.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      languages: {
        description: "The language the channel section is targeting.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      regions: {
        description: "The region the channel section is targeting.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const ChannelSettings = () =>
  ({
    description: "Branding properties for the channel view.",
    properties: {
      country: {
        description: "The country of the channel.",
        type: "string",
      } as const,
      defaultLanguage: {
        type: "string",
      } as const,
      defaultTab: {
        description:
          "Which content tab users should see when viewing the channel.",
        type: "string",
      } as const,
      description: {
        description: "Specifies the channel description.",
        type: "string",
      } as const,
      featuredChannelsTitle: {
        description: "Title for the featured channels tab.",
        type: "string",
      } as const,
      featuredChannelsUrls: {
        description: "The list of featured channels.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      keywords: {
        description:
          "Lists keywords associated with the channel, comma-separated.",
        type: "string",
      } as const,
      moderateComments: {
        description:
          "Whether user-submitted comments left on the channel page need to be approved by the channel owner to be publicly visible.",
        type: "boolean",
      } as const,
      profileColor: {
        description:
          "A prominent color that can be rendered on this channel page.",
        type: "string",
      } as const,
      showBrowseView: {
        description:
          "Whether the tab to browse the videos should be displayed.",
        type: "boolean",
      } as const,
      showRelatedChannels: {
        description: "Whether related channels should be proposed.",
        type: "boolean",
      } as const,
      title: {
        description: "Specifies the channel title.",
        type: "string",
      } as const,
      trackingAnalyticsAccountId: {
        description:
          "The ID for a Google Analytics account to track and measure traffic to the channels.",
        type: "string",
      } as const,
      unsubscribedTrailer: {
        description:
          "The trailer of the channel, for users that are not subscribers.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelSnippet = () =>
  ({
    description:
      "Basic details about a channel, including title, description and thumbnails.",
    properties: {
      country: {
        description: "The country of the channel.",
        type: "string",
      } as const,
      customUrl: {
        description: "The custom url of the channel.",
        type: "string",
      } as const,
      defaultLanguage: {
        description:
          "The language of the channel's default title and description.",
        type: "string",
      } as const,
      description: {
        description: "The description of the channel.",
        type: "string",
      } as const,
      localized: ChannelLocalization,
      publishedAt: {
        description: "The date and time that the channel was created.",
        format: "date-time",
        type: "string",
      } as const,
      thumbnails: ThumbnailDetails,
      title: {
        description: "The channel's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelStatistics = () =>
  ({
    description:
      "Statistics about a channel: number of subscribers, number of videos in the channel, etc.",
    properties: {
      commentCount: {
        description: "The number of comments for the channel.",
        format: "uint64",
        type: "string",
      } as const,
      hiddenSubscriberCount: {
        description:
          "Whether or not the number of subscribers is shown for this user.",
        type: "boolean",
      } as const,
      subscriberCount: {
        description: "The number of subscribers that the channel has.",
        format: "uint64",
        type: "string",
      } as const,
      videoCount: {
        description: "The number of videos uploaded to the channel.",
        format: "uint64",
        type: "string",
      } as const,
      viewCount: {
        description: "The number of times the channel has been viewed.",
        format: "uint64",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelStatus = () =>
  ({
    description: "JSON template for the status part of a channel.",
    properties: {
      isLinked: {
        description:
          "If true, then the user is linked to either a YouTube username or G+ account. Otherwise, the user doesn't have a public YouTube identity.",
        type: "boolean",
      } as const,
      longUploadsStatus: {
        description:
          "The long uploads status of this channel. See https://support.google.com/youtube/answer/71673 for more information.",
        enum: ["longUploadsUnspecified", "allowed", "eligible", "disallowed"],
        type: "string",
      } as const,
      madeForKids: {
        type: "boolean",
      } as const,
      privacyStatus: {
        description: "Privacy status of the channel.",
        enum: ["public", "unlisted", "private"],
        type: "string",
      } as const,
      selfDeclaredMadeForKids: {
        type: "boolean",
      } as const,
    },
    type: "object",
  }) as const

const ChannelToStoreLinkDetails = () =>
  ({
    description:
      "Information specific to a store on a merchandising platform linked to a YouTube channel.",
    properties: {
      merchantId: {
        description: "Google Merchant Center id of the store.",
        format: "uint64",
        type: "string",
      } as const,
      storeName: {
        description: "Name of the store.",
        type: "string",
      } as const,
      storeUrl: {
        description: "Landing page of the store.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ChannelTopicDetails = () =>
  ({
    description: "Freebase topic information related to the channel.",
    properties: {
      topicCategories: {
        description:
          "A list of Wikipedia URLs that describe the channel's content.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      topicIds: {
        description:
          "A list of Freebase topic IDs associated with the channel. You can retrieve information about each topic using the Freebase Topic API.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const Comment = () =>
  ({
    description: "A *comment* represents a single YouTube comment.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the comment.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#comment",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#comment".',
        type: "string",
      } as const,
      snippet: CommentSnippet,
    },
    type: "object",
  }) as const

const CommentListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of comments that match the request criteria.",
        items: Comment,
        type: "array",
      } as const,
      kind: {
        default: "youtube#commentListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#commentListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const CommentSnippet = () =>
  ({
    description: "Basic details about a comment, such as its author and text.",
    properties: {
      authorChannelId: CommentSnippetAuthorChannelId,
      authorChannelUrl: {
        description: "Link to the author's YouTube channel, if any.",
        type: "string",
      } as const,
      authorDisplayName: {
        description: "The name of the user who posted the comment.",
        type: "string",
      } as const,
      authorProfileImageUrl: {
        description:
          "The URL for the avatar of the user who posted the comment.",
        type: "string",
      } as const,
      canRate: {
        description: "Whether the current viewer can rate this comment.",
        type: "boolean",
      } as const,
      channelId: {
        description:
          "The id of the corresponding YouTube channel. In case of a channel comment this is the channel the comment refers to. In case of a video comment it's the video's channel.",
        type: "string",
      } as const,
      likeCount: {
        description: "The total number of likes this comment has received.",
        format: "uint32",
        type: "integer",
      } as const,
      moderationStatus: {
        description:
          "The comment's moderation status. Will not be set if the comments were requested through the id filter.",
        enum: ["published", "heldForReview", "likelySpam", "rejected"],
        type: "string",
      } as const,
      parentId: {
        description:
          "The unique id of the parent comment, only set for replies.",
        type: "string",
      } as const,
      publishedAt: {
        description:
          "The date and time when the comment was originally published.",
        format: "date-time",
        type: "string",
      } as const,
      textDisplay: {
        description:
          "The comment's text. The format is either plain text or HTML dependent on what has been requested. Even the plain text representation may differ from the text originally posted in that it may replace video links with video titles etc.",
        type: "string",
      } as const,
      textOriginal: {
        description:
          "The comment's original raw text as initially posted or last updated. The original text will only be returned if it is accessible to the viewer, which is only guaranteed if the viewer is the comment's author.",
        type: "string",
      } as const,
      updatedAt: {
        description: "The date and time when the comment was last updated.",
        format: "date-time",
        type: "string",
      } as const,
      videoId: {
        description: "The ID of the video the comment refers to, if any.",
        type: "string",
      } as const,
      viewerRating: {
        description:
          "The rating the viewer has given to this comment. For the time being this will never return RATE_TYPE_DISLIKE and instead return RATE_TYPE_NONE. This may change in the future.",
        enum: ["none", "like", "dislike"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const CommentSnippetAuthorChannelId = () =>
  ({
    description: "The id of the author's YouTube channel, if any.",
    properties: {
      value: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const CommentThread = () =>
  ({
    description:
      "A *comment thread* represents information that applies to a top level comment and all its replies. It can also include the top level comment itself and some of the replies.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the comment thread.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#commentThread",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#commentThread".',
        type: "string",
      } as const,
      replies: CommentThreadReplies,
      snippet: CommentThreadSnippet,
    },
    type: "object",
  }) as const

const CommentThreadListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of comment threads that match the request criteria.",
        items: CommentThread,
        type: "array",
      } as const,
      kind: {
        default: "youtube#commentThreadListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#commentThreadListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const CommentThreadReplies = () =>
  ({
    description:
      "Comments written in (direct or indirect) reply to the top level comment.",
    properties: {
      comments: {
        description:
          "A limited number of replies. Unless the number of replies returned equals total_reply_count in the snippet the returned replies are only a subset of the total number of replies.",
        items: Comment,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const CommentThreadSnippet = () =>
  ({
    description: "Basic details about a comment thread.",
    properties: {
      canReply: {
        description:
          "Whether the current viewer of the thread can reply to it. This is viewer specific - other viewers may see a different value for this field.",
        type: "boolean",
      } as const,
      channelId: {
        description:
          "The YouTube channel the comments in the thread refer to or the channel with the video the comments refer to. If video_id isn't set the comments refer to the channel itself.",
        type: "string",
      } as const,
      isPublic: {
        description:
          "Whether the thread (and therefore all its comments) is visible to all YouTube users.",
        type: "boolean",
      } as const,
      topLevelComment: Comment,
      totalReplyCount: {
        description:
          "The total number of replies (not including the top level comment).",
        format: "uint32",
        type: "integer",
      } as const,
      videoId: {
        description:
          "The ID of the video the comments refer to, if any. No video_id implies a channel discussion comment.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ContentRating = () =>
  ({
    description:
      "Ratings schemes. The country-specific ratings are mostly for movies and shows. LINT.IfChange",
    properties: {
      acbRating: {
        description:
          "The video's Australian Classification Board (ACB) or Australian Communications and Media Authority (ACMA) rating. ACMA ratings are used to classify children's television programming.",
        enum: [
          "acbUnspecified",
          "acbE",
          "acbP",
          "acbC",
          "acbG",
          "acbPg",
          "acbM",
          "acbMa15plus",
          "acbR18plus",
          "acbUnrated",
        ],
        type: "string",
      } as const,
      agcomRating: {
        description:
          "The video's rating from Italy's Autorità per le Garanzie nelle Comunicazioni (AGCOM).",
        enum: [
          "agcomUnspecified",
          "agcomT",
          "agcomVm14",
          "agcomVm18",
          "agcomUnrated",
        ],
        type: "string",
      } as const,
      anatelRating: {
        description:
          "The video's Anatel (Asociación Nacional de Televisión) rating for Chilean television.",
        enum: [
          "anatelUnspecified",
          "anatelF",
          "anatelI",
          "anatelI7",
          "anatelI10",
          "anatelI12",
          "anatelR",
          "anatelA",
          "anatelUnrated",
        ],
        type: "string",
      } as const,
      bbfcRating: {
        description:
          "The video's British Board of Film Classification (BBFC) rating.",
        enum: [
          "bbfcUnspecified",
          "bbfcU",
          "bbfcPg",
          "bbfc12a",
          "bbfc12",
          "bbfc15",
          "bbfc18",
          "bbfcR18",
          "bbfcUnrated",
        ],
        type: "string",
      } as const,
      bfvcRating: {
        description:
          "The video's rating from Thailand's Board of Film and Video Censors.",
        enum: [
          "bfvcUnspecified",
          "bfvcG",
          "bfvcE",
          "bfvc13",
          "bfvc15",
          "bfvc18",
          "bfvc20",
          "bfvcB",
          "bfvcUnrated",
        ],
        type: "string",
      } as const,
      bmukkRating: {
        description:
          "The video's rating from the Austrian Board of Media Classification (Bundesministerium für Unterricht, Kunst und Kultur).",
        enum: [
          "bmukkUnspecified",
          "bmukkAa",
          "bmukk6",
          "bmukk8",
          "bmukk10",
          "bmukk12",
          "bmukk14",
          "bmukk16",
          "bmukkUnrated",
        ],
        type: "string",
      } as const,
      catvRating: {
        description:
          "Rating system for Canadian TV - Canadian TV Classification System The video's rating from the Canadian Radio-Television and Telecommunications Commission (CRTC) for Canadian English-language broadcasts. For more information, see the Canadian Broadcast Standards Council website.",
        enum: [
          "catvUnspecified",
          "catvC",
          "catvC8",
          "catvG",
          "catvPg",
          "catv14plus",
          "catv18plus",
          "catvUnrated",
          "catvE",
        ],
        type: "string",
      } as const,
      catvfrRating: {
        description:
          "The video's rating from the Canadian Radio-Television and Telecommunications Commission (CRTC) for Canadian French-language broadcasts. For more information, see the Canadian Broadcast Standards Council website.",
        enum: [
          "catvfrUnspecified",
          "catvfrG",
          "catvfr8plus",
          "catvfr13plus",
          "catvfr16plus",
          "catvfr18plus",
          "catvfrUnrated",
          "catvfrE",
        ],
        type: "string",
      } as const,
      cbfcRating: {
        description:
          "The video's Central Board of Film Certification (CBFC - India) rating.",
        enum: [
          "cbfcUnspecified",
          "cbfcU",
          "cbfcUA",
          "cbfcUA7plus",
          "cbfcUA13plus",
          "cbfcUA16plus",
          "cbfcA",
          "cbfcS",
          "cbfcUnrated",
        ],
        type: "string",
      } as const,
      cccRating: {
        description:
          "The video's Consejo de Calificación Cinematográfica (Chile) rating.",
        enum: [
          "cccUnspecified",
          "cccTe",
          "ccc6",
          "ccc14",
          "ccc18",
          "ccc18v",
          "ccc18s",
          "cccUnrated",
        ],
        type: "string",
      } as const,
      cceRating: {
        description:
          "The video's rating from Portugal's Comissão de Classificação de Espect´culos.",
        enum: [
          "cceUnspecified",
          "cceM4",
          "cceM6",
          "cceM12",
          "cceM16",
          "cceM18",
          "cceUnrated",
          "cceM14",
        ],
        type: "string",
      } as const,
      chfilmRating: {
        description: "The video's rating in Switzerland.",
        enum: [
          "chfilmUnspecified",
          "chfilm0",
          "chfilm6",
          "chfilm12",
          "chfilm16",
          "chfilm18",
          "chfilmUnrated",
        ],
        type: "string",
      } as const,
      chvrsRating: {
        description:
          "The video's Canadian Home Video Rating System (CHVRS) rating.",
        enum: [
          "chvrsUnspecified",
          "chvrsG",
          "chvrsPg",
          "chvrs14a",
          "chvrs18a",
          "chvrsR",
          "chvrsE",
          "chvrsUnrated",
        ],
        type: "string",
      } as const,
      cicfRating: {
        description:
          "The video's rating from the Commission de Contrôle des Films (Belgium).",
        enum: [
          "cicfUnspecified",
          "cicfE",
          "cicfKtEa",
          "cicfKntEna",
          "cicfUnrated",
        ],
        type: "string",
      } as const,
      cnaRating: {
        description:
          "The video's rating from Romania's CONSILIUL NATIONAL AL AUDIOVIZUALULUI (CNA).",
        enum: [
          "cnaUnspecified",
          "cnaAp",
          "cna12",
          "cna15",
          "cna18",
          "cna18plus",
          "cnaUnrated",
        ],
        type: "string",
      } as const,
      cncRating: {
        description:
          "Rating system in France - Commission de classification cinematographique",
        enum: [
          "cncUnspecified",
          "cncT",
          "cnc10",
          "cnc12",
          "cnc16",
          "cnc18",
          "cncE",
          "cncInterdiction",
          "cncUnrated",
        ],
        type: "string",
      } as const,
      csaRating: {
        description:
          "The video's rating from France's Conseil supérieur de l’audiovisuel, which rates broadcast content.",
        enum: [
          "csaUnspecified",
          "csaT",
          "csa10",
          "csa12",
          "csa16",
          "csa18",
          "csaInterdiction",
          "csaUnrated",
        ],
        type: "string",
      } as const,
      cscfRating: {
        description:
          "The video's rating from Luxembourg's Commission de surveillance de la classification des films (CSCF).",
        enum: [
          "cscfUnspecified",
          "cscfAl",
          "cscfA",
          "cscf6",
          "cscf9",
          "cscf12",
          "cscf16",
          "cscf18",
          "cscfUnrated",
        ],
        type: "string",
      } as const,
      czfilmRating: {
        description: "The video's rating in the Czech Republic.",
        enum: [
          "czfilmUnspecified",
          "czfilmU",
          "czfilm12",
          "czfilm14",
          "czfilm18",
          "czfilmUnrated",
        ],
        type: "string",
      } as const,
      djctqRating: {
        description:
          "The video's Departamento de Justiça, Classificação, Qualificação e Títulos (DJCQT - Brazil) rating.",
        enum: [
          "djctqUnspecified",
          "djctqL",
          "djctq10",
          "djctq12",
          "djctq14",
          "djctq16",
          "djctq18",
          "djctqEr",
          "djctqL10",
          "djctqL12",
          "djctqL14",
          "djctqL16",
          "djctqL18",
          "djctq1012",
          "djctq1014",
          "djctq1016",
          "djctq1018",
          "djctq1214",
          "djctq1216",
          "djctq1218",
          "djctq1416",
          "djctq1418",
          "djctq1618",
          "djctqUnrated",
        ],
        type: "string",
      } as const,
      djctqRatingReasons: {
        description:
          "Reasons that explain why the video received its DJCQT (Brazil) rating.",
        items: {
          enum: [
            "djctqRatingReasonUnspecified",
            "djctqViolence",
            "djctqExtremeViolence",
            "djctqSexualContent",
            "djctqNudity",
            "djctqSex",
            "djctqExplicitSex",
            "djctqDrugs",
            "djctqLegalDrugs",
            "djctqIllegalDrugs",
            "djctqInappropriateLanguage",
            "djctqCriminalActs",
            "djctqImpactingContent",
          ],
          type: "string",
        } as const,
        type: "array",
      } as const,
      ecbmctRating: {
        description:
          "Rating system in Turkey - Evaluation and Classification Board of the Ministry of Culture and Tourism",
        enum: [
          "ecbmctUnspecified",
          "ecbmctG",
          "ecbmct7a",
          "ecbmct7plus",
          "ecbmct13a",
          "ecbmct13plus",
          "ecbmct15a",
          "ecbmct15plus",
          "ecbmct18plus",
          "ecbmctUnrated",
        ],
        type: "string",
      } as const,
      eefilmRating: {
        description: "The video's rating in Estonia.",
        enum: [
          "eefilmUnspecified",
          "eefilmPere",
          "eefilmL",
          "eefilmMs6",
          "eefilmK6",
          "eefilmMs12",
          "eefilmK12",
          "eefilmK14",
          "eefilmK16",
          "eefilmUnrated",
        ],
        type: "string",
      } as const,
      egfilmRating: {
        description: "The video's rating in Egypt.",
        enum: [
          "egfilmUnspecified",
          "egfilmGn",
          "egfilm18",
          "egfilmBn",
          "egfilmUnrated",
        ],
        type: "string",
      } as const,
      eirinRating: {
        description:
          "The video's Eirin (映倫) rating. Eirin is the Japanese rating system.",
        enum: [
          "eirinUnspecified",
          "eirinG",
          "eirinPg12",
          "eirinR15plus",
          "eirinR18plus",
          "eirinUnrated",
        ],
        type: "string",
      } as const,
      fcbmRating: {
        description:
          "The video's rating from Malaysia's Film Censorship Board.",
        enum: [
          "fcbmUnspecified",
          "fcbmU",
          "fcbmPg13",
          "fcbmP13",
          "fcbm18",
          "fcbm18sx",
          "fcbm18pa",
          "fcbm18sg",
          "fcbm18pl",
          "fcbmUnrated",
        ],
        type: "string",
      } as const,
      fcoRating: {
        description:
          "The video's rating from Hong Kong's Office for Film, Newspaper and Article Administration.",
        enum: [
          "fcoUnspecified",
          "fcoI",
          "fcoIia",
          "fcoIib",
          "fcoIi",
          "fcoIii",
          "fcoUnrated",
        ],
        type: "string",
      } as const,
      fmocRating: {
        description:
          "This property has been deprecated. Use the contentDetails.contentRating.cncRating instead.",
        enum: [
          "fmocUnspecified",
          "fmocU",
          "fmoc10",
          "fmoc12",
          "fmoc16",
          "fmoc18",
          "fmocE",
          "fmocUnrated",
        ],
        type: "string",
      } as const,
      fpbRating: {
        description:
          "The video's rating from South Africa's Film and Publication Board.",
        enum: [
          "fpbUnspecified",
          "fpbA",
          "fpbPg",
          "fpb79Pg",
          "fpb1012Pg",
          "fpb13",
          "fpb16",
          "fpb18",
          "fpbX18",
          "fpbXx",
          "fpbUnrated",
          "fpb10",
        ],
        type: "string",
      } as const,
      fpbRatingReasons: {
        description:
          "Reasons that explain why the video received its FPB (South Africa) rating.",
        items: {
          enum: [
            "fpbRatingReasonUnspecified",
            "fpbBlasphemy",
            "fpbLanguage",
            "fpbNudity",
            "fpbPrejudice",
            "fpbSex",
            "fpbViolence",
            "fpbDrugs",
            "fpbSexualViolence",
            "fpbHorror",
            "fpbCriminalTechniques",
            "fpbImitativeActsTechniques",
          ],
          type: "string",
        } as const,
        type: "array",
      } as const,
      fskRating: {
        description:
          "The video's Freiwillige Selbstkontrolle der Filmwirtschaft (FSK - Germany) rating.",
        enum: [
          "fskUnspecified",
          "fsk0",
          "fsk6",
          "fsk12",
          "fsk16",
          "fsk18",
          "fskUnrated",
        ],
        type: "string",
      } as const,
      grfilmRating: {
        description: "The video's rating in Greece.",
        enum: [
          "grfilmUnspecified",
          "grfilmK",
          "grfilmE",
          "grfilmK12",
          "grfilmK13",
          "grfilmK15",
          "grfilmK17",
          "grfilmK18",
          "grfilmUnrated",
        ],
        type: "string",
      } as const,
      icaaRating: {
        description:
          "The video's Instituto de la Cinematografía y de las Artes Audiovisuales (ICAA - Spain) rating.",
        enum: [
          "icaaUnspecified",
          "icaaApta",
          "icaa7",
          "icaa12",
          "icaa13",
          "icaa16",
          "icaa18",
          "icaaX",
          "icaaUnrated",
        ],
        type: "string",
      } as const,
      ifcoRating: {
        description:
          "The video's Irish Film Classification Office (IFCO - Ireland) rating. See the IFCO website for more information.",
        enum: [
          "ifcoUnspecified",
          "ifcoG",
          "ifcoPg",
          "ifco12",
          "ifco12a",
          "ifco15",
          "ifco15a",
          "ifco16",
          "ifco18",
          "ifcoUnrated",
        ],
        type: "string",
      } as const,
      ilfilmRating: {
        description: "The video's rating in Israel.",
        enum: [
          "ilfilmUnspecified",
          "ilfilmAa",
          "ilfilm12",
          "ilfilm14",
          "ilfilm16",
          "ilfilm18",
          "ilfilmUnrated",
        ],
        type: "string",
      } as const,
      incaaRating: {
        description:
          "The video's INCAA (Instituto Nacional de Cine y Artes Audiovisuales - Argentina) rating.",
        enum: [
          "incaaUnspecified",
          "incaaAtp",
          "incaaSam13",
          "incaaSam16",
          "incaaSam18",
          "incaaC",
          "incaaUnrated",
        ],
        type: "string",
      } as const,
      kfcbRating: {
        description:
          "The video's rating from the Kenya Film Classification Board.",
        enum: [
          "kfcbUnspecified",
          "kfcbG",
          "kfcbPg",
          "kfcb16plus",
          "kfcbR",
          "kfcbUnrated",
        ],
        type: "string",
      } as const,
      kijkwijzerRating: {
        description:
          "The video's NICAM/Kijkwijzer rating from the Nederlands Instituut voor de Classificatie van Audiovisuele Media (Netherlands).",
        enum: [
          "kijkwijzerUnspecified",
          "kijkwijzerAl",
          "kijkwijzer6",
          "kijkwijzer9",
          "kijkwijzer12",
          "kijkwijzer16",
          "kijkwijzer18",
          "kijkwijzerUnrated",
        ],
        type: "string",
      } as const,
      kmrbRating: {
        description:
          "The video's Korea Media Rating Board (영상물등급위원회) rating. The KMRB rates videos in South Korea.",
        enum: [
          "kmrbUnspecified",
          "kmrbAll",
          "kmrb12plus",
          "kmrb15plus",
          "kmrbTeenr",
          "kmrbR",
          "kmrbUnrated",
        ],
        type: "string",
      } as const,
      lsfRating: {
        description: "The video's rating from Indonesia's Lembaga Sensor Film.",
        enum: [
          "lsfUnspecified",
          "lsfSu",
          "lsfA",
          "lsfBo",
          "lsf13",
          "lsfR",
          "lsf17",
          "lsfD",
          "lsf21",
          "lsfUnrated",
        ],
        type: "string",
      } as const,
      mccaaRating: {
        description:
          "The video's rating from Malta's Film Age-Classification Board.",
        enum: [
          "mccaaUnspecified",
          "mccaaU",
          "mccaaPg",
          "mccaa12a",
          "mccaa12",
          "mccaa14",
          "mccaa15",
          "mccaa16",
          "mccaa18",
          "mccaaUnrated",
        ],
        type: "string",
      } as const,
      mccypRating: {
        description:
          "The video's rating from the Danish Film Institute's (Det Danske Filminstitut) Media Council for Children and Young People.",
        enum: [
          "mccypUnspecified",
          "mccypA",
          "mccyp7",
          "mccyp11",
          "mccyp15",
          "mccypUnrated",
        ],
        type: "string",
      } as const,
      mcstRating: {
        description: "The video's rating system for Vietnam - MCST",
        enum: [
          "mcstUnspecified",
          "mcstP",
          "mcst0",
          "mcstC13",
          "mcstC16",
          "mcst16plus",
          "mcstC18",
          "mcstGPg",
          "mcstUnrated",
        ],
        type: "string",
      } as const,
      mdaRating: {
        description:
          "The video's rating from Singapore's Media Development Authority (MDA) and, specifically, it's Board of Film Censors (BFC).",
        enum: [
          "mdaUnspecified",
          "mdaG",
          "mdaPg",
          "mdaPg13",
          "mdaNc16",
          "mdaM18",
          "mdaR21",
          "mdaUnrated",
        ],
        type: "string",
      } as const,
      medietilsynetRating: {
        description:
          "The video's rating from Medietilsynet, the Norwegian Media Authority.",
        enum: [
          "medietilsynetUnspecified",
          "medietilsynetA",
          "medietilsynet6",
          "medietilsynet7",
          "medietilsynet9",
          "medietilsynet11",
          "medietilsynet12",
          "medietilsynet15",
          "medietilsynet18",
          "medietilsynetUnrated",
        ],
        type: "string",
      } as const,
      mekuRating: {
        description:
          "The video's rating from Finland's Kansallinen Audiovisuaalinen Instituutti (National Audiovisual Institute).",
        enum: [
          "mekuUnspecified",
          "mekuS",
          "meku7",
          "meku12",
          "meku16",
          "meku18",
          "mekuUnrated",
        ],
        type: "string",
      } as const,
      menaMpaaRating: {
        description:
          "The rating system for MENA countries, a clone of MPAA. It is needed to prevent titles go live w/o additional QC check, since some of them can be inappropriate for the countries at all. See b/33408548 for more details.",
        enum: [
          "menaMpaaUnspecified",
          "menaMpaaG",
          "menaMpaaPg",
          "menaMpaaPg13",
          "menaMpaaR",
          "menaMpaaUnrated",
        ],
        type: "string",
      } as const,
      mibacRating: {
        description:
          "The video's rating from the Ministero dei Beni e delle Attività Culturali e del Turismo (Italy).",
        enum: [
          "mibacUnspecified",
          "mibacT",
          "mibacVap",
          "mibacVm6",
          "mibacVm12",
          "mibacVm14",
          "mibacVm16",
          "mibacVm18",
          "mibacUnrated",
        ],
        type: "string",
      } as const,
      mocRating: {
        description: "The video's Ministerio de Cultura (Colombia) rating.",
        enum: [
          "mocUnspecified",
          "mocE",
          "mocT",
          "moc7",
          "moc12",
          "moc15",
          "moc18",
          "mocX",
          "mocBanned",
          "mocUnrated",
        ],
        type: "string",
      } as const,
      moctwRating: {
        description:
          "The video's rating from Taiwan's Ministry of Culture (文化部).",
        enum: [
          "moctwUnspecified",
          "moctwG",
          "moctwP",
          "moctwPg",
          "moctwR",
          "moctwUnrated",
          "moctwR12",
          "moctwR15",
        ],
        type: "string",
      } as const,
      mpaaRating: {
        description:
          "The video's Motion Picture Association of America (MPAA) rating.",
        enum: [
          "mpaaUnspecified",
          "mpaaG",
          "mpaaPg",
          "mpaaPg13",
          "mpaaR",
          "mpaaNc17",
          "mpaaX",
          "mpaaUnrated",
        ],
        type: "string",
      } as const,
      mpaatRating: {
        description:
          "The rating system for trailer, DVD, and Ad in the US. See http://movielabs.com/md/ratings/v2.3/html/US_MPAAT_Ratings.html.",
        enum: ["mpaatUnspecified", "mpaatGb", "mpaatRb"],
        type: "string",
      } as const,
      mtrcbRating: {
        description:
          "The video's rating from the Movie and Television Review and Classification Board (Philippines).",
        enum: [
          "mtrcbUnspecified",
          "mtrcbG",
          "mtrcbPg",
          "mtrcbR13",
          "mtrcbR16",
          "mtrcbR18",
          "mtrcbX",
          "mtrcbUnrated",
        ],
        type: "string",
      } as const,
      nbcRating: {
        description:
          "The video's rating from the Maldives National Bureau of Classification.",
        enum: [
          "nbcUnspecified",
          "nbcG",
          "nbcPg",
          "nbc12plus",
          "nbc15plus",
          "nbc18plus",
          "nbc18plusr",
          "nbcPu",
          "nbcUnrated",
        ],
        type: "string",
      } as const,
      nbcplRating: {
        description: "The video's rating in Poland.",
        enum: [
          "nbcplUnspecified",
          "nbcplI",
          "nbcplIi",
          "nbcplIii",
          "nbcplIv",
          "nbcpl18plus",
          "nbcplUnrated",
        ],
        type: "string",
      } as const,
      nfrcRating: {
        description:
          "The video's rating from the Bulgarian National Film Center.",
        enum: [
          "nfrcUnspecified",
          "nfrcA",
          "nfrcB",
          "nfrcC",
          "nfrcD",
          "nfrcX",
          "nfrcUnrated",
        ],
        type: "string",
      } as const,
      nfvcbRating: {
        description:
          "The video's rating from Nigeria's National Film and Video Censors Board.",
        enum: [
          "nfvcbUnspecified",
          "nfvcbG",
          "nfvcbPg",
          "nfvcb12",
          "nfvcb12a",
          "nfvcb15",
          "nfvcb18",
          "nfvcbRe",
          "nfvcbUnrated",
        ],
        type: "string",
      } as const,
      nkclvRating: {
        description:
          "The video's rating from the Nacionãlais Kino centrs (National Film Centre of Latvia).",
        enum: [
          "nkclvUnspecified",
          "nkclvU",
          "nkclv7plus",
          "nkclv12plus",
          "nkclv16plus",
          "nkclv18plus",
          "nkclvUnrated",
        ],
        type: "string",
      } as const,
      nmcRating: {
        description:
          "The National Media Council ratings system for United Arab Emirates.",
        enum: [
          "nmcUnspecified",
          "nmcG",
          "nmcPg",
          "nmcPg13",
          "nmcPg15",
          "nmc15plus",
          "nmc18plus",
          "nmc18tc",
          "nmcUnrated",
        ],
        type: "string",
      } as const,
      oflcRating: {
        description:
          "The video's Office of Film and Literature Classification (OFLC - New Zealand) rating.",
        enum: [
          "oflcUnspecified",
          "oflcG",
          "oflcPg",
          "oflcM",
          "oflcR13",
          "oflcR15",
          "oflcR16",
          "oflcR18",
          "oflcUnrated",
          "oflcRp13",
          "oflcRp16",
          "oflcRp18",
        ],
        type: "string",
      } as const,
      pefilmRating: {
        description: "The video's rating in Peru.",
        enum: [
          "pefilmUnspecified",
          "pefilmPt",
          "pefilmPg",
          "pefilm14",
          "pefilm18",
          "pefilmUnrated",
        ],
        type: "string",
      } as const,
      rcnofRating: {
        description:
          "The video's rating from the Hungarian Nemzeti Filmiroda, the Rating Committee of the National Office of Film.",
        enum: [
          "rcnofUnspecified",
          "rcnofI",
          "rcnofIi",
          "rcnofIii",
          "rcnofIv",
          "rcnofV",
          "rcnofVi",
          "rcnofUnrated",
        ],
        type: "string",
      } as const,
      resorteviolenciaRating: {
        description: "The video's rating in Venezuela.",
        enum: [
          "resorteviolenciaUnspecified",
          "resorteviolenciaA",
          "resorteviolenciaB",
          "resorteviolenciaC",
          "resorteviolenciaD",
          "resorteviolenciaE",
          "resorteviolenciaUnrated",
        ],
        type: "string",
      } as const,
      rtcRating: {
        description:
          "The video's General Directorate of Radio, Television and Cinematography (Mexico) rating.",
        enum: [
          "rtcUnspecified",
          "rtcAa",
          "rtcA",
          "rtcB",
          "rtcB15",
          "rtcC",
          "rtcD",
          "rtcUnrated",
        ],
        type: "string",
      } as const,
      rteRating: {
        description:
          "The video's rating from Ireland's Raidió Teilifís Éireann.",
        enum: [
          "rteUnspecified",
          "rteGa",
          "rteCh",
          "rtePs",
          "rteMa",
          "rteUnrated",
        ],
        type: "string",
      } as const,
      russiaRating: {
        description:
          "The video's National Film Registry of the Russian Federation (MKRF - Russia) rating.",
        enum: [
          "russiaUnspecified",
          "russia0",
          "russia6",
          "russia12",
          "russia16",
          "russia18",
          "russiaUnrated",
        ],
        type: "string",
      } as const,
      skfilmRating: {
        description: "The video's rating in Slovakia.",
        enum: [
          "skfilmUnspecified",
          "skfilmG",
          "skfilmP2",
          "skfilmP5",
          "skfilmP8",
          "skfilmUnrated",
        ],
        type: "string",
      } as const,
      smaisRating: {
        description: "The video's rating in Iceland.",
        enum: [
          "smaisUnspecified",
          "smaisL",
          "smais7",
          "smais12",
          "smais14",
          "smais16",
          "smais18",
          "smaisUnrated",
        ],
        type: "string",
      } as const,
      smsaRating: {
        description:
          "The video's rating from Statens medieråd (Sweden's National Media Council).",
        enum: [
          "smsaUnspecified",
          "smsaA",
          "smsa7",
          "smsa11",
          "smsa15",
          "smsaUnrated",
        ],
        type: "string",
      } as const,
      tvpgRating: {
        description: "The video's TV Parental Guidelines (TVPG) rating.",
        enum: [
          "tvpgUnspecified",
          "tvpgY",
          "tvpgY7",
          "tvpgY7Fv",
          "tvpgG",
          "tvpgPg",
          "pg14",
          "tvpgMa",
          "tvpgUnrated",
        ],
        type: "string",
      } as const,
      ytRating: {
        description:
          "A rating that YouTube uses to identify age-restricted content.",
        enum: ["ytUnspecified", "ytAgeRestricted"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const Cuepoint = () =>
  ({
    description:
      "Note that there may be a 5-second end-point resolution issue. For instance, if a cuepoint comes in for 22:03:27, we may stuff the cuepoint into 22:03:25 or 22:03:30, depending. This is an artifact of HLS.",
    properties: {
      cueType: {
        enum: ["cueTypeUnspecified", "cueTypeAd"],
        type: "string",
      } as const,
      durationSecs: {
        description: "The duration of this cuepoint.",
        format: "uint32",
        type: "integer",
      } as const,
      etag: {
        type: "string",
      } as const,
      id: {
        description: "The identifier for cuepoint resource.",
        type: "string",
      } as const,
      insertionOffsetTimeMs: {
        description:
          "The time when the cuepoint should be inserted by offset to the broadcast actual start time.",
        format: "int64",
        type: "string",
      } as const,
      walltimeMs: {
        description:
          "The wall clock time at which the cuepoint should be inserted. Only one of insertion_offset_time_ms and walltime_ms may be set at a time.",
        format: "uint64",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const Entity = () =>
  ({
    properties: {
      id: {
        type: "string",
      } as const,
      typeId: {
        type: "string",
      } as const,
      url: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const GeoPoint = () =>
  ({
    description: "Geographical coordinates of a point, in WGS84.",
    properties: {
      altitude: {
        description: "Altitude above the reference ellipsoid, in meters.",
        format: "double",
        type: "number",
      } as const,
      latitude: {
        description: "Latitude in degrees.",
        format: "double",
        type: "number",
      } as const,
      longitude: {
        description: "Longitude in degrees.",
        format: "double",
        type: "number",
      } as const,
    },
    type: "object",
  }) as const

const I18nLanguage = () =>
  ({
    description:
      "An *i18nLanguage* resource identifies a UI language currently supported by YouTube.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the i18n language.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#i18nLanguage",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#i18nLanguage".',
        type: "string",
      } as const,
      snippet: I18nLanguageSnippet,
    },
    type: "object",
  }) as const

const I18nLanguageListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of supported i18n languages. In this map, the i18n language ID is the map key, and its value is the corresponding i18nLanguage resource.",
        items: I18nLanguage,
        type: "array",
      } as const,
      kind: {
        default: "youtube#i18nLanguageListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#i18nLanguageListResponse".',
        type: "string",
      } as const,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const I18nLanguageSnippet = () =>
  ({
    description:
      "Basic details about an i18n language, such as language code and human-readable name.",
    properties: {
      hl: {
        description: "A short BCP-47 code that uniquely identifies a language.",
        type: "string",
      } as const,
      name: {
        description:
          "The human-readable name of the language in the language itself.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const I18nRegion = () =>
  ({
    description:
      "A *i18nRegion* resource identifies a region where YouTube is available.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the i18n region.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#i18nRegion",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#i18nRegion".',
        type: "string",
      } as const,
      snippet: I18nRegionSnippet,
    },
    type: "object",
  }) as const

const I18nRegionListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of regions where YouTube is available. In this map, the i18n region ID is the map key, and its value is the corresponding i18nRegion resource.",
        items: I18nRegion,
        type: "array",
      } as const,
      kind: {
        default: "youtube#i18nRegionListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#i18nRegionListResponse".',
        type: "string",
      } as const,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const I18nRegionSnippet = () =>
  ({
    description:
      "Basic details about an i18n region, such as region code and human-readable name.",
    properties: {
      gl: {
        description: "The region code as a 2-letter ISO country code.",
        type: "string",
      } as const,
      name: {
        description: "The human-readable name of the region.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ImageSettings = () =>
  ({
    description: "Branding properties for images associated with the channel.",
    properties: {
      backgroundImageUrl: LocalizedProperty,
      bannerExternalUrl: {
        description:
          "This is generated when a ChannelBanner.Insert request has succeeded for the given channel.",
        type: "string",
      } as const,
      bannerImageUrl: {
        description: "Banner image. Desktop size (1060x175).",
        type: "string",
      } as const,
      bannerMobileExtraHdImageUrl: {
        description: "Banner image. Mobile size high resolution (1440x395).",
        type: "string",
      } as const,
      bannerMobileHdImageUrl: {
        description: "Banner image. Mobile size high resolution (1280x360).",
        type: "string",
      } as const,
      bannerMobileImageUrl: {
        description: "Banner image. Mobile size (640x175).",
        type: "string",
      } as const,
      bannerMobileLowImageUrl: {
        description: "Banner image. Mobile size low resolution (320x88).",
        type: "string",
      } as const,
      bannerMobileMediumHdImageUrl: {
        description:
          "Banner image. Mobile size medium/high resolution (960x263).",
        type: "string",
      } as const,
      bannerTabletExtraHdImageUrl: {
        description:
          "Banner image. Tablet size extra high resolution (2560x424).",
        type: "string",
      } as const,
      bannerTabletHdImageUrl: {
        description: "Banner image. Tablet size high resolution (2276x377).",
        type: "string",
      } as const,
      bannerTabletImageUrl: {
        description: "Banner image. Tablet size (1707x283).",
        type: "string",
      } as const,
      bannerTabletLowImageUrl: {
        description: "Banner image. Tablet size low resolution (1138x188).",
        type: "string",
      } as const,
      bannerTvHighImageUrl: {
        description: "Banner image. TV size high resolution (1920x1080).",
        type: "string",
      } as const,
      bannerTvImageUrl: {
        description: "Banner image. TV size extra high resolution (2120x1192).",
        type: "string",
      } as const,
      bannerTvLowImageUrl: {
        description: "Banner image. TV size low resolution (854x480).",
        type: "string",
      } as const,
      bannerTvMediumImageUrl: {
        description: "Banner image. TV size medium resolution (1280x720).",
        type: "string",
      } as const,
      largeBrandedBannerImageImapScript: LocalizedProperty,
      largeBrandedBannerImageUrl: LocalizedProperty,
      smallBrandedBannerImageImapScript: LocalizedProperty,
      smallBrandedBannerImageUrl: LocalizedProperty,
      trackingImageUrl: {
        description:
          "The URL for a 1px by 1px tracking pixel that can be used to collect statistics for views of the channel or video pages.",
        type: "string",
      } as const,
      watchIconImageUrl: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const IngestionInfo = () =>
  ({
    description:
      "Describes information necessary for ingesting an RTMP, HTTP, or SRT stream.",
    properties: {
      backupIngestionAddress: {
        description:
          "The backup ingestion URL that you should use to stream video to YouTube. You have the option of simultaneously streaming the content that you are sending to the ingestionAddress to this URL.",
        type: "string",
      } as const,
      ingestionAddress: {
        description:
          "The primary ingestion URL that you should use to stream video to YouTube. You must stream video to this URL. Depending on which application or tool you use to encode your video stream, you may need to enter the stream URL and stream name separately or you may need to concatenate them in the following format: *STREAM_URL/STREAM_NAME* ",
        type: "string",
      } as const,
      rtmpsBackupIngestionAddress: {
        description:
          "This ingestion url may be used instead of backupIngestionAddress in order to stream via RTMPS. Not applicable to non-RTMP streams.",
        type: "string",
      } as const,
      rtmpsIngestionAddress: {
        description:
          "This ingestion url may be used instead of ingestionAddress in order to stream via RTMPS. Not applicable to non-RTMP streams.",
        type: "string",
      } as const,
      streamName: {
        description:
          "The stream name that YouTube assigns to the video stream.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const InvideoBranding = () =>
  ({
    description: "LINT.IfChange Describes an invideo branding.",
    properties: {
      imageBytes: {
        description:
          "The bytes the uploaded image. Only used in api to youtube communication.",
        format: "byte",
        type: "string",
      } as const,
      imageUrl: {
        description:
          "The url of the uploaded image. Only used in apiary to api communication.",
        type: "string",
      } as const,
      position: InvideoPosition,
      targetChannelId: {
        description:
          "The channel to which this branding links. If not present it defaults to the current channel.",
        type: "string",
      } as const,
      timing: InvideoTiming,
    },
    type: "object",
  }) as const

const InvideoPosition = () =>
  ({
    description:
      "Describes the spatial position of a visual widget inside a video. It is a union of various position types, out of which only will be set one.",
    properties: {
      cornerPosition: {
        description:
          "Describes in which corner of the video the visual widget will appear.",
        enum: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
        type: "string",
      } as const,
      type: {
        description: "Defines the position type.",
        enum: ["corner"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const InvideoTiming = () =>
  ({
    description:
      "Describes a temporal position of a visual widget inside a video.",
    properties: {
      durationMs: {
        description:
          "Defines the duration in milliseconds for which the promotion should be displayed. If missing, the client should use the default.",
        format: "uint64",
        type: "string",
      } as const,
      offsetMs: {
        description:
          "Defines the time at which the promotion will appear. Depending on the value of type the value of the offsetMs field will represent a time offset from the start or from the end of the video, expressed in milliseconds.",
        format: "uint64",
        type: "string",
      } as const,
      type: {
        description:
          "Describes a timing type. If the value is offsetFromStart, then the offsetMs field represents an offset from the start of the video. If the value is offsetFromEnd, then the offsetMs field represents an offset from the end of the video.",
        enum: ["offsetFromStart", "offsetFromEnd"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LanguageTag = () =>
  ({
    properties: {
      value: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LevelDetails = () =>
  ({
    properties: {
      displayName: {
        description:
          "The name that should be used when referring to this level.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveBroadcast = () =>
  ({
    description:
      "A *liveBroadcast* resource represents an event that will be streamed, via live video, on YouTube.",
    properties: {
      contentDetails: LiveBroadcastContentDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube assigns to uniquely identify the broadcast.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#liveBroadcast",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveBroadcast".',
        type: "string",
      } as const,
      snippet: LiveBroadcastSnippet,
      statistics: LiveBroadcastStatistics,
      status: LiveBroadcastStatus,
    },
    type: "object",
  }) as const

const LiveBroadcastContentDetails = () =>
  ({
    description: "Detailed settings of a broadcast.",
    properties: {
      boundStreamId: {
        description:
          "This value uniquely identifies the live stream bound to the broadcast.",
        type: "string",
      } as const,
      boundStreamLastUpdateTimeMs: {
        description:
          "The date and time that the live stream referenced by boundStreamId was last updated.",
        format: "date-time",
        type: "string",
      } as const,
      closedCaptionsType: {
        enum: [
          "closedCaptionsTypeUnspecified",
          "closedCaptionsDisabled",
          "closedCaptionsHttpPost",
          "closedCaptionsEmbedded",
        ],
        type: "string",
      } as const,
      enableAutoStart: {
        description:
          "This setting indicates whether auto start is enabled for this broadcast. The default value for this property is false. This setting can only be used by Events.",
        type: "boolean",
      } as const,
      enableAutoStop: {
        description:
          "This setting indicates whether auto stop is enabled for this broadcast. The default value for this property is false. This setting can only be used by Events.",
        type: "boolean",
      } as const,
      enableClosedCaptions: {
        description:
          "This setting indicates whether HTTP POST closed captioning is enabled for this broadcast. The ingestion URL of the closed captions is returned through the liveStreams API. This is mutually exclusive with using the closed_captions_type property, and is equivalent to setting closed_captions_type to CLOSED_CAPTIONS_HTTP_POST.",
        type: "boolean",
      } as const,
      enableContentEncryption: {
        description:
          "This setting indicates whether YouTube should enable content encryption for the broadcast.",
        type: "boolean",
      } as const,
      enableDvr: {
        description:
          "This setting determines whether viewers can access DVR controls while watching the video. DVR controls enable the viewer to control the video playback experience by pausing, rewinding, or fast forwarding content. The default value for this property is true. *Important:* You must set the value to true and also set the enableArchive property's value to true if you want to make playback available immediately after the broadcast ends.",
        type: "boolean",
      } as const,
      enableEmbed: {
        description:
          "This setting indicates whether the broadcast video can be played in an embedded player. If you choose to archive the video (using the enableArchive property), this setting will also apply to the archived video.",
        type: "boolean",
      } as const,
      enableLowLatency: {
        description:
          "Indicates whether this broadcast has low latency enabled.",
        type: "boolean",
      } as const,
      latencyPreference: {
        description:
          "If both this and enable_low_latency are set, they must match. LATENCY_NORMAL should match enable_low_latency=false LATENCY_LOW should match enable_low_latency=true LATENCY_ULTRA_LOW should have enable_low_latency omitted.",
        enum: ["latencyPreferenceUnspecified", "normal", "low", "ultraLow"],
        type: "string",
      } as const,
      mesh: {
        description:
          "The mesh for projecting the video if projection is mesh. The mesh value must be a UTF-8 string containing the base-64 encoding of 3D mesh data that follows the Spherical Video V2 RFC specification for an mshp box, excluding the box size and type but including the following four reserved zero bytes for the version and flags.",
        format: "byte",
        type: "string",
      } as const,
      monitorStream: MonitorStreamInfo,
      projection: {
        description:
          "The projection format of this broadcast. This defaults to rectangular.",
        enum: ["projectionUnspecified", "rectangular", "360", "mesh"],
        type: "string",
      } as const,
      recordFromStart: {
        description:
          "Automatically start recording after the event goes live. The default value for this property is true. *Important:* You must also set the enableDvr property's value to true if you want the playback to be available immediately after the broadcast ends. If you set this property's value to true but do not also set the enableDvr property to true, there may be a delay of around one day before the archived video will be available for playback.",
        type: "boolean",
      } as const,
      startWithSlate: {
        description:
          "This setting indicates whether the broadcast should automatically begin with an in-stream slate when you update the broadcast's status to live. After updating the status, you then need to send a liveCuepoints.insert request that sets the cuepoint's eventState to end to remove the in-stream slate and make your broadcast stream visible to viewers.",
        type: "boolean",
      } as const,
      stereoLayout: {
        description:
          "The 3D stereo layout of this broadcast. This defaults to mono.",
        enum: ["stereoLayoutUnspecified", "mono", "leftRight", "topBottom"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveBroadcastListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of broadcasts that match the request criteria.",
        items: LiveBroadcast,
        type: "array",
      } as const,
      kind: {
        default: "youtube#liveBroadcastListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveBroadcastListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveBroadcastSnippet = () =>
  ({
    description: "Basic broadcast information.",
    properties: {
      actualEndTime: {
        description:
          "The date and time that the broadcast actually ended. This information is only available once the broadcast's state is complete.",
        format: "date-time",
        type: "string",
      } as const,
      actualStartTime: {
        description:
          "The date and time that the broadcast actually started. This information is only available once the broadcast's state is live.",
        format: "date-time",
        type: "string",
      } as const,
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the channel that is publishing the broadcast.",
        type: "string",
      } as const,
      description: {
        description:
          "The broadcast's description. As with the title, you can set this field by modifying the broadcast resource or by setting the description field of the corresponding video resource.",
        type: "string",
      } as const,
      isDefaultBroadcast: {
        description:
          "Indicates whether this broadcast is the default broadcast. Internal only.",
        type: "boolean",
      } as const,
      liveChatId: {
        description: "The id of the live chat for this broadcast.",
        type: "string",
      } as const,
      publishedAt: {
        description:
          "The date and time that the broadcast was added to YouTube's live broadcast schedule.",
        format: "date-time",
        type: "string",
      } as const,
      scheduledEndTime: {
        description:
          "The date and time that the broadcast is scheduled to end.",
        format: "date-time",
        type: "string",
      } as const,
      scheduledStartTime: {
        description:
          "The date and time that the broadcast is scheduled to start.",
        format: "date-time",
        type: "string",
      } as const,
      thumbnails: ThumbnailDetails,
      title: {
        description:
          "The broadcast's title. Note that the broadcast represents exactly one YouTube video. You can set this field by modifying the broadcast resource or by setting the title field of the corresponding video resource.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveBroadcastStatistics = () =>
  ({
    description:
      "Statistics about the live broadcast. These represent a snapshot of the values at the time of the request. Statistics are only returned for live broadcasts.",
    properties: {
      concurrentViewers: {
        description:
          "The number of viewers currently watching the broadcast. The property and its value will be present if the broadcast has current viewers and the broadcast owner has not hidden the viewcount for the video. Note that YouTube stops tracking the number of concurrent viewers for a broadcast when the broadcast ends. So, this property would not identify the number of viewers watching an archived video of a live broadcast that already ended.",
        format: "uint64",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveBroadcastStatus = () =>
  ({
    description: "Live broadcast state.",
    properties: {
      lifeCycleStatus: {
        description:
          "The broadcast's status. The status can be updated using the API's liveBroadcasts.transition method.",
        enum: [
          "lifeCycleStatusUnspecified",
          "created",
          "ready",
          "testing",
          "live",
          "complete",
          "revoked",
          "testStarting",
          "liveStarting",
        ],
        type: "string",
      } as const,
      liveBroadcastPriority: {
        description: "Priority of the live broadcast event (internal state).",
        enum: ["liveBroadcastPriorityUnspecified", "low", "normal", "high"],
        type: "string",
      } as const,
      madeForKids: {
        description:
          "Whether the broadcast is made for kids or not, decided by YouTube instead of the creator. This field is read only.",
        type: "boolean",
      } as const,
      privacyStatus: {
        description:
          "The broadcast's privacy status. Note that the broadcast represents exactly one YouTube video, so the privacy settings are identical to those supported for videos. In addition, you can set this field by modifying the broadcast resource or by setting the privacyStatus field of the corresponding video resource.",
        enum: ["public", "unlisted", "private"],
        type: "string",
      } as const,
      recordingStatus: {
        description: "The broadcast's recording status.",
        enum: [
          "liveBroadcastRecordingStatusUnspecified",
          "notRecording",
          "recording",
          "recorded",
        ],
        type: "string",
      } as const,
      selfDeclaredMadeForKids: {
        description:
          "This field will be set to True if the creator declares the broadcast to be kids only: go/live-cw-work.",
        type: "boolean",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatBan = () =>
  ({
    description:
      "A `__liveChatBan__` resource represents a ban for a YouTube live chat.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube assigns to uniquely identify the ban.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#liveChatBan",
        description:
          'Identifies what kind of resource this is. Value: the fixed string `"youtube#liveChatBan"`.',
        type: "string",
      } as const,
      snippet: LiveChatBanSnippet,
    },
    type: "object",
  }) as const

const LiveChatBanSnippet = () =>
  ({
    properties: {
      banDurationSeconds: {
        description:
          "The duration of a ban, only filled if the ban has type TEMPORARY.",
        format: "uint64",
        type: "string",
      } as const,
      bannedUserDetails: ChannelProfileDetails,
      liveChatId: {
        description: "The chat this ban is pertinent to.",
        type: "string",
      } as const,
      type: {
        description: "The type of ban.",
        enum: ["liveChatBanTypeUnspecified", "permanent", "temporary"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatFanFundingEventDetails = () =>
  ({
    properties: {
      amountDisplayString: {
        description:
          "A rendered string that displays the fund amount and currency to the user.",
        type: "string",
      } as const,
      amountMicros: {
        description: "The amount of the fund.",
        format: "uint64",
        type: "string",
      } as const,
      currency: {
        description: "The currency in which the fund was made.",
        type: "string",
      } as const,
      userComment: {
        description: "The comment added by the user to this fan funding event.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatGiftMembershipReceivedDetails = () =>
  ({
    properties: {
      associatedMembershipGiftingMessageId: {
        description:
          "The ID of the membership gifting message that is related to this gift membership. This ID will always refer to a message whose type is 'membershipGiftingEvent'.",
        type: "string",
      } as const,
      gifterChannelId: {
        description:
          "The ID of the user that made the membership gifting purchase. This matches the `snippet.authorChannelId` of the associated membership gifting message.",
        type: "string",
      } as const,
      memberLevelName: {
        description:
          "The name of the Level at which the viewer is a member. This matches the `snippet.membershipGiftingDetails.giftMembershipsLevelName` of the associated membership gifting message. The Level names are defined by the YouTube channel offering the Membership. In some situations this field isn't filled.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatMemberMilestoneChatDetails = () =>
  ({
    properties: {
      memberLevelName: {
        description:
          "The name of the Level at which the viever is a member. The Level names are defined by the YouTube channel offering the Membership. In some situations this field isn't filled.",
        type: "string",
      } as const,
      memberMonth: {
        description:
          "The total amount of months (rounded up) the viewer has been a member that granted them this Member Milestone Chat. This is the same number of months as is being displayed to YouTube users.",
        format: "uint32",
        type: "integer",
      } as const,
      userComment: {
        description:
          "The comment added by the member to this Member Milestone Chat. This field is empty for messages without a comment from the member.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatMembershipGiftingDetails = () =>
  ({
    properties: {
      giftMembershipsCount: {
        description: "The number of gift memberships purchased by the user.",
        format: "int32",
        type: "integer",
      } as const,
      giftMembershipsLevelName: {
        description:
          "The name of the level of the gift memberships purchased by the user. The Level names are defined by the YouTube channel offering the Membership. In some situations this field isn't filled.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatMessage = () =>
  ({
    description:
      "A *liveChatMessage* resource represents a chat message in a YouTube Live Chat.",
    properties: {
      authorDetails: LiveChatMessageAuthorDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube assigns to uniquely identify the message.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#liveChatMessage",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveChatMessage".',
        type: "string",
      } as const,
      snippet: LiveChatMessageSnippet,
    },
    type: "object",
  }) as const

const LiveChatMessageAuthorDetails = () =>
  ({
    properties: {
      channelId: {
        description: "The YouTube channel ID.",
        type: "string",
      } as const,
      channelUrl: {
        description: "The channel's URL.",
        type: "string",
      } as const,
      displayName: {
        description: "The channel's display name.",
        type: "string",
      } as const,
      isChatModerator: {
        description: "Whether the author is a moderator of the live chat.",
        type: "boolean",
      } as const,
      isChatOwner: {
        description: "Whether the author is the owner of the live chat.",
        type: "boolean",
      } as const,
      isChatSponsor: {
        description: "Whether the author is a sponsor of the live chat.",
        type: "boolean",
      } as const,
      isVerified: {
        description:
          "Whether the author's identity has been verified by YouTube.",
        type: "boolean",
      } as const,
      profileImageUrl: {
        description: "The channels's avatar URL.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatMessageDeletedDetails = () =>
  ({
    properties: {
      deletedMessageId: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatMessageListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        items: LiveChatMessage,
        type: "array",
      } as const,
      kind: {
        default: "youtube#liveChatMessageListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveChatMessageListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        type: "string",
      } as const,
      offlineAt: {
        description:
          "The date and time when the underlying stream went offline.",
        format: "date-time",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      pollingIntervalMillis: {
        description:
          "The amount of time the client should wait before polling again.",
        format: "uint32",
        type: "integer",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatMessageRetractedDetails = () =>
  ({
    properties: {
      retractedMessageId: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatMessageSnippet = () =>
  ({
    description: "Next ID: 33",
    properties: {
      authorChannelId: {
        description:
          "The ID of the user that authored this message, this field is not always filled. textMessageEvent - the user that wrote the message fanFundingEvent - the user that funded the broadcast newSponsorEvent - the user that just became a sponsor memberMilestoneChatEvent - the member that sent the message membershipGiftingEvent - the user that made the purchase giftMembershipReceivedEvent - the user that received the gift membership messageDeletedEvent - the moderator that took the action messageRetractedEvent - the author that retracted their message userBannedEvent - the moderator that took the action superChatEvent - the user that made the purchase superStickerEvent - the user that made the purchase",
        type: "string",
      } as const,
      displayMessage: {
        description:
          "Contains a string that can be displayed to the user. If this field is not present the message is silent, at the moment only messages of type TOMBSTONE and CHAT_ENDED_EVENT are silent.",
        type: "string",
      } as const,
      fanFundingEventDetails: LiveChatFanFundingEventDetails,
      giftMembershipReceivedDetails: LiveChatGiftMembershipReceivedDetails,
      hasDisplayContent: {
        description:
          "Whether the message has display content that should be displayed to users.",
        type: "boolean",
      } as const,
      liveChatId: {
        type: "string",
      } as const,
      memberMilestoneChatDetails: LiveChatMemberMilestoneChatDetails,
      membershipGiftingDetails: LiveChatMembershipGiftingDetails,
      messageDeletedDetails: LiveChatMessageDeletedDetails,
      messageRetractedDetails: LiveChatMessageRetractedDetails,
      newSponsorDetails: LiveChatNewSponsorDetails,
      publishedAt: {
        description:
          "The date and time when the message was orignally published.",
        format: "date-time",
        type: "string",
      } as const,
      superChatDetails: LiveChatSuperChatDetails,
      superStickerDetails: LiveChatSuperStickerDetails,
      textMessageDetails: LiveChatTextMessageDetails,
      type: {
        description:
          "The type of message, this will always be present, it determines the contents of the message as well as which fields will be present.",
        enum: [
          "invalidType",
          "textMessageEvent",
          "tombstone",
          "fanFundingEvent",
          "chatEndedEvent",
          "sponsorOnlyModeStartedEvent",
          "sponsorOnlyModeEndedEvent",
          "newSponsorEvent",
          "memberMilestoneChatEvent",
          "membershipGiftingEvent",
          "giftMembershipReceivedEvent",
          "messageDeletedEvent",
          "messageRetractedEvent",
          "userBannedEvent",
          "superChatEvent",
          "superStickerEvent",
        ],
        type: "string",
      } as const,
      userBannedDetails: LiveChatUserBannedMessageDetails,
    },
    type: "object",
  }) as const

const LiveChatModerator = () =>
  ({
    description:
      "A *liveChatModerator* resource represents a moderator for a YouTube live chat. A chat moderator has the ability to ban/unban users from a chat, remove message, etc.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube assigns to uniquely identify the moderator.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#liveChatModerator",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveChatModerator".',
        type: "string",
      } as const,
      snippet: LiveChatModeratorSnippet,
    },
    type: "object",
  }) as const

const LiveChatModeratorListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of moderators that match the request criteria.",
        items: LiveChatModerator,
        type: "array",
      } as const,
      kind: {
        default: "youtube#liveChatModeratorListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveChatModeratorListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatModeratorSnippet = () =>
  ({
    properties: {
      liveChatId: {
        description: "The ID of the live chat this moderator can act on.",
        type: "string",
      } as const,
      moderatorDetails: ChannelProfileDetails,
    },
    type: "object",
  }) as const

const LiveChatNewSponsorDetails = () =>
  ({
    properties: {
      isUpgrade: {
        description:
          "If the viewer just had upgraded from a lower level. For viewers that were not members at the time of purchase, this field is false.",
        type: "boolean",
      } as const,
      memberLevelName: {
        description:
          "The name of the Level that the viewer just had joined. The Level names are defined by the YouTube channel offering the Membership. In some situations this field isn't filled.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatSuperChatDetails = () =>
  ({
    properties: {
      amountDisplayString: {
        description:
          "A rendered string that displays the fund amount and currency to the user.",
        type: "string",
      } as const,
      amountMicros: {
        description:
          "The amount purchased by the user, in micros (1,750,000 micros = 1.75).",
        format: "uint64",
        type: "string",
      } as const,
      currency: {
        description: "The currency in which the purchase was made.",
        type: "string",
      } as const,
      tier: {
        description:
          "The tier in which the amount belongs. Lower amounts belong to lower tiers. The lowest tier is 1.",
        format: "uint32",
        type: "integer",
      } as const,
      userComment: {
        description: "The comment added by the user to this Super Chat event.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatSuperStickerDetails = () =>
  ({
    properties: {
      amountDisplayString: {
        description:
          "A rendered string that displays the fund amount and currency to the user.",
        type: "string",
      } as const,
      amountMicros: {
        description:
          "The amount purchased by the user, in micros (1,750,000 micros = 1.75).",
        format: "uint64",
        type: "string",
      } as const,
      currency: {
        description: "The currency in which the purchase was made.",
        type: "string",
      } as const,
      superStickerMetadata: SuperStickerMetadata,
      tier: {
        description:
          "The tier in which the amount belongs. Lower amounts belong to lower tiers. The lowest tier is 1.",
        format: "uint32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatTextMessageDetails = () =>
  ({
    properties: {
      messageText: {
        description: "The user's message.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveChatUserBannedMessageDetails = () =>
  ({
    properties: {
      banDurationSeconds: {
        description:
          "The duration of the ban. This property is only present if the banType is temporary.",
        format: "uint64",
        type: "string",
      } as const,
      banType: {
        description: "The type of ban.",
        enum: ["permanent", "temporary"],
        type: "string",
      } as const,
      bannedUserDetails: ChannelProfileDetails,
    },
    type: "object",
  }) as const

const LiveStream = () =>
  ({
    description: "A live stream describes a live ingestion point.",
    properties: {
      cdn: CdnSettings,
      contentDetails: LiveStreamContentDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube assigns to uniquely identify the stream.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#liveStream",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveStream".',
        type: "string",
      } as const,
      snippet: LiveStreamSnippet,
      status: LiveStreamStatus,
    },
    type: "object",
  }) as const

const LiveStreamConfigurationIssue = () =>
  ({
    properties: {
      description: {
        description:
          "The long-form description of the issue and how to resolve it.",
        type: "string",
      } as const,
      reason: {
        description: "The short-form reason for this issue.",
        type: "string",
      } as const,
      severity: {
        description: "How severe this issue is to the stream.",
        enum: ["info", "warning", "error"],
        type: "string",
      } as const,
      type: {
        description: "The kind of error happening.",
        enum: [
          "gopSizeOver",
          "gopSizeLong",
          "gopSizeShort",
          "openGop",
          "badContainer",
          "audioBitrateHigh",
          "audioBitrateLow",
          "audioSampleRate",
          "bitrateHigh",
          "bitrateLow",
          "audioCodec",
          "videoCodec",
          "noAudioStream",
          "noVideoStream",
          "multipleVideoStreams",
          "multipleAudioStreams",
          "audioTooManyChannels",
          "interlacedVideo",
          "frameRateHigh",
          "resolutionMismatch",
          "videoCodecMismatch",
          "videoInterlaceMismatch",
          "videoProfileMismatch",
          "videoBitrateMismatch",
          "framerateMismatch",
          "gopMismatch",
          "audioSampleRateMismatch",
          "audioStereoMismatch",
          "audioCodecMismatch",
          "audioBitrateMismatch",
          "videoResolutionSuboptimal",
          "videoResolutionUnsupported",
          "videoIngestionStarved",
          "videoIngestionFasterThanRealtime",
        ],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveStreamContentDetails = () =>
  ({
    description: "Detailed settings of a stream.",
    properties: {
      closedCaptionsIngestionUrl: {
        description:
          "The ingestion URL where the closed captions of this stream are sent.",
        type: "string",
      } as const,
      isReusable: {
        description:
          "Indicates whether the stream is reusable, which means that it can be bound to multiple broadcasts. It is common for broadcasters to reuse the same stream for many different broadcasts if those broadcasts occur at different times. If you set this value to false, then the stream will not be reusable, which means that it can only be bound to one broadcast. Non-reusable streams differ from reusable streams in the following ways: - A non-reusable stream can only be bound to one broadcast. - A non-reusable stream might be deleted by an automated process after the broadcast ends. - The liveStreams.list method does not list non-reusable streams if you call the method and set the mine parameter to true. The only way to use that method to retrieve the resource for a non-reusable stream is to use the id parameter to identify the stream. ",
        type: "boolean",
      } as const,
    },
    type: "object",
  }) as const

const LiveStreamHealthStatus = () =>
  ({
    properties: {
      configurationIssues: {
        description: "The configurations issues on this stream",
        items: LiveStreamConfigurationIssue,
        type: "array",
      } as const,
      lastUpdateTimeSeconds: {
        description: "The last time this status was updated (in seconds)",
        format: "uint64",
        type: "string",
      } as const,
      status: {
        description: "The status code of this stream",
        enum: ["good", "ok", "bad", "noData", "revoked"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveStreamListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of live streams that match the request criteria.",
        items: LiveStream,
        type: "array",
      } as const,
      kind: {
        default: "youtube#liveStreamListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#liveStreamListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveStreamSnippet = () =>
  ({
    properties: {
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the channel that is transmitting the stream.",
        type: "string",
      } as const,
      description: {
        description:
          "The stream's description. The value cannot be longer than 10000 characters.",
        type: "string",
      } as const,
      isDefaultStream: {
        type: "boolean",
      } as const,
      publishedAt: {
        description: "The date and time that the stream was created.",
        format: "date-time",
        type: "string",
      } as const,
      title: {
        description:
          "The stream's title. The value must be between 1 and 128 characters long.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LiveStreamStatus = () =>
  ({
    description: "Brief description of the live stream status.",
    properties: {
      healthStatus: LiveStreamHealthStatus,
      streamStatus: {
        enum: ["created", "ready", "active", "inactive", "error"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const LocalizedProperty = () =>
  ({
    properties: {
      defaultLanguage: LanguageTag,
      localized: {
        items: LocalizedString,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const LocalizedString = () =>
  ({
    properties: {
      language: {
        type: "string",
      } as const,
      value: {
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const Member = () =>
  ({
    description:
      "A *member* resource represents a member for a YouTube channel. A member provides recurring monetary support to a creator and receives special benefits.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#member",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#member".',
        type: "string",
      } as const,
      snippet: MemberSnippet,
    },
    type: "object",
  }) as const

const MemberListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of members that match the request criteria.",
        items: Member,
        type: "array",
      } as const,
      kind: {
        default: "youtube#memberListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#memberListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const MemberSnippet = () =>
  ({
    properties: {
      creatorChannelId: {
        description: "The id of the channel that's offering memberships.",
        type: "string",
      } as const,
      memberDetails: ChannelProfileDetails,
      membershipsDetails: MembershipsDetails,
    },
    type: "object",
  }) as const

const MembershipsDetails = () =>
  ({
    properties: {
      accessibleLevels: {
        description:
          "Ids of all levels that the user has access to. This includes the currently active level and all other levels that are included because of a higher purchase.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      highestAccessibleLevel: {
        description:
          "Id of the highest level that the user has access to at the moment.",
        type: "string",
      } as const,
      highestAccessibleLevelDisplayName: {
        description:
          "Display name for the highest level that the user has access to at the moment.",
        type: "string",
      } as const,
      membershipsDuration: MembershipsDuration,
      membershipsDurationAtLevels: {
        description:
          "Data about memberships duration on particular pricing levels.",
        items: MembershipsDurationAtLevel,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const MembershipsDuration = () =>
  ({
    properties: {
      memberSince: {
        description:
          "The date and time when the user became a continuous member across all levels.",
        type: "string",
      } as const,
      memberTotalDurationMonths: {
        description:
          "The cumulative time the user has been a member across all levels in complete months (the time is rounded down to the nearest integer).",
        format: "int32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const MembershipsDurationAtLevel = () =>
  ({
    properties: {
      level: {
        description: "Pricing level ID.",
        type: "string",
      } as const,
      memberSince: {
        description:
          "The date and time when the user became a continuous member for the given level.",
        type: "string",
      } as const,
      memberTotalDurationMonths: {
        description:
          "The cumulative time the user has been a member for the given level in complete months (the time is rounded down to the nearest integer).",
        format: "int32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const MembershipsLevel = () =>
  ({
    description:
      "A *membershipsLevel* resource represents an offer made by YouTube creators for their fans. Users can become members of the channel by joining one of the available levels. They will provide recurring monetary support and receives special benefits.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube assigns to uniquely identify the memberships level.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#membershipsLevel",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#membershipsLevelListResponse".',
        type: "string",
      } as const,
      snippet: MembershipsLevelSnippet,
    },
    type: "object",
  }) as const

const MembershipsLevelListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of pricing levels offered by a creator to the fans.",
        items: MembershipsLevel,
        type: "array",
      } as const,
      kind: {
        default: "youtube#membershipsLevelListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#membershipsLevelListResponse".',
        type: "string",
      } as const,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const MembershipsLevelSnippet = () =>
  ({
    properties: {
      creatorChannelId: {
        description:
          "The id of the channel that's offering channel memberships.",
        type: "string",
      } as const,
      levelDetails: LevelDetails,
    },
    type: "object",
  }) as const

const MonitorStreamInfo = () =>
  ({
    description: "Settings and Info of the monitor stream",
    properties: {
      broadcastStreamDelayMs: {
        description:
          "If you have set the enableMonitorStream property to true, then this property determines the length of the live broadcast delay.",
        format: "uint32",
        type: "integer",
      } as const,
      embedHtml: {
        description:
          "HTML code that embeds a player that plays the monitor stream.",
        type: "string",
      } as const,
      enableMonitorStream: {
        description:
          "This value determines whether the monitor stream is enabled for the broadcast. If the monitor stream is enabled, then YouTube will broadcast the event content on a special stream intended only for the broadcaster's consumption. The broadcaster can use the stream to review the event content and also to identify the optimal times to insert cuepoints. You need to set this value to true if you intend to have a broadcast delay for your event. *Note:* This property cannot be updated once the broadcast is in the testing or live state.",
        type: "boolean",
      } as const,
    },
    type: "object",
  }) as const

const PageInfo = () =>
  ({
    description:
      "Paging details for lists of resources, including total number of items available and number of resources returned in a single page.",
    properties: {
      resultsPerPage: {
        description: "The number of results included in the API response.",
        format: "int32",
        type: "integer",
      } as const,
      totalResults: {
        description: "The total number of results in the result set.",
        format: "int32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const Playlist = () =>
  ({
    description:
      "A *playlist* resource represents a YouTube playlist. A playlist is a collection of videos that can be viewed sequentially and shared with other users. A playlist can contain up to 200 videos, and YouTube does not limit the number of playlists that each user creates. By default, playlists are publicly visible to other users, but playlists can be public or private. YouTube also uses playlists to identify special collections of videos for a channel, such as: - uploaded videos - favorite videos - positively rated (liked) videos - watch history - watch later To be more specific, these lists are associated with a channel, which is a collection of a person, group, or company's videos, playlists, and other YouTube information. You can retrieve the playlist IDs for each of these lists from the channel resource for a given channel. You can then use the playlistItems.list method to retrieve any of those lists. You can also add or remove items from those lists by calling the playlistItems.insert and playlistItems.delete methods.",
    properties: {
      contentDetails: PlaylistContentDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the playlist.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#playlist",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#playlist".',
        type: "string",
      } as const,
      localizations: dict({ type: "string" } as const, PlaylistLocalization, {
        description: "Localizations for different languages",
      }),
      player: PlaylistPlayer,
      snippet: PlaylistSnippet,
      status: PlaylistStatus,
    },
    type: "object",
  }) as const

const PlaylistContentDetails = () =>
  ({
    properties: {
      itemCount: {
        description: "The number of videos in the playlist.",
        format: "uint32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistItem = () =>
  ({
    description:
      "A *playlistItem* resource identifies another resource, such as a video, that is included in a playlist. In addition, the playlistItem resource contains details about the included resource that pertain specifically to how that resource is used in that playlist. YouTube uses playlists to identify special collections of videos for a channel, such as: - uploaded videos - favorite videos - positively rated (liked) videos - watch history - watch later To be more specific, these lists are associated with a channel, which is a collection of a person, group, or company's videos, playlists, and other YouTube information. You can retrieve the playlist IDs for each of these lists from the channel resource for a given channel. You can then use the playlistItems.list method to retrieve any of those lists. You can also add or remove items from those lists by calling the playlistItems.insert and playlistItems.delete methods. For example, if a user gives a positive rating to a video, you would insert that video into the liked videos playlist for that user's channel.",
    properties: {
      contentDetails: PlaylistItemContentDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the playlist item.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#playlistItem",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#playlistItem".',
        type: "string",
      } as const,
      snippet: PlaylistItemSnippet,
      status: PlaylistItemStatus,
    },
    type: "object",
  }) as const

const PlaylistItemContentDetails = () =>
  ({
    properties: {
      endAt: {
        description:
          "The time, measured in seconds from the start of the video, when the video should stop playing. (The playlist owner can specify the times when the video should start and stop playing when the video is played in the context of the playlist.) By default, assume that the video.endTime is the end of the video.",
        type: "string",
      } as const,
      note: {
        description: "A user-generated note for this item.",
        type: "string",
      } as const,
      startAt: {
        description:
          "The time, measured in seconds from the start of the video, when the video should start playing. (The playlist owner can specify the times when the video should start and stop playing when the video is played in the context of the playlist.) The default value is 0.",
        type: "string",
      } as const,
      videoId: {
        description:
          "The ID that YouTube uses to uniquely identify a video. To retrieve the video resource, set the id query parameter to this value in your API request.",
        type: "string",
      } as const,
      videoPublishedAt: {
        description:
          "The date and time that the video was published to YouTube.",
        format: "date-time",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistItemListResponse = () =>
  ({
    properties: {
      etag: {
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of playlist items that match the request criteria.",
        items: PlaylistItem,
        type: "array",
      } as const,
      kind: {
        default: "youtube#playlistItemListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#playlistItemListResponse". Etag of this resource.',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistItemSnippet = () =>
  ({
    description:
      "Basic details about a playlist, including title, description and thumbnails. Basic details of a YouTube Playlist item provided by the author. Next ID: 15",
    properties: {
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the user that added the item to the playlist.",
        type: "string",
      } as const,
      channelTitle: {
        description:
          "Channel title for the channel that the playlist item belongs to.",
        type: "string",
      } as const,
      description: {
        description: "The item's description.",
        type: "string",
      } as const,
      playlistId: {
        description:
          "The ID that YouTube uses to uniquely identify thGe playlist that the playlist item is in.",
        type: "string",
      } as const,
      position: {
        description:
          "The order in which the item appears in the playlist. The value uses a zero-based index, so the first item has a position of 0, the second item has a position of 1, and so forth.",
        format: "uint32",
        type: "integer",
      } as const,
      publishedAt: {
        description:
          "The date and time that the item was added to the playlist.",
        format: "date-time",
        type: "string",
      } as const,
      resourceId: ResourceId,
      thumbnails: ThumbnailDetails,
      title: {
        description: "The item's title.",
        type: "string",
      } as const,
      videoOwnerChannelId: {
        description: "Channel id for the channel this video belongs to.",
        type: "string",
      } as const,
      videoOwnerChannelTitle: {
        description: "Channel title for the channel this video belongs to.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistItemStatus = () =>
  ({
    description: "Information about the playlist item's privacy status.",
    properties: {
      privacyStatus: {
        description: "This resource's privacy status.",
        enum: ["public", "unlisted", "private"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of playlists that match the request criteria",
        items: Playlist,
        type: "array",
      } as const,
      kind: {
        default: "youtube#playlistListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#playlistListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistLocalization = () =>
  ({
    description: "Playlist localization setting",
    properties: {
      description: {
        description: "The localized strings for playlist's description.",
        type: "string",
      } as const,
      title: {
        description: "The localized strings for playlist's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistPlayer = () =>
  ({
    properties: {
      embedHtml: {
        description:
          "An <iframe> tag that embeds a player that will play the playlist.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistSnippet = () =>
  ({
    description:
      "Basic details about a playlist, including title, description and thumbnails.",
    properties: {
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the channel that published the playlist.",
        type: "string",
      } as const,
      channelTitle: {
        description:
          "The channel title of the channel that the video belongs to.",
        type: "string",
      } as const,
      defaultLanguage: {
        description:
          "The language of the playlist's default title and description.",
        type: "string",
      } as const,
      description: {
        description: "The playlist's description.",
        type: "string",
      } as const,
      localized: PlaylistLocalization,
      publishedAt: {
        description: "The date and time that the playlist was created.",
        format: "date-time",
        type: "string",
      } as const,
      tags: {
        description: "Keyword tags associated with the playlist.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      thumbnailVideoId: {
        description:
          "Note: if the playlist has a custom thumbnail, this field will not be populated. The video id selected by the user that will be used as the thumbnail of this playlist. This field defaults to the first publicly viewable video in the playlist, if: 1. The user has never selected a video to be the thumbnail of the playlist. 2. The user selects a video to be the thumbnail, and then removes that video from the playlist. 3. The user selects a non-owned video to be the thumbnail, but that video becomes private, or gets deleted.",
        type: "string",
      } as const,
      thumbnails: ThumbnailDetails,
      title: {
        description: "The playlist's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PlaylistStatus = () =>
  ({
    properties: {
      privacyStatus: {
        description: "The playlist's privacy status.",
        enum: ["public", "unlisted", "private"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const PropertyValue = () =>
  ({
    description: "A pair Property / Value.",
    properties: {
      property: {
        description: "A property.",
        type: "string",
      } as const,
      value: {
        description: "The property's value.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const RelatedEntity = () =>
  ({
    properties: {
      entity: Entity,
    },
    type: "object",
  }) as const

const ResourceId = () =>
  ({
    description:
      "A resource id is a generic reference that points to another YouTube resource.",
    properties: {
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the referred resource, if that resource is a channel. This property is only present if the resourceId.kind value is youtube#channel.",
        type: "string",
      } as const,
      kind: {
        description: "The type of the API resource.",
        type: "string",
      } as const,
      playlistId: {
        description:
          "The ID that YouTube uses to uniquely identify the referred resource, if that resource is a playlist. This property is only present if the resourceId.kind value is youtube#playlist.",
        type: "string",
      } as const,
      videoId: {
        description:
          "The ID that YouTube uses to uniquely identify the referred resource, if that resource is a video. This property is only present if the resourceId.kind value is youtube#video.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const SearchListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "Pagination information for token pagination.",
        items: SearchResult,
        type: "array",
      } as const,
      kind: {
        default: "youtube#searchListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#searchListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      regionCode: {
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const SearchResult = () =>
  ({
    description:
      "A search result contains information about a YouTube video, channel, or playlist that matches the search parameters specified in an API request. While a search result points to a uniquely identifiable resource, like a video, it does not have its own persistent data.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: ResourceId,
      kind: {
        default: "youtube#searchResult",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#searchResult".',
        type: "string",
      } as const,
      snippet: SearchResultSnippet,
    },
    type: "object",
  }) as const

const SearchResultSnippet = () =>
  ({
    description:
      "Basic details about a search result, including title, description and thumbnails of the item referenced by the search result.",
    properties: {
      channelId: {
        description:
          "The value that YouTube uses to uniquely identify the channel that published the resource that the search result identifies.",
        type: "string",
      } as const,
      channelTitle: {
        description:
          "The title of the channel that published the resource that the search result identifies.",
        type: "string",
      } as const,
      description: {
        description: "A description of the search result.",
        type: "string",
      } as const,
      liveBroadcastContent: {
        description:
          'It indicates if the resource (video or channel) has upcoming/active live broadcast content. Or it\'s "none" if there is not any upcoming/active live broadcasts.',
        enum: ["none", "upcoming", "live", "completed"],
        type: "string",
      } as const,
      publishedAt: {
        description:
          "The creation date and time of the resource that the search result identifies.",
        format: "date-time",
        type: "string",
      } as const,
      thumbnails: ThumbnailDetails,
      title: {
        description: "The title of the search result.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const Subscription = () =>
  ({
    description:
      "A *subscription* resource contains information about a YouTube user subscription. A subscription notifies a user when new videos are added to a channel or when another user takes one of several actions on YouTube, such as uploading a video, rating a video, or commenting on a video.",
    properties: {
      contentDetails: SubscriptionContentDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the subscription.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#subscription",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#subscription".',
        type: "string",
      } as const,
      snippet: SubscriptionSnippet,
      subscriberSnippet: SubscriptionSubscriberSnippet,
    },
    type: "object",
  }) as const

const SubscriptionContentDetails = () =>
  ({
    description: "Details about the content to witch a subscription refers.",
    properties: {
      activityType: {
        description:
          "The type of activity this subscription is for (only uploads, everything).",
        enum: ["subscriptionActivityTypeUnspecified", "all", "uploads"],
        type: "string",
      } as const,
      newItemCount: {
        description:
          "The number of new items in the subscription since its content was last read.",
        format: "uint32",
        type: "integer",
      } as const,
      totalItemCount: {
        description:
          "The approximate number of items that the subscription points to.",
        format: "uint32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const SubscriptionListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of subscriptions that match the request criteria.",
        items: Subscription,
        type: "array",
      } as const,
      kind: {
        default: "youtube#subscriptionListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#subscriptionListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const SubscriptionSnippet = () =>
  ({
    description:
      "Basic details about a subscription, including title, description and thumbnails of the subscribed item.",
    properties: {
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the subscriber's channel.",
        type: "string",
      } as const,
      channelTitle: {
        description:
          "Channel title for the channel that the subscription belongs to.",
        type: "string",
      } as const,
      description: {
        description: "The subscription's details.",
        type: "string",
      } as const,
      publishedAt: {
        description: "The date and time that the subscription was created.",
        format: "date-time",
        type: "string",
      } as const,
      resourceId: ResourceId,
      thumbnails: ThumbnailDetails,
      title: {
        description: "The subscription's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const SubscriptionSubscriberSnippet = () =>
  ({
    description:
      "Basic details about a subscription's subscriber including title, description, channel ID and thumbnails.",
    properties: {
      channelId: {
        description: "The channel ID of the subscriber.",
        type: "string",
      } as const,
      description: {
        description: "The description of the subscriber.",
        type: "string",
      } as const,
      thumbnails: ThumbnailDetails,
      title: {
        description: "The title of the subscriber.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const SuperChatEvent = () =>
  ({
    description:
      "A `__superChatEvent__` resource represents a Super Chat purchase on a YouTube channel.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube assigns to uniquely identify the Super Chat event.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#superChatEvent",
        description:
          'Identifies what kind of resource this is. Value: the fixed string `"youtube#superChatEvent"`.',
        type: "string",
      } as const,
      snippet: SuperChatEventSnippet,
    },
    type: "object",
  }) as const

const SuperChatEventListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of Super Chat purchases that match the request criteria.",
        items: SuperChatEvent,
        type: "array",
      } as const,
      kind: {
        default: "youtube#superChatEventListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#superChatEventListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const SuperChatEventSnippet = () =>
  ({
    properties: {
      amountMicros: {
        description:
          "The purchase amount, in micros of the purchase currency. e.g., 1 is represented as 1000000.",
        format: "uint64",
        type: "string",
      } as const,
      channelId: {
        description: "Channel id where the event occurred.",
        type: "string",
      } as const,
      commentText: {
        description: "The text contents of the comment left by the user.",
        type: "string",
      } as const,
      createdAt: {
        description: "The date and time when the event occurred.",
        format: "date-time",
        type: "string",
      } as const,
      currency: {
        description: "The currency in which the purchase was made. ISO 4217.",
        type: "string",
      } as const,
      displayString: {
        description:
          'A rendered string that displays the purchase amount and currency (e.g., "$1.00"). The string is rendered for the given language.',
        type: "string",
      } as const,
      isSuperStickerEvent: {
        description: "True if this event is a Super Sticker event.",
        type: "boolean",
      } as const,
      messageType: {
        description:
          "The tier for the paid message, which is based on the amount of money spent to purchase the message.",
        format: "uint32",
        type: "integer",
      } as const,
      superStickerMetadata: SuperStickerMetadata,
      supporterDetails: ChannelProfileDetails,
    },
    type: "object",
  }) as const

const SuperStickerMetadata = () =>
  ({
    properties: {
      altText: {
        description:
          "Internationalized alt text that describes the sticker image and any animation associated with it.",
        type: "string",
      } as const,
      altTextLanguage: {
        description:
          "Specifies the localization language in which the alt text is returned.",
        type: "string",
      } as const,
      stickerId: {
        description:
          "Unique identifier of the Super Sticker. This is a shorter form of the alt_text that includes pack name and a recognizable characteristic of the sticker.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const TestItem = () =>
  ({
    properties: {
      featuredPart: {
        type: "boolean",
      } as const,
      gaia: {
        format: "int64",
        type: "string",
      } as const,
      id: {
        type: "string",
      } as const,
      snippet: TestItemTestItemSnippet,
    },
    type: "object",
  }) as const

const TestItemTestItemSnippet = () =>
  ({
    properties: {},
    type: "object",
  }) as const

const ThirdPartyLink = () =>
  ({
    description:
      "A *third party account link* resource represents a link between a YouTube account or a channel and an account on a third-party service.",
    properties: {
      etag: {
        description: "Etag of this resource",
        type: "string",
      } as const,
      kind: {
        default: "youtube#thirdPartyLink",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#thirdPartyLink".',
        type: "string",
      } as const,
      linkingToken: {
        description:
          "The linking_token identifies a YouTube account and channel with which the third party account is linked.",
        type: "string",
      } as const,
      snippet: ThirdPartyLinkSnippet,
      status: ThirdPartyLinkStatus,
    },
    type: "object",
  }) as const

const ThirdPartyLinkListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      items: {
        items: ThirdPartyLink,
        type: "array",
      } as const,
      kind: {
        default: "youtube#thirdPartyLinkListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#thirdPartyLinkListResponse".',
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ThirdPartyLinkSnippet = () =>
  ({
    description:
      "Basic information about a third party account link, including its type and type-specific information.",
    properties: {
      channelToStoreLink: ChannelToStoreLinkDetails,
      type: {
        description:
          "Type of the link named after the entities that are being linked.",
        enum: ["linkUnspecified", "channelToStoreLink"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const ThirdPartyLinkStatus = () =>
  ({
    description:
      "The third-party link status object contains information about the status of the link.",
    properties: {
      linkStatus: {
        enum: ["unknown", "failed", "pending", "linked"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const Thumbnail = () =>
  ({
    description: "A thumbnail is an image representing a YouTube resource.",
    properties: {
      height: {
        description: "(Optional) Height of the thumbnail image.",
        format: "uint32",
        type: "integer",
      } as const,
      url: {
        description: "The thumbnail image's URL.",
        type: "string",
      } as const,
      width: {
        description: "(Optional) Width of the thumbnail image.",
        format: "uint32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const ThumbnailDetails = () =>
  ({
    description:
      "Internal representation of thumbnails for a YouTube resource.",
    properties: {
      high: Thumbnail,
      maxres: Thumbnail,
      medium: Thumbnail,
      standard: Thumbnail,
    },
    type: "object",
  }) as const

const ThumbnailSetResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of thumbnails.",
        items: ThumbnailDetails,
        type: "array",
      } as const,
      kind: {
        default: "youtube#thumbnailSetResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#thumbnailSetResponse".',
        type: "string",
      } as const,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const TokenPagination = () =>
  ({
    description: "Stub token pagination template to suppress results.",
    properties: {},
    type: "object",
  }) as const

const Video = () =>
  ({
    description: "A *video* resource represents a YouTube video.",
    properties: {
      ageGating: VideoAgeGating,
      contentDetails: VideoContentDetails,
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      fileDetails: VideoFileDetails,
      id: {
        description: "The ID that YouTube uses to uniquely identify the video.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#video",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#video".',
        type: "string",
      } as const,
      liveStreamingDetails: VideoLiveStreamingDetails,
      localizations: dict({ type: "string" } as const, VideoLocalization, {
        description:
          "The localizations object contains localized versions of the basic details about the video, such as its title and description.",
      }),
      monetizationDetails: VideoMonetizationDetails,
      player: VideoPlayer,
      processingDetails: VideoProcessingDetails,
      projectDetails: VideoProjectDetails,
      recordingDetails: VideoRecordingDetails,
      snippet: VideoSnippet,
      statistics: VideoStatistics,
      status: VideoStatus,
      suggestions: VideoSuggestions,
      topicDetails: VideoTopicDetails,
    },
    type: "object",
  }) as const

const VideoAbuseReport = () =>
  ({
    properties: {
      comments: {
        description: "Additional comments regarding the abuse report.",
        type: "string",
      } as const,
      language: {
        description: "The language that the content was viewed in.",
        type: "string",
      } as const,
      reasonId: {
        description:
          "The high-level, or primary, reason that the content is abusive. The value is an abuse report reason ID.",
        type: "string",
      } as const,
      secondaryReasonId: {
        description:
          "The specific, or secondary, reason that this content is abusive (if available). The value is an abuse report reason ID that is a valid secondary reason for the primary reason.",
        type: "string",
      } as const,
      videoId: {
        description: "The ID that YouTube uses to uniquely identify the video.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoAbuseReportReason = () =>
  ({
    description:
      "A `__videoAbuseReportReason__` resource identifies a reason that a video could be reported as abusive. Video abuse report reasons are used with `video.ReportAbuse`.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description: "The ID of this abuse report reason.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#videoAbuseReportReason",
        description:
          'Identifies what kind of resource this is. Value: the fixed string `"youtube#videoAbuseReportReason"`.',
        type: "string",
      } as const,
      snippet: VideoAbuseReportReasonSnippet,
    },
    type: "object",
  }) as const

const VideoAbuseReportReasonListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of valid abuse reasons that are used with `video.ReportAbuse`.",
        items: VideoAbuseReportReason,
        type: "array",
      } as const,
      kind: {
        default: "youtube#videoAbuseReportReasonListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string `"youtube#videoAbuseReportReasonListResponse"`.',
        type: "string",
      } as const,
      visitorId: {
        description: "The `visitorId` identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoAbuseReportReasonSnippet = () =>
  ({
    description:
      "Basic details about a video category, such as its localized title.",
    properties: {
      label: {
        description:
          "The localized label belonging to this abuse report reason.",
        type: "string",
      } as const,
      secondaryReasons: {
        description:
          "The secondary reasons associated with this reason, if any are available. (There might be 0 or more.)",
        items: VideoAbuseReportSecondaryReason,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const VideoAbuseReportSecondaryReason = () =>
  ({
    properties: {
      id: {
        description: "The ID of this abuse report secondary reason.",
        type: "string",
      } as const,
      label: {
        description:
          "The localized label for this abuse report secondary reason.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoAgeGating = () =>
  ({
    properties: {
      alcoholContent: {
        description:
          "Indicates whether or not the video has alcoholic beverage content. Only users of legal purchasing age in a particular country, as identified by ICAP, can view the content.",
        type: "boolean",
      } as const,
      restricted: {
        description:
          "Age-restricted trailers. For redband trailers and adult-rated video-games. Only users aged 18+ can view the content. The the field is true the content is restricted to viewers aged 18+. Otherwise The field won't be present.",
        type: "boolean",
      } as const,
      videoGameRating: {
        description: "Video game rating, if any.",
        enum: ["anyone", "m15Plus", "m16Plus", "m17Plus"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoCategory = () =>
  ({
    description:
      "A *videoCategory* resource identifies a category that has been or could be associated with uploaded videos.",
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      id: {
        description:
          "The ID that YouTube uses to uniquely identify the video category.",
        type: "string",
      } as const,
      kind: {
        default: "youtube#videoCategory",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#videoCategory".',
        type: "string",
      } as const,
      snippet: VideoCategorySnippet,
    },
    type: "object",
  }) as const

const VideoCategoryListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description:
          "A list of video categories that can be associated with YouTube videos. In this map, the video category ID is the map key, and its value is the corresponding videoCategory resource.",
        items: VideoCategory,
        type: "array",
      } as const,
      kind: {
        default: "youtube#videoCategoryListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#videoCategoryListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoCategorySnippet = () =>
  ({
    description:
      "Basic details about a video category, such as its localized title.",
    properties: {
      assignable: {
        type: "boolean",
      } as const,
      channelId: {
        default: "UCBR8-60-B28hp2BmDPdntcQ",
        description: "The YouTube channel that created the video category.",
        type: "string",
      } as const,
      title: {
        description: "The video category's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoContentDetails = () =>
  ({
    description: "Details about the content of a YouTube Video.",
    properties: {
      caption: {
        description:
          "The value of captions indicates whether the video has captions or not.",
        enum: ["true", "false"],
        type: "string",
      } as const,
      contentRating: ContentRating,
      countryRestriction: AccessPolicy,
      definition: {
        description:
          "The value of definition indicates whether the video is available in high definition or only in standard definition.",
        enum: ["sd", "hd"],
        type: "string",
      } as const,
      dimension: {
        description:
          "The value of dimension indicates whether the video is available in 3D or in 2D.",
        type: "string",
      } as const,
      duration: {
        description:
          "The length of the video. The tag value is an ISO 8601 duration in the format PT#M#S, in which the letters PT indicate that the value specifies a period of time, and the letters M and S refer to length in minutes and seconds, respectively. The # characters preceding the M and S letters are both integers that specify the number of minutes (or seconds) of the video. For example, a value of PT15M51S indicates that the video is 15 minutes and 51 seconds long.",
        type: "string",
      } as const,
      hasCustomThumbnail: {
        description:
          "Indicates whether the video uploader has provided a custom thumbnail image for the video. This property is only visible to the video uploader.",
        type: "boolean",
      } as const,
      licensedContent: {
        description:
          "The value of is_license_content indicates whether the video is licensed content.",
        type: "boolean",
      } as const,
      projection: {
        description: "Specifies the projection format of the video.",
        enum: ["rectangular", "360"],
        type: "string",
      } as const,
      regionRestriction: VideoContentDetailsRegionRestriction,
    },
    type: "object",
  }) as const

const VideoContentDetailsRegionRestriction = () =>
  ({
    description: "DEPRECATED Region restriction of the video.",
    properties: {
      allowed: {
        description:
          "A list of region codes that identify countries where the video is viewable. If this property is present and a country is not listed in its value, then the video is blocked from appearing in that country. If this property is present and contains an empty list, the video is blocked in all countries.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      blocked: {
        description:
          "A list of region codes that identify countries where the video is blocked. If this property is present and a country is not listed in its value, then the video is viewable in that country. If this property is present and contains an empty list, the video is viewable in all countries.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const VideoFileDetails = () =>
  ({
    description:
      "Describes original video file properties, including technical details about audio and video streams, but also metadata information like content length, digitization time, or geotagging information.",
    properties: {
      audioStreams: {
        description:
          "A list of audio streams contained in the uploaded video file. Each item in the list contains detailed metadata about an audio stream.",
        items: VideoFileDetailsAudioStream,
        type: "array",
      } as const,
      bitrateBps: {
        description:
          "The uploaded video file's combined (video and audio) bitrate in bits per second.",
        format: "uint64",
        type: "string",
      } as const,
      container: {
        description: "The uploaded video file's container format.",
        type: "string",
      } as const,
      creationTime: {
        description:
          "The date and time when the uploaded video file was created. The value is specified in ISO 8601 format. Currently, the following ISO 8601 formats are supported: - Date only: YYYY-MM-DD - Naive time: YYYY-MM-DDTHH:MM:SS - Time with timezone: YYYY-MM-DDTHH:MM:SS+HH:MM ",
        type: "string",
      } as const,
      durationMs: {
        description: "The length of the uploaded video in milliseconds.",
        format: "uint64",
        type: "string",
      } as const,
      fileName: {
        description:
          "The uploaded file's name. This field is present whether a video file or another type of file was uploaded.",
        type: "string",
      } as const,
      fileSize: {
        description:
          "The uploaded file's size in bytes. This field is present whether a video file or another type of file was uploaded.",
        format: "uint64",
        type: "string",
      } as const,
      fileType: {
        description:
          "The uploaded file's type as detected by YouTube's video processing engine. Currently, YouTube only processes video files, but this field is present whether a video file or another type of file was uploaded.",
        enum: [
          "video",
          "audio",
          "image",
          "archive",
          "document",
          "project",
          "other",
        ],
        type: "string",
      } as const,
      videoStreams: {
        description:
          "A list of video streams contained in the uploaded video file. Each item in the list contains detailed metadata about a video stream.",
        items: VideoFileDetailsVideoStream,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const VideoFileDetailsAudioStream = () =>
  ({
    description: "Information about an audio stream.",
    properties: {
      bitrateBps: {
        description: "The audio stream's bitrate, in bits per second.",
        format: "uint64",
        type: "string",
      } as const,
      channelCount: {
        description: "The number of audio channels that the stream contains.",
        format: "uint32",
        type: "integer",
      } as const,
      codec: {
        description: "The audio codec that the stream uses.",
        type: "string",
      } as const,
      vendor: {
        description:
          "A value that uniquely identifies a video vendor. Typically, the value is a four-letter vendor code.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoFileDetailsVideoStream = () =>
  ({
    description: "Information about a video stream.",
    properties: {
      aspectRatio: {
        description:
          "The video content's display aspect ratio, which specifies the aspect ratio in which the video should be displayed.",
        format: "double",
        type: "number",
      } as const,
      bitrateBps: {
        description: "The video stream's bitrate, in bits per second.",
        format: "uint64",
        type: "string",
      } as const,
      codec: {
        description: "The video codec that the stream uses.",
        type: "string",
      } as const,
      frameRateFps: {
        description: "The video stream's frame rate, in frames per second.",
        format: "double",
        type: "number",
      } as const,
      heightPixels: {
        description: "The encoded video content's height in pixels.",
        format: "uint32",
        type: "integer",
      } as const,
      rotation: {
        description:
          "The amount that YouTube needs to rotate the original source content to properly display the video.",
        enum: ["none", "clockwise", "upsideDown", "counterClockwise", "other"],
        type: "string",
      } as const,
      vendor: {
        description:
          "A value that uniquely identifies a video vendor. Typically, the value is a four-letter vendor code.",
        type: "string",
      } as const,
      widthPixels: {
        description:
          "The encoded video content's width in pixels. You can calculate the video's encoding aspect ratio as width_pixels / height_pixels.",
        format: "uint32",
        type: "integer",
      } as const,
    },
    type: "object",
  }) as const

const VideoGetRatingResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        description: "A list of ratings that match the request criteria.",
        items: VideoRating,
        type: "array",
      } as const,
      kind: {
        default: "youtube#videoGetRatingResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#videoGetRatingResponse".',
        type: "string",
      } as const,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoListResponse = () =>
  ({
    properties: {
      etag: {
        description: "Etag of this resource.",
        type: "string",
      } as const,
      eventId: {
        description:
          "Serialized EventId of the request which produced this response.",
        type: "string",
      } as const,
      items: {
        items: Video,
        type: "array",
      } as const,
      kind: {
        default: "youtube#videoListResponse",
        description:
          'Identifies what kind of resource this is. Value: the fixed string "youtube#videoListResponse".',
        type: "string",
      } as const,
      nextPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the next page in the result set.",
        type: "string",
      } as const,
      pageInfo: PageInfo,
      prevPageToken: {
        description:
          "The token that can be used as the value of the pageToken parameter to retrieve the previous page in the result set.",
        type: "string",
      } as const,
      tokenPagination: TokenPagination,
      visitorId: {
        description: "The visitorId identifies the visitor.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoLiveStreamingDetails = () =>
  ({
    description: "Details about the live streaming metadata.",
    properties: {
      activeLiveChatId: {
        description:
          "The ID of the currently active live chat attached to this video. This field is filled only if the video is a currently live broadcast that has live chat. Once the broadcast transitions to complete this field will be removed and the live chat closed down. For persistent broadcasts that live chat id will no longer be tied to this video but rather to the new video being displayed at the persistent page.",
        type: "string",
      } as const,
      actualEndTime: {
        description:
          "The time that the broadcast actually ended. This value will not be available until the broadcast is over.",
        format: "date-time",
        type: "string",
      } as const,
      actualStartTime: {
        description:
          "The time that the broadcast actually started. This value will not be available until the broadcast begins.",
        format: "date-time",
        type: "string",
      } as const,
      concurrentViewers: {
        description:
          "The number of viewers currently watching the broadcast. The property and its value will be present if the broadcast has current viewers and the broadcast owner has not hidden the viewcount for the video. Note that YouTube stops tracking the number of concurrent viewers for a broadcast when the broadcast ends. So, this property would not identify the number of viewers watching an archived video of a live broadcast that already ended.",
        format: "uint64",
        type: "string",
      } as const,
      scheduledEndTime: {
        description:
          "The time that the broadcast is scheduled to end. If the value is empty or the property is not present, then the broadcast is scheduled to contiue indefinitely.",
        format: "date-time",
        type: "string",
      } as const,
      scheduledStartTime: {
        description: "The time that the broadcast is scheduled to begin.",
        format: "date-time",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoLocalization = () =>
  ({
    description: "Localized versions of certain video properties (e.g. title).",
    properties: {
      description: {
        description: "Localized version of the video's description.",
        type: "string",
      } as const,
      title: {
        description: "Localized version of the video's title.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoMonetizationDetails = () =>
  ({
    description: "Details about monetization of a YouTube Video.",
    properties: {
      access: AccessPolicy,
    },
    type: "object",
  }) as const

const VideoPlayer = () =>
  ({
    description: "Player to be used for a video playback.",
    properties: {
      embedHeight: {
        format: "int64",
        type: "string",
      } as const,
      embedHtml: {
        description:
          "An <iframe> tag that embeds a player that will play the video.",
        type: "string",
      } as const,
      embedWidth: {
        description: "The embed width",
        format: "int64",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoProcessingDetails = () =>
  ({
    description:
      "Describes processing status and progress and availability of some other Video resource parts.",
    properties: {
      editorSuggestionsAvailability: {
        description:
          "This value indicates whether video editing suggestions, which might improve video quality or the playback experience, are available for the video. You can retrieve these suggestions by requesting the suggestions part in your videos.list() request.",
        type: "string",
      } as const,
      fileDetailsAvailability: {
        description:
          "This value indicates whether file details are available for the uploaded video. You can retrieve a video's file details by requesting the fileDetails part in your videos.list() request.",
        type: "string",
      } as const,
      processingFailureReason: {
        description:
          "The reason that YouTube failed to process the video. This property will only have a value if the processingStatus property's value is failed.",
        enum: ["uploadFailed", "transcodeFailed", "streamingFailed", "other"],
        type: "string",
      } as const,
      processingIssuesAvailability: {
        description:
          "This value indicates whether the video processing engine has generated suggestions that might improve YouTube's ability to process the the video, warnings that explain video processing problems, or errors that cause video processing problems. You can retrieve these suggestions by requesting the suggestions part in your videos.list() request.",
        type: "string",
      } as const,
      processingProgress: VideoProcessingDetailsProcessingProgress,
      processingStatus: {
        description:
          "The video's processing status. This value indicates whether YouTube was able to process the video or if the video is still being processed.",
        enum: ["processing", "succeeded", "failed", "terminated"],
        type: "string",
      } as const,
      tagSuggestionsAvailability: {
        description:
          "This value indicates whether keyword (tag) suggestions are available for the video. Tags can be added to a video's metadata to make it easier for other users to find the video. You can retrieve these suggestions by requesting the suggestions part in your videos.list() request.",
        type: "string",
      } as const,
      thumbnailsAvailability: {
        description:
          "This value indicates whether thumbnail images have been generated for the video.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoProcessingDetailsProcessingProgress = () =>
  ({
    description: "Video processing progress and completion time estimate.",
    properties: {
      partsProcessed: {
        description:
          "The number of parts of the video that YouTube has already processed. You can estimate the percentage of the video that YouTube has already processed by calculating: 100 * parts_processed / parts_total Note that since the estimated number of parts could increase without a corresponding increase in the number of parts that have already been processed, it is possible that the calculated progress could periodically decrease while YouTube processes a video.",
        format: "uint64",
        type: "string",
      } as const,
      partsTotal: {
        description:
          "An estimate of the total number of parts that need to be processed for the video. The number may be updated with more precise estimates while YouTube processes the video.",
        format: "uint64",
        type: "string",
      } as const,
      timeLeftMs: {
        description:
          "An estimate of the amount of time, in millseconds, that YouTube needs to finish processing the video.",
        format: "uint64",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoProjectDetails = () =>
  ({
    description:
      "DEPRECATED. b/157517979: This part was never populated after it was added. However, it sees non-zero traffic because there is generated client code in the wild that refers to it [1]. We keep this field and do NOT remove it because otherwise V3 would return an error when this part gets requested [2]. [1] https://developers.google.com/resources/api-libraries/documentation/youtube/v3/csharp/latest/classGoogle_1_1Apis_1_1YouTube_1_1v3_1_1Data_1_1VideoProjectDetails.html [2] http://google3/video/youtube/src/python/servers/data_api/common.py?l=1565-1569&rcl=344141677",
    properties: {},
    type: "object",
  }) as const

const VideoRating = () =>
  ({
    description: "Basic details about rating of a video.",
    properties: {
      rating: {
        description: "Rating of a video.",
        enum: ["none", "like", "dislike"],
        type: "string",
      } as const,
      videoId: {
        description: "The ID that YouTube uses to uniquely identify the video.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoRecordingDetails = () =>
  ({
    description: "Recording information associated with the video.",
    properties: {
      location: GeoPoint,
      locationDescription: {
        description:
          "The text description of the location where the video was recorded.",
        type: "string",
      } as const,
      recordingDate: {
        description: "The date and time when the video was recorded.",
        format: "date-time",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoSnippet = () =>
  ({
    description:
      "Basic details about a video, including title, description, uploader, thumbnails and category.",
    properties: {
      categoryId: {
        description: "The YouTube video category associated with the video.",
        type: "string",
      } as const,
      channelId: {
        description:
          "The ID that YouTube uses to uniquely identify the channel that the video was uploaded to.",
        type: "string",
      } as const,
      channelTitle: {
        description: "Channel title for the channel that the video belongs to.",
        type: "string",
      } as const,
      defaultAudioLanguage: {
        description:
          "The default_audio_language property specifies the language spoken in the video's default audio track.",
        type: "string",
      } as const,
      defaultLanguage: {
        description: "The language of the videos's default snippet.",
        type: "string",
      } as const,
      description: {
        description:
          "The video's description. @mutable youtube.videos.insert youtube.videos.update",
        type: "string",
      } as const,
      liveBroadcastContent: {
        description:
          'Indicates if the video is an upcoming/active live broadcast. Or it\'s "none" if the video is not an upcoming/active live broadcast.',
        enum: ["none", "upcoming", "live", "completed"],
        type: "string",
      } as const,
      localized: VideoLocalization,
      publishedAt: {
        description: "The date and time when the video was uploaded.",
        format: "date-time",
        type: "string",
      } as const,
      tags: {
        description:
          "A list of keyword tags associated with the video. Tags may contain spaces.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      thumbnails: ThumbnailDetails,
      title: {
        description:
          "The video's title. @mutable youtube.videos.insert youtube.videos.update",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoStatistics = () =>
  ({
    description:
      "Statistics about the video, such as the number of times the video was viewed or liked.",
    properties: {
      commentCount: {
        description: "The number of comments for the video.",
        format: "uint64",
        type: "string",
      } as const,
      dislikeCount: {
        description:
          "The number of users who have indicated that they disliked the video by giving it a negative rating.",
        format: "uint64",
        type: "string",
      } as const,
      favoriteCount: {
        description:
          "The number of users who currently have the video marked as a favorite video.",
        format: "uint64",
        type: "string",
      } as const,
      likeCount: {
        description:
          "The number of users who have indicated that they liked the video by giving it a positive rating.",
        format: "uint64",
        type: "string",
      } as const,
      viewCount: {
        description: "The number of times the video has been viewed.",
        format: "uint64",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoStatus = () =>
  ({
    description:
      "Basic details about a video category, such as its localized title. Next Id: 18",
    properties: {
      embeddable: {
        description:
          "This value indicates if the video can be embedded on another website. @mutable youtube.videos.insert youtube.videos.update",
        type: "boolean",
      } as const,
      failureReason: {
        description:
          "This value explains why a video failed to upload. This property is only present if the uploadStatus property indicates that the upload failed.",
        enum: [
          "conversion",
          "invalidFile",
          "emptyFile",
          "tooSmall",
          "codec",
          "uploadAborted",
        ],
        type: "string",
      } as const,
      license: {
        description:
          "The video's license. @mutable youtube.videos.insert youtube.videos.update",
        enum: ["youtube", "creativeCommon"],
        type: "string",
      } as const,
      madeForKids: {
        type: "boolean",
      } as const,
      privacyStatus: {
        description: "The video's privacy status.",
        enum: ["public", "unlisted", "private"],
        type: "string",
      } as const,
      publicStatsViewable: {
        description:
          "This value indicates if the extended video statistics on the watch page can be viewed by everyone. Note that the view count, likes, etc will still be visible if this is disabled. @mutable youtube.videos.insert youtube.videos.update",
        type: "boolean",
      } as const,
      publishAt: {
        description:
          "The date and time when the video is scheduled to publish. It can be set only if the privacy status of the video is private..",
        format: "date-time",
        type: "string",
      } as const,
      rejectionReason: {
        description:
          "This value explains why YouTube rejected an uploaded video. This property is only present if the uploadStatus property indicates that the upload was rejected.",
        enum: [
          "copyright",
          "inappropriate",
          "duplicate",
          "termsOfUse",
          "uploaderAccountSuspended",
          "length",
          "claim",
          "uploaderAccountClosed",
          "trademark",
          "legal",
        ],
        type: "string",
      } as const,
      selfDeclaredMadeForKids: {
        type: "boolean",
      } as const,
      uploadStatus: {
        description: "The status of the uploaded video.",
        enum: ["uploaded", "processed", "failed", "rejected", "deleted"],
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoSuggestions = () =>
  ({
    description:
      "Specifies suggestions on how to improve video content, including encoding hints, tag suggestions, and editor suggestions.",
    properties: {
      editorSuggestions: {
        description:
          "A list of video editing operations that might improve the video quality or playback experience of the uploaded video.",
        items: {
          enum: [
            "videoAutoLevels",
            "videoStabilize",
            "videoCrop",
            "audioQuietAudioSwap",
          ],
          type: "string",
        } as const,
        type: "array",
      } as const,
      processingErrors: {
        description:
          "A list of errors that will prevent YouTube from successfully processing the uploaded video video. These errors indicate that, regardless of the video's current processing status, eventually, that status will almost certainly be failed.",
        items: {
          enum: [
            "audioFile",
            "imageFile",
            "projectFile",
            "notAVideoFile",
            "docFile",
            "archiveFile",
            "unsupportedSpatialAudioLayout",
          ],
          type: "string",
        } as const,
        type: "array",
      } as const,
      processingHints: {
        description:
          "A list of suggestions that may improve YouTube's ability to process the video.",
        items: {
          enum: [
            "nonStreamableMov",
            "sendBestQualityVideo",
            "sphericalVideo",
            "spatialAudio",
            "vrVideo",
            "hdrVideo",
          ],
          type: "string",
        } as const,
        type: "array",
      } as const,
      processingWarnings: {
        description:
          "A list of reasons why YouTube may have difficulty transcoding the uploaded video or that might result in an erroneous transcoding. These warnings are generated before YouTube actually processes the uploaded video file. In addition, they identify issues that are unlikely to cause the video processing to fail but that might cause problems such as sync issues, video artifacts, or a missing audio track.",
        items: {
          enum: [
            "unknownContainer",
            "unknownVideoCodec",
            "unknownAudioCodec",
            "inconsistentResolution",
            "hasEditlist",
            "problematicVideoCodec",
            "problematicAudioCodec",
            "unsupportedVrStereoMode",
            "unsupportedSphericalProjectionType",
            "unsupportedHdrPixelFormat",
            "unsupportedHdrColorMetadata",
            "problematicHdrLookupTable",
          ],
          type: "string",
        } as const,
        type: "array",
      } as const,
      tagSuggestions: {
        description:
          "A list of keyword tags that could be added to the video's metadata to increase the likelihood that users will locate your video when searching or browsing on YouTube.",
        items: VideoSuggestionsTagSuggestion,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const VideoSuggestionsTagSuggestion = () =>
  ({
    description: "A single tag suggestion with it's relevance information.",
    properties: {
      categoryRestricts: {
        description:
          "A set of video categories for which the tag is relevant. You can use this information to display appropriate tag suggestions based on the video category that the video uploader associates with the video. By default, tag suggestions are relevant for all categories if there are no restricts defined for the keyword.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      tag: {
        description: "The keyword tag suggested for the video.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const VideoTopicDetails = () =>
  ({
    description: "Freebase topic information related to the video.",
    properties: {
      relevantTopicIds: {
        description:
          "Similar to topic_id, except that these topics are merely relevant to the video. These are topics that may be mentioned in, or appear in the video. You can retrieve information about each topic using Freebase Topic API.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      topicCategories: {
        description:
          "A list of Wikipedia URLs that provide a high-level description of the video's content.",
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
      topicIds: {
        description:
          'A list of Freebase topic IDs that are centrally associated with the video. These are topics that are centrally featured in the video, and it can be said that the video is mainly about each of these. You can retrieve information about each topic using the < a href="http://wiki.freebase.com/wiki/Topic_API">Freebase Topic API.',
        items: {
          type: "string",
        } as const,
        type: "array",
      } as const,
    },
    type: "object",
  }) as const

const WatchSettings = () =>
  ({
    description: "Branding properties for the watch. All deprecated.",
    properties: {
      backgroundColor: {
        description: "The text color for the video watch page's branded area.",
        type: "string",
      } as const,
      featuredPlaylistId: {
        description:
          "An ID that uniquely identifies a playlist that displays next to the video player.",
        type: "string",
      } as const,
      textColor: {
        description:
          "The background color for the video watch page's branded area.",
        type: "string",
      } as const,
    },
    type: "object",
  }) as const

const tags = declareTags({
  abuseReports: {},
  activities: {},
  captions: {},
  channelBanners: {},
  channels: {},
  channelSections: {},
  comments: {},
  commentThreads: {},
  i18nLanguages: {},
  i18nRegions: {},
  liveBroadcasts: {},
  liveChatBans: {},
  liveChatMessages: {},
  liveChatModerators: {},
  liveStreams: {},
  members: {},
  membershipsLevels: {},
  playlistItems: {},
  playlists: {},
  search: {},
  subscriptions: {},
  superChatEvents: {},
  tests: {},
  thirdPartyLinks: {},
  thumbnails: {},
  videoAbuseReportReasons: {},
  videoCategories: {},
  videos: {},
  watermarks: {},
  youtube: {},
} as const)

const __xgafv = named(
  "_.xgafv",
  queryParam({
    description: "V1 error format.",
    in: "query",
    name: "$.xgafv",
    schema: {
      enum: ["1", "2"],
      type: "string",
    } as const,
  }),
)

const access_token = named(
  "access_token",
  queryParam({
    description: "OAuth access token.",
    in: "query",
    name: "access_token",
    schema: {
      type: "string",
    } as const,
  }),
)

const alt = named(
  "alt",
  queryParam({
    description: "Data format for response.",
    in: "query",
    name: "alt",
    schema: {
      enum: ["json", "media", "proto"],
      type: "string",
    } as const,
  }),
)

const callback = named(
  "callback",
  queryParam({
    description: "JSONP",
    in: "query",
    name: "callback",
    schema: {
      type: "string",
    } as const,
  }),
)

const fields = named(
  "fields",
  queryParam({
    description:
      "Selector specifying which fields to include in a partial response.",
    in: "query",
    name: "fields",
    schema: {
      type: "string",
    } as const,
  }),
)

const key = named(
  "key",
  queryParam({
    description:
      "API key. Your API key identifies your project and provides you with API access, quota, and reports. Required unless you provide an OAuth 2.0 token.",
    in: "query",
    name: "key",
    schema: {
      type: "string",
    } as const,
  }),
)

const oauth_token = named(
  "oauth_token",
  queryParam({
    description: "OAuth 2.0 token for the current user.",
    in: "query",
    name: "oauth_token",
    schema: {
      type: "string",
    } as const,
  }),
)

const prettyPrint = named(
  "prettyPrint",
  queryParam({
    description: "Returns response with indentations and line breaks.",
    in: "query",
    name: "prettyPrint",
    schema: {
      type: "boolean",
    } as const,
  }),
)

const quotaUser = named(
  "quotaUser",
  queryParam({
    description:
      "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
    in: "query",
    name: "quotaUser",
    schema: {
      type: "string",
    } as const,
  }),
)

const uploadType = named(
  "uploadType",
  queryParam({
    description:
      'Legacy upload protocol for media (e.g. "media", "multipart").',
    in: "query",
    name: "uploadType",
    schema: {
      type: "string",
    } as const,
  }),
)

const upload_protocol = named(
  "upload_protocol",
  queryParam({
    description: 'Upload protocol for media (e.g. "raw", "multipart").',
    in: "query",
    name: "upload_protocol",
    schema: {
      type: "string",
    } as const,
  }),
)

export default responsibleAPI({
  partialDoc: {
    openapi: "3.0.0",
    info: {
      contact: {
        name: "Google",
        url: "https://google.com",
        "x-twitter": "youtube",
      },
      description:
        "The YouTube Data API v3 is an API that provides access to YouTube data, such as videos, playlists, and channels.",
      license: {
        name: "Creative Commons Attribution 3.0",
        url: "http://creativecommons.org/licenses/by/3.0/",
      },
      termsOfService: "https://developers.google.com/terms/",
      title: "YouTube Data API v3",
      version: "v3",
      "x-apiClientRegistration": {
        url: "https://console.developers.google.com",
      },
      "x-apisguru-categories": ["analytics", "media"],
      "x-logo": {
        url: "https://api.apis.guru/v2/cache/logo/https_www.google.com_images_branding_googlelogo_2x_googlelogo_color_272x92dp.png",
      },
      "x-origin": [
        {
          format: "google",
          url: "https://youtube.googleapis.com/$discovery/rest?version=v3",
          version: "v1",
        },
      ],
      "x-providerName": "googleapis.com",
      "x-serviceName": "youtube",
    },
    externalDocs: {
      url: "https://developers.google.com/youtube/",
    },
    servers: [
      {
        url: "https://youtube.googleapis.com/",
      },
    ],
    tags: Object.values(tags),
  },
  forAll: {
    req: {
      params: [
        __xgafv,
        access_token,
        alt,
        callback,
        fields,
        key,
        oauth_token,
        prettyPrint,
        quotaUser,
        uploadType,
        upload_protocol,
      ],
    },
  },
  routes: {
    "/youtube/v3/abuseReports": POST({
      description: "Inserts a new resource into this collection.",
      id: "youtube.abuseReports.insert",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
        ),
        body: {
          "application/json": AbuseReport,
        } as const,
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": AbuseReport,
          } as const,
        }),
      },
      tags: [tags.abuseReports],
    } as const),
    "/youtube/v3/activities": GET({
      description: "Retrieves a list of resources, possibly filtered.",
      id: "youtube.activities.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies a comma-separated list of one or more activity resource properties that the API response will include. If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in an activity resource, the snippet property contains other properties that identify the type of activity, a display title for the activity, and so forth. If you set *part=snippet*, the API response will also contain all of those nested properties.",
          } as const,
          "channelId?": {
            type: "string",
          } as const,
          "home?": {
            type: "boolean",
          } as const,
          "maxResults?": {
            maximum: 50,
            minimum: 0,
            type: "integer",
            description:
              "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
          } as const,
          "mine?": {
            type: "boolean",
          } as const,
          "pageToken?": {
            type: "string",
            description:
              "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
          } as const,
          "publishedAfter?": {
            type: "string",
          } as const,
          "publishedBefore?": {
            type: "string",
          } as const,
          "regionCode?": {
            type: "string",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": ActivityListResponse,
          } as const,
        }),
      },
      tags: [tags.activities],
    } as const),
    "/youtube/v3/captions": scope({
      forAll: {
        tags: [tags.captions],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.captions.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
            "onBehalfOf?": {
              type: "string",
              description:
                "ID of the Google+ Page for the channel that the request is be on behalf of",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.captions.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more caption resource parts that the API response will include. The part names that you can include in the parameter value are id and snippet.",
            } as const,
            videoId: {
              type: "string",
              description: "Returns the captions for the specified video.",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Returns the captions with the given IDs for Stubby or Apiary.",
            } as const,
            "onBehalfOf?": {
              type: "string",
              description:
                "ID of the Google+ Page for the channel that the request is on behalf of.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": CaptionListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.captions.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies the caption resource parts that the API response will include. Set the parameter value to snippet.",
            } as const,
            "onBehalfOf?": {
              type: "string",
              description:
                "ID of the Google+ Page for the channel that the request is be on behalf of",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "sync?": {
              type: "boolean",
              description:
                "Extra parameter to allow automatically syncing the uploaded caption/transcript with the audio.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/octet-stream": Caption,
            "text/xml": Caption,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Caption,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.captions.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more caption resource parts that the API response will include. The part names that you can include in the parameter value are id and snippet.",
            } as const,
            "onBehalfOf?": {
              type: "string",
              description:
                "ID of the Google+ Page for the channel that the request is on behalf of.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "sync?": {
              type: "boolean",
              description:
                "Extra parameter to allow automatically syncing the uploaded caption/transcript with the audio.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/octet-stream": Caption,
            "text/xml": Caption,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Caption,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/captions/{id}": GET({
      description: "Downloads a caption track.",
      id: "youtube.captions.download",
      req: {
        pathParams: {
          id: {
            type: "string",
            description:
              "The ID of the caption track to download, required for One Platform.",
          } as const,
        },
        query: {
          "onBehalfOf?": {
            type: "string",
            description:
              "ID of the Google+ Page for the channel that the request is be on behalf of",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
          "tfmt?": {
            type: "string",
            description:
              "Convert the captions into this format. Supported options are sbv, srt, and vtt.",
          } as const,
          "tlang?": {
            type: "string",
            description:
              "tlang is the language code; machine translate the captions into this language.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
        }),
      },
      tags: [tags.captions],
    } as const),
    "/youtube/v3/channelBanners/insert": POST({
      description: "Inserts a new resource into this collection.",
      id: "youtube.channelBanners.insert",
      req: {
        query: {
          "channelId?": {
            type: "string",
            description:
              "Unused, channel_id is currently derived from the security context of the requestor.",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
          "onBehalfOfContentOwnerChannel?": {
            type: "string",
            description:
              "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.upload",
        ),
        body: {
          "application/octet-stream": ChannelBannerResource,
          "image/jpeg": ChannelBannerResource,
          "image/png": ChannelBannerResource,
        } as const,
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": ChannelBannerResource,
          } as const,
        }),
      },
      tags: [tags.channelBanners],
    } as const),
    "/youtube/v3/channelSections": scope({
      forAll: {
        tags: [tags.channelSections],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.channelSections.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.channelSections.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more channelSection resource properties that the API response will include. The part names that you can include in the parameter value are id, snippet, and contentDetails. If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a channelSection resource, the snippet property contains other properties, such as a display title for the channelSection. If you set *part=snippet*, the API response will also contain all of those nested properties.",
            } as const,
            "channelId?": {
              type: "string",
              description:
                "Return the ChannelSections owned by the specified channel ID.",
            } as const,
            "hl?": {
              type: "string",
              description: "Return content in specified language",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Return the ChannelSections with the given IDs for Stubby or Apiary.",
            } as const,
            "mine?": {
              type: "boolean",
              description:
                "Return the ChannelSections owned by the authenticated user.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": ChannelSectionListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.channelSections.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. The part names that you can include in the parameter value are snippet and contentDetails.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": ChannelSection,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": ChannelSection,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.channelSections.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. The part names that you can include in the parameter value are snippet and contentDetails.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": ChannelSection,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": ChannelSection,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/channels": scope({
      forAll: {
        tags: [tags.channels],
      },
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.channels.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more channel resource properties that the API response will include. If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a channel resource, the contentDetails property contains other properties, such as the uploads properties. As such, if you set *part=contentDetails*, the API response will also contain all of those nested properties.",
            } as const,
            "categoryId?": {
              type: "string",
              description:
                "Return the channels within the specified guide category ID.",
            } as const,
            "forUsername?": {
              type: "string",
              description:
                "Return the channel associated with a YouTube username.",
            } as const,
            "hl?": {
              type: "string",
              description:
                'Stands for "host language". Specifies the localization language of the metadata to be filled into snippet.localized. The field is filled with the default metadata if there is no localization in the specified language. The parameter value must be a language code included in the list returned by the i18nLanguages.list method (e.g. en_US, es_MX).',
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description: "Return the channels with the specified IDs.",
            } as const,
            "managedByMe?": {
              type: "boolean",
              description:
                "Return the channels managed by the authenticated user.",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 0,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "mine?": {
              type: "boolean",
              description:
                "Return the ids of channels owned by the authenticated user.",
            } as const,
            "mySubscribers?": {
              type: "boolean",
              description:
                "Return the channels subscribed to the authenticated user",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtubepartner",
            "https://www.googleapis.com/auth/youtubepartner-channel-audit",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": ChannelListResponse,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.channels.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. The API currently only allows the parameter value to be set to either brandingSettings or invideoPromotion. (You cannot update both of those parts with a single request.) Note that this method overrides the existing values for all of the mutable properties that are contained in any parts that the parameter value specifies.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "The *onBehalfOfContentOwner* parameter indicates that the authenticated user is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with needs to be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": Channel,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Channel,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/commentThreads": scope({
      forAll: {
        tags: [tags.commentThreads],
      },
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.commentThreads.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more commentThread resource properties that the API response will include.",
            } as const,
            "allThreadsRelatedToChannelId?": {
              type: "string",
              description:
                "Returns the comment threads of all videos of the channel and the channel comments as well.",
            } as const,
            "channelId?": {
              type: "string",
              description:
                "Returns the comment threads for all the channel comments (ie does not include comments left on videos).",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Returns the comment threads with the given IDs for Stubby or Apiary.",
            } as const,
            "maxResults?": {
              maximum: 100,
              minimum: 1,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "moderationStatus?": {
              enum: ["published", "heldForReview", "likelySpam", "rejected"],
              type: "string",
              description:
                "Limits the returned comment threads to those with the specified moderation status. Not compatible with the 'id' filter. Valid values: published, heldForReview, likelySpam.",
            } as const,
            "order?": {
              enum: ["orderUnspecified", "time", "relevance"],
              type: "string",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
            "searchTerms?": {
              type: "string",
              description:
                "Limits the returned comment threads to those matching the specified key words. Not compatible with the 'id' filter.",
            } as const,
            "textFormat?": {
              enum: ["textFormatUnspecified", "html", "plainText"],
              type: "string",
              description:
                "The requested text format for the returned comments.",
            } as const,
            "videoId?": {
              type: "string",
              description:
                "Returns the comment threads of the specified video.",
            } as const,
          },
          security: youtubeScope(
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": CommentThreadListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.commentThreads.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter identifies the properties that the API response will include. Set the parameter value to snippet. The snippet part has a quota cost of 2 units.",
            } as const,
          },
          security: youtubeScope(
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": CommentThread,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": CommentThread,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.youtube.v3.updateCommentThreads",
        req: {
          query: {
            "part?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of commentThread resource properties that the API response will include. You must at least include the snippet part in the parameter value since that part contains all of the properties that the API request can update.",
            } as const,
          },
          body: {
            "application/json": CommentThread,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": CommentThread,
            } as const,
          }),
        },
        tags: [tags.youtube],
      } as const,
    }),
    "/youtube/v3/comments": scope({
      forAll: {
        tags: [tags.comments],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.comments.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
          },
          security: youtubeScope(
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.comments.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more comment resource properties that the API response will include.",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Returns the comments with the given IDs for One Platform.",
            } as const,
            "maxResults?": {
              maximum: 100,
              minimum: 1,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
            "parentId?": {
              type: "string",
              description:
                "Returns replies to the specified comment. Note, currently YouTube features only one level of replies (ie replies to top level comments). However replies to replies may be supported in the future.",
            } as const,
            "textFormat?": {
              enum: ["textFormatUnspecified", "html", "plainText"],
              type: "string",
              description:
                "The requested text format for the returned comments.",
            } as const,
          },
          security: youtubeScope(
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": CommentListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.comments.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter identifies the properties that the API response will include. Set the parameter value to snippet. The snippet part has a quota cost of 2 units.",
            } as const,
          },
          security: youtubeScope(
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": Comment,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Comment,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.comments.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter identifies the properties that the API response will include. You must at least include the snippet part in the parameter value since that part contains all of the properties that the API request can update.",
            } as const,
          },
          security: youtubeScope(
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": Comment,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Comment,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/comments/markAsSpam": POST({
      description:
        "Expresses the caller's opinion that one or more comments should be flagged as spam.",
      id: "youtube.comments.markAsSpam",
      req: {
        query: {
          id: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "Flags the comments with the given IDs as spam in the caller's opinion.",
          } as const,
        },
        security: youtubeScope(
          "https://www.googleapis.com/auth/youtube.force-ssl",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
        }),
      },
      tags: [tags.comments],
    } as const),
    "/youtube/v3/comments/setModerationStatus": POST({
      description: "Sets the moderation status of one or more comments.",
      id: "youtube.comments.setModerationStatus",
      req: {
        query: {
          id: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "Modifies the moderation status of the comments with the given IDs",
          } as const,
          moderationStatus: {
            enum: ["published", "heldForReview", "likelySpam", "rejected"],
            type: "string",
            description:
              "Specifies the requested moderation status. Note, comments can be in statuses, which are not available through this call. For example, this call does not allow to mark a comment as 'likely spam'. Valid values: MODERATION_STATUS_PUBLISHED, MODERATION_STATUS_HELD_FOR_REVIEW, MODERATION_STATUS_REJECTED.",
          } as const,
          "banAuthor?": {
            type: "boolean",
            description:
              "If set to true the author of the comment gets added to the ban list. This means all future comments of the author will autmomatically be rejected. Only valid in combination with STATUS_REJECTED.",
          } as const,
        },
        security: youtubeScope(
          "https://www.googleapis.com/auth/youtube.force-ssl",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
        }),
      },
      tags: [tags.comments],
    } as const),
    "/youtube/v3/i18nLanguages": GET({
      description: "Retrieves a list of resources, possibly filtered.",
      id: "youtube.i18nLanguages.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies the i18nLanguage resource properties that the API response will include. Set the parameter value to snippet.",
          } as const,
          "hl?": {
            type: "string",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": I18nLanguageListResponse,
          } as const,
        }),
      },
      tags: [tags.i18nLanguages],
    } as const),
    "/youtube/v3/i18nRegions": GET({
      description: "Retrieves a list of resources, possibly filtered.",
      id: "youtube.i18nRegions.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies the i18nRegion resource properties that the API response will include. Set the parameter value to snippet.",
          } as const,
          "hl?": {
            type: "string",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": I18nRegionListResponse,
          } as const,
        }),
      },
      tags: [tags.i18nRegions],
    } as const),
    "/youtube/v3/liveBroadcasts": scope({
      forAll: {
        tags: [tags.liveBroadcasts],
      },
      DELETE: {
        description: "Delete a given broadcast.",
        id: "youtube.liveBroadcasts.delete",
        req: {
          query: {
            id: {
              type: "string",
              description: "Broadcast to delete.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description:
          "Retrieve the list of broadcasts associated with the given channel.",
        id: "youtube.liveBroadcasts.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more liveBroadcast resource properties that the API response will include. The part names that you can include in the parameter value are id, snippet, contentDetails, status and statistics.",
            } as const,
            "broadcastStatus?": {
              enum: [
                "broadcastStatusFilterUnspecified",
                "all",
                "active",
                "upcoming",
                "completed",
              ],
              type: "string",
              description:
                "Return broadcasts with a certain status, e.g. active broadcasts.",
            } as const,
            "broadcastType?": {
              enum: [
                "broadcastTypeFilterUnspecified",
                "all",
                "event",
                "persistent",
              ],
              type: "string",
              description: "Return only broadcasts with the selected type.",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Return broadcasts with the given ids from Stubby or Apiary.",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 0,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "mine?": {
              type: "boolean",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveBroadcastListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new stream for the authenticated user.",
        id: "youtube.liveBroadcasts.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. The part properties that you can include in the parameter value are id, snippet, contentDetails, and status.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": LiveBroadcast,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveBroadcast,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description:
          "Updates an existing broadcast for the authenticated user.",
        id: "youtube.liveBroadcasts.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. The part properties that you can include in the parameter value are id, snippet, contentDetails, and status. Note that this method will override the existing values for all of the mutable properties that are contained in any parts that the parameter value specifies. For example, a broadcast's privacy status is defined in the status part. As such, if your request is updating a private or unlisted broadcast, and the request's part parameter value includes the status part, the broadcast's privacy setting will be updated to whatever value the request body specifies. If the request body does not specify a value, the existing privacy setting will be removed and the broadcast will revert to the default privacy setting.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": LiveBroadcast,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveBroadcast,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/liveBroadcasts/bind": POST({
      description: "Bind a broadcast to a stream.",
      id: "youtube.liveBroadcasts.bind",
      req: {
        query: {
          id: {
            type: "string",
            description: "Broadcast to bind to the stream",
          } as const,
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies a comma-separated list of one or more liveBroadcast resource properties that the API response will include. The part names that you can include in the parameter value are id, snippet, contentDetails, and status.",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
          "onBehalfOfContentOwnerChannel?": {
            type: "string",
            description:
              "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
          } as const,
          "streamId?": {
            type: "string",
            description: "Stream to bind, if not set unbind the current one.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": LiveBroadcast,
          } as const,
        }),
      },
      tags: [tags.liveBroadcasts],
    } as const),
    "/youtube/v3/liveBroadcasts/cuepoint": POST({
      description: "Insert cuepoints in a broadcast",
      id: "youtube.liveBroadcasts.insertCuepoint",
      req: {
        query: {
          "id?": {
            type: "string",
            description:
              "Broadcast to insert ads to, or equivalently `external_video_id` for internal use.",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
          "onBehalfOfContentOwnerChannel?": {
            type: "string",
            description:
              "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
          } as const,
          "part?": {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies a comma-separated list of one or more liveBroadcast resource properties that the API response will include. The part names that you can include in the parameter value are id, snippet, contentDetails, and status.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
        body: {
          "application/json": Cuepoint,
        } as const,
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": Cuepoint,
          } as const,
        }),
      },
      tags: [tags.liveBroadcasts],
    } as const),
    "/youtube/v3/liveBroadcasts/transition": POST({
      description: "Transition a broadcast to a given status.",
      id: "youtube.liveBroadcasts.transition",
      req: {
        query: {
          broadcastStatus: {
            enum: ["statusUnspecified", "testing", "live", "complete"],
            type: "string",
            description:
              "The status to which the broadcast is going to transition.",
          } as const,
          id: {
            type: "string",
            description: "Broadcast to transition.",
          } as const,
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies a comma-separated list of one or more liveBroadcast resource properties that the API response will include. The part names that you can include in the parameter value are id, snippet, contentDetails, and status.",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
          "onBehalfOfContentOwnerChannel?": {
            type: "string",
            description:
              "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": LiveBroadcast,
          } as const,
        }),
      },
      tags: [tags.liveBroadcasts],
    } as const),
    "/youtube/v3/liveChat/bans": scope({
      forAll: {
        tags: [tags.liveChatBans],
      },
      DELETE: {
        description: "Deletes a chat ban.",
        id: "youtube.liveChatBans.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.liveChatBans.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response returns. Set the parameter value to snippet.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": LiveChatBan,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveChatBan,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/liveChat/messages": scope({
      forAll: {
        tags: [tags.liveChatMessages],
      },
      DELETE: {
        description: "Deletes a chat message.",
        id: "youtube.liveChatMessages.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.liveChatMessages.list",
        req: {
          query: {
            liveChatId: {
              type: "string",
              description:
                "The id of the live chat for which comments should be returned.",
            } as const,
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies the liveChatComment resource parts that the API response will include. Supported values are id and snippet.",
            } as const,
            "hl?": {
              type: "string",
              description:
                "Specifies the localization language in which the system messages should be returned.",
            } as const,
            "maxResults?": {
              maximum: 2000,
              minimum: 200,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken property identify other pages that could be retrieved.",
            } as const,
            "profileImageSize?": {
              maximum: 720,
              minimum: 16,
              type: "integer",
              description:
                "Specifies the size of the profile image that should be returned for each user.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveChatMessageListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.liveChatMessages.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes. It identifies the properties that the write operation will set as well as the properties that the API response will include. Set the parameter value to snippet.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": LiveChatMessage,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveChatMessage,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/liveChat/moderators": scope({
      forAll: {
        tags: [tags.liveChatModerators],
      },
      DELETE: {
        description: "Deletes a chat moderator.",
        id: "youtube.liveChatModerators.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.liveChatModerators.list",
        req: {
          query: {
            liveChatId: {
              type: "string",
              description:
                "The id of the live chat for which moderators should be returned.",
            } as const,
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies the liveChatModerator resource parts that the API response will include. Supported values are id and snippet.",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 0,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveChatModeratorListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.liveChatModerators.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response returns. Set the parameter value to snippet.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": LiveChatModerator,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveChatModerator,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/liveStreams": scope({
      forAll: {
        tags: [tags.liveStreams],
      },
      DELETE: {
        description: "Deletes an existing stream for the authenticated user.",
        id: "youtube.liveStreams.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description:
          "Retrieve the list of streams associated with the given channel. --",
        id: "youtube.liveStreams.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more liveStream resource properties that the API response will include. The part names that you can include in the parameter value are id, snippet, cdn, and status.",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Return LiveStreams with the given ids from Stubby or Apiary.",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 0,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "mine?": {
              type: "boolean",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveStreamListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new stream for the authenticated user.",
        id: "youtube.liveStreams.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. The part properties that you can include in the parameter value are id, snippet, cdn, content_details, and status.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": LiveStream,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveStream,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing stream for the authenticated user.",
        id: "youtube.liveStreams.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. The part properties that you can include in the parameter value are id, snippet, cdn, and status. Note that this method will override the existing values for all of the mutable properties that are contained in any parts that the parameter value specifies. If the request body does not specify a value for a mutable property, the existing value for that property will be removed.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
          ),
          body: {
            "application/json": LiveStream,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": LiveStream,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/members": GET({
      description:
        "Retrieves a list of members that match the request criteria for a channel.",
      id: "youtube.members.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies the member resource parts that the API response will include. Set the parameter value to snippet.",
          } as const,
          "filterByMemberChannelId?": {
            type: "string",
            description:
              "Comma separated list of channel IDs. Only data about members that are part of this list will be included in the response.",
          } as const,
          "hasAccessToLevel?": {
            type: "string",
            description:
              "Filter members in the results set to the ones that have access to a level.",
          } as const,
          "maxResults?": {
            maximum: 1000,
            minimum: 0,
            type: "integer",
            description:
              "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
          } as const,
          "mode?": {
            enum: ["listMembersModeUnknown", "updates", "all_current"],
            type: "string",
            description:
              "Parameter that specifies which channel members to return.",
          } as const,
          "pageToken?": {
            type: "string",
            description:
              "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
          } as const,
        },
        security: youtubeScope(
          "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": MemberListResponse,
          } as const,
        }),
      },
      tags: [tags.members],
    } as const),
    "/youtube/v3/membershipsLevels": GET({
      description:
        "Retrieves a list of all pricing levels offered by a creator to the fans.",
      id: "youtube.membershipsLevels.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies the membershipsLevel resource parts that the API response will include. Supported values are id and snippet.",
          } as const,
        },
        security: youtubeScope(
          "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": MembershipsLevelListResponse,
          } as const,
        }),
      },
      tags: [tags.membershipsLevels],
    } as const),
    "/youtube/v3/playlistItems": scope({
      forAll: {
        tags: [tags.playlistItems],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.playlistItems.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.playlistItems.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more playlistItem resource properties that the API response will include. If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a playlistItem resource, the snippet property contains numerous fields, including the title, description, position, and resourceId properties. As such, if you set *part=snippet*, the API response will contain all of those properties.",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 0,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
            "playlistId?": {
              type: "string",
              description:
                "Return the playlist items within the given playlist.",
            } as const,
            "videoId?": {
              type: "string",
              description:
                "Return the playlist items associated with the given video ID.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": PlaylistItemListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.playlistItems.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": PlaylistItem,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": PlaylistItem,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.playlistItems.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. Note that this method will override the existing values for all of the mutable properties that are contained in any parts that the parameter value specifies. For example, a playlist item can specify a start time and end time, which identify the times portion of the video that should play when users watch the video in the playlist. If your request is updating a playlist item that sets these values, and the request's part parameter value includes the contentDetails part, the playlist item's start and end times will be updated to whatever value the request body specifies. If the request body does not specify values, the existing start and end times will be removed and replaced with the default settings.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": PlaylistItem,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": PlaylistItem,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/playlists": scope({
      forAll: {
        tags: [tags.playlists],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.playlists.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.playlists.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more playlist resource properties that the API response will include. If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a playlist resource, the snippet property contains properties like author, title, description, tags, and timeCreated. As such, if you set *part=snippet*, the API response will contain all of those properties.",
            } as const,
            "channelId?": {
              type: "string",
              description:
                "Return the playlists owned by the specified channel ID.",
            } as const,
            "hl?": {
              type: "string",
              description: "Return content in specified language",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Return the playlists with the given IDs for Stubby or Apiary.",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 0,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "mine?": {
              type: "boolean",
              description:
                "Return the playlists owned by the authenticated user.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": PlaylistListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.playlists.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": Playlist,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Playlist,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.playlists.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. Note that this method will override the existing values for mutable properties that are contained in any parts that the request body specifies. For example, a playlist's description is contained in the snippet part, which must be included in the request body. If the request does not specify a value for the snippet.description property, the playlist's existing description will be deleted.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": Playlist,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Playlist,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/search": GET({
      description: "Retrieves a list of search resources",
      id: "youtube.search.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies a comma-separated list of one or more search resource properties that the API response will include. Set the parameter value to snippet.",
          } as const,
          "channelId?": {
            type: "string",
            description: "Filter on resources belonging to this channelId.",
          } as const,
          "channelType?": {
            enum: ["channelTypeUnspecified", "any", "show"],
            type: "string",
            description: "Add a filter on the channel search.",
          } as const,
          "eventType?": {
            enum: ["none", "upcoming", "live", "completed"],
            type: "string",
            description: "Filter on the livestream status of the videos.",
          } as const,
          "forContentOwner?": {
            type: "boolean",
            description: "Search owned by a content owner.",
          } as const,
          "forDeveloper?": {
            type: "boolean",
            description:
              "Restrict the search to only retrieve videos uploaded using the project id of the authenticated user.",
          } as const,
          "forMine?": {
            type: "boolean",
            description:
              "Search for the private videos of the authenticated user.",
          } as const,
          "location?": {
            type: "string",
            description: "Filter on location of the video",
          } as const,
          "locationRadius?": {
            type: "string",
            description:
              "Filter on distance from the location (specified above).",
          } as const,
          "maxResults?": {
            maximum: 50,
            minimum: 0,
            type: "integer",
            description:
              "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
          "order?": {
            enum: [
              "searchSortUnspecified",
              "date",
              "rating",
              "viewCount",
              "relevance",
              "title",
              "videoCount",
            ],
            type: "string",
            description: "Sort order of the results.",
          } as const,
          "pageToken?": {
            type: "string",
            description:
              "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
          } as const,
          "publishedAfter?": {
            type: "string",
            description: "Filter on resources published after this date.",
          } as const,
          "publishedBefore?": {
            type: "string",
            description: "Filter on resources published before this date.",
          } as const,
          "q?": {
            type: "string",
            description: "Textual search terms to match.",
          } as const,
          "regionCode?": {
            type: "string",
            description:
              "Display the content as seen by viewers in this country.",
          } as const,
          "relatedToVideoId?": {
            type: "string",
            description: "Search related to a resource.",
          } as const,
          "relevanceLanguage?": {
            type: "string",
            description: "Return results relevant to this language.",
          } as const,
          "safeSearch?": {
            enum: [
              "safeSearchSettingUnspecified",
              "none",
              "moderate",
              "strict",
            ],
            type: "string",
            description:
              "Indicates whether the search results should include restricted content as well as standard content.",
          } as const,
          "topicId?": {
            type: "string",
            description: "Restrict results to a particular topic.",
          } as const,
          "type?": {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "Restrict results to a particular set of resource types from One Platform.",
          } as const,
          "videoCaption?": {
            enum: ["videoCaptionUnspecified", "any", "closedCaption", "none"],
            type: "string",
            description: "Filter on the presence of captions on the videos.",
          } as const,
          "videoCategoryId?": {
            type: "string",
            description: "Filter on videos in a specific category.",
          } as const,
          "videoDefinition?": {
            enum: ["any", "standard", "high"],
            type: "string",
            description: "Filter on the definition of the videos.",
          } as const,
          "videoDimension?": {
            enum: ["any", "2d", "3d"],
            type: "string",
            description: "Filter on 3d videos.",
          } as const,
          "videoDuration?": {
            enum: [
              "videoDurationUnspecified",
              "any",
              "short",
              "medium",
              "long",
            ],
            type: "string",
            description: "Filter on the duration of the videos.",
          } as const,
          "videoEmbeddable?": {
            enum: ["videoEmbeddableUnspecified", "any", "true"],
            type: "string",
            description: "Filter on embeddable videos.",
          } as const,
          "videoLicense?": {
            enum: ["any", "youtube", "creativeCommon"],
            type: "string",
            description: "Filter on the license of the videos.",
          } as const,
          "videoSyndicated?": {
            enum: ["videoSyndicatedUnspecified", "any", "true"],
            type: "string",
            description: "Filter on syndicated videos.",
          } as const,
          "videoType?": {
            enum: ["videoTypeUnspecified", "any", "movie", "episode"],
            type: "string",
            description: "Filter on videos of a specific type.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": SearchListResponse,
          } as const,
        }),
      },
      tags: [tags.search],
    } as const),
    "/youtube/v3/subscriptions": scope({
      forAll: {
        tags: [tags.subscriptions],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.subscriptions.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.subscriptions.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more subscription resource properties that the API response will include. If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a subscription resource, the snippet property contains other properties, such as a display title for the subscription. If you set *part=snippet*, the API response will also contain all of those nested properties.",
            } as const,
            "channelId?": {
              type: "string",
              description:
                "Return the subscriptions of the given channel owner.",
            } as const,
            "forChannelId?": {
              type: "string",
              description:
                "Return the subscriptions to the subset of these channels that the authenticated user is subscribed to.",
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "Return the subscriptions with the given IDs for Stubby or Apiary.",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 0,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
            } as const,
            "mine?": {
              type: "boolean",
              description:
                "Flag for returning the subscriptions of the authenticated user.",
            } as const,
            "myRecentSubscribers?": {
              type: "boolean",
            } as const,
            "mySubscribers?": {
              type: "boolean",
              description: "Return the subscribers of the given channel owner.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
            "order?": {
              enum: [
                "subscriptionOrderUnspecified",
                "relevance",
                "unread",
                "alphabetical",
              ],
              type: "string",
              description: "The order of the returned subscriptions",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": SubscriptionListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.subscriptions.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": Subscription,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Subscription,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/superChatEvents": GET({
      description: "Retrieves a list of resources, possibly filtered.",
      id: "youtube.superChatEvents.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies the superChatEvent resource parts that the API response will include. This parameter is currently not supported.",
          } as const,
          "hl?": {
            type: "string",
            description:
              "Return rendered funding amounts in specified language.",
          } as const,
          "maxResults?": {
            maximum: 50,
            minimum: 1,
            type: "integer",
            description:
              "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set.",
          } as const,
          "pageToken?": {
            type: "string",
            description:
              "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": SuperChatEventListResponse,
          } as const,
        }),
      },
      tags: [tags.superChatEvents],
    } as const),
    "/youtube/v3/tests": POST({
      description: "POST method.",
      id: "youtube.tests.insert",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
          } as const,
          "externalChannelId?": {
            type: "string",
          } as const,
        },
        security: youtubeScope(
          "https://www.googleapis.com/auth/youtube.readonly",
        ),
        body: {
          "application/json": TestItem,
        } as const,
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": TestItem,
          } as const,
        }),
      },
      tags: [tags.tests],
    } as const),
    "/youtube/v3/thirdPartyLinks": scope({
      forAll: {
        tags: [tags.thirdPartyLinks],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.thirdPartyLinks.delete",
        req: {
          query: {
            linkingToken: {
              type: "string",
              description:
                "Delete the partner links with the given linking token.",
            } as const,
            type: {
              enum: ["linkUnspecified", "channelToStoreLink"],
              type: "string",
              description: "Type of the link to be deleted.",
            } as const,
            "externalChannelId?": {
              type: "string",
              description:
                "Channel ID to which changes should be applied, for delegation.",
            } as const,
            "part?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description: "Do not use. Required for compatibility.",
            } as const,
          },
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.thirdPartyLinks.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies the thirdPartyLink resource parts that the API response will include. Supported values are linkingToken, status, and snippet.",
            } as const,
            "externalChannelId?": {
              type: "string",
              description:
                "Channel ID to which changes should be applied, for delegation.",
            } as const,
            "linkingToken?": {
              type: "string",
              description:
                "Get a third party link with the given linking token.",
            } as const,
            "type?": {
              enum: ["linkUnspecified", "channelToStoreLink"],
              type: "string",
              description: "Get a third party link of the given type.",
            } as const,
          },
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": ThirdPartyLinkListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.thirdPartyLinks.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies the thirdPartyLink resource parts that the API request and response will include. Supported values are linkingToken, status, and snippet.",
            } as const,
            "externalChannelId?": {
              type: "string",
              description:
                "Channel ID to which changes should be applied, for delegation.",
            } as const,
          },
          body: {
            "application/json": ThirdPartyLink,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": ThirdPartyLink,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.thirdPartyLinks.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies the thirdPartyLink resource parts that the API request and response will include. Supported values are linkingToken, status, and snippet.",
            } as const,
            "externalChannelId?": {
              type: "string",
              description:
                "Channel ID to which changes should be applied, for delegation.",
            } as const,
          },
          body: {
            "application/json": ThirdPartyLink,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": ThirdPartyLink,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/thumbnails/set": POST({
      description:
        "As this is not an insert in a strict sense (it supports uploading/setting of a thumbnail for multiple videos, which doesn't result in creation of a single resource), I use a custom verb here.",
      id: "youtube.thumbnails.set",
      req: {
        query: {
          videoId: {
            type: "string",
            description:
              "Returns the Thumbnail with the given video IDs for Stubby or Apiary.",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": ThumbnailSetResponse,
          } as const,
        }),
      },
      tags: [tags.thumbnails],
    } as const),
    "/youtube/v3/videoAbuseReportReasons": GET({
      description: "Retrieves a list of resources, possibly filtered.",
      id: "youtube.videoAbuseReportReasons.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies the videoCategory resource parts that the API response will include. Supported values are id and snippet.",
          } as const,
          "hl?": {
            type: "string",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": VideoAbuseReportReasonListResponse,
          } as const,
        }),
      },
      tags: [tags.videoAbuseReportReasons],
    } as const),
    "/youtube/v3/videoCategories": GET({
      description: "Retrieves a list of resources, possibly filtered.",
      id: "youtube.videoCategories.list",
      req: {
        query: {
          part: {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "The *part* parameter specifies the videoCategory resource properties that the API response will include. Set the parameter value to snippet.",
          } as const,
          "hl?": {
            type: "string",
          } as const,
          "id?": {
            items: {
              type: "string",
            } as const,
            type: "array",
            description:
              "Returns the video categories with the given IDs for Stubby or Apiary.",
          } as const,
          "regionCode?": {
            type: "string",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": VideoCategoryListResponse,
          } as const,
        }),
      },
      tags: [tags.videoCategories],
    } as const),
    "/youtube/v3/videos": scope({
      forAll: {
        tags: [tags.videos],
      },
      DELETE: {
        description: "Deletes a resource.",
        id: "youtube.videos.delete",
        req: {
          query: {
            id: {
              type: "string",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
          }),
        },
      } as const,
      GET: {
        description: "Retrieves a list of resources, possibly filtered.",
        id: "youtube.videos.list",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter specifies a comma-separated list of one or more video resource properties that the API response will include. If the parameter identifies a property that contains child properties, the child properties will be included in the response. For example, in a video resource, the snippet property contains the channelId, title, description, tags, and categoryId properties. As such, if you set *part=snippet*, the API response will contain all of those properties.",
            } as const,
            "chart?": {
              enum: ["chartUnspecified", "mostPopular"],
              type: "string",
              description: "Return the videos that are in the specified chart.",
            } as const,
            "hl?": {
              type: "string",
              description:
                'Stands for "host language". Specifies the localization language of the metadata to be filled into snippet.localized. The field is filled with the default metadata if there is no localization in the specified language. The parameter value must be a language code included in the list returned by the i18nLanguages.list method (e.g. en_US, es_MX).',
            } as const,
            "id?": {
              items: {
                type: "string",
              } as const,
              type: "array",
              description: "Return videos with the given ids.",
            } as const,
            "locale?": {
              type: "string",
            } as const,
            "maxHeight?": {
              maximum: 8192,
              minimum: 72,
              type: "integer",
            } as const,
            "maxResults?": {
              maximum: 50,
              minimum: 1,
              type: "integer",
              description:
                "The *maxResults* parameter specifies the maximum number of items that should be returned in the result set. *Note:* This parameter is supported for use in conjunction with the myRating and chart parameters, but it is not supported for use in conjunction with the id parameter.",
            } as const,
            "maxWidth?": {
              maximum: 8192,
              minimum: 72,
              type: "integer",
              description: "Return the player with maximum height specified in",
            } as const,
            "myRating?": {
              enum: ["none", "like", "dislike"],
              type: "string",
              description:
                "Return videos liked/disliked by the authenticated user. Does not support RateType.RATED_TYPE_NONE.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "pageToken?": {
              type: "string",
              description:
                "The *pageToken* parameter identifies a specific page in the result set that should be returned. In an API response, the nextPageToken and prevPageToken properties identify other pages that could be retrieved. *Note:* This parameter is supported for use in conjunction with the myRating and chart parameters, but it is not supported for use in conjunction with the id parameter.",
            } as const,
            "regionCode?": {
              type: "string",
              description:
                "Use a chart that is specific to the specified region",
            } as const,
            "videoCategoryId?": {
              type: "string",
              description:
                "Use chart that is specific to the specified video category",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": VideoListResponse,
            } as const,
          }),
        },
      } as const,
      POST: {
        description: "Inserts a new resource into this collection.",
        id: "youtube.videos.insert",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. Note that not all parts contain properties that can be set when inserting or updating a video. For example, the statistics object encapsulates statistics that YouTube calculates for a video and does not contain values that you can set or modify. If the parameter value specifies a part that does not contain mutable values, that part will still be included in the API response.",
            } as const,
            "autoLevels?": {
              type: "boolean",
              description: "Should auto-levels be applied to the upload.",
            } as const,
            "notifySubscribers?": {
              type: "boolean",
              description:
                "Notify the channel subscribers about the new video. As default, the notification is enabled.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
            "onBehalfOfContentOwnerChannel?": {
              type: "string",
              description:
                "This parameter can only be used in a properly authorized request. *Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwnerChannel* parameter specifies the YouTube channel ID of the channel to which a video is being added. This parameter is required when a request specifies a value for the onBehalfOfContentOwner parameter, and it can only be used in conjunction with that parameter. In addition, the request must be authorized using a CMS account that is linked to the content owner that the onBehalfOfContentOwner parameter specifies. Finally, the channel that the onBehalfOfContentOwnerChannel parameter value specifies must be linked to the content owner that the onBehalfOfContentOwner parameter specifies. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and perform actions on behalf of the channel specified in the parameter value, without having to provide authentication credentials for each separate channel.",
            } as const,
            "stabilize?": {
              type: "boolean",
              description: "Should stabilize be applied to the upload.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/octet-stream": Video,
            "video/1d-interleaved-parityfec": Video,
            "video/3gpp": Video,
            "video/3gpp-tt": Video,
            "video/3gpp2": Video,
            "video/av1": Video,
            "video/bmpeg": Video,
            "video/bt656": Video,
            "video/celb": Video,
            "video/dv": Video,
            "video/encaprtp": Video,
            "video/ffv1": Video,
            "video/flexfec": Video,
            "video/h261": Video,
            "video/h263": Video,
            "video/h263-1998": Video,
            "video/h263-2000": Video,
            "video/h264": Video,
            "video/h264-rcdo": Video,
            "video/h264-svc": Video,
            "video/h265": Video,
            "video/iso.segment": Video,
            "video/jpeg": Video,
            "video/jpeg2000": Video,
            "video/jpm": Video,
            "video/jxsv": Video,
            "video/mj2": Video,
            "video/mp1s": Video,
            "video/mp2p": Video,
            "video/mp2t": Video,
            "video/mp4": Video,
            "video/mp4v-es": Video,
            "video/mpeg": Video,
            "video/mpeg4-generic": Video,
            "video/mpv": Video,
            "video/nv": Video,
            "video/ogg": Video,
            "video/parityfec": Video,
            "video/pointer": Video,
            "video/quicktime": Video,
            "video/raptorfec": Video,
            "video/raw": Video,
            "video/rtp-enc-aescm128": Video,
            "video/rtploopback": Video,
            "video/rtx": Video,
            "video/scip": Video,
            "video/smpte291": Video,
            "video/smpte292m": Video,
            "video/ulpfec": Video,
            "video/vc1": Video,
            "video/vc2": Video,
            "video/vnd.cctv": Video,
            "video/vnd.dece.hd": Video,
            "video/vnd.dece.mobile": Video,
            "video/vnd.dece.mp4": Video,
            "video/vnd.dece.pd": Video,
            "video/vnd.dece.sd": Video,
            "video/vnd.dece.video": Video,
            "video/vnd.directv.mpeg": Video,
            "video/vnd.directv.mpeg-tts": Video,
            "video/vnd.dlna.mpeg-tts": Video,
            "video/vnd.dvb.file": Video,
            "video/vnd.fvt": Video,
            "video/vnd.hns.video": Video,
            "video/vnd.iptvforum.1dparityfec-1010": Video,
            "video/vnd.iptvforum.1dparityfec-2005": Video,
            "video/vnd.iptvforum.2dparityfec-1010": Video,
            "video/vnd.iptvforum.2dparityfec-2005": Video,
            "video/vnd.iptvforum.ttsavc": Video,
            "video/vnd.iptvforum.ttsmpeg2": Video,
            "video/vnd.motorola.video": Video,
            "video/vnd.motorola.videop": Video,
            "video/vnd.mpegurl": Video,
            "video/vnd.ms-playready.media.pyv": Video,
            "video/vnd.nokia.interleaved-multimedia": Video,
            "video/vnd.nokia.mp4vr": Video,
            "video/vnd.nokia.videovoip": Video,
            "video/vnd.objectvideo": Video,
            "video/vnd.radgamettools.bink": Video,
            "video/vnd.radgamettools.smacker": Video,
            "video/vnd.sealed.mpeg1": Video,
            "video/vnd.sealed.mpeg4": Video,
            "video/vnd.sealed.swf": Video,
            "video/vnd.sealedmedia.softseal.mov": Video,
            "video/vnd.uvvu.mp4": Video,
            "video/vnd.vivo": Video,
            "video/vnd.youtube.yt": Video,
            "video/vp8": Video,
            "video/vp9": Video,
            "video/webm": Video,
            "video/x-f4v": Video,
            "video/x-fli": Video,
            "video/x-flv": Video,
            "video/x-m4v": Video,
            "video/x-matroska": Video,
            "video/x-mng": Video,
            "video/x-ms-asf": Video,
            "video/x-ms-vob": Video,
            "video/x-ms-wm": Video,
            "video/x-ms-wmv": Video,
            "video/x-ms-wmx": Video,
            "video/x-ms-wvx": Video,
            "video/x-msvideo": Video,
            "video/x-sgi-movie": Video,
            "video/x-smv": Video,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Video,
            } as const,
          }),
        },
      } as const,
      PUT: {
        description: "Updates an existing resource.",
        id: "youtube.videos.update",
        req: {
          query: {
            part: {
              items: {
                type: "string",
              } as const,
              type: "array",
              description:
                "The *part* parameter serves two purposes in this operation. It identifies the properties that the write operation will set as well as the properties that the API response will include. Note that this method will override the existing values for all of the mutable properties that are contained in any parts that the parameter value specifies. For example, a video's privacy setting is contained in the status part. As such, if your request is updating a private video, and the request's part parameter value includes the status part, the video's privacy setting will be updated to whatever value the request body specifies. If the request body does not specify a value, the existing privacy setting will be removed and the video will revert to the default privacy setting. In addition, not all parts contain properties that can be set when inserting or updating a video. For example, the statistics object encapsulates statistics that YouTube calculates for a video and does not contain values that you can set or modify. If the parameter value specifies a part that does not contain mutable values, that part will still be included in the API response.",
            } as const,
            "onBehalfOfContentOwner?": {
              type: "string",
              description:
                "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The actual CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
            } as const,
          },
          security: youtubeScopes(
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl",
            "https://www.googleapis.com/auth/youtubepartner",
          ),
          body: {
            "application/json": Video,
          } as const,
        },
        res: {
          "200": response({
            description: "Successful response",
            body: {
              "application/json": Video,
            } as const,
          }),
        },
      } as const,
    }),
    "/youtube/v3/videos/getRating": GET({
      description:
        "Retrieves the ratings that the authorized user gave to a list of specified videos.",
      id: "youtube.videos.getRating",
      req: {
        query: {
          id: {
            items: {
              type: "string",
            } as const,
            type: "array",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
          body: {
            "application/json": VideoGetRatingResponse,
          } as const,
        }),
      },
      tags: [tags.videos],
    } as const),
    "/youtube/v3/videos/rate": POST({
      description:
        "Adds a like or dislike rating to a video or removes a rating from a video.",
      id: "youtube.videos.rate",
      req: {
        query: {
          id: {
            type: "string",
          } as const,
          rating: {
            enum: ["none", "like", "dislike"],
            type: "string",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
        }),
      },
      tags: [tags.videos],
    } as const),
    "/youtube/v3/videos/reportAbuse": POST({
      description: "Report abuse for a video.",
      id: "youtube.videos.reportAbuse",
      req: {
        query: {
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
        body: {
          "application/json": VideoAbuseReport,
        } as const,
      },
      res: {
        "200": response({
          description: "Successful response",
        }),
      },
      tags: [tags.videos],
    } as const),
    "/youtube/v3/watermarks/set": POST({
      description:
        "Allows upload of watermark image and setting it for a channel.",
      id: "youtube.watermarks.set",
      req: {
        query: {
          channelId: {
            type: "string",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
        body: {
          "application/octet-stream": InvideoBranding,
          "image/jpeg": InvideoBranding,
          "image/png": InvideoBranding,
        } as const,
      },
      res: {
        "200": response({
          description: "Successful response",
        }),
      },
      tags: [tags.watermarks],
    } as const),
    "/youtube/v3/watermarks/unset": POST({
      description: "Allows removal of channel watermark.",
      id: "youtube.watermarks.unset",
      req: {
        query: {
          channelId: {
            type: "string",
          } as const,
          "onBehalfOfContentOwner?": {
            type: "string",
            description:
              "*Note:* This parameter is intended exclusively for YouTube content partners. The *onBehalfOfContentOwner* parameter indicates that the request's authorization credentials identify a YouTube CMS user who is acting on behalf of the content owner specified in the parameter value. This parameter is intended for YouTube content partners that own and manage many different YouTube channels. It allows content owners to authenticate once and get access to all their video and channel data, without having to provide authentication credentials for each individual channel. The CMS account that the user authenticates with must be linked to the specified YouTube content owner.",
          } as const,
        },
        security: youtubeScopes(
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.force-ssl",
          "https://www.googleapis.com/auth/youtubepartner",
        ),
      },
      res: {
        "200": response({
          description: "Successful response",
        }),
      },
      tags: [tags.watermarks],
    } as const),
  },
})
