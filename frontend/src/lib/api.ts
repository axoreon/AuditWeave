import { clearAuthSession, getStoredEmail, getStoredRole, getValidAccessToken, saveAuthSession } from "./auth/session";
import { parseAuthTokenResponse, parseUserProfileResponse } from "./auth/types";
import type { AuthTokenResponse, UserProfileResponse } from "./auth/types";
import type { CopilotHistoryEntry } from "./copilot";
import {
  AUDIT_REQUEST_TIMEOUT_MS,
  fetchWithTimeout,
  RequestTimeoutError,
} from "./audit-request";

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const API_BASE = `${configuredApiUrl.replace(/\/api$/, "")}/api`;
const API_REQUEST_TIMEOUT_MS = 60_000;

// Helper to get headers
function getHeaders(isMultipart = false) {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = getValidAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Check if user is logged in
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return getValidAccessToken() !== null;
}

export function getCurrentRole(): string {
  if (typeof window === "undefined") return "user";
  return getStoredRole();
}

export function isAdmin(): boolean {
  return getCurrentRole() === "admin";
}

export function getCurrentEmail(): string {
  if (typeof window === "undefined") return "";
  return getStoredEmail();
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  clearAuthSession();
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function isInsufficientCreditsError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 402;
}

function formatApiError(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const messages = value.flatMap((item) => {
      if (typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string") {
        return [item.msg];
      }
      return [];
    });
    if (messages.length) return messages.join(" ");
  }
  return "Server returned an error.";
}

async function throwResponseError(res: Response): Promise<never> {
  if (res.status === 401) clearAuthSession();
  const body: unknown = await res.json().catch(() => null);
  const detail = typeof body === "object" && body !== null && "detail" in body ? body.detail : body;
  throw new ApiError(formatApiError(detail), res.status);
}

// Low-level request wrapper
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isMultipart = false,
  timeoutMs = API_REQUEST_TIMEOUT_MS,
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders(isMultipart);

  const mergedOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    }
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(url, mergedOptions, timeoutMs);
  } catch (error: unknown) {
    if (error instanceof RequestTimeoutError) {
      throw new Error("The API service did not respond in time. Verify that the backend is running and try again.");
    }
    if (error instanceof TypeError) {
      console.error("Fetch TypeError:", error);
      throw new Error("Unable to connect to the API service. Verify that the backend is running.");
    }
    throw error;
  }
  if (!res.ok) {
    await throwResponseError(res);
  }
  return await res.json() as T;
}


function roundVal(num: number): number {
  return Math.round(num * 10) / 10;
}

// --- API ACTIONS ---

export async function getAuditDetail(id: string | number): Promise<any> {
  return request<any>(`/audit/${id}`);
}

export async function deleteAudit(id: string | number): Promise<any> {
  return request<any>(`/audit/${id}`, {
    method: "DELETE"
  });
}

export async function createAudit(companyName: string, industry: string, policyUrl?: string, policyText?: string): Promise<any> {
  return request<any>("/audit", {
    method: "POST",
    body: JSON.stringify({
      company_name: companyName,
      industry: industry,
      policy_url: policyUrl || null,
      policy_text: policyText || null
    })
  }, false, AUDIT_REQUEST_TIMEOUT_MS);
}

export async function createAuditWithFile(companyName: string, industry: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("company_name", companyName);
  formData.append("industry", industry);
  formData.append("file", file);

  return request<any>("/audit/file", {
    method: "POST",
    body: formData
  }, true, AUDIT_REQUEST_TIMEOUT_MS);
}

export interface CopilotResponse {
  response: string;
  suggested_actions: string[];
}

export async function askCopilot(
  auditId: string | number,
  message: string,
  history: CopilotHistoryEntry[],
): Promise<CopilotResponse> {
  return request<CopilotResponse>("/audit/copilot", {
    method: "POST",
    body: JSON.stringify({ audit_id: Number(auditId), message, history }),
  });
}

export interface RewriteClauseResponse {
  finding_id: number;
  original_text: string;
  rewritten_text: string;
  disclaimer: string;
  generation_mode: "ai" | "template";
}

export async function rewriteClause(findingId: number): Promise<RewriteClauseResponse> {
  return request<RewriteClauseResponse>("/audit/rewrite", {
    method: "POST",
    body: JSON.stringify({ finding_id: findingId })
  });
}

// --- AUTH ---

export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const raw = await request<unknown>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = parseAuthTokenResponse(raw);
  saveAuthSession(data);
  return data;
}

export interface RegisterPendingResponse {
  message: string;
  email: string;
  requires_verification: boolean;
}

export async function register(
  firstName: string,
  email: string,
  password: string,
): Promise<RegisterPendingResponse> {
  const raw = await request<unknown>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ first_name: firstName, email, password }),
  });
  if (
    typeof raw === "object" &&
    raw !== null &&
    "requires_verification" in raw &&
    typeof (raw as Record<string, unknown>).requires_verification === "boolean"
  ) {
    return raw as RegisterPendingResponse;
  }
  throw new Error("Unexpected registration response from server.");
}

export interface EmailVerificationResponse {
  message: string;
}

export async function verifySignupOtp(
  email: string,
  otp: string,
): Promise<EmailVerificationResponse> {
  return request<EmailVerificationResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendSignupOtp(email: string): Promise<EmailVerificationResponse> {
  return request<EmailVerificationResponse>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function requestPasswordReset(
  email: string,
): Promise<EmailVerificationResponse> {
  return request<EmailVerificationResponse>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export interface PasswordResetOtpResponse extends EmailVerificationResponse {
  reset_token: string;
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string,
): Promise<PasswordResetOtpResponse> {
  return request<PasswordResetOtpResponse>("/auth/password-reset/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function completePasswordReset(
  email: string,
  resetToken: string,
  newPassword: string,
): Promise<EmailVerificationResponse> {
  return request<EmailVerificationResponse>("/auth/password-reset/complete", {
    method: "POST",
    body: JSON.stringify({
      email,
      reset_token: resetToken,
      new_password: newPassword,
    }),
  });
}

export async function getCurrentUser(): Promise<UserProfileResponse> {
  const raw = await request<unknown>("/auth/me");
  return parseUserProfileResponse(raw);
}

async function requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
  const headers = getHeaders();
  const mergedOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    }
  };
  const res = await fetch(`${API_BASE}${endpoint}`, mergedOptions);
  if (!res.ok) await throwResponseError(res);
  return res.blob();
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAuditReport(auditId: string | number): Promise<void> {
  saveBlob(await requestBlob(`/report/${auditId}`), `audit-report-${auditId}.pdf`);
}

export async function downloadPaymentReceipt(receiptNumber: string): Promise<void> {
  saveBlob(
    await requestBlob(`/receipts/${encodeURIComponent(receiptNumber)}/pdf`),
    `AuditWeave-Receipt-${receiptNumber}.pdf`,
  );
}

export async function downloadRemediatedPolicy(auditId: string | number, format: "pdf" | "docx" = "pdf"): Promise<void> {
  const ext = format === "docx" ? "docx" : "pdf";
  saveBlob(
    await requestBlob(`/audit/${auditId}/remediated-policy?format=${format}`),
    `remediated-policy-${auditId}.${ext}`,
  );
}

export async function getRemediatedPolicyText(auditId: string | number): Promise<string> {
  const res = await request<any>(`/audit/${auditId}/remediated-policy?format=text`);
  return res.text;
}

export async function downloadFilledPolicy(auditId: string | number, text: string, format: "pdf" | "docx" = "pdf"): Promise<void> {
  const ext = format === "docx" ? "docx" : "pdf";
  const blob = await requestBlob(`/audit/${auditId}/remediated-policy/fill`, {
    method: "POST",
    body: JSON.stringify({ text, format })
  });
  saveBlob(blob, `remediated-policy-edited-${auditId}.${ext}`);
}

export async function downloadComparisonReport(auditIdA: string | number, auditIdB: string | number): Promise<void> {
  saveBlob(
    await requestBlob(`/compare/${auditIdA}/${auditIdB}/report`),
    `audit-comparison-${auditIdA}-${auditIdB}.pdf`,
  );
}

export async function getDashboard(): Promise<any> {
  return request<any>("/dashboard");
}

// --- ADMIN PANEL ---

export async function getAdminStats(): Promise<any> {
  return request<any>("/admin/stats");
}

export async function getAdminUsers(): Promise<any[]> {
  return request<any[]>("/admin/users");
}

export async function updateUserRole(userId: number, role: string): Promise<any> {
  return request<any>(`/admin/users/${userId}/role?role=${encodeURIComponent(role)}`, {
    method: "PATCH",
  });
}

export async function deleteUser(userId: number): Promise<any> {
  return request<any>(`/admin/users/${userId}`, { method: "DELETE" });
}

export async function getAdminCompanies(): Promise<any[]> {
  return request<any[]>("/admin/companies");
}

export async function getAdminAudits(): Promise<any[]> {
  return request<any[]>("/admin/audits");
}

export async function deleteAdminAudit(auditId: number): Promise<any> {
  return request<any>(`/admin/audits/${auditId}`, { method: "DELETE" });
}

export async function getAdminLogs(): Promise<any[]> {
  return request<any[]>("/admin/logs");
}

export async function getBenchmarks(): Promise<any[]> {
  return request<any[]>("/benchmark");
}

export async function getLeaderboard(): Promise<any[]> {
  return request<any[]>("/leaderboard");
}

// --- PAYMENTS ---

export interface CreditPlan {
  id: string;
  title: string;
  credits: number;
  price_inr: number;
  currency: string;
  description: string;
  popular: boolean;
  features: string[];
}

export interface PaymentOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  new_balance: number;
  already_processed: boolean;
  receipt_available: boolean;
  receipt_number: string | null;
  receipt_email_status: string | null;
}

export interface CreditSummary {
  available_credits: number;
  recorded_purchased_credits: number;
  recorded_used_credits: number;
  has_incomplete_history: boolean;
}

export type CreditActivityFilter = "all" | "purchases" | "usage" | "bonuses";
export type PaymentStatusFilter = "all" | "verified" | "created" | "processing" | "failed";

export interface CreditActivityItem {
  id: number;
  created_at: string | null;
  transaction_type: string;
  amount: number;
  balance_after: number | null;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  status: string;
}

export interface PaymentHistoryItem {
  id: number;
  plan_id: string | null;
  plan_name: string;
  credits_purchased: number;
  amount_paise: number;
  currency: string;
  status: string;
  payment_reference: string;
  created_at: string | null;
  verified_at: string | null;
  receipt_available: boolean;
  receipt_number: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export async function getCreditPlans(): Promise<CreditPlan[]> {
  return request<CreditPlan[]>("/credits/plans");
}

export async function getCreditSummary(): Promise<CreditSummary> {
  return request<CreditSummary>("/credits/summary");
}

export async function getCreditActivity(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  typeFilter?: CreditActivityFilter;
} = {}): Promise<PaginatedResponse<CreditActivityItem>> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 10),
    search: params.search ?? "",
    type_filter: params.typeFilter ?? "all",
  });
  return request<PaginatedResponse<CreditActivityItem>>(`/credits/transactions?${query}`);
}

export async function getPaymentHistory(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: PaymentStatusFilter;
} = {}): Promise<PaginatedResponse<PaymentHistoryItem>> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 10),
    search: params.search ?? "",
    status_filter: params.statusFilter ?? "all",
  });
  return request<PaginatedResponse<PaymentHistoryItem>>(`/payments/history?${query}`);
}

export async function createPaymentOrder(planId: string): Promise<PaymentOrderResponse> {
  return request<PaymentOrderResponse>("/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function verifyPaymentSignature(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): Promise<PaymentVerificationResponse> {
  return request<PaymentVerificationResponse>("/payments/verify", {
    method: "POST",
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  });
}

export async function createBatchAudit(items: Array<{ company_name: string; industry: string; policy_url?: string; policy_text?: string }>): Promise<any> {
  return request<any>("/audit/batch", {
    method: "POST",
    body: JSON.stringify({ items })
  });
}

export async function extractAuditFile(file: File): Promise<{ policy_text: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/audit/extract-file`, {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) await throwResponseError(res);
  return await res.json() as { policy_text: string };
}

export async function getAuditHistory(): Promise<any[]> {
  return request<any[]>("/audit/history");
}

export async function compareAudits(idA: string | number, idB: string | number): Promise<any> {
  return request<any>(`/compare/${idA}/${idB}/report`);
}

export async function searchKnowledgeBase(query?: string): Promise<any> {
  return request<any>("/kb" + (query ? `?query=${encodeURIComponent(query)}` : ""));
}

export async function runResearchReport(companies: string[]): Promise<any> {
  return request<any>("/research", {
    method: "POST",
    body: JSON.stringify(companies)
  });
}

export interface ContactSubmission {
  name: string;
  email: string;
  topic: "feedback" | "vulnerability" | "integration" | "bug" | "other";
  other_topic?: string;
  message: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
}

export async function submitContactForm(data: ContactSubmission): Promise<ContactSubmissionResponse> {
  return request<ContactSubmissionResponse>("/contact", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
