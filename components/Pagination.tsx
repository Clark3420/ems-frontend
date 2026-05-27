type Props = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Show max 5 page buttons
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    if (currentPage <= 3) return pages.slice(0, 5);
    if (currentPage >= totalPages - 2) return pages.slice(totalPages - 5);
    return pages.slice(currentPage - 3, currentPage + 2);
  };

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <p className="text-xs text-gray-500">
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ←
        </button>

        {currentPage > 3 && totalPages > 5 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              1
            </button>
            <span className="text-gray-400 text-sm px-1">...</span>
          </>
        )}

        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        {currentPage < totalPages - 2 && totalPages > 5 && (
          <>
            <span className="text-gray-400 text-sm px-1">...</span>
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </div>
  );
}