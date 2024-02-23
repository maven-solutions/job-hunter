import React from "react";
import "./joblist.css";
import { getTimeInFormattetDesing } from "./helper";

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
              <thead>
                <tr className="job__table__row">
                  <th className="job__heading">Job title</th>
                  <th>Company Name</th>
                  <th>Location</th>
                  <th>Date Posted</th>
                  <th>Job URL</th>
                </tr>
              </thead>
              <tbody>
                {jobTableData.map((data: any, i: number) => {
                  return (
                    <tr className="job__table__tr" key={data.id ?? i + 1}>
                      <td
                        className={`job__table__td ${
                          data.local && "job__data__local"
                        }`}
                      >
                        {data.jobTitle}
                      </td>
                      <td>{data.companyName}</td>
                      <td>
                        {data.city}, {data.state}
                      </td>
                      <td>{getTimeInFormattetDesing(data.createdAt)}</td>
                      <td>
                        <a
                          className="job__table__link"
                          href={data.jobLink}
                          target="_blank"
                        >
                          {data.jobBoard}
                        </a>
                      </td>
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
