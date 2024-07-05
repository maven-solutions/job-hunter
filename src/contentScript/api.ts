export const checkJobStatus = async (
  postUrl,
  setAlreadySavedStatus,
  setSavedNotification,
  SetAlreadySavedInfo
) => {
  const data = {
    jobLink: postUrl,
  };
  if (!postUrl) {
    return;
  }

  const url = "https://backend.careerai.io/public/jobs/check-job-status";
  // const url =
  //   "https://d2fa6tipx2eq6v.cloudfront.net/public/jobs/check-job-status";

  const settings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  try {
    const fetchResponse = await fetch(url, settings);
    const response = await fetchResponse.json();
    if (response?.data?.already_saved) {
      setAlreadySavedStatus(true);
      setSavedNotification(true);
      SetAlreadySavedInfo(true);
      setTimeout(() => {
        setSavedNotification(false);
      }, 3000);
      return;
    } else {
      setAlreadySavedStatus(false);
    }
    return;
  } catch (e) {
    console.log(e);
  }
};

export const saveJobs = async (
  data,
  setLoading,
  setShowJobsTable,
  setJobTableData,
  handleAlreadySaved,
  setNotification,
  handleFailed,
  handleSuccess,
  setSavedNotification,
  postUrl,
  setAlreadySavedStatus
) => {
  // const url = "https://d2fa6tipx2eq6v.cloudfront.net/public/jobs";
  const url = "https://backend.careerai.io/public/jobs";

  const settings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const dataWithLocal = data;
  dataWithLocal.local = true;

  try {
    setLoading(true);
    const fetchResponse = await fetch(url, settings);
    const data = await fetchResponse.json();

    if (data?.status === "duplicate-jobs") {
      setLoading(false);
      setShowJobsTable(true);

      setJobTableData([dataWithLocal, ...data?.data]);
    }

    if (data?.status === "failed") {
      handleAlreadySaved();
      setLoading(false);
      setNotification(false);

      setTimeout(() => {
        setNotification(false);
      }, 3000);
      return;
    }
    if (data?.status === "error") {
      handleFailed();
      setLoading(false);
      setNotification(false);
      setTimeout(() => {
        setNotification(false);
      }, 3000);
    }
    if (data?.status === "success") {
      handleSuccess();
      setLoading(false);
      setNotification(false);
      setAlreadySavedStatus(true);
      setSavedNotification(true);
      setTimeout(() => {
        setSavedNotification(false);
      }, 3000);
      // checkJobStatus(
      //   postUrl,
      //   setAlreadySavedStatus,
      //   setSavedNotification,
      //   SetAlreadySavedInfo
      // );
      setTimeout(() => {
        setSavedNotification(false);
      }, 3000);
    }
    return;
  } catch (e) {
    handleFailed();
    setLoading(false);
    setNotification(false);
    // console.log(e);
    setTimeout(() => {
      setNotification(false);
    }, 3000);
  }
};
