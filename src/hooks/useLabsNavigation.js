import { useState, useEffect } from "react";
import axios from "utils/axios";
import { dashboards } from "app/navigation/dashboards";
import { NAV_TYPE_ITEM } from "constants/app.constant";

export const useLabsNavigation = () => {
  const [navigation, setNavigation] = useState([dashboards]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabsAndBuildNav = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/master/list-lab");
        const labsData = response.data.data;
        const employeeId = Number(localStorage.getItem("userId") || 0);

        const labNavItems = labsData
          .filter((lab) => {
            // PHP logic: find_in_set($employeeid,users)
            if (!lab.users) return false;
            if (Array.isArray(lab.users)) {
              return lab.users.includes(employeeId) || lab.users.map(String).includes(String(employeeId));
            }
            if (typeof lab.users === "string") {
              return lab.users.split(",").map(s => s.trim()).includes(String(employeeId));
            }
            return false;
          })
          .map((lab) => {
            // Slug MUST match useFetchLabs.js exactly
            const slug = (lab.name || '')
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[()]/g, '')
              .replace(/[^\w-]/g, '');

            return {
              id: `dashboards.material-list.${slug}`,
              type: NAV_TYPE_ITEM,
              path: `/dashboards/material-list/${slug}?labId=${lab.id}`,
              title: lab.name,
              transKey: `nav.dashboards.${slug}`,
            };
          });

        const updatedDashboards = JSON.parse(JSON.stringify(dashboards));
        const materialListIndex = updatedDashboards.childs.findIndex(
          (child) => child.id === "dashboards.material-list"
        );

        if (materialListIndex !== -1) {
          updatedDashboards.childs[materialListIndex].childs = labNavItems;
        }

        setNavigation([updatedDashboards]);
        setLoading(false);
      } catch (err) {
        console.error("Error loading labs:", err);
        setError(err);
        setLoading(false);
        setNavigation([dashboards]);
      }
    };

    fetchLabsAndBuildNav();
  }, []);

  return { navigation, loading, error };
};