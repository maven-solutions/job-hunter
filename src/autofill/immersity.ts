import { delay, handleValueChanges } from "./helper";
const firstNames = [
  "John",
  "Jane",
  "Michael",
  "Emily",
  "David",
  "Sarah",
  "Robert",
  "Olivia",
  "James",
  "Sophia",
  "Daniel",
  "Emma",
  "Matthew",
  "Ava",
  "Chris",
  "Lily",
  "Andrew",
  "Mia",
  "Johna",
  "Janea",
  "Michaela",
  "Emilya",
  "Davida",
  "Saraha",
  "Roberta",
  "Oliviaa",
  "Jamesa",
  "Sophiaa",
  "Daniela",
  "Emmaa",
  "Matthewa",
  "Avaa",
  "Chrisa",
  "Lilya",
  "Andrewa",
  "Miaa",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Brown",
  "Williams",
  "Jones",
  "Miller",
  "Davis",
  "Garcia",
  "Rodriguez",
  "Martinez",
  "Wilson",
  "Anderson",
  "Taylor",
  "Thomas",
  "Hernandez",
  "Moore",
  "Jackson",
  "Martin",
  "Smitha",
  "Johnsona",
  "Browna",
  "Williamsa",
  "Jonesa",
  "Millera",
  "Davisa",
  "Garciaa",
  "Rodrigueza",
  "Martineza",
  "Wilsona",
  "Andersona",
  "Taylora",
  "Thomasa",
  "Hernandeza",
  "Moorea",
  "Jacksona",
  "Martina",
];
function getRandomFirstName() {
  const randomIndex = Math.floor(Math.random() * firstNames.length);
  return firstNames[randomIndex];
}

function getRandomLastName() {
  const randomIndex = Math.floor(Math.random() * lastNames.length);
  return lastNames[randomIndex];
}

function generateRandomDOB() {
  // Random year between 1900 and 2023
  const year = Math.floor(Math.random() * (2023 - 1900 + 1)) + 1900;

  // Random month between 0 (January) and 11 (December)
  const month = Math.floor(Math.random() * 12);

  // Days in each month
  const daysInMonth = [
    31, // January
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28, // February
    31, // March
    30, // April
    31, // May
    30, // June
    31, // July
    31, // August
    30, // September
    31, // October
    30, // November
    31, // December
  ];

  // Random day based on the month
  const day = Math.floor(Math.random() * daysInMonth[month]) + 1;

  // Format the date to MM/DD/YYYY
  const formattedDOB = `${String(month + 1).padStart(2, "0")}/${String(
    day
  ).padStart(2, "0")}/${year}`;
  return formattedDOB;
}

// Example usage

// Example usage

function generateRandomEmail() {
  const randomFirstName =
    firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName =
    lastNames[Math.floor(Math.random() * lastNames.length)];
  const randomNumber = Math.floor(Math.random() * 1000); // Random number to ensure uniqueness

  return `${randomFirstName}.${randomLastName}${randomNumber}@mailinator.com`.toLowerCase();
}

export const fillImmersity = async () => {
  const firstname: any = document.querySelector('[name="firstName"]');
  if (firstname) {
    firstname.value = getRandomFirstName();
    handleValueChanges(firstname);
  }

  const lastname: any = document.querySelector('[name="lastName"]');
  if (lastname) {
    lastname.value = getRandomLastName();
    handleValueChanges(lastname);
  }

  const email: any = document.querySelector('[name="authUsername"]');
  if (email) {
    const randomemail = generateRandomEmail();
    chrome.storage.local.set({
      aiemail: randomemail,
    });
    email.value = randomemail;
    handleValueChanges(email);
  }
  const dob: any = document.querySelector('[name="user/attributes/birthdate"]');
  if (dob) {
    dob.value = generateRandomDOB();
    handleValueChanges(dob);
  }

  await delay(1000);
  const submitButton: any = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.click();
    handleValueChanges(submitButton);
  }

  const password: any = document.querySelector('[name="password"]');
  if (password) {
    password.value = "Admin@1234";
    handleValueChanges(password);
  }
  const password2: any = document.querySelector('[name="password-confirm"]');
  if (password2) {
    password2.value = "Admin@1234";
    handleValueChanges(password2);
  }
};
