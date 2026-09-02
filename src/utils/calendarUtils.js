export function getCalendarDays(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);

  // Converts Sunday-first into Monday-first.
  const startingDay =
    (firstDayOfMonth.getDay() + 6) % 7;

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const numberOfCells =
    Math.ceil((startingDay + daysInMonth) / 7) * 7;

  return Array.from(
    { length: numberOfCells },
    (_, index) =>
      new Date(
        year,
        month,
        index - startingDay + 1
      )
  );
}

export function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
