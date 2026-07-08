import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import toast from "react-hot-toast";

export default function EditExpenseCategory() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`/expense-categories/${id}`)
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setName(d.name ?? "");
        setDescription(d.description ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.put(`/expense-categories/${id}`, { name, description });
      toast.success("Expense category updated");
      navigate("/dashboards/accounts/expense-category");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update expense category");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200";

  if (loading) return (
    <Page title="Edit Expense Category">
      <div className="flex h-[60vh] items-center justify-center text-gray-500 text-sm">Loading...</div>
    </Page>
  );

  return (
    <Page title="Edit Expense Category">
      <div className="px-[var(--margin-x)] py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Edit Expense Category
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboards/accounts/expense-category")}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-dark-500 dark:hover:bg-dark-700"
          >
            &laquo; Back
          </button>
        </div>

        <Card className="max-w-lg p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Description/Symbol</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Update"}
            </button>
          </form>
        </Card>
      </div>
    </Page>
  );
}
