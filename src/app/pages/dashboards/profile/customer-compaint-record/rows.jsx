import PropTypes from "prop-types";
import clsx from "clsx";

// ----------------------------------------------------------------------

export function RefNoCell({ getValue }) {
  return (
    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wide text-xs-plus bg-blue-50/50 dark:bg-blue-900/10 px-1.5 py-0.5 rounded-md border border-blue-150/60 dark:border-blue-900/35">
      {getValue() || "—"}
    </span>
  );
}

RefNoCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

export function NCWorkCell({ getValue, row }) {
  const isNc = String(getValue() || "No").toLowerCase() === "yes";
  const comment = row?.original?.nccomment || row?.original?.nc_comment;
  return (
    <div className="flex flex-col gap-1 items-start">
      <span
        className={clsx(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border",
          isNc
            ? "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30"
            : "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
        )}
      >
        {isNc ? "Yes" : "No"}
      </span>
      {isNc && comment && (
        <span className="text-[11px] font-normal text-gray-500 dark:text-dark-300 italic max-w-[200px] break-words leading-tight">
          {comment}
        </span>
      )}
    </div>
  );
}

NCWorkCell.propTypes = {
  getValue: PropTypes.func.isRequired,
  row: PropTypes.object.isRequired,
};

const statusCodesMap = {
  0: "RCA is pending",
  1: "RCA is done CAPA submission is pending",
  2: "CAPA submission is done CAPA approval is pending",
  3: "CAPA execution is done CAPA verification is pending",
  4: "CAPA execution is done CAPA verified by QM",
  5: "CAPA has been verified complaint is closed",
  6: "CAPA approval is done CAPA execution is pending",
};

const statusColorsMap = {
  "RCA is pending": "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
  "RCA is done CAPA submission is pending": "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50",
  "CAPA submission is done CAPA approval is pending": "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50",
  "CAPA execution is done CAPA verification is pending": "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50",
  "CAPA execution is done CAPA verified by QM": "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
  "CAPA has been verified complaint is closed": "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50",
  "CAPA approval is done CAPA execution is pending": "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
  Open: "text-rose-600 bg-rose-50 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
  Closed: "text-emerald-600 bg-emerald-50 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
  Pending: "text-amber-600 bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
  "Under Investigation": "text-sky-600 bg-sky-50 border-sky-250 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50"
};

export function StatusCell({ getValue }) {
  const val = getValue();
  const statusStr = statusCodesMap[val] !== undefined ? statusCodesMap[val] : String(val || "RCA is pending");
  
  const colorClass =
    statusColorsMap[statusStr] ||
    statusColorsMap[val] ||
    "text-gray-500 bg-gray-50 border-gray-250 dark:bg-gray-800/20 dark:text-dark-200";

  return (
    <span className={clsx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border leading-snug whitespace-normal max-w-[180px]", colorClass)}>
      {statusStr}
    </span>
  );
}

StatusCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

export function CustomerSourceCell({ row }) {
  const data = row.original;
  const isCc = String(data.complaint_type || data.type || "").toUpperCase() === "CC" || !data.source;
  
  if (isCc) {
    // Address string builder matching PHP
    const addressParts = [];
    if (data.add1) addressParts.push(data.add1);
    if (data.add2) addressParts.push(data.add2);
    if (data.add3) addressParts.push(data.add3);
    if (data.city) addressParts.push(data.city);
    
    let addressStr = addressParts.join(", ");
    if (data.pincode) {
      addressStr += (addressStr ? " - " : "") + data.pincode;
    }
    if (data.state && String(data.state).toLowerCase() !== "other") {
      addressStr += (addressStr ? ", " : "") + data.state;
    }

    // Default fallback if parts are missing but pre-assembled address exists
    if (!addressStr && data.customer_address) {
      addressStr = data.customer_address;
    }

    return (
      <div className="flex flex-col gap-1 text-xs-plus">
        <span className="font-semibold text-gray-800 dark:text-dark-100 leading-snug">
          {data.customer_name_source || data.customer_name || data.name || "—"}
          {(data.customer_code || data.customercode) && (
            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 dark:bg-dark-800 px-1 py-0.5 rounded-md ml-1.5">
              {data.customer_code || data.customercode}
            </span>
          )}
        </span>
        {addressStr && (
          <span className="text-[11px] text-gray-500 dark:text-dark-300 leading-normal max-w-[220px] italic">
            {addressStr}
          </span>
        )}
      </div>
    );
  }

  // Otherwise, return source
  return (
    <span className="text-sm font-semibold text-gray-850 dark:text-dark-100 block">
      {data.source || data.customer_name_source || "—"}
    </span>
  );
}

CustomerSourceCell.propTypes = {
  row: PropTypes.object.isRequired,
};

export function ConcernPersonCell({ row }) {
  const data = row.original;
  const name = data.concern_name || data.concernpersonname || "—";
  const mobile = data.concern_mobile || data.concernpersonmobile || data.concern_phone;

  return (
    <div className="flex flex-col gap-0.5 text-xs-plus">
      <span className="font-semibold text-gray-800 dark:text-dark-100 leading-snug">{name}</span>
      {mobile && (
        <span className="text-[10px] font-mono text-gray-500 dark:text-dark-300 flex items-center gap-1">
          <svg className="size-3 text-gray-450" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.145-.44.02-.927.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          {mobile}
        </span>
      )}
    </div>
  );
}

ConcernPersonCell.propTypes = {
  row: PropTypes.object.isRequired,
};

export function StandardCell({ getValue }) {
  const val = getValue();
  return (
    <span className="text-xs-plus font-medium text-gray-850 dark:text-dark-100 truncate block max-w-[200px] whitespace-pre-wrap leading-relaxed">
      {val || "—"}
    </span>
  );
}

StandardCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

export function LongTextCell({ getValue }) {
  const val = getValue();
  return (
    <span className="text-xs font-normal text-gray-600 dark:text-dark-250 block min-w-[220px] max-w-[400px] whitespace-pre-wrap leading-relaxed break-words">
      {val || "—"}
    </span>
  );
}

LongTextCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};
