function draftKey(showtimeId) {
  return `ticketor.checkout.${showtimeId}`;
}

function confirmedBookingKey(showtimeId) {
  return `ticketor.confirmed-booking.${showtimeId}`;
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

export function loadConfirmedBooking(showtimeId, userId, selectedSeatIds) {
  if (!showtimeId || !userId || selectedSeatIds.length === 0) return null;

  try {
    const storedValue = sessionStorage.getItem(confirmedBookingKey(showtimeId));
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;
    const booking = parsedValue?.booking;

    if (!booking || parsedValue.userId !== userId) return null;

    const cachedSeatIds = (booking.tickets || [])
      .map((ticket) => String(ticket.seatId))
      .sort();
    const requestedSeatIds = selectedSeatIds.map(String).sort();

    return cachedSeatIds.length === requestedSeatIds.length
      && cachedSeatIds.every((seatId, index) => seatId === requestedSeatIds[index])
      ? booking
      : null;
  } catch {
    sessionStorage.removeItem(confirmedBookingKey(showtimeId));
    return null;
  }
}

export function saveConfirmedBooking(showtimeId, userId, booking) {
  if (!showtimeId || !userId || !booking) return;

  sessionStorage.setItem(
    confirmedBookingKey(showtimeId),
    JSON.stringify({ userId, booking })
  );
}
