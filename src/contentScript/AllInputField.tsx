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
  return (
    <div className="job_detail_content_section">
      <div className="job_input_section">
        <label htmlFor="category" className="job_box_title">
          Category
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
            // defaultValue={options[0]}
            placeholder="Select a category"
            onChange={(option) => {
              setCategory(option.value);
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
        title="Company"
        value={companyName}
        valueSetter={setCompanyName}
        name="company"
      />
      <InputBox
        title="Job title"
        value={jobsTitle}
        valueSetter={setJobstitle}
        name="jobtitle"
      />
      <InputBox
        title="Location"
        value={companyLocation}
        valueSetter={setCompanyLocation}
        name="location"
      />

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
      <InputBox
        title="Job Type"
        value={jobType}
        valueSetter={setJobType}
        name="jobtype"
      />
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
