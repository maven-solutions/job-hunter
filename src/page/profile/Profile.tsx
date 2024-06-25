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
  console.log("authstate::", authState);
  const dispatch = useAppDispatch();

  const handleLogOut = () => {
    dispatch(logoutUser());
    setShowPage("");
  };

  function getInitials(name: string): string {
    // Split the name into an array of words
    let words: string[] = name.trim().split(/\s+/);

    // Get the first letter of the first word
    let initials: string = words[0][0].toUpperCase();

    // If there is a second word, add the first letter of the second word
    if (words.length > 1) {
      initials += words[1][0].toUpperCase();
    }

    return initials;
  }
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
          {authState?.ci_user?.image && (
            <img src={authState?.ci_user?.image} alt="profile-icon" />
          )}
          {!authState?.ci_user?.image && (
            <div className="ci_user_has_no_image">
              {getInitials(authState?.ci_user?.fullName)}
            </div>
          )}
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
