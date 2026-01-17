import ErrorState from "./ErrorState";

interface ErrorStateWithButtonProps {
  message?: string;
  buttonText: string;
  onButtonClick: () => void;
}

export default function ErrorStateWithButton({
  message = "Failed to load data",
  buttonText,
  onButtonClick,
}: ErrorStateWithButtonProps) {
  return (
    <div>
      <ErrorState message={message} />
      <div className="mt-4 text-center">
        <button
          onClick={onButtonClick}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
