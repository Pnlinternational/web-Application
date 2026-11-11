import type { BaseParams } from "@/api/types";

export const generateQueryString = (params: BaseParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString();
};

export const appendQueryString = (url: string, queryString?: string): string => {
  return queryString ? `${url}?${queryString}` : url;
};

export const appendQueryParams = (url: string, params: BaseParams): string => {
  const queryString = generateQueryString(params);
  return appendQueryString(url, queryString);
};

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
