export function requestCountLabel(requestCount: number) {
  return `${requestCount} open request${requestCount === 1 ? "" : "s"}`;
}

export function requestStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function fulfilledRequestLabel(vendorName: string) {
  return `Fulfilled with ${vendorName}`;
}

export function founderRequestActionLabel(status: string, vendorName?: string | null) {
  if (status === "fulfilled" && vendorName) {
    return `View ${vendorName}`;
  }

  if (status === "closed") {
    return "Closed by admin";
  }

  return "Waiting for admin match";
}

export function closedRequestLabel(adminNote?: string | null) {
  const note = adminNote?.trim();

  if (!note) {
    return "Closed without a note.";
  }

  return `Admin note: ${note}`;
}
