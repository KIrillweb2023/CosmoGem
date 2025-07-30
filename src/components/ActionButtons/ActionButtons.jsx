import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";
import './ActionButtons.scss';

export const ActionButtons = () => {
    return (
        <div className="app-buttons">
            <Link to={"/game"} className="app-button app-button-play ">
                <span className="app-button-text">Играть</span>
                <IoArrowForward className="app-button-icon" />
            </Link>

            <Link to={"/settings"} className="app-button app-button-settings">
                <span className="app-button-text">Настойки</span>
            </Link>
        </div>
    );
};