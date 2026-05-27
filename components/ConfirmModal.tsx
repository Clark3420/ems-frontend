type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: "red" | "blue" | "green";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  confirmColor = "red",
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  const colorMap = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg transition ${colorMap[confirmColor]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}