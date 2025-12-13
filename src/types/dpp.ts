// src/types/dpp.ts

export interface EventItem {
  id?: number;
  event_id?: string;
  event_type?: string;
  action?: string;
  biz_step?: string;
  disposition?: string;
  event_time?: string;
  read_point?: string;
  biz_location?: string;

  event_hash?: string;

  epc_list?: string[];
  ilmd?: any;
  extensions?: any;

  // thêm product_code cho MerkleViewer hiển thị
  product_code?: string;
}

export interface DocumentItem {
  id?: number;
  file_name?: string;
  file_hash?: string;
  doc_bundle_id?: string;

  vc_hash?: string;
  vc_status?: string;
}

export interface DppResponse {
  batch: {
    batch_code: string;
    product_code?: string;
    quantity?: number;
    unit?: string;

    mfg_date?: string;
    country?: string;

    product?: {
      name?: string;
      brand?: string;
      gtin?: string;
    };
  };

  blockchain: {
    network: string;
    status: string;
    tx_hash: string;
    root_hash: string;
    block_number: number;
    ipfs_cid?: string | null;

    // 2 field này DppPage đang dùng, nên khai báo thêm
    ipfs_gateway?: string | null;
    created_at?: string | null;
  };

  events: EventItem[];
  documents: DocumentItem[];
}
