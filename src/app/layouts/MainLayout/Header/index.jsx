// Import Dependencies
import clsx from "clsx";

// Local Imports
import { SidebarToggleBtn } from "components/shared/SidebarToggleBtn";
import { Button } from "components/ui";
import { Notifications } from "components/template/Notifications";
import { RightSidebar } from "components/template/RightSidebar";
import { useThemeContext } from "app/contexts/theme/context";
import { useAuthContext } from "app/contexts/auth/context";
import { getFinancialYears } from "utils/financialYear";
import { useState, useEffect } from "react";

// ----------------------------------------------------------------------

export function Header() {
  const { cardSkin } = useThemeContext();
  const { finyear, changeFinYear } = useAuthContext();
  const [selectedFinYear, setSelectedFinYear] = useState(finyear);
  const finYears = getFinancialYears();

  useEffect(() => {
    setSelectedFinYear(finyear);
  }, [finyear]);

  const handleSetFinYear = () => {
    if (selectedFinYear && selectedFinYear !== finyear) {
      changeFinYear(selectedFinYear);
    }
  };

  return (
    <header
      className={clsx(
        "app-header transition-content dark:border-dark-600 sticky top-0 z-20 flex h-[65px] shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-[var(--margin-x)] backdrop-blur-sm backdrop-saturate-150",
        cardSkin === "shadow" ? "dark:bg-dark-750/80" : "dark:bg-dark-900/80",
      )}
    >
      <SidebarToggleBtn />

      {/* Financial Year Selector - Centered Section */}
      <div className="flex items-center gap-2">
        <label className="dark:text-dark-200 text-sm font-semibold whitespace-nowrap text-gray-700">
          Fin Year
        </label>
        <select
          value={selectedFinYear || ""}
          onChange={(e) => setSelectedFinYear(e.target.value)}
          className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium shadow-sm focus:ring-1 focus:outline-none"
        >
          {finYears.map((fy) => (
            <option key={fy} value={fy}>
              {fy}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="filled"
          color="primary"
          className="h-8 px-4 text-xs font-bold transition-all hover:scale-105 active:scale-95"
          onClick={handleSetFinYear}
          disabled={!selectedFinYear || selectedFinYear === finyear}
        >
          SET
        </Button>
      </div>

      <div className="flex items-center gap-2 ltr:-mr-1.5 rtl:-ml-1.5">
        <Notifications />
        <RightSidebar />
      </div>
    </header>
  );
}
