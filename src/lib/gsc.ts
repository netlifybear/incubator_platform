const GSC_API = "https://www.googleapis.com/webmasters/v3";

export type GscSite = {
  siteUrl: string;
  permissionLevel: string;
};

export type GscLinkCount = {
  referringDomain: string;
  count: number;
};

export async function listGscSites(accessToken: string): Promise<GscSite[]> {
  const res = await fetch(`${GSC_API}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC sites list failed: ${text}`);
  }

  const data = await res.json() as { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> };
  return data.siteEntry ?? [];
}

export async function fetchTopLinkingDomains(
  accessToken: string,
  siteUrl: string,
  limit = 20,
): Promise<GscLinkCount[]> {
  const encoded = encodeURIComponent(siteUrl);

  const res = await fetch(
    `${GSC_API}/sites/${encoded}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: dateStringMonthsAgo(3),
        endDate: dateStringToday(),
        dimensions: ["linkSection", "referringDomain"],
        rowLimit: limit,
      }),
    },
  );

  if (!res.ok) {
    // Some GSC accounts may not have search analytics data. Fallback.
    return [];
  }

  const data = await res.json() as { rows?: Array<{ keys: string[]; clicks: number; impressions: number }> };

  if (!data.rows) return [];

  const domainMap = new Map<string, number>();
  for (const row of data.rows) {
    const domain = row.keys[1] ?? row.keys[0];
    if (domain) {
      domainMap.set(domain, (domainMap.get(domain) ?? 0) + row.clicks);
    }
  }

  return Array.from(domainMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([referringDomain]) => ({ referringDomain, count: 1 }));
}

function dateStringMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function dateStringToday(): string {
  return new Date().toISOString().slice(0, 10);
}
