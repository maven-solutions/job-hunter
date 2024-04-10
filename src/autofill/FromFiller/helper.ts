export const getMonthFromDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Get month in MM format
  return month;
};

export const getYearFromDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear(); // Get year in YYYY format
  return year.toString();
};
export const formatDateInDDMMYY = (inputDate: string): string => {
  const [year, month, day] = inputDate.split("-");

  return `${day}-${month}-${year}`;
};
