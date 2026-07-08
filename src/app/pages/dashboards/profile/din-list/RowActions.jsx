import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button } from "components/ui";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const actions = row.original.actions || [];

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-[150px]">
      {actions.map((action, idx) => {
        let color = "primary";
        const titleLower = action.title.toLowerCase();
        if (titleLower.includes("approve")) color = "success";
        else if (titleLower.includes("reject")) color = "error";
        else if (titleLower.includes("edit")) color = "warning";
        else if (titleLower.includes("add") || titleLower.includes("fill")) color = "info";

        let isInternalLink = false;
        let href = action.url;

        if (action.title.toLowerCase().includes("view din form")) {
          const idMatch = action.url.match(/\/(\d+)$/);
          if (idMatch) {
            const id = idMatch[1];
            href = `/dashboards/profile/din-list/view-din-form?hakuna=${id}`;
            isInternalLink = true;
          } else if (row.original.id) {
            href = `/dashboards/profile/din-list/view-din-form?hakuna=${row.original.id}`;
            isInternalLink = true;
          }
        }

        if (titleLower.includes("dispatch detail") || titleLower.includes("dispach detail")) {
          return (
            <Button
              key={idx}
              onClick={() => row.getTable().options.meta?.openDispatchModal(row.original)}
              size="xs"
              color={color}
              variant="soft"
              className={`px-2.5 py-1 font-semibold transition-all hover:bg-${color}-100`}
            >
              {action.title}
            </Button>
          );
        }

        if (isInternalLink) {
          return (
            <Button
              key={idx}
              component={Link}
              to={href}
              size="xs"
              color={color}
              variant="soft"
              className={`px-2.5 py-1 font-semibold transition-all hover:bg-${color}-100`}
            >
              {action.title}
            </Button>
          );
        }

        return (
          <Button
            key={idx}
            component="a"
            href={href}
            size="xs"
            color={color}
            variant="soft"
            className={`px-2.5 py-1 font-semibold transition-all hover:bg-${color}-100`}
          >
            {action.title}
          </Button>
        );
      })}
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
};
