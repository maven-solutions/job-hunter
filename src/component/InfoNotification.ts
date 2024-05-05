const infoNotification = (container: any, website) => {
  // Create the notification bar element
  const notificationBar = document.createElement("div");

  if (website === "glassdoor") {
    notificationBar.classList.add(
      "careerhub-notification-bar",
      "glassdoor-spacing-for-bar"
    );
  }

  if (website === "simplyhired") {
    notificationBar.classList.add(
      "careerhub-notification-bar",
      "simplyhired-spacing-for-bar"
    );
  }
  // Create the info icon element
  const infoIcon = document.createElement("img");
  infoIcon.src = chrome.runtime.getURL("waring.svg"); // replace 'info_icon.png' with your actual icon image path
  infoIcon.alt = "Info";
  infoIcon.classList.add("careerhub-notification-icon");

  // Create the text node for the notification message
  const notificationText = document.createTextNode(
    "If Extension doesn't Work, Please click on the CareerAi Button"
  );

  // Append the icon and text to the notification bar
  notificationBar.appendChild(infoIcon);
  notificationBar.appendChild(notificationText);

  // Append the notification bar to the selected element

  container.prepend(notificationBar);
};

export const simplyHiredNotiification = () => {
  const container = document.querySelector(".css-imseer");
  console.log("container::", container);
  infoNotification(container, "simplyhired");
};
export const glassDoorNotiification = () => {
  const containerChild = document.querySelector(
    '[data-test="job-details-header"]'
  );
  console.log("containerChild::", containerChild);
  const parentElement = containerChild.parentElement;
  infoNotification(parentElement, "glassdoor");
};
