import type { ClientConfig } from "../types/client-config.js";

export type TransferWindowConfig = {
  transferWindowStart: string | null;
  transferWindowEnd: string | null;
};

function parseMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

function dateAtMinutes(base: Date, minutes: number): Date {
  const date = new Date(base);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

function hasTransferWindow(client: TransferWindowConfig | null | undefined): client is {
  transferWindowStart: string;
  transferWindowEnd: string;
} {
  return Boolean(client?.transferWindowStart && client.transferWindowEnd);
}

export function isTransferWindowOpen(
  client: TransferWindowConfig | null | undefined,
  now = new Date()
): boolean {
  if (!hasTransferWindow(client)) {
    return true;
  }

  const start = parseMinutes(client.transferWindowStart);
  const end = parseMinutes(client.transferWindowEnd);

  if (start === end) {
    return true;
  }

  const current = now.getHours() * 60 + now.getMinutes();

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

export function nextTransferWindowStart(
  client: TransferWindowConfig | null | undefined,
  now = new Date()
): Date {
  if (!hasTransferWindow(client) || isTransferWindowOpen(client, now)) {
    return now;
  }

  const start = parseMinutes(client.transferWindowStart);
  const end = parseMinutes(client.transferWindowEnd);
  const current = now.getHours() * 60 + now.getMinutes();
  const todayStart = dateAtMinutes(now, start);

  if (start < end) {
    if (current < start) {
      return todayStart;
    }

    const tomorrowStart = dateAtMinutes(now, start);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return tomorrowStart;
  }

  return todayStart;
}

export function transferWindowLabel(
  client: TransferWindowConfig | null | undefined
): string {
  if (!hasTransferWindow(client)) {
    return "Sempre ativo";
  }

  return `${client.transferWindowStart} ate ${client.transferWindowEnd}`;
}
