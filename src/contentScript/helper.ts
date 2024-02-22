export const getPostedDate = (daysAgo: number): any => {
  // Get the current date
  const currentDate = new Date();

  // Calculate the date 4 days ago
  const millisecondsInADay = 24 * 60 * 60 * 1000;
  const postedDate = new Date(
    currentDate.getTime() - daysAgo * millisecondsInADay
  );
  return postedDate;
};

export const dateExtractorFromDom = (daysAgoEle: any): any => {
  const postedDate = daysAgoEle?.textContent?.trim().split("");
  if (postedDate.length === 1) {
    const currentDate = new Date();
    return currentDate;
  }

  if (postedDate[0] !== ".") {
    const getExactDate = getPostedDate(Number(postedDate[0]));
    return getExactDate;
  }
};

export const extractDateFromDiceDom = (daysAgoEle: any): any => {
  if (daysAgoEle) {
    const date = daysAgoEle?.textContent?.trim().split(" ");
    const getExactDate = getPostedDate(Number(date[1]));
    return getExactDate;
  }
};

export const extractDateFromZipRecruterDom = (dateEle: any): any => {
  const dateInArray = dateEle?.textContent?.trim().split(" ");
  dateInArray.shift();
  const date = dateInArray.join("");
  const formattedDate = date.replace(",", "");
  // Convert the formatted date string to a JavaScript Date object
  const jsDate = new Date(formattedDate);
  return jsDate;
};

export const getTimeInFormattetDesing = (inputTime: string) => {
  const date = new Date(inputTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const formattedDate = `${month}/${day}/${year}`;
  if (inputTime && formattedDate) {
    return formattedDate;
  } else {
    return "";
  }
};
