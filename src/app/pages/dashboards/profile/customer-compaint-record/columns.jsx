import { createColumnHelper } from "@tanstack/react-table";
import {
  RefNoCell,
  NCWorkCell,
  StatusCell,
  StandardCell,
  LongTextCell,
  CustomerSourceCell,
  ConcernPersonCell,
} from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Complaint Ref No.
  columnHelper.accessor("ref_no", {
    id: "ref_no",
    header: "Complaint Ref No.",
    cell: RefNoCell,
  }),

  // 2. Date of receipt of complaint
  columnHelper.accessor("receipt_date", {
    id: "receipt_date",
    header: "Date of receipt of complaint",
    cell: StandardCell,
  }),

  // 3. Customer name(CCL) /Source
  columnHelper.accessor("customer_name_source", {
    id: "customer_name_source",
    header: "Customer name(CCL) /Source",
    cell: CustomerSourceCell,
  }),

  // 4. Concern Person Name
  columnHelper.accessor("concern_name", {
    id: "concern_name",
    header: "Concern Person Name",
    cell: ConcernPersonCell,
  }),

  // 5. Concern Person Email
  columnHelper.accessor("concern_email", {
    id: "concern_email",
    header: "Concern Person Email",
    cell: StandardCell,
  }),

  // 6. Complaint Received By & on date
  columnHelper.accessor("received_by_date", {
    id: "received_by_date",
    header: "Complaint Received By & on date",
    cell: StandardCell,
  }),

  // 7. Complaint Registered By & On Date
  columnHelper.accessor("registered_by_date", {
    id: "registered_by_date",
    header: "Complaint Registered By & On Date",
    cell: StandardCell,
  }),

  // 8. Reference Document No.
  columnHelper.accessor("ref_doc_no", {
    id: "ref_doc_no",
    header: "Reference Document No.",
    cell: StandardCell,
  }),

  // 9. Nature & Details of complaint
  columnHelper.accessor("nature_details", {
    id: "nature_details",
    header: "Nature & Details of complaint",
    cell: LongTextCell,
  }),

  // 10. Is NC Work
  columnHelper.accessor("is_nc_work", {
    id: "is_nc_work",
    header: "Is NC Work",
    cell: NCWorkCell,
  }),

  // 11. Type
  columnHelper.accessor("complaint_type", {
    id: "complaint_type",
    header: "Type",
    cell: StandardCell,
  }),

  // 12. CAPA Assigned to
  columnHelper.accessor("capa_assigned", {
    id: "capa_assigned",
    header: "CAPA Assigned to",
    cell: StandardCell,
  }),

  // 13. Validated By
  columnHelper.accessor("validated_by", {
    id: "validated_by",
    header: "Validated By",
    cell: StandardCell,
  }),

  // 14. RCA Done on
  columnHelper.accessor("rca_date", {
    id: "rca_date",
    header: "RCA Done on",
    cell: StandardCell,
  }),

  // 15. Status
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: StatusCell,
  }),
];
