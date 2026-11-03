export interface PendingRegistrationResponse {
  requires_verification: boolean;
}

interface NavigationTarget {
  assign(url: string): void;
}

interface StatusError {
  status: unknown;
}

export function isRecoverableRegistrationError(error: unknown): error is Error & StatusError {
  return error instanceof Error && "status" in error && error.status === 409;
}

export function completeSuccessfulRegistration(
  response: PendingRegistrationResponse,
  verificationPath: string,
  navigation: NavigationTarget,
): void {
  if (response.requires_verification === true) {
    navigation.assign(verificationPath);
    return;
  }

  navigation.assign("/login?registered=1");
}
