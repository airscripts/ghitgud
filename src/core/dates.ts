import { formatDistanceToNow, isFuture } from "date-fns";

const formatRelative = (date: string | Date | number): string => {
  const dateObj =
    typeof date === "number" ? new Date(date * 1000) : new Date(date);

  if (isFuture(dateObj)) {
    return `in ${formatDistanceToNow(dateObj)}`;
  }

  return `${formatDistanceToNow(dateObj)} ago`;
};

const formatDuration = (hours: number): string => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }

  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }

  const days = Math.round(hours / 24);
  if (days < 30) {
    return `${days}d`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months}mo`;
  }

  return `${Math.round(months / 12)}y`;
};

const formatDateShort = (date: string | Date | number): string => {
  const dateObj =
    typeof date === "number" ? new Date(date * 1000) : new Date(date);

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default {
  formatRelative,
  formatDuration,
  formatDateShort,
};
