import type { ElectricalRequest, Prisma } from "@/app/generated/prisma/client";

type RequestBody = Record<string, unknown>;

type ParseResult<T> =
  | {
      data: T;
      errors?: never;
    }
  | {
      data?: never;
      errors: string[];
    };

type MutableElectricalRequestData = Record<
  string,
  string | string[] | number | boolean | Date | null | undefined
>;

const REQUIRED_CREATE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "subDistrict",
  "district",
  "requestDate",
  "requestType",
] as const;

const REQUIRED_STRING_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "subDistrict",
  "district",
  "requestType",
] as const;

const STRING_FIELDS = [
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

const DATE_FIELDS = ["requestDate", "targetDate"] as const;
const DECIMAL_FIELDS = ["lat", "long"] as const;
const BOOLEAN_FIELDS = ["isFollowUp"] as const;

export function isRequestBody(value: unknown): value is RequestBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCreateElectricalRequest(
  body: RequestBody,
): ParseResult<Prisma.ElectricalRequestCreateInput> {
  const errors: string[] = [];
  const data: MutableElectricalRequestData = {};
  const normalizedBody = normalizeBody(body);

  // Parse requestType as array
  if ("requestType" in normalizedBody) {
    const requestTypeValue = normalizedBody.requestType;
    let requestTypeArray: string[] = [];

    if (Array.isArray(requestTypeValue)) {
      requestTypeArray = requestTypeValue.filter(
        (item) => typeof item === "string" && item.length > 0,
      );
    } else if (typeof requestTypeValue === "string" && requestTypeValue.length > 0) {
      requestTypeArray = [requestTypeValue];
    }

    if (requestTypeArray.length === 0) {
      errors.push("requestType is required and must not be empty");
    } else {
      data.requestType = requestTypeArray;
    }
  } else {
    errors.push("requestType is required");
  }

  for (const field of STRING_FIELDS) {
    if (field !== "requestType" && field in normalizedBody) {
      const value = parseOptionalString(normalizedBody[field]);

      if (isRequiredStringField(field) && value === null) {
        errors.push(`${field} is required`);
        continue;
      }

      data[field] = value;
    }
  }

  for (const field of REQUIRED_CREATE_FIELDS) {
    if (field !== "requestType" && !(field in normalizedBody)) {
      errors.push(`${field} is required`);
    }
  }

  parseDateFields(normalizedBody, data, errors);
  parseDecimalFields(normalizedBody, data, errors);
  parseBooleanFields(normalizedBody, data, errors);

  if (data.requestDate === null) {
    errors.push("requestDate is required");
  }

  if (!data.province) {
    data.province = "ลพบุรี";
  }

  if (!data.status) {
    data.status = "รับเรื่อง";
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { data: data as Prisma.ElectricalRequestCreateInput };
}

export function parseUpdateElectricalRequest(
  body: RequestBody,
): ParseResult<Prisma.ElectricalRequestUpdateInput> {
  const errors: string[] = [];
  const data: MutableElectricalRequestData = {};
  const normalizedBody = normalizeBody(body);

  // Parse requestType as array if provided
  if ("requestType" in normalizedBody) {
    const requestTypeValue = normalizedBody.requestType;
    let requestTypeArray: string[] = [];

    if (Array.isArray(requestTypeValue)) {
      requestTypeArray = requestTypeValue.filter(
        (item) => typeof item === "string" && item.length > 0,
      );
    } else if (typeof requestTypeValue === "string" && requestTypeValue.length > 0) {
      requestTypeArray = [requestTypeValue];
    }

    if (requestTypeArray.length === 0) {
      errors.push("requestType cannot be empty");
    } else {
      data.requestType = requestTypeArray;
    }
  }

  for (const field of STRING_FIELDS) {
    if (field !== "requestType" && field in normalizedBody) {
      const value = parseOptionalString(normalizedBody[field]);

      if (isRequiredStringField(field) && value === null) {
        errors.push(`${field} cannot be empty`);
        continue;
      }

      data[field] = value;
    }
  }

  parseDateFields(normalizedBody, data, errors);
  parseDecimalFields(normalizedBody, data, errors);
  parseBooleanFields(normalizedBody, data, errors);

  if (Object.keys(data).length === 0 && errors.length === 0) {
    errors.push("No valid fields to update");
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { data: data as Prisma.ElectricalRequestUpdateInput };
}

export function serializeElectricalRequest(request: ElectricalRequest) {
  return {
    ...request,
    lat: request.lat === null ? null : Number(request.lat),
    long: request.long === null ? null : Number(request.long),
    requestDate: toDateInputValue(request.requestDate),
    targetDate:
      request.targetDate === null ? null : toDateInputValue(request.targetDate),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInteger(searchParams.get("pageSize"), 20),
    100,
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

function normalizeBody(body: RequestBody): RequestBody {
  if (!("meterOption" in body) && "metrerOption" in body) {
    return {
      ...body,
      meterOption: body.metrerOption,
    };
  }

  return body;
}

function isRequiredStringField(
  field: (typeof STRING_FIELDS)[number],
): field is (typeof REQUIRED_STRING_FIELDS)[number] {
  return REQUIRED_STRING_FIELDS.includes(
    field as (typeof REQUIRED_STRING_FIELDS)[number],
  );
}

function parseOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateFields(
  body: RequestBody,
  data: MutableElectricalRequestData,
  errors: string[],
) {
  for (const field of DATE_FIELDS) {
    if (!(field in body)) {
      continue;
    }

    const value = parseDateValue(body[field]);

    if (value === undefined) {
      errors.push(`${field} must be a valid date`);
      continue;
    }

    data[field] = value;
  }
}

function parseDecimalFields(
  body: RequestBody,
  data: MutableElectricalRequestData,
  errors: string[],
) {
  for (const field of DECIMAL_FIELDS) {
    if (!(field in body)) {
      continue;
    }

    const value = parseDecimalValue(body[field]);

    if (value === undefined) {
      errors.push(`${field} must be a valid number`);
      continue;
    }

    data[field] = value;
  }
}

function parseBooleanFields(
  body: RequestBody,
  data: MutableElectricalRequestData,
  errors: string[],
) {
  for (const field of BOOLEAN_FIELDS) {
    if (!(field in body)) {
      continue;
    }

    const value = parseBooleanValue(body[field]);

    if (value === undefined) {
      errors.push(`${field} must be true or false`);
      continue;
    }

    data[field] = value;
  }
}

function parseDateValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseDecimalValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseBooleanValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return undefined;
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (value === null) {
    return fallback;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : fallback;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
