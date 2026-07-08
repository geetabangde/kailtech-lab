// Import Dependencies
import clsx from "clsx";

// Local Imports
import { Button } from "components/ui";
import { SidebarToggleBtn } from "components/shared/SidebarToggleBtn";
import { Profile } from "../Profile";
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
        "app-header transition-content dark:border-dark-600 sticky top-0 z-20 flex h-[65px] items-center gap-1 border-b border-gray-200 bg-white/80 px-[var(--margin-x)] backdrop-blur-sm backdrop-saturate-150 max-sm:justify-between",
        cardSkin === "bordered" ? "dark:bg-dark-900/80" : "dark:bg-dark-700/80",
      )}
    >
      <div className="contents xl:hidden">
        <SidebarToggleBtn />
      </div>

      {/* Financial Year Selector — Moved to Left for visibility test */}
      <div className="dark:bg-dark-800 ml-2 flex items-center gap-2 rounded-lg bg-gray-100 p-1.5">
        <span className="text-[10px] font-bold tracking-tighter text-gray-500 uppercase">
          Fin Year
        </span>
        <select
          value={selectedFinYear || ""}
          onChange={(e) => setSelectedFinYear(e.target.value)}
          className="focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100 h-7 rounded border border-gray-300 bg-white px-1 text-xs font-bold focus:ring-1 focus:outline-none"
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
          className="h-7 px-3 text-[10px] font-bold"
          onClick={handleSetFinYear}
          disabled={!selectedFinYear || selectedFinYear === finyear}
        >
          SET
        </Button>
      </div>

      {/* Actions & Profile Section - Flexible Center for balance */}
      <div className="flex flex-1 items-center justify-end gap-4 px-[var(--margin-x)]">
        <Profile />
      </div>
    </header>
  );
}
