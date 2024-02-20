import React from "react";
import "./joblist.css";

const JobListTable = () => {
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
            <button className="job__tabel__button save">
              {" "}
              Save as New Job
            </button>
            <button className="job__tabel__button redundent">
              Save as Redundant Job
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
                {[1, 2, 3, 4].map((e) => {
                  return (
                    <tr className="job__table__tr">
                      {" "}
                      <td className="job__table__td"> Scrum Master</td>{" "}
                      <td>Maven Solutions</td> <td> New York City, NY</td>{" "}
                      <td> 02/15/2024</td>{" "}
                      <td>
                        {" "}
                        <a className="job__table__link" href="" target="_blank">
                          {" "}
                          LinkedIn
                        </a>{" "}
                      </td>{" "}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="job__table__footer">
            <button className="job__tabel__button cancel">Cancel </button>
          </div>{" "}
        </div>
      </div>
    </div>
  );
};

export default JobListTable;
