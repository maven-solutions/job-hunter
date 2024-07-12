import { v4 as uuidv4 } from "uuid";
import { getToken } from "../../config/axiosInstance";
import { BASE_URL, WEBSITE_URL } from "../../config/urlconfig";
import { createSelectOption, formatDateWhileUploading } from "./helper";
import { uploadPDFPromptCollection } from "./uploadPDFPromptCollection";
import moment from "moment";

function adjustButtonStyle() {
  const buttonElement: any = document.querySelector(".generate-resume-button");
  if (!buttonElement) return;

  const lightDiv = document.querySelector(".light");
  const darkDiv = document.querySelector(".dark");

  // buttonElement.style.backgroundColor = "blue";
  // buttonElement.style.color = "white";

  // if (lightDiv) {
  //   buttonElement.style.backgroundColor = "blue";
  //   buttonElement.style.color = "white";
  // } else if (darkDiv) {
  //   buttonElement.style.backgroundColor = "blue";
  //   buttonElement.style.color = "white";
  // }
}

function handleDomChanges(mutationsList, observer) {
  mutationsList.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const div = node.closest(".light, .dark");
        if (div) {
          adjustButtonStyle();
        }
      }
    });
  });
}

function resumeGPTmainFunction(
  setIsGenerating: any,
  isGenerating: any,
  authState: any,
  setInfoOpen: any
) {
  console.log({ authState });
  function isEmpty(obj: any) {
    return Object.entries(obj).length === 0;
  }

  const handleInfoClick = () => {
    setInfoOpen(true);
  };

  const checkIfSubscribedOrUnSubscribed = () => {
    const stripeSubscription = authState?.ci_user?.stripeSubscriptionType;

    if (stripeSubscription && !isEmpty(stripeSubscription)) {
      if (stripeSubscription.status === "active") {
        const cancelAt = stripeSubscription.cancel_at;
        if (cancelAt && moment.unix(cancelAt).isBefore(moment())) {
          return false;
        }
        return true;
      }
    }
    return false;
  };

  console.log("plan", checkIfSubscribedOrUnSubscribed());
  const plan = checkIfSubscribedOrUnSubscribed();

  if (window.location.href.includes("chatgpt")) {
    console.log("entered");
    // const divToEmbedInto = document.querySelector(".stretch");
    const divToEmbedInto = document.querySelector("form");
    divToEmbedInto.classList.add("careerai-form");
    console.log("newDivToEmbed", divToEmbedInto);
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
            const listResponse = await fetch(`${BASE_URL}/applicants`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                Authorization: `Bearer ${token}`,
              },
            });
            // console.log({ listResponse });
            if (listResponse.ok) {
              const responseData = await listResponse.json();
              console.log({ responseData }, responseData?.data?.length);

              if (!plan && responseData?.data?.length === 3) {
                alert(
                  "You aleady have a 3 resumes. So delete some of the existing resume or GO PREMIUM to generate new resume."
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

                    function cleanAndWrapString(inputString = "") {
                      const cleanedString = inputString.replace(
                        /[\"\[\]\{\}]/g,
                        ""
                      );

                      const containsHtmlTag = /<\/?[a-z][\s\S]*>/i.test(
                        cleanedString
                      );

                      const finalString = containsHtmlTag
                        ? cleanedString
                        : cleanedString?.trim()?.length > 0
                        ? `<p>${cleanedString}</p>`
                        : "";

                      const wrappedString = finalString;

                      return wrappedString;
                    }

                    const newPropmpt = `From the provided Extracted Resume Content, fill the sample response object and array fields exactly as they appear:
                                        \nSAMPLE RESPONSE FORMAT:\n
                                          {
                                            "personalInfo":{"country":"","state":"","city":"","preferredRole":"","name":"","phoneNumber":"","emailAddress":"","zipCode":""},
                                            "professionalSummary":"",
                                            "skills":[{"skillGroupName":"", "skillGroupLists":""}],
                                            "hobbies":[{"name":""}],
                                            "achievements":[{"titleOrDescription":"","startDate":"","endDate":"","country":"","state":"","city":"","zipCode":""}],
                                            "employmentHistory":[{"employer":"","jobTitle":"","description":"","startDate":"","endDate":"","country":"","state":"","city":"","zipCode":""}],
                                            "educationHistory":[{"fieldOfStudy":"","schoolName":"","description":"","startDate":"","endDate":"","country":"","state":"","city":"","zipCode":""}],
                                            "certifications":[{"name":"","id":"","issuingOrganization":"","issueDate":"","expiryDate":"","hasExpiry":""}],
                                            "internships":[{"institutionName":"","internshipTitle":"","description":"","startDate":"","endDate":"","country":"","state":"","city":"","zipCode":""}],
                                            "volunteering":[{"institutionName":"","role":"","description":"","startDate":"","endDate":"","country":"","state":"","city":"","zipCode":""}],
                                            "courses":[{"institutionName":"","courseName":"","description":"","startDate":"","endDate":"","country":"","state":"","city":"","zipCode":""}],
                                            "references":[{"name":"","company":"","phoneNumber":"","email":""}],
                                            "languages":[{"name":""}]}
                                          }
                                        EXTRACTED RESUME CONTENT: ${textContent}.\n
                                        \nGENERAL GUIDELINE:\n
                                          1. If data is missing in the provided Extracted Resume Content, return an empty array for the respective sections.
                                          2. For the personalInfo section, include required values along with the country, state, and city information.
                                          3. For the employmentHistory section, include all relevant employment categories such as freelance, contract, layoff, part-time, full-time, etc. positions.
                                          4. In the skills array, include all proficiencies, skills, tools/software, etc.. Organize skills by skillGroupName with corresponding skillGroupLists in a comma-separated format wrapped with HTML paragraph. Ensure skillGroupName is concise, ideally not exceeding three words.
                                          5. Treat trainee, intern and similar roles as internships.
                                          7. For the professionalSummary, provide the content in a well-structured HTML paragraph. If no professional summary content is available in the provided Extracted Resume Content, return an empty string.
                                          8. For descriptions value of any section, maintain text as a well-structured HTML unordered lists. If no description is available in a section's description from the provided Extracted Resume Content, then return an empty array.
                                          9. Include startDate and endDate for each relevant section if available.
                                        \nINSTRUCTIONS:\n
                                          1. Don't be creative or paraphrase, and maintain the response exactly from the provided extracted resume content, except for correcting typographical errors.
                                          2. Improve all typographical errors, maintain proper spacing between words and punctuation.
                                          3. Ensure there is always a space following commas.\n
                                        Give the response in JSON format, adhering strictly to the guidelines listed above included in Instructions, Sample Response Format and General Guideline.
                                        `;

                    try {
                      const response = await fetch(
                        `${BASE_URL}/gpt/write/gpt40`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ prompt: newPropmpt }),
                        }
                      );

                      if (!response.ok) {
                        throw new Error(
                          `HTTP error! status: ${response.status}`
                        );
                      }

                      const data: any = await response.json();
                      const result = data.data;
                      console.log({ result });

                      const finalResult = JSON.parse(
                        result?.replace(/```json\\?/g, "")?.replace(/`/g, "")
                      );

                      console.log({ finalResult });

                      if (finalResult) {
                        (async () => {
                          try {
                            // const personalinforesponse = JSON.parse(
                            //   finalResult?.personalInfo,
                            // );
                            // const professionalSummaryResponse = finalResult?.personalInfo;
                            // const skillsResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.personalInfo)) || [];
                            // const employmentResponse =
                            //   (await parseJsonArrayOrObject(
                            //     finalResult?.employmentHistory,
                            //   )) || [];
                            // const educationResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.educationHistory)) ||
                            //   [];
                            // const certificationResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.certifications)) ||
                            //   [];
                            // const languageResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.languages)) || [];
                            // const internshipResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.internships)) || [];
                            // const volunteeringResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.volunteering)) || [];
                            // const courseResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.courses)) || [];
                            // const referenceResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.references)) || [];
                            // const achievementResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.achievements)) || [];
                            // const hobbiesResponse =
                            //   (await parseJsonArrayOrObject(finalResult?.hobbies)) || [];

                            const skillsResponse = finalResult?.skills || [];
                            const employmentResponse =
                              finalResult?.employmentHistory || [];
                            const educationResponse =
                              finalResult?.educationHistory || [];
                            const certificationResponse =
                              finalResult?.certifications || [];
                            const languageResponse =
                              finalResult?.languages || [];
                            const internshipResponse =
                              finalResult?.internships || [];
                            const volunteeringResponse =
                              finalResult?.volunteering || [];
                            const courseResponse = finalResult?.courses || [];
                            const referenceResponse =
                              finalResult?.references || [];
                            const achievementResponse =
                              finalResult?.achievements || [];
                            const hobbiesResponse = finalResult?.hobbies || [];

                            console.log(
                              "dataxx employmentHistory",

                              finalResult?.employmentHistory,
                              typeof finalResult?.employmentHistory
                            );

                            const personalInfo = {
                              country:
                                createSelectOption(
                                  finalResult?.personalInfo?.country
                                ) || null,
                              state:
                                createSelectOption(
                                  finalResult?.personalInfo?.state
                                ) || null,
                              city:
                                createSelectOption(
                                  finalResult?.personalInfo?.city
                                ) || null,
                              customPreferredRole:
                                createSelectOption(
                                  finalResult?.personalInfo?.customPreferredRole
                                ) || null,
                              name: finalResult?.personalInfo?.name || "",
                              phoneNumber:
                                finalResult?.personalInfo?.phoneNumber || "",
                              emailAddress:
                                finalResult?.personalInfo?.emailAddress || "",
                              zipCode: finalResult?.personalInfo?.zipCode || "",
                              templateName: "compact",
                              fontFamily: "NotoSans",
                              title: null,
                              isStudent: 0,
                              isAiCreated: null,
                              color: "#FFFFFF",
                            };

                            const professionalInfo = {
                              title: "Professional Summary",
                              order: 512,
                              section: "professional-summary",
                              canBeDeleted: 1,
                              data: {
                                description: cleanAndWrapString(
                                  finalResult?.professionalSummary
                                ),
                              },
                            };

                            const skillsField = {
                              title: "Skills",
                              order: 1536,
                              section: "skills",
                              canBeDeleted: 1,
                              // data:
                              //   skillsResponse?.length > 0
                              //     ? skillsResponse
                              //         .slice(0, 11)
                              //         ?.filter((skill: any) => {
                              //           const isHobby = hobbiesResponse?.some(
                              //             (hobby: any) =>
                              //               hobby?.hobbyName?.trim() ===
                              //               skill?.skillTitle?.trim(),
                              //           );
                              //           return !isHobby;
                              //         })
                              //         ?.map((el: any) => {
                              //           if (el?.skillTitle?.trim()) {
                              //             return {
                              //               id: uuidv4(),
                              //               skillTitle: el?.skillTitle?.trim() || "",
                              //               skillDescription: "",
                              //               skillExpertise: "",
                              //             };
                              //           }
                              //         })
                              //         .filter(Boolean)
                              //     : [],
                              data:
                                skillsResponse?.length > 0
                                  ? skillsResponse
                                      ?.map((el: any) => {
                                        if (
                                          el?.skillGroupName?.trim() ||
                                          el?.skillGroupLists?.trim()
                                        ) {
                                          return {
                                            id: uuidv4(),
                                            skillTitle:
                                              el?.skillGroupName?.trim() || "",
                                            skillDescription:
                                              el?.skillGroupLists?.trim()
                                                ? cleanAndWrapString(
                                                    el?.skillGroupLists?.trim()
                                                  )
                                                : "",
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
                                        // if (Object.values(el).some((value) => value)) {
                                        //   if (
                                        //     isInTheExtractedData(
                                        //       el.employer || el.employeer,
                                        //     ) &&
                                        //     !el.jobTitle?.toLowerCase()?.includes("intern")
                                        //   ) {
                                        //     return {
                                        //       id: uuidv4(),
                                        //       employeer: el.employeer || el.employer || "",
                                        //       jobTitle: el.jobTitle || "",
                                        //       description:
                                        //         convertDescriptionToBulletPoints(
                                        //           el.description,
                                        //         ) || "",
                                        //       startDate: formatDateWhileUploading(
                                        //         el?.startDate || "",
                                        //       ),
                                        //       endDate: formatDateWhileUploading(
                                        //         el?.endDate || "",
                                        //       ),
                                        //       country: createSelectOption(el?.country),
                                        //       state: createSelectOption(el?.state),
                                        //       city: createSelectOption(el?.city),
                                        //       zipcode: el.zipcode || "",
                                        //       isWorking: false,
                                        //     };
                                        //   }
                                        // }
                                        return {
                                          id: uuidv4(),
                                          employeer:
                                            el.employeer || el.employer || "",
                                          jobTitle: el.jobTitle || "",
                                          // description:
                                          //   convertDescriptionToBulletPoints(
                                          //     el.description,
                                          //   ) || "",
                                          description: Array.isArray(
                                            el.description
                                          )
                                            ? cleanAndWrapString(
                                                `${el.description}`
                                              )
                                            : cleanAndWrapString(
                                                el.description
                                              ),
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
                                        // if (Object.values(el).some((value) => value)) {
                                        return {
                                          id: uuidv4(),
                                          field: el.fieldOfStudy || "",
                                          school: el.schoolName || "",
                                          // description:
                                          //   convertDescriptionToBulletPoints(
                                          //     el.description,
                                          //   ) || "",
                                          description: Array.isArray(
                                            el.description
                                          )
                                            ? cleanAndWrapString(
                                                `${el.description}`
                                              )
                                            : cleanAndWrapString(
                                                el.description
                                              ),
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
                                          isStudy: false,
                                        };
                                        // }
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
                                        // if (Object.values(el).some((value) => value)) {
                                        return {
                                          id: uuidv4(),
                                          certificateName: el.name || "",
                                          certificateID: el.id || "",
                                          issueOrg:
                                            el.issuingOrganization || "",
                                          issueDate: formatDateWhileUploading(
                                            el?.issueDate || ""
                                          ),
                                          expiryDate: formatDateWhileUploading(
                                            el?.expiryDate || ""
                                          ),
                                          isExpiry: false,
                                        };
                                        // }
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
                                        if (el?.name?.trim()) {
                                          return {
                                            id: uuidv4(),
                                            title: el?.name?.trim() || "",
                                          };
                                        }
                                      })
                                      .filter(Boolean)
                                  : [],
                            };

                            const employmentResponseFields =
                              employmentResponse || [];

                            const fieldsToCheck = ["employeer", "jobTitle"];

                            const shouldIgnoreInternship = (
                              internshipEntry: any
                            ) => {
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
                              // data:
                              //   internshipResponse?.length > 0
                              //     ? internshipResponse
                              //         ?.map((el: any) => {
                              //           if (
                              //             Object.values(el).some((value) => value) &&
                              //             !shouldIgnoreInternship(el) &&
                              //             !["institution_name", "title"].some((key) =>
                              //               ["not mentioned", "n/a"].includes(
                              //                 el[key]?.toLowerCase(),
                              //               ),
                              //             )
                              //           ) {
                              //             return {
                              //               id: uuidv4(),
                              //               institution_name: el.institutionName || "",
                              //               title: el.internshipTitle || "",
                              //               description:
                              //                 convertDescriptionToBulletPoints(
                              //                   el.description,
                              //                 ) || "",
                              //               startDate: formatDateWhileUploading(
                              //                 el?.startDate || "",
                              //               ),
                              //               endDate: formatDateWhileUploading(
                              //                 el?.endDate || "",
                              //               ),
                              //               country: createSelectOption(el?.country),
                              //               state: createSelectOption(el?.state),
                              //               city: createSelectOption(el?.city),
                              //               zipcode: el.zipcode || "",
                              //               isPresent: false,
                              //             };
                              //           }
                              //         })
                              //         .filter(Boolean)
                              //     : [],
                              data:
                                internshipResponse?.length > 0
                                  ? internshipResponse
                                      ?.map((el: any) => {
                                        // if (
                                        //   Object.values(el).some((value) => value) &&
                                        //   !shouldIgnoreInternship(el) &&
                                        //   !["institution_name", "title"].some((key) =>
                                        //     ["not mentioned", "n/a"].includes(
                                        //       el[key]?.toLowerCase(),
                                        //     ),
                                        //   )
                                        // ) {
                                        return {
                                          id: uuidv4(),
                                          institution_name:
                                            el.institutionName || "",
                                          title: el.internshipTitle || "",
                                          description: Array.isArray(
                                            el.description
                                          )
                                            ? cleanAndWrapString(
                                                `${el.description}`
                                              )
                                            : cleanAndWrapString(
                                                el.description
                                              ),
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
                                          isPresent: false,
                                        };
                                        // }
                                      })
                                      .filter(Boolean)
                                  : [],
                            };
                            const volunteeringField = {
                              title: "Volunteering",
                              order: 6600,
                              section: "volunteering",
                              canBeDeleted: 1,
                              // data:
                              //   volunteeringResponse?.length > 0
                              //     ? volunteeringResponse
                              //         ?.map((el: any) => {
                              //           if (
                              //             Object.values(el).some((value) => value) &&
                              //             pdfExtractedData
                              //               ?.replaceAll("\n", " ")
                              //               ?.toLowerCase()
                              //               ?.includes(el.institutionName?.toLowerCase())
                              //           ) {
                              //             return {
                              //               id: uuidv4(),
                              //               institution_name: el.institutionName || "",
                              //               role: el.role || "",
                              //               description:
                              //                 convertDescriptionToBulletPoints(
                              //                   el.description,
                              //                 ) || "",
                              //               startDate: formatDateWhileUploading(
                              //                 el?.startDate || "",
                              //               ),
                              //               endDate: formatDateWhileUploading(
                              //                 el?.endDate || "",
                              //               ),
                              //               country: createSelectOption(el?.country),
                              //               state: createSelectOption(el?.state),
                              //               city: createSelectOption(el?.city),
                              //               zipcode: el.zipcode || "",
                              //               isPresent: false,
                              //             };
                              //           }
                              //         })
                              //         .filter(Boolean)
                              //     : [],
                              data:
                                volunteeringResponse?.length > 0
                                  ? volunteeringResponse
                                      ?.map((el: any) => {
                                        // if (
                                        //   Object.values(el).some((value) => value) &&
                                        //   pdfExtractedData
                                        //     ?.replaceAll("\n", " ")
                                        //     ?.toLowerCase()
                                        //     ?.includes(el.institutionName?.toLowerCase())
                                        // ) {
                                        return {
                                          id: uuidv4(),
                                          institution_name:
                                            el.institutionName || "",
                                          role: el.role || "",
                                          description: Array.isArray(
                                            el.description
                                          )
                                            ? cleanAndWrapString(
                                                `${el.description}`
                                              )
                                            : cleanAndWrapString(
                                                el.description
                                              ),
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
                                          isPresent: false,
                                        };
                                        // }
                                      })
                                      .filter(Boolean)
                                  : [],
                            };

                            const educationResponseFields =
                              educationResponse || [];

                            const fieldsToCheck1 = ["field", "school"];

                            const shouldIgnoreCourse = (courseEntry: any) => {
                              for (const empEntry of educationResponseFields) {
                                let match = true;
                                for (const field of fieldsToCheck1) {
                                  if (
                                    courseEntry.course_name !== empEntry[field]
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

                            const courseField = {
                              title: "Course",
                              order: 6700,
                              section: "course",
                              canBeDeleted: 1,
                              data:
                                courseResponse?.length > 0
                                  ? courseResponse
                                      ?.map((el: any) => {
                                        // if (
                                        //   Object.values(el).some((value) => value) &&
                                        //   !shouldIgnoreCourse(el)
                                        // ) {
                                        return {
                                          id: uuidv4(),
                                          institution_name:
                                            el.institutionName || "",
                                          course_name: el.courseName || "",
                                          // description:
                                          //   convertDescriptionToBulletPoints(
                                          //     el.description,
                                          //   ) || "",
                                          description: Array.isArray(
                                            el.description
                                          )
                                            ? cleanAndWrapString(
                                                `${el.description}`
                                              )
                                            : cleanAndWrapString(
                                                el.description
                                              ),
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
                                          isPresent: false,
                                        };
                                        // }
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
                                        if (el.phoneNumber || el.email) {
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
                              // data: isMultipleInTheExtractedData(["hobb", "interest"])
                              //   ? hobbiesResponse?.length > 0
                              //     ? hobbiesResponse?.map((el: any) => {
                              //         // if (isInTheExtractedData(el?.trim())) {
                              //         return {
                              //           id: uuidv4(),
                              //           field1: el?.name?.trim(),
                              //           field2: "",
                              //           country: "",
                              //           state: el.email || "",
                              //           zipcode: "",
                              //           startDate: "",
                              //           endDate: "",
                              //           expanded: false,
                              //         };
                              //         // }
                              //       })
                              //     : []
                              //   : [],
                              data:
                                hobbiesResponse?.length > 0
                                  ? hobbiesResponse?.map((el: any) => {
                                      // if (isInTheExtractedData(el?.trim())) {
                                      return {
                                        id: uuidv4(),
                                        field1: el?.name?.trim(),
                                        field2: "",
                                        country: "",
                                        state: "",
                                        zipcode: "",
                                        startDate: "",
                                        endDate: "",
                                        expanded: false,
                                      };
                                      // }
                                    })
                                  : [],
                              // : [],
                            };

                            const achievementsField = {
                              title: "Achievement",
                              order: 7000,
                              section: "custom-section",
                              canBeDeleted: 1,
                              // data: isMultipleInTheExtractedData(["award", "achievement"])
                              //   ? achievementResponse?.length > 0
                              //     ? achievementResponse
                              //         ?.map((el: any) => {
                              //           if (el?.achievementOrAwardTitleOrDescription) {
                              //             // if (
                              //             //   isInTheExtractedData(
                              //             //     el.achievementOrAwardTileOrDescription,
                              //             //   )
                              //             // ) {
                              //             return {
                              //               id: uuidv4(),
                              //               field1:
                              //                 el?.achievementOrAwardTitleOrDescription?.trim() ||
                              //                 "",
                              //               field2: "",
                              //               startDate: formatDateWhileUploading(
                              //                 el?.startDate || "",
                              //               ),
                              //               endDate: formatDateWhileUploading(
                              //                 el?.endDate || "",
                              //               ),
                              //               country: createSelectOption(el?.country),
                              //               state: createSelectOption(el?.state),
                              //               city: createSelectOption(el?.city),
                              //               zipcode: el.zipcode || "",
                              //               expanded: false,
                              //             };
                              //             // }
                              //           } else {
                              //             return null;
                              //           }
                              //         })
                              //         .filter(Boolean)
                              //     : []
                              //   : [],
                              data:
                                achievementResponse?.length > 0
                                  ? achievementResponse
                                      ?.map((el: any) => {
                                        // if (el?.achievementOrAwardTitleOrDescription) {
                                        // if (
                                        //   isInTheExtractedData(
                                        //     el.achievementOrAwardTileOrDescription,
                                        //   )
                                        // ) {
                                        return {
                                          id: uuidv4(),
                                          field1:
                                            el?.titleOrDescription?.trim() ||
                                            "",
                                          field2: "",
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
                                          expanded: false,
                                        };
                                        // }
                                        // } else {
                                        //   return null;
                                        // }
                                      })
                                      .filter(Boolean)
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
                                `${BASE_URL}/applicants`,
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
                                  `${WEBSITE_URL}/editor/${responseData?.data?.id}`,
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
                          } catch (error: any) {
                            // setShowError(true);
                            // setUploading(false);
                            console.log(error);
                            // errorToastMessage(
                            //   error?.response?.data?.message ||
                            //     "Error while fetching information. Try again",
                            // );
                          }
                        })();
                      }
                    } catch (error: any) {
                      console.error(
                        "Error in gptWriteAPI4:",
                        error.message || error
                      );
                      return null;
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
          window.open(`${WEBSITE_URL}`, "_blank");
        }
      }
    };

    if (divToEmbedInto) {
      const existingButton: any = divToEmbedInto.querySelector(
        ".generate-resume-button"
      );

      if (existingButton) {
        existingButton.textContent = "";

        const buttonText = isGenerating ? "Generating..." : "Generate Resume";
        existingButton.textContent = buttonText;
        existingButton.disabled = isGenerating;

        if (isGenerating) {
          const buttonElement: any = document.querySelector(
            ".generate-resume-button"
          );

          if (buttonElement) {
            buttonElement.style.backgroundColor = "#f7ae04";
            buttonElement.style.color = "white";
          }
          const gifImg = document.createElement("img");

          const lightDiv = document.querySelector(".light");
          const darkDiv = document.querySelector(".dark");

          // if (lightDiv) {
          //   gifImg.src = chrome.runtime.getURL("dark-loader.svg");
          // }
          // if (darkDiv) {
          gifImg.src = chrome.runtime.getURL("dark-loader.svg");
          // }

          gifImg.style.verticalAlign = "middle";
          // gifImg.style.paddingLeft = "25px";
          existingButton.appendChild(gifImg);
        } else {
          const buttonElement: any = document.querySelector(
            ".generate-resume-button"
          );

          if (buttonElement) {
            buttonElement.style.backgroundColor = "#0145fd";
            buttonElement.style.color = "white";
          }
          const gifImg = document.createElement("img");
          gifImg.src = chrome.runtime.getURL("C.svg");
          gifImg.style.width = "25px"; // Adjust size as needed
          gifImg.style.height = "25px";

          gifImg.style.verticalAlign = "middle";
          existingButton.appendChild(gifImg);
        }
      } else {
        console.log("entered");

        // Create button element
        const buttonElement = document.createElement("button");

        // Create text node for the button
        const buttonText = document.createTextNode("Generate Resume");
        // Create image element for the icon
        const buttonIcon = document.createElement("img");

        // Set image source and styling
        buttonIcon.src = chrome.runtime.getURL("C.svg"); // Ensure the path to your image is correct
        buttonIcon.alt = "Icon";
        buttonIcon.style.width = "23px"; // Adjust size as needed
        buttonIcon.style.height = "23px";
        // buttonIcon.style.marginRight = "8px"; // Adjust space between icon and text

        // Style the button using flexbox for alignment
        buttonElement.style.display = "flex"; // Flexbox for alignment
        buttonElement.style.alignItems = "center"; // Center items vertically
        buttonElement.style.justifyContent = "center";
        buttonElement.style.width = "195px";
        buttonElement.style.height = "52px";
        buttonElement.style.borderRadius = "8px";
        buttonElement.style.backgroundColor = "#0145fd";
        buttonElement.style.color = "white";
        buttonElement.style.border = "1px solid #efefef";
        // buttonElement.style.paddingLeft = "-104px";
        buttonElement.style.paddingRight = "14px";
        buttonElement.style.fontSize = "16px";

        // Add custom class for additional styling if needed
        buttonElement.classList.add("generate-resume-button");

        // Append icon and text to the button (icon first, then text)
        buttonElement.appendChild(buttonText);

        buttonElement.appendChild(buttonIcon);

        // Add event listener for the button click
        buttonElement.addEventListener("click", handleClick);

        const additionalIcon = document.createElement("img");
        additionalIcon.src = chrome.runtime.getURL("info-icon.svg"); // Ensure the path to your image is correct
        additionalIcon.style.width = "28px"; // Adjust size as needed
        additionalIcon.style.height = "28px";
        additionalIcon.style.marginLeft = "5px"; // 5px gap between button and new icon
        additionalIcon.style.cursor = "pointer";
        additionalIcon.addEventListener("click", handleInfoClick);

        // Create a new div element to embed the button
        const newDivElement = document.createElement("div");
        newDivElement.style.display = "flex"; // Flexbox for alignment
        newDivElement.style.gap = "3px"; // Flexbox for alignment
        newDivElement.style.alignItems = "center"; // Center items vertically

        newDivElement.appendChild(buttonElement);
        newDivElement.appendChild(additionalIcon);

        // Append the new div element to the target container
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
  }
}

export { handleDomChanges, adjustButtonStyle, resumeGPTmainFunction };
