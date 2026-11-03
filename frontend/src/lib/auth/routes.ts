const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/contact",
  "/docs/privacy",
  "/docs/terms",
]);

const APP_SHELL_HIDDEN_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/contact",
  "/docs/privacy",
  "/docs/terms",
]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

export function shouldHideAppShell(pathname: string): boolean {
  return APP_SHELL_HIDDEN_PATHS.has(pathname);
}

export function isPlanAccessExemptPath(pathname: string): boolean {
  return isPublicPath(pathname) || pathname === "/account/billing";
}

export function canRenderRoute(
  pathname: string,
  authenticated: boolean,
  hasPlanAccess: boolean,
  sessionResolved: boolean,
): boolean {
  if (isPublicPath(pathname)) return true;
  if (!sessionResolved || !authenticated) return false;
  return hasPlanAccess || isPlanAccessExemptPath(pathname);
}
