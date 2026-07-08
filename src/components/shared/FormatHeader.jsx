import logo from "assets/krtc.jpg";

export function FormatHeader({
  companyName = "Kailtech Test And Research Centre Pvt. Ltd.",
  title,
  qfNo,
  issueNo,
  issueDate,
  revisionNo,
  revisionDate,
  page = "1 of 1",
}) {
  return (
    <div className="mb-4 w-full overflow-x-auto bg-white dark:bg-dark-900">
      <table className="w-full min-w-[800px] border border-gray-300 text-sm dark:border-dark-500">
        <tbody>
          <tr>
            {/* Logo & Company Name */}
            <td rowSpan="6" className="w-1/5 border border-gray-300 p-4 align-top dark:border-dark-500">
              <div className="flex flex-col items-start gap-2">
                <img
                  src={logo}
                  alt="Company Logo"
                  className="w-[150px] object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="text-left text-[9px] font-bold text-gray-800 dark:text-gray-200">
                  {companyName}
                </div>
              </div>
            </td>

            {/* Header Title */}
            <th
              rowSpan="6"
              className="w-1/2 border border-gray-300 p-4 text-center text-base font-bold text-gray-800 dark:border-dark-500 dark:text-gray-100 align-top"
            >
              {title}
            </th>

            {/* Row 1: QF. No. */}
            <th className="w-[15%] border border-gray-300 p-2 text-left font-semibold text-gray-700 dark:border-dark-500 dark:text-gray-300">
              QF. No.
            </th>
            <td className="w-[15%] border border-gray-300 p-2 text-gray-800 dark:border-dark-500 dark:text-gray-200">
              {qfNo}
            </td>
          </tr>

          {/* Row 2: Issue No. */}
          <tr>
            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700 dark:border-dark-500 dark:text-gray-300">
              Issue No.
            </th>
            <td className="border border-gray-300 p-2 text-gray-800 dark:border-dark-500 dark:text-gray-200">
              {issueNo}
            </td>
          </tr>

          {/* Row 3: Issue Date */}
          <tr>
            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700 dark:border-dark-500 dark:text-gray-300">
              Issue Date
            </th>
            <td className="border border-gray-300 p-2 text-gray-800 dark:border-dark-500 dark:text-gray-200">
              {issueDate}
            </td>
          </tr>

          {/* Row 4: Revision No. */}
          <tr>
            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700 dark:border-dark-500 dark:text-gray-300">
              Revision No.
            </th>
            <td className="border border-gray-300 p-2 text-gray-800 dark:border-dark-500 dark:text-gray-200">
              {revisionNo}
            </td>
          </tr>

          {/* Row 5: Revision Date */}
          <tr>
            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700 dark:border-dark-500 dark:text-gray-300">
              Revision Date
            </th>
            <td className="border border-gray-300 p-2 text-gray-800 dark:border-dark-500 dark:text-gray-200">
              {revisionDate}
            </td>
          </tr>

          {/* Row 6: Page */}
          <tr>
            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700 dark:border-dark-500 dark:text-gray-300">
              Page
            </th>
            <td className="border border-gray-300 p-2 text-gray-800 dark:border-dark-500 dark:text-gray-200">
              {page}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
