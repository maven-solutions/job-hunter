export const uploadPDFPromptCollection = (data: string) => {
  const personalInfoSample = {
    country: "",
    state: "",
    city: "",
    customPreferredRole: "",
    name: "",
    phoneNumber: "",
    emailAddress: "",
    zipCode: "",
  };

  const skillSample = [{ skillTitle: "" }, { skillTitle: "" }];

  const hobbiesSample = [{ hobbyName: "" }, { hobbyName: "" }];

  const achievementSample = [
    {
      achievementOrAwardTitleOrDescription: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
  ];

  const employmentSample = [
    {
      employeer: "",
      jobTitle: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
    {
      employeer: "",
      jobTitle: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
  ];

  const educationSample = [
    {
      fieldOfStudy: "",
      schoolName: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
    {
      fieldOfStudy: "",
      schoolName: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
  ];

  const certificationData = [
    {
      certificateName: "",
      certificateID: "",
      issueOrg: "",
      issueDate: "",
      expiryDate: "",
      isExpiry: "",
    },
    {
      certificateName: "",
      certificateID: "",
      issueOrg: "",
      issueDate: "",
      expiryDate: "",
      isExpiry: "",
    },
  ];

  const internshipSample = [
    {
      institutionName: "",
      internshipTitle: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
    {
      institutionName: "",
      internshipTitle: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
  ];

  const volunteeringSample = [
    {
      institutionName: "",
      role: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
    {
      institutionName: "",
      role: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
  ];

  const courseSample = [
    {
      institutionName: "",
      courseName: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
    {
      institutionName: "",
      courseName: "",
      description: "",
      startDate: "",
      endDate: "",
      country: "",
      state: "",
      city: "",
      zipcode: "",
    },
  ];

  const referenceSample = [
    {
      name: "",
      company: "",
      phoneNumber: "",
      email: "",
    },
    {
      name: "",
      company: "",
      phoneNumber: "",
      email: "",
    },
  ];

  const languageData = [{ languageName: "" }, { languageName: "" }];

  return [
    {
      key: "personalInfo",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Utilizing this information, please populate the ${JSON.stringify(
        personalInfoSample
      )} object and respond with the updated object exclusively.
        `,
    },
    {
      key: "professionalSummary",
      prompt: `Following the extraction of the PDF content, the obtained string is ${data}. Subsequently, extract the professional summary from the provided PDF content string. In case the professional summary is not mentioned, provide an empty string as the response.`,
    },
    {
      key: "skills",
      prompt: `Upon acquiring the string through PDF content extraction, denoted as ${data}, identify and extract only explicitly mentioned core skills from the PDF content's skills section. Furnish the extracted skills as the response. Furthermore, revise the skills within the ${JSON.stringify(
        skillSample
      )} array, offering the modified array exclusively containing the skills as the answer. The result should be in array with the presence of escape characters`,
    },
    {
      key: "employment",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if respective job role experience OR professional experience OR employment/work experience/history is mentioned, extract only respective job role experience OR professional experience OR employment/work experience/history data from the employment section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        employmentSample
      )} array and respond accordingly. Also extract the respective job role experience OR professional experience OR employment/work experience/history description if present and Ensure that the response should contain exactly one final array as per the structure of the ${employmentSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any respective job role experience OR professional experience OR employment/work experience/history mentioned, just give empty array ([]) as an result.
        While giving answer dont add any quote(") in the description value and make sure description value is dot and well-space seprated.
        `,
    },
    {
      key: "education",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if education is mentioned, extract only education/academic data from the education/academic section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        educationSample
      )} array and respond accordingly. Also extract the respective education/academic deescription if present and  Ensure that the response should contain exactly one final array as per the structure of the ${educationSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no education mentioned, just give empty array ([]) as an result.
        White giving answer dont add any quote(") in the description value and make sure description is dot and well-space seprated.
        `,
    },
    {
      key: "certification",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if certification/certificates is mentioned, extract only certification/certificates data from the certification section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        certificationData
      )} array and respond accordingly. Ensure that the response should contain exactly one final array as per the structure of the ${certificationData} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any certification/certificates mentioned, just give empty array ([]) as an result.
        `,
    },
    {
      key: "language",
      prompt: `Upon acquiring the string through PDF content extraction, denoted as ${data}, identify and extract only explictly mentioned speaking language in the language section from the PDF content's speaking language section. Furthermore, revise the language within the ${JSON.stringify(
        languageData
      )} array, offering the modified array exclusively containing the speaking language as the answer. The result should be an iterable RFC8259 compliant valid array of objects.`,
    },
    {
      key: "internship",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if explictly internship is mentioned, then only extract the mentioned internship / trainee data from the internship / trainee section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        internshipSample
      )} array and respond accordingly. Also extract the respective internship deescription if present and  Ensure that the response should contain exactly one final array as per the structure of the ${internshipSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any internship / trainee section is present, just give empty array ([]) as an result.
        White giving answer dont add any quote(") in the description value and make sure description is dot and well-space seprated.
        `,
    },
    {
      key: "volunteering",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if volunteering activities is mentioned, extract only volunteering data from the volunteering section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        volunteeringSample
      )} array and respond accordingly. Also extract the respective volunteering deescription if present and  Ensure that the response should contain exactly one final array as per the structure of the ${volunteeringSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any volunteering activities mentioned, just give empty array ([]) as an result.
        White giving answer dont add any quote(") in the description value and make sure description is dot and well-space seprated.
        `,
    },
    {
      key: "reference",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if reference is mentioned, if reference section is mentioned, extract only reference data from the reference section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        referenceSample
      )} array and respond accordingly. Also extract the respective reference deescription if present and  Ensure that the response should contain exactly one final array as per the structure of the ${referenceSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any reference section present, just give empty array ([]) as an result.
        `,
    },
    {
      key: "course",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if course is mentioned, extract only course data from the course section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        courseSample
      )} array and respond accordingly. Also extract the respective course deescription if present and  Ensure that the response should contain exactly one final array as per the structure of the ${courseSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any course mentioned, just give empty array as an aswer
        `,
    },
    {
      key: "achievements",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if any award OR achievement OR rank OR nomination is mentioned, extract only award OR achievement OR rank OR nomination data from the award OR achievement OR rank OR nomination section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        achievementSample
      )} array and respond accordingly. Ensure that the response should contain exactly one final array as per the structure of the ${achievementSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any award OR acheievement OR rank OR nomination mentioned, just give empty array as an aswer
        `,
    },
    {
      key: "hobbies",
      prompt: `After extracting the content from the PDF, the resulting string is ${data}. Using this information, if hobbies section is explictly mentioned, extract only hobbies or interest data from the hobbies or interest section of the PDF content string and provide the answer. Subsequently, update the key:value pair in the ${JSON.stringify(
        hobbiesSample
      )} array and respond accordingly. Ensure that the response should contain exactly one final array as per the structure of the ${hobbiesSample} array. The result should be an iterable RFC8259 compliant valid array of objects. If there is no any hobbies  or interest mentioned, just give empty array as an aswer
        `,
    },
  ];
};
