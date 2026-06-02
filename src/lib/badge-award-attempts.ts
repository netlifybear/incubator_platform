export {
  type TagAwardIssuerType as BadgeAwardIssuerType,
  isTagAwardRateLimited as isBadgeAwardRateLimited,
  recordTagAwardAttempt as recordBadgeAwardAttempt,
  clientIpFromHeaders,
} from "./tag-award-attempts.ts";
