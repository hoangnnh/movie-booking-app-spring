function draftKey(showtimeId) {
  return `ticketor.checkout.${showtimeId}`;
}

export function loadFoodDraft(showtimeId) {
  if (!showtimeId) return [];

  try {
    const storedValue = sessionStorage.getItem(draftKey(showtimeId));
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;
    return Array.isArray(parsedValue?.foodItems) ? parsedValue.foodItems : [];
  } catch {
    sessionStorage.removeItem(draftKey(showtimeId));
    return [];
  }
}

export function saveFoodDraft(showtimeId, foodItems) {
  if (!showtimeId) return;

  sessionStorage.setItem(
    draftKey(showtimeId),
    JSON.stringify({ foodItems })
  );
}

export function clearFoodDraft(showtimeId) {
  if (!showtimeId) return;
  sessionStorage.removeItem(draftKey(showtimeId));
}
