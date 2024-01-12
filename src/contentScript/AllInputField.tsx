import React from 'react';
import {
  BtnBold,
  BtnItalic,
  Editor,
  EditorProvider,
  Toolbar,
  BtnUnderline,
} from 'react-simple-wysiwyg';
import Select from 'react-select';

import InputBox from '../component/InputBox';

const AllInputField = (props: any) => {
  const {
    companyName,
    setCompanyName,
    jobsTitle,
    setJobstitle,
    companyLocation,
    setCompanyLocation,
    postUrl,
    setPostUrl,
    jobDescription,
    setJobDescription,
    postedDate,
    setPostedDate,
    jobType,
    setJobType,
    category,
    setCategory,
    source,
    setSource,
    locked,
    setLocked,
    jobDetails,
    setJobDetails,
    companyInfo,
    setCompanyInfo,
    skills,
    setSkills,
    employment,
    setEmployment,
  } = props;
  const setDescValue = (e: any) => {
    if (e.target.value) {
      setJobDescription(e.target.value);
    }
  };
  const options = [
    { value: 'Product Owner', label: 'Product Owner' },
    { value: 'Scrum Master', label: 'Scrum Master' },
    { value: 'Project Manager', label: 'Project Manager' },
    { value: 'Business Analyst', label: 'Business Analyst' },
  ];
  const employmentOptions = [
    { value: 'part-time', label: 'Part-time' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'contract', label: 'Contract' },
  ];
  const jobTypeOptions = [
    { value: 'remote', label: 'Remote' },
    { value: 'on-site', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
  ];
  return (
    <div className="job_detail_content_section">
      <div className="job_input_section">
        <label
          htmlFor="category"
          className="job_box_title"
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          Category{' '}
          {locked ? (
            <div
              style={{
                backgroundColor: 'red',
                color: 'white',
                padding: '0.5rem 0.5rem',
              }}
              onClick={() => {
                setLocked(!locked);
                localStorage.setItem('lock_status', JSON.stringify(!locked));
              }}
            >
              Locked
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'green',
                color: 'white',
                padding: '0.5rem 0.5rem',
              }}
              onClick={() => {
                setLocked(!locked);
                localStorage.setItem('lock_status', JSON.stringify(!locked));
              }}
            >
              Unlocked
            </div>
          )}
        </label>
        <div className="category_selector">
          <Select
            options={options}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                borderColor: state.isFocused ? 'grey' : '#7662e7',
                boxShadow: state.isFocused ? '0 0 5px #7662e7' : 'none',
                fontSize: 14,

                padding: '-2px 10px',
                borderRadius: '8px',
                width: '102%',
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: 14,
                background: state.isSelected ? '#7662e7' : '#white',
              }),
            }}
            value={category}
            defaultValue={null}
            placeholder="Select a category"
            onChange={(option) => {
              setLocked(false);
              setCategory(option);
              localStorage.setItem('categoryOption', JSON.stringify(option));
            }}
          />
        </div>

        {/* <select id="category" name="category">
          <option value="1">All Categories</option>
          <option value="1">Product Owner</option>
          <option value="1">Scrum Master</option>
          <option value="1">Project Manager</option>
          <option value="1">Business Analyst</option>
        </select> */}
      </div>

      <InputBox
        title="Job title"
        value={jobsTitle}
        valueSetter={setJobstitle}
        name="jobtitle"
      />

      <InputBox
        title="Company"
        value={companyName}
        valueSetter={setCompanyName}
        name="company"
      />

      <InputBox
        title="Location"
        value={companyLocation}
        valueSetter={setCompanyLocation}
        name="location"
      />
      <div className="job_input_section">
        <label
          htmlFor="employment"
          className="job_box_title"
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          Employment
        </label>
        <div className="category_selector">
          <Select
            options={employmentOptions}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                borderColor: state.isFocused ? 'grey' : '#7662e7',
                boxShadow: state.isFocused ? '0 0 5px #7662e7' : 'none',
                fontSize: 14,

                padding: '-2px 10px',
                borderRadius: '8px',
                width: '102%',
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: 14,
                background: state.isSelected ? '#7662e7' : '#white',
              }),
            }}
            value={employment}
            defaultValue={null}
            placeholder="Select a employment type"
            onChange={(option) => {
              setEmployment(option);
              localStorage.setItem('employmentOption', JSON.stringify(option));
            }}
          />
        </div>
      </div>
      <div className="job_input_section">
        <label
          htmlFor="JobType"
          className="job_box_title"
          style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          JobType
        </label>
        <div className="category_selector">
          <Select
            options={jobTypeOptions}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                borderColor: state.isFocused ? 'grey' : '#7662e7',
                boxShadow: state.isFocused ? '0 0 5px #7662e7' : 'none',
                fontSize: 14,

                padding: '-2px 10px',
                borderRadius: '8px',
                width: '102%',
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: 14,
                background: state.isSelected ? '#7662e7' : '#white',
              }),
            }}
            value={jobType}
            defaultValue={null}
            placeholder="Select a job type"
            onChange={(option) => {
              setJobType(option);
              localStorage.setItem('jobTypeOption', JSON.stringify(option));
            }}
          />
        </div>
      </div>

      {/* <InputBox
        title="Job Details"
        value={jobDetails}
        valueSetter={setJobDetails}
        name="job-details"
      />
      <InputBox
        title="Company Info"
        value={companyInfo}
        valueSetter={setCompanyInfo}
        name="company-info"
      />
      <InputBox
        title="Skills"
        value={skills}
        valueSetter={setSkills}
        name="skills"
      /> */}
      <InputBox
        title="Post Url"
        value={postUrl}
        valueSetter={setPostUrl}
        name="posturl"
      />
      <InputBox
        title="Posted On"
        value={postedDate}
        valueSetter={setPostedDate}
        name="posteddate"
      />
      {/* <InputBox
        title="Job Type"
        value={jobType}
        valueSetter={setJobType}
        name="jobtype"
      /> */}
      <InputBox
        title="Source"
        value={source}
        valueSetter={setSource}
        name="source"
      />

      <div className="job_input_section">
        <span className="job_box_title">Description </span>
        <div className="scrollbar-container">
          <EditorProvider>
            <Editor value={jobDescription ?? ''} onChange={setDescValue}>
              <Toolbar>
                <BtnBold />
                <BtnItalic />
                <BtnUnderline />
              </Toolbar>
            </Editor>
          </EditorProvider>
        </div>
      </div>
    </div>
  );
};

export default AllInputField;
