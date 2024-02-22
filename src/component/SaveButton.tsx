import React from "react";

const SaveButton = (props: any) => {
  const {
    success,
    failed,
    errorMessage,
    alreadySavedStatus,
    handleSaveClick,
    loading,
  } = props;

  return (
    <div className="job__detail__footer">
      {success ? <div className="success">Saved successfully</div> : null}
      {failed ? <div className="failed">Saving failed</div> : null}
      {errorMessage?.length > 0 && (
        <div className="failed">Fill the required fields</div>
      )}
      <div>
        {alreadySavedStatus ? (
          <button className="job_saved_button" disabled={true}>
            Saved
          </button>
        ) : (
          <button className="job_save_button" onClick={handleSaveClick}>
            {loading ? (
              <>
                <div id="jhloading"></div>Saving
              </>
            ) : (
              "Save"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SaveButton;
