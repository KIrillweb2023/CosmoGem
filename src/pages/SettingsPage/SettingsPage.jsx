import { Link } from "react-router-dom";
import "./SettingsPage.scss";
import { SettingsAvatar } from "../../components/SettingsAvatar/SettingsAvatar";
import { SettingsSelect } from "../../components/SettingsSelect/SettingsSelect";
import { SettingsInfo } from "../../components/SettingsInfo/SettingsInfo";
import { SettingsStats } from "../../components/SettingsStats/SettingsStats";

export const SettingsPage = () => {
    return (
        <>

            <div className="app-settings">
                <div className="app-tops-btns">
                    <Link to={"/"} className='app-tops-btn app-tops-home'>
                        На главную
                    </Link>
                    <Link to={"/game"} id="restart-btn" className='app-tops-btn app-tops-restart'>
                        В игру
                    </Link>
                </div>

                <SettingsAvatar />
                <SettingsSelect />
                <SettingsInfo />
                <SettingsStats />
            </div>
        </>
    )
}