// Known link-preview / social crawlers that fetch a page to build a share card.
// Excludes search-engine indexers on purpose — the site is noindex, so only
// share-preview bots are let through gated pages (to render the OG thumbnail).
export function isPreviewBot(ua: string): boolean {
  return /facebookexternalhit|Facebot|Twitterbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Applebot|SkypeUriPreview|redditbot|Pinterest|vkShare|Embedly|Iframely|Google-InspectionTool|SnapchatAds|Snapchat/i.test(
    ua
  );
}
