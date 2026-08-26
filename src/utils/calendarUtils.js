export function getCalendarDays(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();

  // JS: Sunday = 0, Monday = 1...
  // We want Monday = 0
  const startingDay =
    (firstDayOfMonth.getDay() + 6) % 7;

  const days = [];

  // Empty cells before the first day
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      new Date(year, month, day)
    );
  }

  // Complete the last week so every row has seven cells.
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
