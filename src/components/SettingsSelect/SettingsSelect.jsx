import "./SettingsSelect.scss";

import CityAvatar from "../../assets/Avatar/city-avatar.jpeg"
import CarsAvatar from "../../assets/Avatar/cars-avatar.jpeg"
import PandaAvatar from "../../assets/Avatar/panda-avatar.jpeg"
import CosmosAvatar from "../../assets/Avatar/cosmos-avatar.jpeg"
import TigerAvatar from "../../assets/Avatar/tiger-avatar.jpeg"
import KotAvatar from "../../assets/Avatar/kot-avatar.jpeg"

export const SettingsSelect = () => {
    return (
        <>
            <div className="app-settings-select">
                <h4 className="app-settings-select_title">Вы можете выбрать аватарку</h4>
                <div className="app-settings-select_wrapper">
                    <div className="app-settings-select_img">
                        <img src={KotAvatar} alt="" />
                    </div>
                    <div className="app-settings-select_img">
                        <img src={CityAvatar} alt="" />
                    </div>
                    <div className="app-settings-select_img">
                        <img src={CosmosAvatar} alt="" />
                    </div>
                    <div className="app-settings-select_img">
                        <img src={TigerAvatar} alt="" />
                    </div>
                    <div className="app-settings-select_img">
                        <img src={PandaAvatar} alt="" />
                    </div>
                    <div className="app-settings-select_img">
                        <img src={CarsAvatar} alt="" />
                    </div>
                </div>
            </div>
        </>
    )
}