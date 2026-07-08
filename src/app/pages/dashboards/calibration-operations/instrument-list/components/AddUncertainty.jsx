import { useState } from "react";
import { Button } from "components/ui/button";
import RawData from "./RawData";
import { useParams } from "react-router-dom";

export default function AddUncertainty({
  // eslint-disable-next-line no-unused-vars
  instid,
  instrumentId: propInstrumentId,
  formatId,
  onComplete,
  onBack,
}) {

  const { id } = useParams();
  const [instrumentId] = useState(propInstrumentId || id);
  const [loading] = useState(false);

  // ✅ Save handler - Bypass API, just proceed
  const handleSave = async () => {
    onComplete();
  };

  if (!formatId) {
    return <div className="p-6 text-red-600">Invalid format ID.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-[98%] space-y-6">
        <RawData instrumentId={instrumentId} formatId={formatId} />

        {/* Save Button */}
        <div className="mt-4 flex flex-row items-center justify-between gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-md bg-white border border-gray-300 px-8 py-3 text-lg font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            ← Back
          </Button>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{ cursor: loading ? "not-allowed" : "pointer" }}
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save & Next
          </button>
        </div>
      </div>
    </div>
  );
}
