export const extractSalaryFromString = (jobInsightText: string) => {
  const regex =
    /\$\d+(?:,\d+)*(?:\.\d+)?(?:K|k)?\/(?:yr|hr|m)?(?:\s*-\s*\$\d+(?:,\d+)*(?:\.\d+)?(?:K|k)?\/(?:yr|hr|m)?)?/;
  const matches = jobInsightText.match(regex);
  if (matches) {
    const salary = matches[0];
    // Assuming you have a dispatch function and setSalary action creator function defined somewhere
    return salary;
  }
  return null; // Or whatever you want to return if there's no match
};

export const isEmptyArray = (array) => {
  if (!array || array.length === 0) {
    return true;
  }
  return false;
};

export const getAllinputId = () => {
  const ids = localStorage.getItem("ci_inputid");
  return ids;
};
export const setIdToLocalstorage = (id: any) => {
  let allInputId = [];
  const ids = localStorage.getItem("ci_inputid");
  if (ids) {
    const allIds = JSON.parse(ids);
    allInputId = [...allIds, id];
  } else {
    allInputId[id];
  }
  localStorage.setItem("ci_inputid", JSON.stringify(allInputId));
};

export function sanitizeHTML(htmlString) {
  // Remove inline styles
  htmlString = htmlString.replace(/<[^>]+? style="[^"]*?"/gi, "");

  // Remove all tags except 'p'
  htmlString = htmlString.replace(/<(\/)?(?!p\b)\w+[^>]*?>/g, "");

  // Remove &nbsp;
  htmlString = htmlString.replace(/&nbsp;/g, "");

  return htmlString;
}
