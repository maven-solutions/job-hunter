import React from "react";
import "./joblist.css";

const JobListTable = (props: any) => {
  const { setShowJobsTable, jobTableData, loading, saveNewJob } = props;

  const saveAsNewJobFn = () => {
    saveNewJob("restored");
    setShowJobsTable(false);
  };
  const saveAsRedundantJobFn = () => {
    saveNewJob("redundant");
    setShowJobsTable(false);
  };

  console.log("jobTableData--", jobTableData);

  return (
    <div className="job__table__overlay">
      <div className="job__table__modal">
        <h3 className="job__list__title"> Job List</h3>

        <div className="job_table_header">
          <span className="job_table_header_span">
            {" "}
            Explore related job roles listed below.
          </span>

          <div className="job__table__button__row">
            <button
              className="job__tabel__button save"
              type="button"
              onClick={saveAsNewJobFn}
            >
              {loading ? (
                <>
                  <div id="jhloading" />
                  Saving...
                </>
              ) : (
                "Save as New Job"
              )}
            </button>
            <button
              className="job__tabel__button redundent"
              type="button"
              onClick={saveAsRedundantJobFn}
            >
              {loading ? (
                <>
                  <div id="jhloading" />
                  Saving...
                </>
              ) : (
                "Save as Redundant Job"
              )}
            </button>
          </div>
        </div>

        <div className="job_table_and_canceL_button_section">
          <div className="job__table__section">
            <table className="job__table">
              <tr className="job__table__row">
                <th className="job__heading"> Job title</th>
                <th> Company Name</th>
                <th> Location</th>
                <th> Date Posted</th>
                <th> Job URL</th>
              </tr>

              <tbody>
                {jobTableData.map((data: any) => {
                  return (
                    <tr className="job__table__tr" key={data.id}>
                      {" "}
                      <td
                        className={`job__table__td ${
                          data.local && "job__data__local"
                        }`}
                      >
                        {" "}
                        {data.jobTitle}
                      </td>{" "}
                      <td> {data.companyName}</td> <td> {data.location}</td>{" "}
                      <td>{data.createdAt}</td>{" "}
                      <td>
                        {" "}
                        <a
                          className="job__table__link"
                          href={data.jobLink}
                          target="_blank"
                        >
                          {data.jobBoard}
                        </a>{" "}
                      </td>{" "}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="job__table__footer">
            <button
              className="job__tabel__button cancel"
              type="button"
              onClick={() => setShowJobsTable(false)}
            >
              Cancel{" "}
            </button>
          </div>{" "}
        </div>
      </div>
    </div>
  );
};

export default JobListTable;
