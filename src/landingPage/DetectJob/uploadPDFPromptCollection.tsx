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

  const skillSample = [{ skillItem: "" }, { skillItem: "" }];

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
      prompt: `The resume string is ${data}. Utilizing this information, please populate the ${JSON.stringify(
        personalInfoSample
      )} object and respond with the updated object exclusively.
      `,
    },
    {
      key: "professionalSummary",
      prompt: `This is my resume content: ${data}.\n
      From this resume content, Find the professional summary mentioned section and return that section in response. If there is not mentioned any professional summary as such, just return empty string.`,
    },
    {
      key: "skills",
      prompt: `This is my resume content: ${data}.\n
      From this resume content, Find the skills mentioned section and return that whole section in valid RFC8259 compliant array of exact form string as a response.\n
      If there is no skills mentioned section, then return empty array
      `,
    },
    {
      key: "employment",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the work experience mentioned section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
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
      },\n
      If there is no work experience mentioned section, then return empty array
      `,
    },
    {
      key: "education",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the mentioned education section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
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
      },\n
      If there is no education mentioned section, then return empty array
      `,
    },
    {
      key: "certification",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the mentioned certifications or training section. If either actual data or sample data is present, return that whole section in valid RFC8259 compliant array of object following this:\n
      {
        certificateName: "",
        certificateID: "",
        issueOrg: "",
        issueDate: "",
        expiryDate: "",
        isExpiry: "",
      },\n
      If there is no certification / training mentioned section, then return empty array
      `,
    },
    {
      key: "language",
      prompt: `This is my resume content: ${data}.\n
      From this resume content, Find the language mentioned section and return that whole section in valid RFC8259 compliant array of string as a response.\n
      If there is no language mentioned section, then return empty array`,
    },
    {
      key: "internship",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the internship or trainee mentioned section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
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
      },\n
      If there is no internship or trainee mentioned section, then return empty array
      `,
    },
    {
      key: "volunteering",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the volunteering mentioned section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
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
      },\n
      If there is no volunteering mentioned section, then return empty array
      `,
    },
    {
      key: "reference",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the references mentioned section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
      {
        name: "",
        company: "",
        phoneNumber: "",
        email: "",
      },\n
      If there is no references mentioned section, then return empty array
      `,
    },
    {
      key: "course",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the courses / trainings mentioned section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
      {
        achievementOrAwardTitleOrDescription: "",
        startDate: "",
        endDate: "",
        country: "",
        state: "",
        city: "",
        zipcode: "",
      },\n
      If there is no courses / trainings mentioned section, then return empty array
      `,
    },
    {
      key: "achievements",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the awards or achievements explictly mentioned section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
      {
        achievementOrAwardTitleOrDescription: "",
        startDate: "",
        endDate: "",
        country: "",
        state: "",
        city: "",
        zipcode: "",
      },\n
      If there is no awards or achievements mentioned section, then return empty array
      `,
    },
    {
      key: "hobbies",
      prompt: `This is my resume content:${data}.\n
      From this resume content, Find the hobbies or interest mentioned section. If either actual data or sample data present, return that whole section in valid RFC8259 compliant array of object following this:\n
      { hobbyName: "" },\n
      If there is no hobbies / interest mentioned section, then return empty array
      `,
    },
  ];
};
