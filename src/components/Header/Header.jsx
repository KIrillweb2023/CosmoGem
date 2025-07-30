import "./Header.scss";
import { Link } from "react-router-dom";

import LogoGame from "../../assets/logoGame/logo-game.jpeg";
import StageIcon from "../../assets/stages.svg";

export const Header = () => {
    return (
        <>
            <div className="header">
                <div className="header-wrapper">
                    <div className="header-logo">
                        <img src={LogoGame} width={40} height={40} alt="" className="header-logo-icon" />
                        <h4 className="header-logo-text">Admin accaunt</h4>
                    </div>

                    <Link to={"/tops"} className="header-stage">
                        <img src={StageIcon} alt="stage" width={20} height={20} />
                    </Link>
                </div>
            </div>
        </>
    )
}