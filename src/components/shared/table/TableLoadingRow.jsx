import PropTypes from "prop-types";
import { Tr, Td, Spinner } from "components/ui";

export function TableLoadingRow({ colSpan = 1, message = "Loading..." }) {
  return (
    <Tr>
      <Td colSpan={colSpan} className="h-32 text-center border-b border-gray-100 last:border-0 dark:border-dark-600">
        <div className="flex items-center justify-center text-primary-600 w-full h-full">
          <Spinner color="primary" className="h-6 w-6 mr-3" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      </Td>
    </Tr>
  );
}

TableLoadingRow.propTypes = {
  colSpan: PropTypes.number,
  message: PropTypes.string,
};
