const infoNotification = (container: any) => {
  // Create the notification bar element
  const notificationBar = document.createElement("div");
  notificationBar.classList.add("careerhub-notification-bar");

  // Create the info icon element
  const infoIcon = document.createElement("img");
  infoIcon.src = chrome.runtime.getURL("info.svg"); // replace 'info_icon.png' with your actual icon image path
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
  infoNotification(container);
};
