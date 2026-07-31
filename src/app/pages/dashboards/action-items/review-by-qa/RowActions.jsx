import { Link } from "react-router-dom";
import PropTypes from "prop-types";

// ── Button style map (updated to include inline-block for Link) ────────────────
const btnCls = {
  primary: "inline-block rounded bg-blue-600 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-blue-700 active:scale-95 text-center leading-tight",
  info:    "inline-block rounded bg-cyan-500 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-cyan-600 active:scale-95 text-center leading-tight",
  warning: "inline-block rounded bg-amber-500 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-amber-600 active:scale-95 text-center leading-tight",
  success: "inline-block rounded bg-green-600 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-green-700 active:scale-95 text-center leading-tight",
  muted:   "inline-flex items-center rounded bg-gray-200 px-2 py-1 text-[10.5px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-center leading-tight",
};

export function RowActions({ row }) {
  // API field names from /actionitem/qa-report-list response
  const tid       = row.original.id;           // trfProducts.id
  const hid       = row.original.hod_id;       // hodrequests.id
  const hodStatus = row.original.hod_status;   // hodrequests.status
  const packtype  = row.original.package_type; // 0=upload, 1=perform

  switch (hodStatus) {

    // PHP: $trfstatus == 3
    case 3:
      return (
        <div className="flex flex-col gap-1">
          <Link to={`/dashboards/action-items/allot-quantity/${tid}`} className={btnCls.primary}>
            <>Allot <br /> Quantity</>
          </Link>
          <Link to={`/dashboards/action-items/delete-trf-item/${tid}`} className={btnCls.info}>
            <>Remove <br /> Item</>
          </Link>
        </div>
      );

    // PHP: $trfstatus == 4
    case 4:
      return (
        <Link to={`/dashboards/action-items/assign-chemist/${tid}`} className={btnCls.primary}>
          <>Assign <br /> Chemist</>
        </Link>
      );

    // PHP: $trfstatus == 5 — packtype==0 → Upload Report, else → Perform Test
    case 5:
      return packtype === 0 ? (
        <Link to={`/dashboards/action-items/upload-report/${tid}`} className={btnCls.primary}>
          <>Upload <br /> Report</>
        </Link>
      ) : (
        <Link to={`/dashboards/action-items/perform-test/${tid}`} className={btnCls.primary}>
          <>Perform <br /> Test</>
        </Link>
      );

    // PHP: $trfstatus == 6 → View Draft Report
    case 6:
      return (
        <Link to={`/dashboards/action-items/review-by-hod/${tid}`} className={btnCls.primary}>
          <>View <br /> Draft</>
        </Link>
      );

    // PHP: $trfstatus == 7 → Review By HOD
    case 7: {
      const url = hid ? `/dashboards/action-items/review-by-hod/${tid}?hid=${hid}` : `/dashboards/action-items/review-by-hod/${tid}`;
      return (
        <Link to={url} className={btnCls.primary}>
          <>Review <br /> By HOD</>
        </Link>
      );
    }

    // PHP: $trfstatus == 8 → Review By QA
    case 8: {
      const url = hid ? `/dashboards/action-items/review-by-qa/${tid}?hid=${hid}` : `/dashboards/action-items/review-by-qa/${tid}`;
      return (
        <Link to={url} className={btnCls.primary}>
          <>Review <br /> By QA</>
        </Link>
      );
    }

    // PHP: $trfstatus == 9 → Generate Final Report
    case 9:
      return (
        <Link to={`/dashboards/action-items/review-by-hod/${tid}`} className={btnCls.primary}>
          <>Generate <br /> Report</>
        </Link>
      );

    default:
      return (
        <span className={btnCls.muted}>Pending TRF <br /> Approval</span>
      );
  }
}

RowActions.propTypes = {
  row: PropTypes.object,
};
