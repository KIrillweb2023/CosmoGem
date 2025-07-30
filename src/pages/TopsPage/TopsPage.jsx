import "./TopsPage.scss";

import { TopsText } from "../../components/TopsText/TopsText"
import { TopsList } from "../../components/TopsList/TopsList";
import { Link } from "react-router-dom";

export const TopsPage = () => {
    return (
        <>
            <div className="app-tops">
                <div className="app-tops-btns">
                    <Link to={"/"} className='app-tops-btn app-tops-home'>
                        На главную
                    </Link>
                    <Link to={"/game"} id="restart-btn" className='app-tops-btn app-tops-restart'>
                        В игру
                    </Link>
                </div>
                <TopsText />
                <TopsList />
            </div>
        </>
    )
}