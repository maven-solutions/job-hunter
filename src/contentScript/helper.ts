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
