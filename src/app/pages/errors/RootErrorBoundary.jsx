// Import Depndencies
import { isRouteErrorResponse, useRouteError } from "react-router";
import { lazy } from "react";

// Local Imports
import { Loadable } from "components/shared/Loadable";

// ----------------------------------------------------------------------

const app = {
  401: lazy(() => import("./401")),
  404: lazy(() => import("./404")),
  429: lazy(() => import("./429")),
  500: lazy(() => import("./500")),
};

function RootErrorBoundary() {
  const error = useRouteError();

  // Handle Chunk Loading Errors (usually caused by a new deployment)
  const isChunkLoadError =
    error?.name === "ChunkLoadError" ||
    error?.message?.match(
      /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Expected a JavaScript-or-Wasm module script/i
    );

  if (isChunkLoadError) {
    // Prevent infinite reload loops
    if (!sessionStorage.getItem("chunk_reload")) {
      sessionStorage.setItem("chunk_reload", "true");
      window.location.reload();
      return <div className="flex h-screen items-center justify-center text-gray-500">Loading new version...</div>;
    }
  } else {
    sessionStorage.removeItem("chunk_reload");
  }

  if (isRouteErrorResponse(error)) {
    const Component = Loadable(app[error.status]);
    return <Component />;
  }

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <h2 className="text-xl font-semibold text-gray-700">Something went wrong</h2>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Reload Page
      </button>
    </div>
  );
}

export default RootErrorBoundary;
