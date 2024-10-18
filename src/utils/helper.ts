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

  // Replace 'li' tags with bullet point only if there's content inside
  htmlString = htmlString.replace(
    /<li[^>]*>(.*?)<\/li>/gi,
    function (match, content) {
      // Trim content to remove leading/trailing whitespace
      const trimmedContent = content?.trim();
      // Only add bullet point if there's actual content
      if (trimmedContent) {
        return "• " + trimmedContent;
      }
      return "";
    }
  );

  // Remove all tags except 'p'
  htmlString = htmlString?.replace(/<(\/)?(?!p\b)\w+[^>]*?>/g, "");

  // Replace closing </p> tags with a newline character
  htmlString = htmlString?.replace(/<\/p>/g, "\n");

  // Remove opening <p> tags
  htmlString = htmlString?.replace(/<p[^>]*>/g, "");

  // Remove &nbsp;
  htmlString = htmlString?.replace(/&nbsp;/g, "");

  // Remove extra spaces and extra newlines
  htmlString = htmlString?.replace(/\s{2,}/g, " "); // Replace multiple spaces with a single space
  htmlString = htmlString?.replace(/\n{2,}/g, "\n"); // Replace multiple newlines with a single newline
  htmlString = htmlString?.trim(); // Trim leading and trailing spaces or newlines

  return htmlString;
}

export const getDomainName = () => {
  const pathurl = window.location.href.toLocaleLowerCase();
  const splitted = pathurl.split("/");
  if (splitted && splitted.length > 2) {
    const currentWebURL = splitted[2];
    return currentWebURL;
  }
  return "";
};
