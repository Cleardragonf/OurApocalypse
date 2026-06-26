import type { UiConnectionSettings } from "../types";

export function apiBase(settings: UiConnectionSettings): string {
  return settings.modApiBaseUrl.replace(/\/$/, "");
}

export function apiHeaders(settings: UiConnectionSettings): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-apocalypse-token": settings.adminToken,
  };
}
