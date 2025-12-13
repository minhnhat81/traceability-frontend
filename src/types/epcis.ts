// src/types/epcis.ts

/* ============================================================
   RAW EVENT (theo DB) - KHÔNG ĐỤNG TỚI
   Đây là type bạn gửi, tôi giữ nguyên
============================================================ */
export interface EPCISEventRaw {
  id: number;

  tenant_id?: number | null;
  event_type?: string | null;
  batch_code?: string | null;
  product_code?: string | null;
  event_time?: string | null;
  action?: string | null;
  biz_step?: string | null;
  disposition?: string | null;
  read_point?: string | null;
  biz_location?: string | null;

  epc_list?: any;

  ilmd?: {
    dpp?: any;
    [key: string]: any;
  };

  extensions?: any;

  event_time_zone_offset?: string | null;
  biz_transaction_list?: any;
  context?: any;

  event_id?: string | null;
  event_hash?: string | null;

  doc_bundle_id?: string | null;
  vc_hash_hex?: string | null;

  verified?: boolean;
  verify_error?: string | null;

  raw_payload?: any;

  created_at?: string | null;
  updated_at?: string | null;

  batch_id?: number | null;
  dpp_id?: number | null;
  dpp_passport_id?: number | null;
}

/* ============================================================
   CLEAN EVENT (UI cần)
   Loại bỏ null | undefined và chuẩn hóa field
============================================================ */
export interface EPCISEvent {
  event_id: string;
  event_type: string;
  action: string;
  biz_step: string;
  disposition: string;
  event_time: string;
  read_point: string;
  biz_location: string;
  epc_list?: any;
  ilmd?: any;
  extensions?: any;
}

/* ============================================================
   DOCUMENT
============================================================ */
export interface DppDocument {
  id: string | number;
  file_name: string;
  file_hash: string;
  doc_bundle_id: string;
  vc_status?: string;
}

/* ============================================================
   FULL API RESPONSE
============================================================ */
export interface DppResponse {
  batch: any;
  blockchain: any;

  // RAW EVENTS (backend trả về)
  events: EPCISEventRaw[];

  // DOCUMENTS
  documents: DppDocument[];

  // fallback dpp_json
  dpp_json?: any;
}
