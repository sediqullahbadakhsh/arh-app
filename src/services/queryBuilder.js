export const buildQueryString = (filters = {}) => {
  return Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
};
