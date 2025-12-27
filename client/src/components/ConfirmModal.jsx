// frontend/src/components/ConfirmModal.jsx
export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-96 animate-fadeIn">
        <h3 className="text-lg font-semibold dark:text-white mb-2">{title}</h3>
        <p className="dark:text-gray-300 mb-4">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded dark:border-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700"
          >
            Confirm Kill
          </button>
        </div>
      </div>
    </div>
  );
}
