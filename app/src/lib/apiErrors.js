export function formatApiError(error, fallback = "Something went wrong. Please try again.") {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
}

export function toastMutationError(toast, title = "Save failed") {
  return (error) => toast({ title, description: formatApiError(error), variant: "destructive" });
}

export function queryErrorMessage(error) {
  return formatApiError(error, "Could not load the latest data.");
}