import AvatarGame from "../../assets/Avatar/kot-avatar.jpeg";
import "./SettingsAvatar.scss";
export const SettingsAvatar = () => {
    return (
        <>
            <div className="app-settings-avatar">
                <div className="app-settings-avatar_wrapper">
                    <img src={AvatarGame} alt="avatar-game" className="app-settings-avatar_image" />
                </div>
            </div>

        </>
    )
}