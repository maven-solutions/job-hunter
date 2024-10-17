export const getMonthFromDate = (dateString: string): string => {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Get month in MM format
  return month;
};

export const getYearFromDate = (dateString: string): string => {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  const year = date.getFullYear(); // Get year in YYYY format
  return year.toString();
};
export const formatDateInDDMMYY = (inputDate: string): string => {
  if (inputDate) {
    const [year, month, day] = inputDate?.split("-");
    return `${day}-${month}-${year}`;
  } else {
    return "";
  }
};

export function getMonthShortForm(
  dateString: string | null | undefined
): string {
  if (!dateString) {
    return ""; // Return empty string if input is null, undefined or empty
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return ""; // Return empty string if the date is invalid
  }

  const monthShortNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthIndex = date.getUTCMonth(); // Get the month index (0-11)

  return monthShortNames[monthIndex];
}
