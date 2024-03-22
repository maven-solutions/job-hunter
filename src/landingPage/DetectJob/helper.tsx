/* eslint-disable no-prototype-builtins */
/* eslint-disable vars-on-top */
/* eslint-disable func-names */
/* eslint-disable no-var */
/* eslint-disable no-lonely-if */
/* eslint-disable one-var */
/* eslint-disable no-plusplus */
/* eslint-disable prefer-template */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-destructuring */
/* eslint-disable radix */

function replaceInJSON(jsonString: string = "") {
  const pattern = /"([^"]*[A-Z][^"]*)"/g;

  const modifiedText = jsonString?.replace(pattern, (_, match) => match);
  return modifiedText;
}

function parseToArray(inputString: string) {
  try {
    // const parsedJSON = JSON.parse(`${inputString}`);
    const parsedJSON = JSON.parse(inputString?.replaceAll("\\", ""));

    if (Array.isArray(parsedJSON)) {
      return parsedJSON;
    }

    for (const key in parsedJSON) {
      if (Array.isArray(parsedJSON[key])) {
        return parsedJSON[key];
      }
    }
  } catch (error) {
    console.error("Error parsing the input string:", error);
    try {
      const parsedJSON = JSON.parse(`${inputString}`);
      console.log({ parsedJSON });

      if (Array.isArray(parsedJSON)) {
        console.log("parsedJSON 11", parsedJSON);
        return parsedJSON;
      }

      for (const key in parsedJSON) {
        if (Array.isArray(parsedJSON[key])) {
          console.log("parsedJSON 22", parsedJSON[key]);

          return parsedJSON[key];
        }
      }
    } catch (error) {
      console.error("Error parsing the input string:", error);
      return null;
    }
  }
}

export function extractArrayFromString(inputString: string) {
  console.log({ inputString });
  // const dataPrepared = inputString?.replaceAll(/'/g, '"')?.replaceAll("\n", "");
  const dataPrepared = inputString
    ?.replaceAll(/'/g, '"')
    ?.replaceAll("\n", "")
    ?.replaceAll(/\uFFFD/g, "")
    ?.replaceAll("\u0002", "")
    ?.replaceAll(".n", ".");

  const arrayRegex = /\[.*?\]/g;

  const arrayMatch = dataPrepared?.match(arrayRegex);

  if (arrayMatch && arrayMatch.length > 0) {
    const arrayString = arrayMatch[arrayMatch.length - 1]
      .replace(/(\w+):/g, '"$1":') // Add double quotes around property names
      .replace(/'/g, '"'); // Replace single quotes with double quotes

    try {
      return arrayString;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return dataPrepared;
    }
  } else {
    console.error("No valid array found in the input string");
    return dataPrepared;
  }
}

const decodeString = (str: any) => {
  return str?.replace(/\\u[\dA-F]{4}/gi, (unicode: any) => {
    return String.fromCharCode(parseInt(unicode.replace(/\\u/g, ""), 16));
  });
};

function replaceQuotes(str: any) {
  return str?.replace(/(\w)["'](\w)/g, "$1$2");
}

function removeColonsFromStringValues(jsonString: any) {
  // Parse the JSON string into an array of objects
  var objArray = JSON?.parse(jsonString);

  // Iterate over each object in the array
  objArray.forEach(function (obj: any) {
    // Iterate over each key-value pair in the object
    for (var key in obj) {
      if (obj?.hasOwnProperty(key)) {
        // Check if the value is a string
        if (typeof obj[key] === "string") {
          // Replace any occurrences of ':' within the value
          obj[key] = obj[key].replace(/:/g, "");
        }
      }
    }
  });

  // Convert the modified array of objects back to a JSON string
  return JSON.stringify(objArray);
}

export function parseJsonArrayOrObject(jsonString: string) {
  const data: any = extractArrayFromString(
    decodeString(
      replaceQuotes(jsonString?.replace(/\\/g, ""))
        ?.replaceAll("\n  ", "")
        ?.replaceAll(/\\/g, "")
        ?.replaceAll("▪", ".")
        ?.replace(/\s+/g, " ")
        ?.replaceAll(' "', '"')
        ?.replaceAll('" ', '"')
        ?.replaceAll(" [", "[")
        ?.replaceAll(" ]", "]")
        ?.replace(/\\n\\t\\/g, "")
        ?.replace(/\\/g, "")
        ?.replace("[{}]", "")
    )
  );

  console.log("jsons data", data, typeof data);

  return parseToArray(data);
}

export function formatMonthYearToDate(monthYearString: string) {
  const monthMap: any = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const parts = monthYearString.split(/\s+|[-\/]/);

  if (parts.length === 1) {
    parts[1] = parts[0];
    parts[0] = "Jan";
  }

  const monthAbbreviation = parts[0];
  const year = parts[1];

  const day = "01";
  const month =
    monthMap[monthAbbreviation] !== undefined ? monthMap[monthAbbreviation] : 1;

  if (year?.trim()?.length === 4) {
    return "";
  } else {
    // If year is a string, return null
    return "";
  }
}

export function formatDateWhileUploading(value: string = "") {
  const inputDate = value?.replace(/[^a-zA-Z0-9\s]/g, " ");
  console.log({ inputDate });
  if (!inputDate) return ""; // Return empty string if input is empty

  const date = inputDate.trim();
  let parts = date.split(/[\s/-]+/); // Split the input string by space, slash, or hyphen

  // Define month names and their corresponding numbers
  const monthNames: any = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };

  // Replace short and long form month names with corresponding numbers
  parts = parts.map((part) => monthNames[part?.toLowerCase()] || part);

  // Determine the format of the input date
  let yearIndex, monthIndex, dayIndex;
  if (parts.length === 1) {
    // Year only (e.g., 'yyyy-mm' or 'mm-yyyy')
    if (date.includes("/")) {
      [yearIndex, monthIndex] = date.split("/").map(Number);
      if (yearIndex && monthIndex) {
        return `${yearIndex}-${("0" + monthIndex).slice(-2)}-01T04:12:14.673Z`;
      }
    } else if (date.includes("-")) {
      [yearIndex, monthIndex] = date.split("-").map(Number);
      if (yearIndex && monthIndex) {
        return `${yearIndex}-${("0" + monthIndex).slice(-2)}-01T04:12:14.673Z`;
      }
    }
  } else if (parts.length === 2) {
    // Year and month provided (e.g., 'mm yyyy' or 'yyyy mm')
    const [firstPart, secondPart]: any = parts;
    if (firstPart.length === 4 && secondPart.length <= 2) {
      return `${firstPart}-${("0" + secondPart).slice(-2)}-01T04:12:14.673Z`;
    } else if (secondPart.length === 4 && firstPart.length <= 2) {
      return `${secondPart}-${("0" + firstPart).slice(-2)}-01T04:12:14.673Z`;
    }
  } else if (parts.length === 3) {
    // Full date provided (e.g., 'dd mm yyyy' or 'yyyy mm dd' or 'mm/dd/yyyy' or 'mm-dd-yyyy')
    const regex = /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}$/; // Regular expression for date formats
    if (regex.test(date)) {
      const [part1, part2, part3]: any = date?.match(/\d+/g)?.map(Number); // Extract numbers from the date
      // Check if the date format is mm/dd/yyyy or mm-dd-yyyy
      if (part1 <= 12 && part2 <= 31 && part3 <= 9999) {
        yearIndex = part3;
        monthIndex = part1;
        dayIndex = part2;
      } else {
        // Check if the date format is dd mm yyyy or yyyy mm dd
        if (parts[0].length === 4) {
          yearIndex = parts[0];
          monthIndex = parts[1];
          dayIndex = parts[2];
        } else if (parts[2].length === 4) {
          yearIndex = parts[2];
          monthIndex = parts[1];
          dayIndex = parts[0];
        }
      }
      return `${yearIndex}-${("0" + monthIndex).slice(-2)}-01T04:12:14.673Z`;
    }
  }

  // If none of the formats matched, return empty string
  return "";
}

function minimizeProfSummaryParagraph(text: any) {
  const sentences = text.split(". ");

  const result = sentences.slice(0, 6);

  const finalResult = result.join(". ");

  return finalResult;
}

export function extractSummary(inputString: any) {
  const words = inputString?.split(":");

  const longWords = words?.filter((word: any) => word?.length > 150);

  const data = longWords?.length > 0 ? longWords : "";
  if (typeof data !== "string") {
    return minimizeProfSummaryParagraph(data[0]?.replaceAll(/"/g, ""));
  } else {
    return minimizeProfSummaryParagraph(data?.replaceAll(/"/g, ""));
  }
}

export function createSelectOption(value: string) {
  return {
    label: value,
    value,
  };
}

export const convertDescriptionToBulletPoints = (str = "") => {
  const sentences = str?.replaceAll("-", "")?.split(/(?<=[.!?])\s+/);

  const bulletPoints = sentences
    ?.filter((elem) => elem?.length > 5)
    ?.map((sentence) => {
      return `<li>${sentence}.</li>`;
    });

  return bulletPoints?.join("").length > 20
    ? `<ul>${bulletPoints?.join("")?.replaceAll("..", ".")}</ul>`
    : "";
};
