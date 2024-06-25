import React from "react";
import "./index.css";
import Layout from "../../template/Layout";
import WhiteCard from "../../component/card/WhiteCard";
import { RootStore, useAppDispatch, useAppSelector } from "../../store/store";
import { LogoutButton } from "../../component/primaryButton/PrimaryButton";
import { logoutUser } from "../../store/features/Auth/AuthSlice";

const Profile = (props: any) => {
  const { setShowPage, showPage } = props;
  const authState: any = useAppSelector((store: RootStore) => {
    return store.AuthSlice;
  });

  const dispatch = useAppDispatch();

  const handleLogOut = () => {
    dispatch(logoutUser());
    setShowPage("");
  };
  return (
    <Layout
      setShowPage={setShowPage}
      showPage={showPage}
      firstBgWidth="30"
      secondBgWidth="30"
    >
      <h3 className="ci_profile_titile">Profile </h3>
      <WhiteCard>
        <div className="ci_profile_section">
          <img
            src={chrome.runtime.getURL(
              authState?.ci_user?.image ?? "linkedin.svg"
            )}
            alt="profile-icon"
          />
          <div className="ci_profile_info_section">
            <span className="ci_profile_name">
              {" "}
              {authState?.ci_user?.fullName}
            </span>
            <span className="ci_profile_email">
              {" "}
              {authState?.ci_user?.email}{" "}
            </span>
          </div>
        </div>
        <LogoutButton onclick={handleLogOut} />
      </WhiteCard>
    </Layout>
  );
};

export default Profile;
