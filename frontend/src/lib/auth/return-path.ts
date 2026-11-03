export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";
export const PLAN_PURCHASE_PATH = "/account/billing";

const ALLOWED_RETURN_PATHS = new Set([
  "/account/billing",
]);

export function getSafeReturnPath(
  search: string,
  fallback = DEFAULT_AUTHENTICATED_PATH,
): string {
  const requestedPath = new URLSearchParams(search).get("returnTo");
  return requestedPath && ALLOWED_RETURN_PATHS.has(requestedPath)
    ? requestedPath
    : fallback;
}

export function getAuthPathWithSafeReturn(
  destination: "/login" | "/register",
  search: string,
): string {
  const returnPath = getSafeReturnPath(search);
  return returnPath === DEFAULT_AUTHENTICATED_PATH
    ? destination
    : `${destination}?returnTo=${encodeURIComponent(returnPath)}`;
}

export function getVerifyEmailPath(email: string, search: string): string {
  const params = new URLSearchParams({ email });
  const returnPath = getSafeReturnPath(search);
  if (returnPath !== DEFAULT_AUTHENTICATED_PATH) {
    params.set("returnTo", returnPath);
  }
  return `/verify-email?${params.toString()}`;
}

export function getPostLoginPath(hasPlanAccess: boolean, search: string): string {
  return hasPlanAccess ? getSafeReturnPath(search) : PLAN_PURCHASE_PATH;
}
