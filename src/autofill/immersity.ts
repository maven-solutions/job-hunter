import { delay, handleValueChanges } from "./helper";

function getRandomFirstName() {
  const firstNames = [
    "Emma",
    "Liam",
    "Olivia",
    "Noah",
    "Ava",
    "Elijah",
    "Isabella",
    "Oliver",
    "Sophia",
    "William",
    "Charlotte",
    "James",
    "Amelia",
    "Benjamin",
    "Mia",
    "Lucas",
    "Harper",
    "Henry",
    "Evelyn",
    "Alexander",
    "Abigail",
    "Michael",
    "Emily",
    "Daniel",
    "Ella",
    "Matthew",
    "Elizabeth",
    "Samuel",
    "Camila",
    "Joseph",
    "Luna",
    "David",
    "Sofia",
    "Carter",
    "Avery",
    "Owen",
    "Mila",
    "Wyatt",
    "Aria",
  ];

  const randomIndex = Math.floor(Math.random() * firstNames.length);
  return firstNames[randomIndex];
}

function getRandomLastName() {
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
  ];

  const randomIndex = Math.floor(Math.random() * lastNames.length);
  return lastNames[randomIndex];
}

// Example usage

function generateRandomEmail() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const emailPrefixLength = 10; // You can change the length of the random part here
  let randomPrefix = "";

  for (let i = 0; i < emailPrefixLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPrefix += characters[randomIndex];
  }

  return `${randomPrefix}@malinator.com`;
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
    dob.value = "02/02/2000";
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
  const password2: any = document.querySelector('[name="password2-confirm"]');
  if (password2) {
    password2.value = "Admin@1234";
    handleValueChanges(password2);
  }
};
