import "./TopsList.scss";

import OneAccIcon from "../../assets/AccauntImage/baggi.jpeg";
import TwoAccIcon from "../../assets/AccauntImage/enduro.jpeg";
import ThreeAccIcon from "../../assets/AccauntImage/quadrocikle.jpeg";

export const TopsList = () => {
    return (
        <>
            <div className="app-tops-list">
                <div className="app-tops-item">
                    <div className="app-tops-item_person">
                        <img src={ThreeAccIcon} alt="acc-icon" className="app-tops-item_person__icon" />
                        <h4 className="app-tops-item_person__name">Gleb</h4>
                    </div>
                    <div className="app-tops-item_count">
                        <img src={`${import.meta.env.BASE_URL}/AppIcons/key.png`} alt="icon-key" className="app-tops-item_count__icon" />
                        <span className="app-tops-item_count__keys">425</span>
                    </div>
                </div>
                <div className="app-tops-item">
                    <div className="app-tops-item_person">
                        <img src={TwoAccIcon} alt="acc-icon" className="app-tops-item_person__icon" />
                        <h4 className="app-tops-item_person__name">Kirill</h4>
                    </div>
                    <div className="app-tops-item_count">
                        <img src={`${import.meta.env.BASE_URL}/AppIcons/key.png`} alt="icon-key" className="app-tops-item_count__icon" />
                        <span className="app-tops-item_count__keys">422</span>
                    </div>
                </div>
                <div className="app-tops-item">
                    <div className="app-tops-item_person">
                        <img src={OneAccIcon} alt="acc-icon" className="app-tops-item_person__icon" />
                        <h4 className="app-tops-item_person__name">Vlad</h4>
                    </div>
                    <div className="app-tops-item_count">
                        <img src={`${import.meta.env.BASE_URL}/AppIcons/key.png`} alt="icon-key" className="app-tops-item_count__icon" />
                        <span className="app-tops-item_count__keys">334</span>
                    </div>
                </div>
            </div>
        </>
    )
}