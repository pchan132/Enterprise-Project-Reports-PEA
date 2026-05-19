import type { ElectricalRequest, Prisma } from "@/app/generated/prisma/client";

const SEARCHABLE_STRING_FIELDS = [
  "id",
  "requestNo",
  "firstName",
  "lastName",
  "phone",
  "phone2",
  "address",
  "subDistrict",
  "district",
  "province",
  "description",
  "requestType",
  "meterOption",
  "caRefNo",
  "peaNo",
  "status",
] as const;

type SearchableStringField = (typeof SEARCHABLE_STRING_FIELDS)[number];

export function parseSearchKeyword(searchParams: URLSearchParams) {
  return searchParams.get("q")?.trim() ?? "";
}

export function buildElectricalRequestBaseWhere(searchParams: URLSearchParams) {
  const where: Prisma.ElectricalRequestWhereInput = {};
  const status = searchParams.get("status")?.trim();
  const district = searchParams.get("district")?.trim();
  const requestType = searchParams.get("requestType")?.trim();

  if (status) {
    where.status = status;
  }

  if (district) {
    where.district = district;
  }

  if (requestType) {
    where.requestType = requestType;
  }

  return where;
}

export function searchElectricalRequests<T extends ElectricalRequest>(
  requests: T[],
  keyword: string,
) {
  const tokens = tokenize(keyword);

  if (tokens.length === 0) {
    return requests;
  }

  return requests
    .map((request) => ({
      request,
      score: scoreRequest(request, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.request);
}

function scoreRequest(request: ElectricalRequest, tokens: string[]) {
  const values = getSearchValues(request);
  const searchable = values.map((value) => ({
    text: normalizeSearchText(value),
    compact: compactSearchText(value),
  }));

  let score = 0;

  for (const token of tokens) {
    const compactToken = compactSearchText(token);
    let tokenScore = 0;

    for (const value of searchable) {
      tokenScore = Math.max(tokenScore, scoreToken(value.text, value.compact, token, compactToken));

      if (tokenScore >= 100) {
        break;
      }
    }

    if (tokenScore === 0) {
      return 0;
    }

    score += tokenScore;
  }

  return score;
}

function scoreToken(value: string, compactValue: string, token: string, compactToken: string) {
  if (value === token || compactValue === compactToken) {
    return 100;
  }

  if (value.includes(token) || compactValue.includes(compactToken)) {
    return 70;
  }

  const words = value.split(" ").filter(Boolean);

  for (const word of words) {
    if (word.startsWith(token) || token.startsWith(word)) {
      return 55;
    }

    if (isSimilarWord(word, token)) {
      return 35;
    }
  }

  return 0;
}

function isSimilarWord(word: string, token: string) {
  if (token.length < 4 || word.length < 4) {
    return false;
  }

  const distance = levenshteinDistance(word, token);
  const maxDistance = token.length >= 8 ? 2 : 1;

  return distance <= maxDistance;
}

function tokenize(value: string) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function getSearchValues(request: ElectricalRequest) {
  const values = SEARCHABLE_STRING_FIELDS.map((field) =>
    valueToString(request[field as SearchableStringField]),
  );

  values.push(
    dateToSearchValue(request.requestDate),
    dateToSearchValue(request.targetDate),
    dateToSearchValue(request.createdAt),
    dateToSearchValue(request.updatedAt),
    request.lat === null ? "" : String(request.lat),
    request.long === null ? "" : String(request.long),
    request.isFollowUp ? "ติดตาม ใช่ true" : "ไม่ติดตาม ไม่ false",
  );

  return values.filter(Boolean);
}

function valueToString(value: ElectricalRequest[SearchableStringField]) {
  return value === null ? "" : String(value);
}

function dateToSearchValue(value: Date | null) {
  if (!value) {
    return "";
  }

  const isoDate = value.toISOString().slice(0, 10);
  const thaiDate = new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);

  return `${isoDate} ${thaiDate}`;
}

function levenshteinDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}
