const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/app/pages/dashboards/sales/test-packages/EditTestPackage.jsx");
let content = fs.readFileSync(filePath, "utf-8");

// Re-add the submit button markup correctly
const replaceFrom = `            )}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >`;

const replaceTo = `            )}
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >`;

if (content.includes(replaceFrom)) {
    content = content.replace(replaceFrom, replaceTo);
    fs.writeFileSync(filePath, content);
    console.log("Fixed!");
} else {
    // If the file got mangled in another way, let's fix it by regex
    // We want to insert the closing div of Parameters Section, and the Submit section
    // right before {submitting ? ...
    content = content.replace(
      /            \)\}[\s\S]*?(?=\{submitting)/,
      `            )}
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              `
    );
    fs.writeFileSync(filePath, content);
    console.log("Fixed via regex fallback!");
}
