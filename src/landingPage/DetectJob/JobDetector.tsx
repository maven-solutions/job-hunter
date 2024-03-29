import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./index.css";
import {
  glassDoorNotiification,
  simplyHiredNotiification,
} from "../../component/InfoNotification";
import {
  addButtonToGlassdoorWebsite,
  addButtonToSimplyHired,
} from "../../component/CareerAibutton";
import Logo from "../../component/Logo";
import JobFrom from "../../contentScript/JobFrom";
import LoginFrom from "../../auth/LoginForm/LoginFrom";
import SignupForm from "../../auth/signup/Signup";
import DisplayJob from "../../page/displayJob/DisplayJob";
import Profile from "../../page/profile/Profile";
import JobDetail from "../../page/jobDetail/JobDetail";
import MenuPopUp from "../../component/menuPopup/MenuPopUp";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import Linkedin from "../../jobExtractor/Linkedin";
import {
  EXTENSION_ACTION,
  SHOW_PAGE,
  SUPPORTED_WEBSITE,
} from "../../utils/constant";
import { setJobFoundStatus } from "../../store/features/JobDetail/JobDetailSlice";
import SimplyHiredJob from "../../jobExtractor/SimplyHired";
import Dice from "../../jobExtractor/Dice";
import Indeed from "../../jobExtractor/Indeed";
import Ziprecruiter from "../../jobExtractor/Ziprecuriter";
import Builtin from "../../jobExtractor/Builtin";
import Glassdoor from "../../jobExtractor/Glassdoor";
import {
  logoutUser,
  setToken,
  setUser,
} from "../../store/features/Auth/AuthSlice";
import { uploadPDFPromptCollection } from "./uploadPDFPromptCollection";
import {
  convertDescriptionToBulletPoints,
  createSelectOption,
  extractSummary,
  formatDateWhileUploading,
  parseJsonArrayOrObject,
} from "./helper";
import { getToken } from "../../config/axiosInstance";

const JobDetector = () => {
  const [showIcon, setShowIcon] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [postUrl, setPostUrl] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [showPage, setShowPage] = useState<string>("");

  const dispatch = useAppDispatch();
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });
  const jobDetailState: any = useAppSelector((store: RootStore) => {
    return store.JobDetailSlice;
  });

  useEffect(() => {
    if (
      [
        "linkedin",
        "indeed",
        "dice",
        "ziprecruiter",
        "glassdoor",
        "simplyhired",
        "builtin",
        "localhost",
        "openai",
      ].some((domain) => window.location.href.includes(domain))
    ) {
      setShowIcon(true);
    }
  }, []);

  useEffect(() => {
    if (window.location.href.includes("openai.")) {
      setWebsite(SUPPORTED_WEBSITE.openai);
    }
    if (window.location.href.includes("linkedin.")) {
      setWebsite(SUPPORTED_WEBSITE.linkedin);
    }
    if (window.location.href.includes("simplyhired.")) {
      setWebsite(SUPPORTED_WEBSITE.simplyhired);
    }

    if (
      window.location.href.includes("dice.") &&
      window.location.href.includes("job-detail")
    ) {
      setWebsite(SUPPORTED_WEBSITE.dice);
    }
    if (window.location.href.includes("indeed.")) {
      setWebsite(SUPPORTED_WEBSITE.indeed);
    }
    if (window.location.href.includes("ziprecruiter.")) {
      setWebsite(SUPPORTED_WEBSITE.ziprecruiter);
    }
    if (window.location.href.includes("builtin.")) {
      setWebsite(SUPPORTED_WEBSITE.builtin);
    }

    if (
      window.location.href.includes("glassdoor.") &&
      window.location.href.includes("job-listing")
    ) {
      setWebsite(SUPPORTED_WEBSITE.glassdoor);
    }

    loadUser();
  }, [postUrl]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const url = window.location.href;
      // chrome.runtime.sendMessage({ action: "urlChange", url });
      if (url !== postUrl) {
        setPostUrl(url);
      }
    });

    // Observe changes in the DOM
    observer.observe(document, { childList: true, subtree: true });
  }, []);
  const loadUser = () => {
    chrome.storage.local.get(["ci_user"]).then((result) => {
      const data = result.ci_user;
      dispatch(setUser(data));
    });
    chrome.storage.local.get(["ci_token"]).then((result: any) => {
      const data = result.ci_token;
      dispatch(setToken(data));
    });
  };
  const loadUser1 = () => {
    chrome.storage.local.get(["ci_user"]).then((result) => {
      dispatch(setUser(JSON.parse(result.ci_user)));
    });
    chrome.storage.local.get(["ci_token"]).then((result) => {
      dispatch(setToken(JSON.parse(result.ci_token)));
    });
  };

  useEffect(() => {
    if (authState.authenticated) {
      setShowPage("");
    }
  }, [authState.authenticated]);

  const handleLogOut = () => {
    dispatch(logoutUser());
    setShowPage("");
  };
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // console.log("date message::", message);
      if (message.action === EXTENSION_ACTION.LOGIN_TO_CI_EXTENSION) {
        loadUser();
      }
      if (message.action === EXTENSION_ACTION.LOGOUT_TO_CI_EXTENSION) {
        handleLogOut();
      }
      // return true;
    });

    // setTimeout(() => {
    //   chrome.storage.sync.get(["maven_resume_token"]).then((result) => {
    //     console.log("Value is " + result.maven_resume_token);
    //   });
    // }, 5000);
    // let intervalId: any = "";
    // if (
    //   window.location.href.includes("glassdoor") &&
    //   !window.location.href.includes("job-listing")
    // ) {
    //   glassDoorNotiification();
    //   // Clear any existing intervals before setting a new one
    //   intervalId = setInterval(addButtonToGlassdoorWebsite, 3000);
    // }
    // if (window.location.href === "https://www.simplyhired.com/") {
    //   simplyHiredNotiification();
    //   intervalId = setInterval(addButtonToSimplyHired, 3000);
    // }
    // // Clear the interval when the component unmounts
    // return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    console.log("entered");
    const divToEmbedInto = document.querySelector(".stretch");
    let imgElement; // Declare imgElement variable outside the if block

    const handleClick = async (event) => {
      // Find all elements with data-testid attribute matching the pattern
      const divsWithTestId = document.querySelectorAll(
        '[data-testid^="conversation-turn-"]'
      );

      // let maxNumber = -Infinity;
      // let parentDivv = null;
      let lastId = null;

      // Iterate through each element and find the one with the highest number
      divsWithTestId.forEach((div) => {
        const id = div.getAttribute("data-testid");
        lastId = id;
        console.log({ id });
        // const number = parseInt(id.split("-")[1]);

        // if (!isNaN(number) && number > maxNumber) {
        //   maxNumber = number;
        //   parentDivv = div;
        // }
      });
      console.log("this is CONTENT", `[data-testid="${lastId}"]`);
      // if (parentDivv) {
      //   // Rest of your code remains the same
      //   // ...
      // }

      // Find the div with the specified data-testid attribute
      const parentDiv = document.querySelector(`[data-testid="${lastId}"]`);

      if (parentDiv) {
        const textContent: any = parentDiv.textContent
          .replace(/<\/?[^>]+(>|$)/g, "")
          .trim();
        console.log("Text content:", textContent);
      }

      if (parentDiv) {
        const textContent: any = parentDiv.textContent
          .replace(/<\/?[^>]+(>|$)/g, "")
          .trim();
        console.log("Text content:", textContent);

        const token = await getToken();

        console.log({ token });

        if (token) {
          setIsGenerating(true);
          try {
            const listResponse = await fetch(
              "https://d2fa6tipx2eq6v.cloudfront.net/api/v1/applicants/",
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            // console.log({ listResponse });
            if (listResponse.ok) {
              const responseData = await listResponse.json();
              console.log({ responseData }, responseData?.data?.length);

              if (responseData?.data?.length === 6) {
                alert(
                  "You aleady have a 6 resumes. So delete some of the existing resume to generate new one."
                );
                setIsGenerating(false);
              } else {
                if (textContent?.length) {
                  (async () => {
                    function isInTheExtractedData(passedItem: any) {
                      const temp = textContent?.replaceAll("\n", " ");
                      console.log("check, ", temp, passedItem);
                      return temp.includes(passedItem);
                    }

                    function isMultipleInTheExtractedData(passedItems: any) {
                      const temp = textContent
                        ?.replaceAll("\n", " ")
                        ?.toLowerCase();
                      console.log("check, ", temp, passedItems);
                      return passedItems.some((item: any) =>
                        temp.includes(item?.toLowerCase())
                      );
                    }

                    var inputString = "";

                    // var replacedString = replaceBrackets(inputString);
                    // console.log(replacedString);

                    const allPrompts: any = uploadPDFPromptCollection(
                      textContent
                        ?.replaceAll("\n \n", "")
                        ?.replaceAll("[", "STARTBRACKET")
                        ?.replaceAll("]", "ENDBRACKET")
                    );

                    const headers = {
                      "Content-Type": "application/json",
                      "Access-Control-Allow-Origin": "*",
                    };

                    console.log({ token });

                    try {
                      const urls = [
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                        `https://d2fa6tipx2eq6v.cloudfront.net/api/v1/gpt/write`,
                      ];

                      const requests = urls.map((url: string, index: number) =>
                        fetch(url, {
                          method: "POST",
                          headers,
                          body: JSON.stringify({
                            prompt: allPrompts[index]?.prompt,
                          }),
                          // body: JSON.stringify({
                          //   key: allPrompts[index]?.key,
                          //   data: textContent?.replaceAll("\n \n", ""),
                          // }),
                        })
                      );

                      const responses = await Promise.all(requests);
                      const jsons = await Promise.all(
                        responses.map((response) => response.json())
                      );
                      console.log({ jsons });
                      console.log(
                        "datax 0",

                        jsons[0]?.data
                      );
                      console.log(
                        "datax 1",

                        jsons[1]?.data
                      );
                      console.log(
                        "datax 2",

                        jsons[2]?.data
                      );
                      console.log(
                        "datax 3",

                        jsons[3]?.data
                      );
                      console.log(
                        "datax 4",

                        jsons[4]?.data
                      );
                      console.log(
                        "datax 5",

                        jsons[5]?.data
                      );
                      console.log(
                        "datax 6",

                        jsons[6]?.data
                      );

                      const personalinforesponse = JSON.parse(jsons[0]?.data);
                      const professionalSummaryResponse = jsons[1]?.data;
                      const skillsResponse =
                        (await parseJsonArrayOrObject(
                          jsons[2]?.data?.replaceAll(":", "--")
                        )) || [];
                      const employmentResponse =
                        (await parseJsonArrayOrObject(jsons[3]?.data)) || [];
                      const educationResponse =
                        (await parseJsonArrayOrObject(jsons[4]?.data)) || [];
                      const certificationResponse =
                        (await parseJsonArrayOrObject(jsons[5]?.data)) || [];
                      const languageResponse =
                        (await parseJsonArrayOrObject(jsons[6]?.data)) || [];
                      const internshipResponse =
                        (await parseJsonArrayOrObject(jsons[7]?.data)) || [];
                      const volunteeringResponse =
                        (await parseJsonArrayOrObject(jsons[8]?.data)) || [];
                      const courseResponse =
                        (await parseJsonArrayOrObject(jsons[10]?.data)) || [];
                      const referenceResponse =
                        (await parseJsonArrayOrObject(jsons[9]?.data)) || [];
                      const achievementResponse =
                        (await parseJsonArrayOrObject(jsons[11]?.data)) || [];
                      const hobbiesResponse =
                        (await parseJsonArrayOrObject(jsons[12]?.data)) || [];

                      console.log(
                        "dataxx 0",

                        personalinforesponse,
                        typeof personalinforesponse
                      );
                      console.log(
                        "dataxx 1",

                        professionalSummaryResponse,
                        typeof professionalSummaryResponse
                      );
                      console.log(
                        "dataxx 2",

                        skillsResponse,
                        typeof skillsResponse
                      );
                      console.log(
                        "dataxx 3",

                        employmentResponse,
                        typeof employmentResponse
                      );

                      console.log(
                        "dataxx 4",

                        certificationResponse,
                        typeof certificationResponse
                      );

                      console.log(
                        "dataxx 5",

                        languageResponse,
                        typeof languageResponse
                      );

                      console.log(
                        "dataxx 6",

                        internshipResponse,
                        typeof internshipResponse
                      );

                      console.log(
                        "dataxx 7",

                        volunteeringResponse,
                        typeof volunteeringResponse
                      );

                      console.log(
                        "dataxx 8",

                        courseResponse,
                        typeof courseResponse
                      );

                      console.log(
                        "dataxx 9",

                        referenceResponse,
                        typeof referenceResponse
                      );
                      console.log(
                        "dataxx 10",

                        achievementResponse,
                        typeof achievementResponse
                      );
                      console.log(
                        "dataxx 11",

                        hobbiesResponse,
                        typeof hobbiesResponse
                      );

                      const personalInfo = {
                        user: uuidv4(),
                        country:
                          createSelectOption(personalinforesponse?.country) ||
                          null,
                        state:
                          createSelectOption(personalinforesponse?.state) ||
                          null,
                        city:
                          createSelectOption(personalinforesponse?.city) ||
                          null,
                        customPreferredRole:
                          createSelectOption(
                            personalinforesponse?.customPreferredRole
                          ) || null,
                        name: personalinforesponse?.name || "",
                        phoneNumber: personalinforesponse?.phoneNumber || "",
                        emailAddress: personalinforesponse?.email || "",
                        zipCode: personalinforesponse?.zipCode || "",
                        templateName: "kathmandu",
                        fontFamily: "PlusJakartaSans",
                        title: null,
                        isStudent: 0,
                        isAiCreated: null,
                        color: "#000000",
                      };

                      const professionalInfo = {
                        title: "Professional Summary",
                        order: 512,
                        section: "professional-summary",
                        canBeDeleted: 1,
                        data: {
                          description:
                            extractSummary(professionalSummaryResponse)
                              ?.replaceAll("STARTBRACKET", "[")
                              ?.replaceAll("ENDBRACKET", "]") || "",
                        },
                      };

                      const skillsField = {
                        title: "Skills",
                        order: 1536,
                        section: "skills",
                        canBeDeleted: 1,
                        data:
                          skillsResponse?.length > 0
                            ? skillsResponse
                                .slice(0, 11)
                                ?.filter((skill: any) => {
                                  const isHobby = hobbiesResponse?.some(
                                    (hobby: any) =>
                                      hobby?.hobbyName?.trim() ===
                                      skill?.skillItem?.trim()
                                  );
                                  return !isHobby;
                                })
                                ?.map((el: any) => {
                                  if (el?.trim()) {
                                    return {
                                      id: uuidv4(),
                                      skillTitle:
                                        el?.trim()?.replaceAll("--", ":") || "",
                                      skillDescription: "",
                                      skillExpertise: "",
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const employmentField = {
                        title: "Employment History",
                        order: 5731,
                        section: "employment-history",
                        canBeDeleted: 1,
                        data:
                          employmentResponse?.length > 0
                            ? employmentResponse
                                ?.map((el: any) => {
                                  if (
                                    Object.values(el).some((value) => value)
                                  ) {
                                    if (
                                      isInTheExtractedData(
                                        el.employer || el.employeer
                                      ) &&
                                      !el.jobTitle
                                        ?.toLowerCase()
                                        ?.includes("intern")
                                    ) {
                                      return {
                                        id: uuidv4(),
                                        employeer:
                                          el.employeer || el.employer || "",
                                        jobTitle: el.jobTitle || "",
                                        description:
                                          convertDescriptionToBulletPoints(
                                            el.description
                                          ) || "",
                                        startDate: formatDateWhileUploading(
                                          el?.startDate || ""
                                        ),
                                        endDate: formatDateWhileUploading(
                                          el?.endDate || ""
                                        ),
                                        country: createSelectOption(
                                          el?.country
                                        ),
                                        state: createSelectOption(el?.state),
                                        city: createSelectOption(el?.city),
                                        zipcode: el.zipcode || "",
                                        isWorking: false,
                                      };
                                    }
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const educationField = {
                        title: "Education",
                        order: 6322,
                        section: "education",
                        canBeDeleted: 1,
                        data:
                          educationResponse?.length > 0
                            ? educationResponse
                                ?.map((el: any) => {
                                  if (
                                    Object.values(el).some((value) => value)
                                  ) {
                                    return {
                                      id: uuidv4(),
                                      field: el.fieldOfStudy || "",
                                      school: el.schoolName || "",
                                      description:
                                        convertDescriptionToBulletPoints(
                                          el.description
                                        ) || "",
                                      startDate: formatDateWhileUploading(
                                        el?.startDate || ""
                                      ),
                                      endDate: formatDateWhileUploading(
                                        el?.endDate || ""
                                      ),
                                      country: createSelectOption(el?.country),
                                      state: createSelectOption(el?.state),
                                      city: createSelectOption(el?.city),
                                      zipcode: el.zipcode || "",
                                      isStudy: false,
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const certificationField = {
                        title: "Certification",
                        order: 1024,
                        section: "certification",
                        canBeDeleted: 1,
                        data:
                          certificationResponse?.length > 0
                            ? certificationResponse
                                ?.map((el: any) => {
                                  if (
                                    Object.values(el).some((value) => value)
                                  ) {
                                    return {
                                      id: uuidv4(),
                                      certificateName: el.certificateName || "",
                                      certificateID: el.certificateID || "",
                                      issueOrg: el.issueOrg || "",
                                      issueDate: formatDateWhileUploading(
                                        el?.issueDate || ""
                                      ),
                                      expiryDate: formatDateWhileUploading(
                                        el?.expiryDate || ""
                                      ),
                                      isExpiry: false,
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const languageField = {
                        title: "Language",
                        order: 6400,
                        section: "language",
                        canBeDeleted: 1,
                        data:
                          languageResponse?.length > 0
                            ? languageResponse
                                ?.map((el: any) => {
                                  if (el?.languageName?.trim()) {
                                    return {
                                      id: uuidv4(),
                                      title: el?.languageName?.trim() || "",
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const employmentResponseFields = employmentResponse || [];

                      const fieldsToCheck = ["employeer", "jobTitle"];

                      const shouldIgnoreInternship = (internshipEntry: any) => {
                        for (const empEntry of employmentResponseFields) {
                          let match = true;
                          for (const field of fieldsToCheck) {
                            if (
                              internshipEntry.title?.trim() !==
                              empEntry[field]?.trim()
                            ) {
                              match = false;
                              break;
                            }
                          }
                          if (match) {
                            return true;
                          }
                        }
                        return false;
                      };

                      const internshipField = {
                        title: "Internship",
                        order: 6500,
                        section: "internship",
                        canBeDeleted: 1,
                        data:
                          internshipResponse?.length > 0
                            ? internshipResponse
                                ?.map((el: any) => {
                                  if (
                                    Object.values(el).some((value) => value) &&
                                    !shouldIgnoreInternship(el) &&
                                    !["institution_name", "title"].some((key) =>
                                      ["not mentioned", "n/a"].includes(
                                        el[key]?.toLowerCase()
                                      )
                                    )
                                  ) {
                                    return {
                                      id: uuidv4(),
                                      institution_name:
                                        el.institutionName || "",
                                      title: el.internshipTitle || "",
                                      description:
                                        convertDescriptionToBulletPoints(
                                          el.description
                                        ) || "",
                                      startDate: formatDateWhileUploading(
                                        el?.startDate || ""
                                      ),
                                      endDate: formatDateWhileUploading(
                                        el?.endDate || ""
                                      ),
                                      country: createSelectOption(el?.country),
                                      state: createSelectOption(el?.state),
                                      city: createSelectOption(el?.city),
                                      zipcode: el.zipcode || "",
                                      isPresent: false,
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };
                      const volunteeringField = {
                        title: "Volunteering",
                        order: 6600,
                        section: "volunteering",
                        canBeDeleted: 1,
                        data:
                          volunteeringResponse?.length > 0
                            ? volunteeringResponse
                                ?.map((el: any) => {
                                  if (
                                    Object.values(el).some((value) => value) &&
                                    textContent
                                      ?.replaceAll("\n", " ")
                                      ?.toLowerCase()
                                      ?.includes(
                                        el.institutionName?.toLowerCase()
                                      )
                                  ) {
                                    return {
                                      id: uuidv4(),
                                      institution_name:
                                        el.institutionName || "",
                                      role: el.role || "",
                                      description:
                                        convertDescriptionToBulletPoints(
                                          el.description
                                        ) || "",
                                      startDate: formatDateWhileUploading(
                                        el?.startDate || ""
                                      ),
                                      endDate: formatDateWhileUploading(
                                        el?.endDate || ""
                                      ),
                                      country: createSelectOption(el?.country),
                                      state: createSelectOption(el?.state),
                                      city: createSelectOption(el?.city),
                                      zipcode: el.zipcode || "",
                                      isPresent: false,
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const educationResponseFields = educationResponse || [];

                      const fieldsToCheck1 = ["field", "school"];

                      const shouldIgnoreCourse = (courseEntry: any) => {
                        for (const empEntry of educationResponseFields) {
                          let match = true;
                          for (const field of fieldsToCheck1) {
                            if (courseEntry.course_name !== empEntry[field]) {
                              match = false;
                              break;
                            }
                          }
                          if (match) {
                            return true;
                          }
                        }
                        return false;
                      };

                      const courseField = {
                        title: "Course",
                        order: 6700,
                        section: "course",
                        canBeDeleted: 1,
                        data:
                          courseResponse?.length > 0
                            ? courseResponse
                                ?.map((el: any) => {
                                  if (
                                    Object.values(el).some((value) => value) &&
                                    !shouldIgnoreCourse(el)
                                  ) {
                                    return {
                                      id: uuidv4(),
                                      institution_name:
                                        el.institutionName || "",
                                      course_name: el.courseName || "",
                                      description:
                                        convertDescriptionToBulletPoints(
                                          el.description
                                        ) || "",
                                      startDate: formatDateWhileUploading(
                                        el?.startDate || ""
                                      ),
                                      endDate: formatDateWhileUploading(
                                        el?.endDate || ""
                                      ),
                                      country: createSelectOption(el?.country),
                                      state: createSelectOption(el?.state),
                                      city: createSelectOption(el?.city),
                                      zipcode: el.zipcode || "",
                                      isPresent: false,
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const referenceField = {
                        title: "Reference",
                        order: 6800,
                        section: "reference",
                        canBeDeleted: 1,
                        data:
                          referenceResponse?.length > 0
                            ? referenceResponse
                                ?.map((el: any) => {
                                  if (el.phone_number || el.email) {
                                    return {
                                      id: uuidv4(),
                                      name: el.name || "",
                                      company: el.company || "",
                                      phone_number: el.phoneNumber || "",
                                      email: el.email || "",
                                      expanded: false,
                                    };
                                  }
                                })
                                .filter(Boolean)
                            : [],
                      };

                      const hobbiesField = {
                        title: "Hobbies",
                        order: 6900,
                        section: "custom-section",
                        canBeDeleted: 1,
                        data: isMultipleInTheExtractedData(["hobb", "interest"])
                          ? hobbiesResponse?.length > 0
                            ? hobbiesResponse?.map((el: any) => {
                                // if (isInTheExtractedData(el?.trim())) {
                                return {
                                  id: uuidv4(),
                                  field1: el?.hobbyName?.trim(),
                                  field2: "",
                                  country: "",
                                  state: el.email || "",
                                  zipcode: "",
                                  startDate: "",
                                  endDate: "",
                                  expanded: false,
                                };
                                // }
                              })
                            : []
                          : [],
                      };

                      const achievementsField = {
                        title: "Achievement",
                        order: 7000,
                        section: "custom-section",
                        canBeDeleted: 1,
                        data: isMultipleInTheExtractedData([
                          "award",
                          "achievement",
                        ])
                          ? achievementResponse?.length > 0
                            ? achievementResponse
                                ?.map((el: any) => {
                                  if (
                                    el?.achievementOrAwardTitleOrDescription
                                  ) {
                                    // if (
                                    //   isInTheExtractedData(
                                    //     el.achievementOrAwardTileOrDescription,
                                    //   )
                                    // ) {
                                    return {
                                      id: uuidv4(),
                                      field1:
                                        el?.achievementOrAwardTitleOrDescription?.trim() ||
                                        "",
                                      field2: "",
                                      startDate: formatDateWhileUploading(
                                        el?.startDate || ""
                                      ),
                                      endDate: formatDateWhileUploading(
                                        el?.endDate || ""
                                      ),
                                      country: createSelectOption(el?.country),
                                      state: createSelectOption(el?.state),
                                      city: createSelectOption(el?.city),
                                      zipcode: el.zipcode || "",
                                      expanded: false,
                                    };
                                    // }
                                  } else {
                                    return null;
                                  }
                                })
                                .filter(Boolean)
                            : []
                          : [],
                      };

                      const finalData = {
                        ...personalInfo,
                        fields: [
                          professionalInfo,
                          skillsField,
                          employmentField,
                          certificationField,
                          educationField,
                          languageField,
                          internshipField,
                          volunteeringField,
                          courseField,
                          referenceField,
                          hobbiesField,
                          achievementsField,
                        ],
                      };
                      console.log({ finalData });

                      try {
                        const uniqueID = uuidv4();
                        const response = await fetch(
                          "https://d2fa6tipx2eq6v.cloudfront.net/api/v1/applicants/",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Access-Control-Allow-Origin": "*",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(finalData),
                          }
                        );
                        setIsGenerating(false);
                        if (response.ok) {
                          const responseData = await response.json();
                          console.log({ responseData });
                          setIsGenerating(false);
                          window.open(
                            `https://resumebuilder.joinswiftly.com/editor/${responseData?.data?.id}`,
                            "_blank"
                          );
                        } else {
                          setIsGenerating(false);
                          console.error("API request failed");
                          alert("API request failed!");
                        }
                      } catch (error) {
                        setIsGenerating(false);
                        alert("Something error occured!");

                        console.error("An error occurred:", error);
                      }
                    } catch (error) {
                      console.log(error);
                    }
                  })();
                }
              }
            } else {
              setIsGenerating(false);
              alert("API request failed!");
            }
          } catch (error) {
            setIsGenerating(false);
            alert("Something error occured!");
            console.error("An error occurred:", error);
          }
        } else {
          alert("You have to login first");
          setIsGenerating(false);
          window.open(`https://resumebuilder.joinswiftly.com`, "_blank");
        }
      }
    };

    if (divToEmbedInto) {
      // Check if a button with class "custom-button" exists
      const existingButton = divToEmbedInto.querySelector(
        ".generate-resume-button"
      );

      if (existingButton) {
        // If button exists, update its text content
        existingButton.textContent = ""; // Clear existing text content

        // Text content
        const buttonText = isGenerating ? "" : "Generate Resume";
        existingButton.textContent = buttonText;

        if (isGenerating) {
          // Create img element for the GIF
          const gifImg = document.createElement("img");
          gifImg.src = chrome.runtime.getURL("light-loader.svg"); // Replace 'your_gif_url_here.gif' with the actual URL of your GIF
          gifImg.style.verticalAlign = "middle"; // Align the GIF vertically to the middle
          // Add padding left to the image
          gifImg.style.paddingLeft = "25px"; // Adjust the padding value as needed
          // Append img element to button
          existingButton.appendChild(gifImg);
        }
      } else {
        console.log("entered");
        const buttonElement = document.createElement("button");
        const buttonText = "Generate Resume";
        buttonElement.textContent = buttonText;
        buttonElement.style.width = "100px";
        buttonElement.style.height = "55px";
        buttonElement.style.border = "2px solid white";
        buttonElement.style.borderRadius = "6px";
        buttonElement.style.paddingLeft = "4px";
        buttonElement.style.paddingRight = "4px";

        buttonElement.classList.add("generate-resume-button");

        buttonElement.addEventListener("click", handleClick);

        const newDivElement = document.createElement("div");
        newDivElement.appendChild(buttonElement);
        divToEmbedInto.appendChild(newDivElement);
      }
    } else {
      console.error("Div not found!");
    }

    // Cleanup function to remove event listener when component unmounts
    return () => {
      if (imgElement) {
        imgElement.removeEventListener("click", handleClick);
      }
    };
  }, [window.location.href, isGenerating]);

  chrome.storage.local.get(["ci_token"]).then((result: any) => {
    const myToken = result.ci_token;
    // console.log({ myToken });
  });

  return (
    <div className="content__script__section">
      {showIcon ? (
        <Logo
          setShowPage={setShowPage}
          jobFound={jobDetailState?.jobFound || false}
        />
      ) : null}

      {/* <LoginFrom setShowPage={setShowPage} /> */}

      {/* <SignupForm setShowForm={setShowFrom} /> */}

      {showPage === SHOW_PAGE.loginPage && (
        <LoginFrom setShowPage={setShowPage} />
      )}

      {showPage === SHOW_PAGE.singupPage && (
        <SignupForm setShowPage={setShowPage} />
      )}

      {showPage === SHOW_PAGE.jobDetailPage && (
        <JobDetail setShowPage={setShowPage} />
      )}
      {showPage === SHOW_PAGE.summaryPage && (
        <DisplayJob setShowPage={setShowPage} />
      )}

      {showPage === SHOW_PAGE.profilePage && (
        <Profile setShowPage={setShowPage} />
      )}
      <MenuPopUp setShowPage={setShowPage} />
      {website === SUPPORTED_WEBSITE.linkedin && (
        <Linkedin setShowPage={setShowPage} />
      )}

      {website === SUPPORTED_WEBSITE.simplyhired && (
        <SimplyHiredJob setShowPage={setShowPage} />
      )}
      {website === SUPPORTED_WEBSITE.dice && <Dice setShowPage={setShowPage} />}
      {website === SUPPORTED_WEBSITE.indeed && (
        <Indeed setShowPage={setShowPage} />
      )}
      {website === SUPPORTED_WEBSITE.ziprecruiter && (
        <Ziprecruiter setShowPage={setShowPage} />
      )}

      {website === SUPPORTED_WEBSITE.builtin && (
        <Builtin setShowPage={setShowPage} />
      )}

      {website === SUPPORTED_WEBSITE.glassdoor && (
        <Glassdoor setShowPage={setShowPage} />
      )}
    </div>
  );
};

export default JobDetector;
