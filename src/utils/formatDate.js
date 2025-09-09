export const formatDateTime = (isoString) => {
  if (!isoString) return "";

  const date = new Date(isoString);

  // Extract parts
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  // Time formatting
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 24h to 12h

  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
};
