/**
 * WMSF01PdfDocument — react-pdf/renderer version ของฟอร์ม WMSF01
 * ใช้ใน wmsf01-print-form.tsx ผ่าน pdf() → Blob → download
 */
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ElectricalRequestDto } from "@/app/lib/electrical-request-types";

// ---------------------------------------------------------------------------
// Register Sarabun font (Thai) — served from /public/fonts/
// Use window.location.origin so the URL works on any host/port.
// ---------------------------------------------------------------------------
const origin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

Font.register({
  family: "Sarabun",
  fonts: [
    { src: `${origin}/fonts/Sarabun-Regular.ttf`, fontWeight: 400 },
    { src: `${origin}/fonts/Sarabun-Bold.ttf`, fontWeight: 700 },
  ],
});

// ---------------------------------------------------------------------------
// Thai text normalizer — fixes react-pdf ำ (sara am) truncation bug.
// The character ำ (U+0E33) is sometimes decomposed by react-pdf's layout
// engine into ํ (U+0E4D) + า (U+0E32), but the string-length calculation
// still uses the pre-decomposition count, causing all subsequent characters
// to be silently dropped. Pre-normalizing avoids this.
// ---------------------------------------------------------------------------
function normalizeThai(text: string | null | undefined): string {
  if (!text) return "";
  return String(text).replace(/\u0E33/g, "\u0E4D\u0E32");
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 11,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: "#ffffff",
    color: "#000000",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  formCode: {
    fontSize: 12,
    fontWeight: 700,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 6,
    flex: 1,
  },

  // ── Info row (dotted underline fields) ──
  infoSection: {
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 3,
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 700,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomStyle: "dotted",
    borderBottomColor: "#000000",
    paddingBottom: 1,
    paddingLeft: 2,
    minHeight: 16,
  },

  // ── Section heading ──
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 2,
    marginTop: 6,
  },

  // ── Table ──
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    borderStyle: "solid",
  },
  thead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  thNo: {
    width: 30,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    padding: 3,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  thLabel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    padding: 3,
    fontSize: 10,
    fontWeight: 700,
  },
  thData: {
    width: "30%",
    padding: 3,
    fontSize: 10,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    minHeight: 18,
  },
  tdNo: {
    width: 30,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    padding: 3,
    paddingTop: 4,
    fontSize: 10,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  tdLabel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    padding: 3,
    paddingTop: 4,
    fontSize: 10,
    fontWeight: 700,
    flexWrap: "wrap",
  },
  tdData: {
    width: "30%",
    padding: 3,
    paddingTop: 4,
    fontSize: 10,
    flexWrap: "wrap",
  },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 20,
  },
  footerText: {
    fontSize: 10,
    fontWeight: 700,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatThaiDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00+07:00`));
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
type Props = {
  request?: ElectricalRequestDto | null;
  peaOfficeName?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function WMSF01PdfDocument({
  request,
  peaOfficeName = "",
}: Props) {
  const fullName = normalizeThai(
    request ? `${request.firstName} ${request.lastName}`.trim() : ""
  );

  const address = normalizeThai(
    request
      ? `${request.address} จ.${request.province} อ.${request.district} ต.${request.subDistrict}`
      : ""
  );

  const requestTypeStr = request
    ? Array.isArray(request.requestType)
      ? request.requestType.join(", ")
      : request.requestType ?? ""
    : "";

  const reasonData = normalizeThai(
    `${request?.meterOption ?? ""} ${requestTypeStr}`.trim() || ""
  );

  // ── Section 1 items ──
  const section1Items = [
    { no: 1, label: normalizeThai("สายจดหน่วย :"), data: "" },
    { no: 2, label: normalizeThai("ประเภทการใช้ไฟ :"), data: "" },
    { no: 3, label: normalizeThai("ประเภทอุตสาหกรรม :"), data: "" },
    { no: 4, label: normalizeThai("ค่าประมาณการใช้ไฟ :                  หน่วย/เดือน"), data: "" },
    { no: 5, label: normalizeThai("เหตุผลการขอใช้ไฟ /สับเปลี่ยน/รื้อถอน/ต่อกลับ/ตัดฝาก :"), data: reasonData },
    { no: 6, label: normalizeThai("หมายเลขผู้ใช้ไฟฟ้า 6 หลัก :"), data: normalizeThai(request?.caRefNo) },
    { no: 7, label: normalizeThai("หมายเลข PEA มิเตอร์ติดตั้งก่อน :"), data: normalizeThai(request?.peaNo) },
    { no: 8, label: normalizeThai("หมายเลข PEA มิเตอร์ติดตั้งหลัง :"), data: "" },
    { no: 9, label: normalizeThai("สถานีจ่ายไฟระบบ             /เควี"), data: "" },
    { no: 10, label: normalizeThai("หมายเลข PEA หม้อแปลง :"), data: "" },
    { no: 11, label: normalizeThai("ติดตั้งมิเตอร์ขนาด ______ Amp เฟส A B C"), data: "" },
    { no: 12, label: normalizeThai("ติดมิเตอร์ที่เสา ______ เมตร เครื่องที่ ______"), data: "" },
    { no: 13, label: normalizeThai("วันที่สำรวจ :"), data: "" },
    { no: 14, label: normalizeThai("ชื่อผู้สำรวจ และรหัสพนักงาน :"), data: "" },
  ];

  // ── Section 2 items ──
  const section2Items = [
    { no: 15, label: normalizeThai("หมายเลข PEA มิเตอร์นำไปติดตั้ง/สับเปลี่ยน/ต่อกลับ :"), data: "" },
    { no: 16, label: normalizeThai("หน่วยมิเตอร์ที่อ่านได้ (จากลำดับที่ 15) :"), data: "" },
    { no: 17, label: normalizeThai("หมายเลข PEA มิเตอร์ที่รื้อถอน :"), data: "" },
    { no: 18, label: normalizeThai("หน่วยมิเตอร์ที่อ่านได้ (จากลำดับ 17) :"), data: "" },
    { no: 19, label: normalizeThai("วันที่ติดตั้ง/สับเปลี่ยน/รื้อถอน/ตัดฝาก/ต่อกลับ :"), data: normalizeThai(formatThaiDate(request?.targetDate)) },
    { no: 20, label: normalizeThai("ระยะเวลาการปฏิบัติงาน :"), data: "" },
    { no: 21, label: normalizeThai("ติดตั้งมิเตอร์ เฟส A B C"), data: "" },
    { no: 22, label: normalizeThai("หมายเลข PEA หม้อแปลง :"), data: "" },
    { no: 23, label: normalizeThai("ชื่อผู้ติดตั้ง / รหัสพนักงาน / ศูนย์งานผู้รับจ้าง :"), data: "" },
  ];

  return (
    <Document
      title={`WMSF01-${request?.requestNo ?? request?.id ?? "form"}`}
      author="PEA"
      subject="แบบฟอร์มการสำรวจการขอใช้ไฟใหม่"
    >
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.headerRow}>
          <Text style={s.title}>
            {normalizeThai("แบบฟอร์มการสำรวจการขอใช้ไฟใหม่ ติดตั้ง สับเปลี่ยน รื้อถอน ต่อกลับ ตัดฝาก รายย่อย")}
          </Text>
          <Text style={s.formCode}>WMSF01</Text>
        </View>

        {/* วันที่รับคำร้อง */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 700 }}>
            {normalizeThai(`วันที่รับคำร้อง: ${formatThaiDate(request?.requestDate)}`)}
          </Text>
        </View>

        {/* ── Info rows ── */}
        <View style={s.infoSection}>
          {/* ชื่อการไฟฟ้า */}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>{normalizeThai("ชื่อการไฟฟ้า")}</Text>
            <Text style={s.infoValue}>{normalizeThai(peaOfficeName)}</Text>
          </View>

          {/* เลขที่คำร้อง */}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>{normalizeThai("เลขที่คำร้องระบบเดิม")}</Text>
            <Text style={s.infoValue}>{normalizeThai(request?.requestNo)}</Text>
            <Text style={s.infoLabel}>{normalizeThai("เลขที่คำร้องระบบ SAP")}</Text>
            <Text style={s.infoValue}></Text>
          </View>

          {/* ชื่อผู้ใช้ไฟ */}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>{normalizeThai("ชื่อผู้ใช้ไฟ")}</Text>
            <Text style={[s.infoValue, { fontSize: 12 }]}>{fullName}</Text>
          </View>

          {/* ที่อยู่ */}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>{normalizeThai("ที่อยู่")}</Text>
            <Text style={[s.infoValue, { fontSize: 11 }]}>{address}</Text>
          </View>

          {/* เบอร์โทร */}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>{normalizeThai("เบอร์โทรสำรอง")}</Text>
            <Text style={[s.infoValue, { fontSize: 12 }]}>{normalizeThai(request?.phone2)}</Text>
            <Text style={s.infoLabel}>{normalizeThai("เบอร์โทร")}</Text>
            <Text style={[s.infoValue, { fontSize: 12 }]}>{normalizeThai(request?.phone)}</Text>
          </View>
        </View>

        {/* ── SECTION 1 ── */}
        <Text style={s.sectionTitle}>{normalizeThai("ส่วนที่ 1 ของผู้สำรวจ (ผบค.)")}</Text>
        <View style={s.table}>
          {/* thead */}
          <View style={s.thead}>
            <Text style={s.thNo}>{normalizeThai("ลำดับ")}</Text>
            <Text style={s.thLabel}>{normalizeThai("รายการ")}</Text>
            <Text style={s.thData}>{normalizeThai("ข้อมูล")}</Text>
          </View>
          {/* rows */}
          {section1Items.map((item) => (
            <View key={item.no} style={s.row}>
              <Text style={s.tdNo}>{item.no}</Text>
              <Text style={s.tdLabel}>{item.label}</Text>
              <Text style={s.tdData}>{item.data}</Text>
            </View>
          ))}
        </View>

        {/* ── SECTION 2 ── */}
        <Text style={s.sectionTitle}>{normalizeThai("ส่วนที่ 2 ของผู้ติดตั้ง สับเปลี่ยน รื้อถอน ต่อกลับ ตัดฝาก (ผมต.)")}</Text>
        <View style={s.table}>
          {/* thead */}
          <View style={s.thead}>
            <Text style={s.thNo}>ลำดับ</Text>
            <Text style={s.thLabel}>รายการ</Text>
            <Text style={s.thData}>ข้อมูล</Text>
          </View>
          {/* rows */}
          {section2Items.map((item) => (
            <View key={item.no} style={s.row}>
              <Text style={s.tdNo}>{item.no}</Text>
              <Text style={s.tdLabel}>{item.label}</Text>
              <Text style={s.tdData}>{item.data}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer: Lat/Long ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Lat {request?.lat}</Text>
          <Text style={s.footerText}>Lon {request?.long}</Text>
        </View>

      </Page>
    </Document>
  );
}
