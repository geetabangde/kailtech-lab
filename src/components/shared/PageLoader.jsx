// Import Dependencies
import PropTypes from "prop-types";

// Local Imports
import { Page } from "components/shared/Page";
import { Spinner } from "components/ui";

// ----------------------------------------------------------------------

export function PageLoader({ title = "Loading...", message = "Loading data..." }) {
  return (
    <Page title={title}>
      <div className="flex h-[60vh] items-center justify-center text-gray-600 dark:text-gray-400">
        <Spinner className="h-8 w-8 mr-3 text-primary-600" />
        <span className="text-lg font-medium">{message}</span>
      </div>
    </Page>
  );
}

PageLoader.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
};
