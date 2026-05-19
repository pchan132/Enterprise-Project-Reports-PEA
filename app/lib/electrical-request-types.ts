export const REQUEST_STATUSES = [
  "รับเรื่อง",
  "ตรวจสอบข้อมูล",
  "รอนัดหมาย",
  "กำลังดำเนินการ",
  "เสร็จสิ้น",
  "ยกเลิก",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type ElectricalRequestDto = {
  id: string;
  requestNo: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  phone2: string | null;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  lat: number | null;
  long: number | null;
  description: string | null;
  requestDate: string;
  requestType: string;
  meterOption: string | null;
  caRefNo: string | null;
  peaNo: string | null;
  status: string;
  isFollowUp: boolean;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ElectricalRequestsListResponse = {
  data: ElectricalRequestDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ElectricalRequestResponse = {
  data: ElectricalRequestDto;
};

export type ApiErrorResponse = {
  error?: string;
  errors?: string[];
};
