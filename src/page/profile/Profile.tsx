import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";

const Profile = (props: any) => {
  const { setShowPage } = props;
  return (
    <Layout setShowPage={setShowPage} firstBgWidth="30" secondBgWidth="30">
      <h3 className="ci_profile_titile">Profile </h3>
      <WhiteCard>
        <div className="ci_profile_section">
          <img src={chrome.runtime.getURL("linkedin.svg")} alt="profile-icon" />
          <div className="ci_profile_info_section">
            <span className="ci_profile_name"> Howard Jones</span>
            <span className="ci_profile_email"> howard@gmail.com</span>
          </div>
        </div>
      </WhiteCard>
    </Layout>
  );
};

export default Profile;
